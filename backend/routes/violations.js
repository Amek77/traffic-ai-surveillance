const express = require('express');
const router = express.Router();
const Violation = require('../models/Violation');
const Log = require('../models/Log');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/violations
// @desc    Get paginated violations with filters
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { severity, type, startDate, endDate, page = 1, limit = 6 } = req.query;

    // Build filter object
    const filter = {};

    if (severity && severity !== 'ALL') {
      filter.severity = severity.toUpperCase();
    }

    if (type && type !== 'ALL') {
      // type can be: "NO HELMET", "TRIPLE RIDING", "NON HSRP"
      filter.violations = type.toUpperCase();
    }

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) {
        filter.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.timestamp.$lte = end;
      }
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skipNum = (pageNum - 1) * limitNum;

    // Execute query
    const total = await Violation.countDocuments(filter);
    const violations = await Violation.find(filter)
      .populate('created_by', 'name email')
      .sort({ timestamp: -1 })
      .skip(skipNum)
      .limit(limitNum);

    const pages = Math.ceil(total / limitNum) || 1;

    res.json({
      success: true,
      data: violations,
      pagination: {
        total,
        page: pageNum,
        pages,
        limit: limitNum
      }
    });
  } catch (error) {
    console.error('Fetch violations error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/violations/export/csv
// @desc    Export violations as CSV
// @access  Private
router.get('/export/csv', protect, async (req, res) => {
  try {
    const { severity, type, startDate, endDate } = req.query;

    // Build filter object (same as list filters)
    const filter = {};
    if (severity && severity !== 'ALL') {
      filter.severity = severity.toUpperCase();
    }
    if (type && type !== 'ALL') {
      filter.violations = type.toUpperCase();
    }
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) {
        filter.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.timestamp.$lte = end;
      }
    }

    const violations = await Violation.find(filter).sort({ timestamp: -1 });

    // Build CSV Content
    let csvContent = 'ID,Timestamp,Plate Number,Helmet,Triple Riding,HSRP Status,Violations,Severity\n';
    
    violations.forEach((v) => {
      const id = v._id;
      const timestamp = v.timestamp ? v.timestamp.toISOString() : '';
      const plate = v.plate_number || 'NOT FOUND';
      const helmet = v.helmet ? 'OK' : 'VIOLATION';
      const triple = v.triple_riding ? 'VIOLATION' : 'OK';
      const hsrp = v.hsrp_status || 'UNKNOWN';
      const tags = v.violations ? v.violations.join('; ') : '';
      const sev = v.severity || 'NONE';

      csvContent += `"${id}","${timestamp}","${plate}","${helmet}","${triple}","${hsrp}","${tags}","${sev}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=violations_export_${Date.now()}.csv`);
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/violations/:id
// @desc    Get a single violation by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const violation = await Violation.findById(req.params.id).populate('created_by', 'name email');
    
    if (!violation) {
      return res.status(404).json({ success: false, message: 'Violation record not found' });
    }

    res.json({
      success: true,
      data: violation
    });
  } catch (error) {
    console.error('Fetch single violation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/violations/:id
// @desc    Delete a violation record
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const violation = await Violation.findById(req.params.id);

    if (!violation) {
      return res.status(404).json({ success: false, message: 'Violation record not found' });
    }

    // Capture file path to optionally delete the image asset, but mongoose delete is key
    await Violation.findByIdAndDelete(req.params.id);

    // Create log entry for audit trail
    await Log.create({
      user_id: req.user._id,
      image_id: violation.image_id,
      action: 'DELETE_VIOLATION',
      details: {
        violationId: violation._id,
        plateNumber: violation.plate_number,
        severity: violation.severity
      }
    });

    res.json({
      success: true,
      message: 'Violation record deleted successfully'
    });
  } catch (error) {
    console.error('Delete violation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
