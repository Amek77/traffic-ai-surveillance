const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const Violation = require('../models/Violation');
const Log = require('../models/Log');
const { protect } = require('../middleware/authMiddleware');

// Setup Multer storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter check for images/videos
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.jpeg', '.jpg', '.png', '.webp', '.mp4', '.avi'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, JPEG, PNG, MP4, and AVI files are accepted.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter
});

// Promise wrapper to execute the Python pipeline
const runPythonPipeline = (imagePath, modelPath, hsrpModelPath) => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '../python/pipeline.py');
    const args = ['--image', imagePath, '--model', modelPath, '--hsrp-model', hsrpModelPath];
    
    // Spawn python (Windows standard)
    const pyProcess = spawn('python', [scriptPath, ...args]);
    
    let stdoutData = '';
    let stderrData = '';
    
    pyProcess.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });
    
    pyProcess.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    const parseStdout = (stdout) => {
      const match = stdout.match(/__JSON_START__([\s\S]*)__JSON_END__/);
      if (match) {
        return JSON.parse(match[1].trim());
      }
      return JSON.parse(stdout.trim());
    };
    
    pyProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Python pipeline script failed (code:', code, '). Stderr:', stderrData);
        return reject(new Error(stderrData.trim() || `Python process exited with code ${code}`));
      }
      try {
        const parsed = parseStdout(stdoutData);
        resolve(parsed);
      } catch (err) {
        console.error('Failed to parse Python stdout as JSON. Raw output:', stdoutData);
        reject(new Error('Invalid output format from YOLO pipeline'));
      }
    });
    
    pyProcess.on('error', (err) => {
      console.warn('Failed to spawn "python", attempting "python3" fallback...', err.message);
      
      // Fallback to python3 (Unix/WSL/MacOS standard)
      const pyProcessFallback = spawn('python3', [scriptPath, ...args]);
      
      let stdoutFallback = '';
      let stderrFallback = '';
      
      pyProcessFallback.stdout.on('data', (data) => {
        stdoutFallback += data.toString();
      });
      
      pyProcessFallback.stderr.on('data', (data) => {
        stderrFallback += data.toString();
      });
      
      pyProcessFallback.on('close', (code) => {
        if (code !== 0) {
          return reject(new Error(stderrFallback.trim() || `Python process exited with code ${code}`));
        }
        try {
          const parsed = parseStdout(stdoutFallback);
          resolve(parsed);
        } catch (e) {
          reject(new Error('Invalid output format from YOLO pipeline fallback'));
        }
      });
      
      pyProcessFallback.on('error', (fallbackErr) => {
        reject(new Error('Python 3 execution runtime not found on this system. Please install Python.'));
      });
    });
  });
};

// @route   POST /api/detect/image
// @desc    Upload image, run AI detection pipeline, save violation
// @access  Private
router.post('/image', protect, (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a traffic photograph file' });
    }

    try {
      const filePath = req.file.path;
      const modelPath = path.join(__dirname, '../model/best.pt');
      const hsrpModelPath = path.join(__dirname, '../model/hsrp_classifier.pth');
      
      // Execute Python YOLOv8 + OCR + HSRP pipeline
      const results = await runPythonPipeline(filePath, modelPath, hsrpModelPath);

      // Map results to model format
      // hsrp_status mapping: python script outputs 'hsrp' or 'non-hsrp'
      let hsrpMapped = 'UNKNOWN';
      const rawHsrp = results.hsrp_status?.toLowerCase();
      if (rawHsrp?.includes('non-hsrp') || rawHsrp?.includes('non hsrp')) {
        hsrpMapped = 'non-hsrp';
      } else if (rawHsrp?.includes('hsrp') || rawHsrp?.includes('compliant')) {
        hsrpMapped = 'hsrp';
      }

      // Read coordinates and address from request
      const latitude = req.body.latitude ? parseFloat(req.body.latitude) : 17.3850;
      const longitude = req.body.longitude ? parseFloat(req.body.longitude) : 78.4867;
      const address = req.body.address || 'Challan Checkpoint, Hyderabad, India';

      // Calculate fines
      const violationsList = results.violations || [];
      let fineAmount = 0;
      const fineBreakdown = [];

      if (violationsList.includes('NO HELMET')) {
        fineAmount += 1000;
        fineBreakdown.push({
          violation: 'NO HELMET',
          section: 'Section 194D (MVA)',
          amount: 1000,
          penalty: '₹1,000 fine + 3 months license suspension recommendation'
        });
      }

      if (violationsList.includes('TRIPLE RIDING')) {
        fineAmount += 1000;
        fineBreakdown.push({
          violation: 'TRIPLE RIDING',
          section: 'Section 194C (MVA)',
          amount: 1000,
          penalty: '₹1,000 fine + 3 months license disqualification'
        });
      }

      if (violationsList.includes('NON HSRP')) {
        fineAmount += 5000;
        fineBreakdown.push({
          violation: 'NON HSRP',
          section: 'Section 192 (MVA)',
          amount: 5000,
          penalty: '₹5,000 fine for registration plate violation'
        });
      }

      // Generate AI analysis text
      const generateAIAnalysis = (violations, plate, severity) => {
        if (violations.length === 0) {
          return `AI System Analysis: Vehicle with plate number "${plate}" was scanned at the checkpoint. The system confirms full compliance: all occupants are wearing protective helmets, occupancy count matches safety thresholds, and the license plate adheres to High-Security Registration Plate (HSRP) regulations. No offenses recorded.`;
        }
        let narrative = `AI System Analysis: Vehicle "${plate}" was flagged at the checkpoint with a ${severity} severity rating. The automated scanner logged the following infraction(s): `;
        const details = [];
        if (violations.includes('NO HELMET')) {
          details.push(`occupants riding without a safety helmet (violating Section 129 read with 194D of the Motor Vehicles Act, which carries a ₹1,000 fine and license suspension)`);
        }
        if (violations.includes('TRIPLE RIDING')) {
          details.push(`over-occupancy with three or more individuals on a two-wheeler (violating Section 128 read with 194C of the Motor Vehicles Act, carrying a ₹1,000 fine and license disqualification)`);
        }
        if (violations.includes('NON HSRP')) {
          details.push(`a non-compliant registration plate that does not meet the High Security Registration Plate (HSRP) guidelines mandated under Section 39 read with 192 of the Motor Vehicles Act, carrying a standard ₹5,000 penalty)`);
        }
        narrative += details.join(', and ') + `. The cumulative fine of ₹${fineAmount} has been generated, and an automated challan is recommended for immediate review.`;
        return narrative;
      };

      const aiAnalysis = generateAIAnalysis(violationsList, results.plate_number || 'NOT FOUND', results.severity || 'NONE');

      // Save violation record to MongoDB
      const relativePath = `/uploads/${path.basename(filePath)}`;
      const imageId = path.basename(filePath, path.extname(filePath));

      const violation = await Violation.create({
        image_id: imageId,
        image_path: relativePath,
        plate_number: results.plate_number || 'NOT FOUND',
        helmet: results.helmet_status === 'OK',
        triple_riding: results.triple_riding === 'VIOLATION',
        hsrp_status: hsrpMapped,
        violations: violationsList,
        severity: results.severity || 'NONE',
        confidence: results.confidence || 0,
        detections: results.detections || [],
        location: {
          latitude,
          longitude,
          address
        },
        ai_analysis: aiAnalysis,
        fine_amount: fineAmount,
        fine_breakdown: fineBreakdown,
        created_by: req.user._id
      });

      // Log action
      await Log.create({
        user_id: req.user._id,
        image_id: imageId,
        action: 'AI_DETECTION_RUN',
        details: {
          violationId: violation._id,
          plateNumber: violation.plate_number,
          severity: violation.severity,
          violationsFound: violation.violations
        }
      });

      // Send response in requested format
      res.status(201).json({
        success: true,
        data: {
          violation_id: violation._id,
          image_path: violation.image_path,
          plate_number: violation.plate_number,
          helmet_status: results.helmet_status,
          triple_riding: results.triple_riding,
          hsrp_status: results.hsrp_status,
          violations: violation.violations,
          severity: violation.severity,
          detections: violation.detections,
          location: violation.location,
          ai_analysis: violation.ai_analysis,
          fine_amount: violation.fine_amount,
          fine_breakdown: violation.fine_breakdown
        }
      });

    } catch (error) {
      console.error('Detection pipeline error:', error);
      
      // Clean up uploaded file if process failed
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({ success: false, message: error.message });
    }
  });
});

module.exports = router;
