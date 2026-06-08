import React, { useState, useRef } from 'react';
import api from '../api/axios';
import { 
  UploadCloud, 
  X, 
  Cpu, 
  Loader2, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle,
  Database,
  User,
  CreditCard,
  FileText
} from 'lucide-react';

const UploadDetect = () => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [isDetecting, setIsDetecting] = useState(false);
  const [results, setResults] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isUsingMock, setIsUsingMock] = useState(false);
  const [simulationReason, setSimulationReason] = useState('');

  const [hoveredDet, setHoveredDet] = useState(null);
  const [showHelmetLayer, setShowHelmetLayer] = useState(true);
  const [showPlateLayer, setShowPlateLayer] = useState(true);
  const [showRiderLayer, setShowRiderLayer] = useState(true);

  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file) => {
    if (file && (file.type === "image/jpeg" || file.type === "image/png" || file.type === "image/webp")) {
      setSelectedFile(file);
      setErrorMsg('');
      setSuccessMsg('');
      setResults(null);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setErrorMsg("Invalid file type. Please upload a JPG, PNG, or WEBP image.");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setResults(null);
    setErrorMsg('');
    setSuccessMsg('');
    setIsUsingMock(false);
    setSimulationReason('');
    setHoveredDet(null);
  };

  const normalizeResults = (raw) => {
    if (!raw) return null;
    const data = raw.data ? raw.data : raw;
    
    let helmet = 'OK';
    const rawHelmet = data.helmet_status || data.helmetStatus;
    if (rawHelmet === 'VIOLATION' || rawHelmet === false || rawHelmet === 'Violation') {
      helmet = 'VIOLATION';
    }

    let triple = 'OK';
    const rawTriple = data.triple_riding || data.tripleRiding;
    if (rawTriple === 'VIOLATION' || rawTriple === true || rawTriple === 'Violation') {
      triple = 'VIOLATION';
    }

    let hsrp = 'UNKNOWN';
    const rawHsrp = data.hsrp_status || data.hsrpStatus;
    if (rawHsrp) {
      const s = rawHsrp.toString().toUpperCase();
      if (s.includes('NON-HSRP') || s.includes('NON HS') || s.includes('NONHS')) {
        hsrp = 'NON-HSRP';
      } else if (s.includes('HSRP') || s.includes('COMPLIANT')) {
        hsrp = 'HSRP';
      }
    }

    return {
      plateNumber: data.plate_number || data.plateNumber || 'NOT FOUND',
      helmetStatus: helmet,
      tripleRiding: triple,
      hsrpStatus: hsrp,
      violations: data.violations || [],
      severity: data.severity || 'NONE',
      detections: data.detections || []
    };
  };

  const handleDetect = async () => {
    if (!selectedFile) return;

    setIsDetecting(true);
    setErrorMsg('');
    setSuccessMsg('');
    setResults(null);

    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      const response = await api.post('/detect/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data) {
        setIsUsingMock(false);
        setResults(normalizeResults(response.data));
        setSuccessMsg("Saved to database");
      }
    } catch (err) {
      console.warn("Detection API error, initializing local simulation:", err);
      setIsUsingMock(true);
      
      let reason = 'API Connection Error (Backend server at port 5000 not running)';
      if (err.response?.data?.message) {
        reason = `Backend Error: "${err.response.data.message}"`;
      } else if (err.message) {
        reason = `Request Error: "${err.message}"`;
      }
      setSimulationReason(reason);
      
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockTypes = [
        {
          helmetStatus: 'VIOLATION',
          tripleRiding: 'OK',
          hsrpStatus: 'non-hsrp',
          plateNumber: 'DL 3C AQ 1234',
          violations: ['NO HELMET', 'NON HSRP'],
          severity: 'HIGH',
          detections: [
            { class: 'no_helmet', label: 'NO HELMET', conf: 0.73, color: '#EF4444', box: { x: 38, y: 12, w: 20, h: 22 } },
            { class: 'number_plate', label: 'NUMBER PLATE', conf: 0.82, color: '#8B5CF6', box: { x: 62, y: 68, w: 18, h: 10 } }
          ]
        },
        {
          helmetStatus: 'VIOLATION',
          tripleRiding: 'VIOLATION',
          hsrpStatus: 'non-hsrp',
          plateNumber: 'HR 26 DK 5678',
          violations: ['NO HELMET', 'TRIPLE RIDING', 'NON HSRP'],
          severity: 'HIGH',
          detections: [
            { class: 'no_helmet', label: 'NO HELMET', conf: 0.88, color: '#EF4444', box: { x: 42, y: 8, w: 16, h: 20 } },
            { class: 'rider', label: 'TRIPLE RIDING', conf: 0.94, color: '#F59E0B', box: { x: 28, y: 22, w: 42, h: 52 } },
            { class: 'number_plate', label: 'NUMBER PLATE', conf: 0.79, color: '#8B5CF6', box: { x: 55, y: 72, w: 20, h: 11 } }
          ]
        },
        {
          helmetStatus: 'OK',
          tripleRiding: 'OK',
          hsrpStatus: 'hsrp',
          plateNumber: 'MH 02 BY 9999',
          violations: [],
          severity: 'NONE',
          detections: [
            { class: 'helmet', label: 'HELMET', conf: 0.96, color: '#22C55E', box: { x: 40, y: 14, w: 18, h: 22 } },
            { class: 'rider', label: 'RIDER', conf: 0.98, color: '#3B82F6', box: { x: 30, y: 30, w: 38, h: 48 } }
          ]
        },
        {
          helmetStatus: 'OK',
          tripleRiding: 'OK',
          hsrpStatus: 'non-hsrp',
          plateNumber: 'KA 51 MB 4321',
          violations: ['NON HSRP'],
          severity: 'LOW',
          detections: [
            { class: 'helmet', label: 'HELMET', conf: 0.92, color: '#22C55E', box: { x: 38, y: 15, w: 16, h: 21 } },
            { class: 'number_plate', label: 'NUMBER PLATE', conf: 0.87, color: '#8B5CF6', box: { x: 60, y: 70, w: 18, h: 10 } }
          ]
        }
      ];

      const randomIndex = Math.floor(Math.random() * mockTypes.length);
      const chosenResult = mockTypes[randomIndex];

      setResults(normalizeResults(chosenResult));
      setSuccessMsg("Saved to database (Simulation)");
    } finally {
      setIsDetecting(false);
    }
  };

  const getSeverityClass = (sev) => {
    switch (sev?.toUpperCase()) {
      case 'HIGH': return 'badge-high';
      case 'MEDIUM': return 'badge-medium';
      case 'LOW': return 'badge-low';
      case 'NONE':
      default: return 'badge-none';
    }
  };

  const renderSeverityGauge = (sev) => {
    const s = sev?.toUpperCase();
    let level = 0;
    let barClass = '';

    if (s === 'LOW') { level = 1; barClass = 'active-low'; }
    else if (s === 'MEDIUM') { level = 2; barClass = 'active-medium'; }
    else if (s === 'HIGH') { level = 3; barClass = 'active-high'; }

    return (
      <div className="severity-gauge-container">
        <div className={`severity-gauge-bar ${level >= 1 ? barClass : ''}`} />
        <div className={`severity-gauge-bar ${level >= 2 ? barClass : ''}`} />
        <div className={`severity-gauge-bar ${level >= 3 ? barClass : ''}`} />
      </div>
    );
  };

  return (
    <div className="page-wrapper">
      <div className="page-header" style={{ marginBottom: '30px' }}>
        <div className="page-title-section">
          <h1>Upload & Detect</h1>
          <p>Scan street imagery for helmet, rider count, and plate compliance offenses</p>
        </div>
      </div>

      <div className="upload-grid">
        {/* Left Side: Upload Zone */}
        <div className="upload-panel">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '20px' }}>Select Traffic Photograph</h2>
          
          {errorMsg && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#fca5a5',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              marginBottom: '20px'
            }}>
              {errorMsg}
            </div>
          )}

          {!imagePreview ? (
            <div 
              className={`dropzone ${dragActive ? 'drag-active' : ''}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={onButtonClick}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                style={{ display: 'none' }}
                accept=".jpg,.jpeg,.png,.webp"
                onChange={handleChange}
              />
              <UploadCloud className="dropzone-icon" size={48} />
              <h3>Drag and drop your image here</h3>
              <p style={{ margin: '4px 0 12px 0' }}>Supports JPEG, JPG and PNG files</p>
              <button type="button" className="filter-export-btn" style={{ height: '36px', padding: '0 16px' }}>
                Browse Files
              </button>
            </div>
          ) : (
            <div>
              <div className="image-preview-container" style={{ position: 'relative', overflow: 'hidden' }}>
                <img src={imagePreview} alt="Traffic checking point preview" className="image-preview" style={{ display: 'block', width: '100%', height: 'auto' }} />
                
                {/* Scanning sweep bar */}
                <div className={`scanner-sweep-line ${isDetecting ? 'active' : ''}`} />

                {/* SVG Overlay for Bounding Boxes */}
                {results && results.detections && (
                  <svg 
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      pointerEvents: 'none'
                    }}
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                  >
                    {results.detections.map((det, index) => {
                      if (!det.box) return null;

                      // Visibility filters
                      const isHelmet = det.class.includes('helmet');
                      const isPlate = det.class.includes('plate') || det.class.includes('number');
                      const isRider = det.class.includes('rider');

                      if (isHelmet && !showHelmetLayer) return null;
                      if (isPlate && !showPlateLayer) return null;
                      if (isRider && !showRiderLayer) return null;

                      const isHovered = hoveredDet === det.class;

                      return (
                        <g key={index}>
                          {isHovered && (
                            <rect
                              x={det.box.x}
                              y={det.box.y}
                              width={det.box.w}
                              height={det.box.h}
                              fill="none"
                              stroke={det.color}
                              strokeWidth="3.5"
                              strokeDasharray="4 2"
                              style={{ opacity: 0.8 }}
                            />
                          )}
                          <rect
                            x={det.box.x}
                            y={det.box.y}
                            width={det.box.w}
                            height={det.box.h}
                            fill="rgba(255, 255, 255, 0.01)"
                            stroke={det.color}
                            strokeWidth={isHovered ? '2.5' : '1.5'}
                            style={{ transition: 'all 0.15s ease' }}
                          />
                          <foreignObject
                            x={det.box.x}
                            y={det.box.y - 6 >= 0 ? det.box.y - 6 : 0}
                            width="40"
                            height="12"
                          >
                            <div style={{
                              background: det.color,
                              color: 'white',
                              fontSize: '3px',
                              fontFamily: 'monospace',
                              fontWeight: 'bold',
                              padding: '1px 2px',
                              borderRadius: '1px',
                              display: 'inline-block',
                              whiteSpace: 'nowrap'
                            }}>
                              {det.label} ({Math.round(det.conf * 100)}%)
                            </div>
                          </foreignObject>
                        </g>
                      );
                    })}
                  </svg>
                )}

                <button type="button" onClick={clearSelection} className="clear-preview-btn" title="Remove image" style={{ zIndex: 11 }}>
                  <X size={18} />
                </button>
              </div>

              {/* Toggle visibility layers */}
              {results && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '12px',
                  marginTop: '12px',
                  padding: '8px',
                  background: 'var(--bg-subtle-strong)',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  border: '1px solid var(--card-border)'
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={showHelmetLayer} 
                      onChange={(e) => setShowHelmetLayer(e.target.checked)} 
                    />
                    <span>Helmets</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={showPlateLayer} 
                      onChange={(e) => setShowPlateLayer(e.target.checked)} 
                    />
                    <span>Plates</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={showRiderLayer} 
                      onChange={(e) => setShowRiderLayer(e.target.checked)} 
                    />
                    <span>Rider Count</span>
                  </label>
                </div>
              )}

              <button 
                type="button" 
                onClick={handleDetect} 
                disabled={isDetecting}
                className="detect-btn"
                style={{ marginTop: '16px' }}
              >
                {isDetecting ? (
                  <>
                    <Loader2 className="spinner" size={18} style={{ borderWidth: '2px', width: '18px', height: '18px' }} />
                    <span>Processing Image...</span>
                  </>
                ) : (
                  <>
                    <Cpu size={18} />
                    <span>Run AI Violation Detection</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Analysis Panel */}
        <div className="results-panel">
          <div className="results-header">
            <h2 className="results-title">Analysis Results</h2>
            {successMsg && (
              <span className="saved-db-indicator">
                <Database size={14} />
                <span>{successMsg}</span>
              </span>
            )}
          </div>

          {isDetecting ? (
            <div className="detection-loader-container">
              <Loader2 className="spinner" size={32} />
              <p>Analyzing frame layers...</p>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                Running ANPR OCR + Helmet YOLOv8 Classifier
              </span>
            </div>
          ) : results ? (
            <div className="results-list-details animate-fade-in">
              {isUsingMock && (
                <div style={{
                  background: 'rgba(245, 158, 11, 0.05)',
                  border: '1px solid rgba(245, 158, 11, 0.15)',
                  color: '#fcd34d',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '6px',
                  marginBottom: '14px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                    <AlertTriangle size={14} />
                    <span>Local Simulation Fallback Active</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.65)', marginTop: '4px' }}>
                    Reason: {simulationReason}
                  </span>
                </div>
              )}

              {/* OCR Plate */}
              <div 
                className="analytics-card-row" 
                style={{ animationDelay: '0ms' }}
                onMouseEnter={() => setHoveredDet('number_plate')}
                onMouseLeave={() => setHoveredDet(null)}
              >
                <div className="analytics-label-section">
                  <span className="analytics-title-text">License Plate (OCR)</span>
                  <span className="analytics-desc-text">Registration number identifier</span>
                </div>
                <div className="ocr-result-val">
                  {results.plateNumber}
                </div>
              </div>

              {/* Helmet Status */}
              <div 
                className="analytics-card-row" 
                style={{ animationDelay: '80ms' }}
                onMouseEnter={() => setHoveredDet(results.helmetStatus === 'OK' ? 'helmet' : 'no_helmet')}
                onMouseLeave={() => setHoveredDet(null)}
              >
                <div className="analytics-label-section">
                  <span className="analytics-title-text">Helmet Detection</span>
                  <span className="analytics-desc-text">Riders safety helmet state</span>
                </div>
                <span className={`result-status-pill ${
                  results.helmetStatus === 'OK' ? 'status-pill-ok' : 'status-pill-violation'
                }`}>
                  {results.helmetStatus === 'OK' ? 'OK (WEARING)' : 'VIOLATION (NO HELMET)'}
                </span>
              </div>

              {/* Triple Riding Status */}
              <div 
                className="analytics-card-row" 
                style={{ animationDelay: '160ms' }}
                onMouseEnter={() => setHoveredDet('rider')}
                onMouseLeave={() => setHoveredDet(null)}
              >
                <div className="analytics-label-section">
                  <span className="analytics-title-text">Occupancy Count</span>
                  <span className="analytics-desc-text">Total rider weight on motorcycle</span>
                </div>
                <span className={`result-status-pill ${
                  results.tripleRiding === 'OK' ? 'status-pill-ok' : 'status-pill-violation'
                }`}>
                  {results.tripleRiding === 'OK' ? 'OK (≤ 2 RIDERS)' : 'VIOLATION (TRIPLE RIDING)'}
                </span>
              </div>

              {/* HSRP Plate Status */}
              <div 
                className="analytics-card-row" 
                style={{ animationDelay: '240ms' }}
                onMouseEnter={() => setHoveredDet('number_plate')}
                onMouseLeave={() => setHoveredDet(null)}
              >
                <div className="analytics-label-section">
                  <span className="analytics-title-text">HSRP Plate Class</span>
                  <span className="analytics-desc-text">Standard license plate compliance</span>
                </div>
                <span className={`result-status-pill ${
                  results.hsrpStatus === 'HSRP' ? 'status-pill-compliant' : 'status-pill-non-compliant'
                }`}>
                  {results.hsrpStatus === 'HSRP' ? 'HSRP Compliant' : 'Non-HSRP Plate'}
                </span>
              </div>

              {/* Severity badge & gauge */}
              <div className="analytics-card-row" style={{ animationDelay: '320ms' }}>
                <div className="analytics-label-section">
                  <span className="analytics-title-text">Threat Severity</span>
                  <span className="analytics-desc-text">Calculated violation threat index</span>
                  {renderSeverityGauge(results.severity)}
                </div>
                <span className={`badge ${getSeverityClass(results.severity)}`} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                  {results.severity || 'NONE'}
                </span>
              </div>

              {/* Offenses List */}
              <div className="analytics-card-row" style={{ animationDelay: '400ms', flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }}>
                <div className="analytics-label-section">
                  <span className="analytics-title-text">Categorized Violations</span>
                  <span className="analytics-desc-text">Identified violation tags</span>
                </div>
                <div className="violation-tags-list" style={{ marginTop: '4px', width: '100%', justifyContent: 'flex-start' }}>
                  {results.violations && results.violations.length > 0 ? (
                    results.violations.map((v, i) => (
                      <span key={i} className="violation-tag" style={{ fontSize: '0.8rem', padding: '6px 10px' }}>{v}</span>
                    ))
                  ) : (
                    <span className="violation-tag no-violations" style={{ fontSize: '0.8rem', padding: '6px 10px' }}>
                      <ShieldCheck size={14} style={{ marginRight: '4px' }} />
                      NO OFFENSES DETECTED
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: '260px',
              color: 'var(--text-muted)',
              textAlign: 'center',
              padding: '20px'
            }}>
              <Cpu size={36} style={{ marginBottom: '14px', strokeWidth: '1.5px' }} />
              <p style={{ fontSize: '0.95rem' }}>Awaiting image submission</p>
              <span style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                Upload a traffic photography frame to start inspection
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadDetect;
