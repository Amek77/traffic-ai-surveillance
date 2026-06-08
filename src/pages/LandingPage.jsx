import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldAlert, 
  Users, 
  ShieldCheck, 
  Eye, 
  Camera, 
  Cpu, 
  Sliders, 
  Bell,
  ArrowRight,
  Sun,
  Moon
} from 'lucide-react';

const CountUp = ({ end, duration = 2000, suffix = '' }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);

  return <span>{count.toLocaleString('en-IN')}{suffix}</span>;
};

const AIConsoleWidget = () => {
  const [activeCase, setActiveCase] = useState(0);
  const [typedPlate, setTypedPlate] = useState('');
  const [scanStep, setScanStep] = useState('idle'); // idle, scanning, analyzing, done

  const cases = [
    {
      plate: 'DL3CAQ1234',
      helmet: 'VIOLATION',
      triple: 'OK',
      hsrp: 'NON-COMPLIANT',
      severity: 'HIGH',
      helmetText: 'NO HELMET',
      helmetConf: '88%'
    },
    {
      plate: 'MH02BY9999',
      helmet: 'OK',
      triple: 'OK',
      hsrp: 'COMPLIANT',
      severity: 'NONE',
      helmetText: 'HELMET OK',
      helmetConf: '97%'
    },
    {
      plate: 'KA51MB4321',
      helmet: 'VIOLATION',
      triple: 'VIOLATION',
      hsrp: 'NON-COMPLIANT',
      severity: 'HIGH',
      helmetText: 'NO HELMET',
      helmetConf: '94%'
    }
  ];

  useEffect(() => {
    let timer;
    const runSequence = () => {
      setScanStep('scanning');
      setTypedPlate('');
      
      timer = setTimeout(() => {
        setScanStep('analyzing');
        
        let plateStr = cases[activeCase].plate;
        let idx = 0;
        const ocrTimer = setInterval(() => {
          if (idx <= plateStr.length) {
            setTypedPlate(plateStr.slice(0, idx));
            idx++;
          } else {
            clearInterval(ocrTimer);
            setScanStep('done');
          }
        }, 120);
        
      }, 1200);
    };

    runSequence();

    return () => {
      clearTimeout(timer);
    };
  }, [activeCase]);

  // Loop through cases
  useEffect(() => {
    const mainInterval = setInterval(() => {
      setActiveCase(prev => (prev + 1) % cases.length);
    }, 5500);
    return () => clearInterval(mainInterval);
  }, []);

  const current = cases[activeCase];

  return (
    <div className="glass-panel" style={{
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      border: '1px solid var(--card-border)',
      boxShadow: 'var(--shadow-lg)',
      position: 'relative'
    }}>
      {/* Viewport Header */}
      <div style={{
        background: 'rgba(0,0,0,0.4)',
        padding: '12px 20px',
        borderBottom: '1px solid var(--card-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.8rem',
        fontWeight: 'bold',
        color: 'var(--text-secondary)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444', display: 'inline-block' }}></span>
          <span>CAM-04: NH-48 ENFORCEMENT</span>
        </div>
        <span style={{ fontFamily: 'monospace', letterSpacing: '1px' }}>LIVE STREAM [AI ENABLED]</span>
      </div>

      {/* Viewport Screen */}
      <div style={{
        height: '240px',
        background: '#04040a',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}>
        {/* Abstract Camera Crosshair */}
        <div style={{ position: 'absolute', top: '10%', left: '5%', width: '15px', height: '15px', borderLeft: '2px solid rgba(255,255,255,0.2)', borderTop: '2px solid rgba(255,255,255,0.2)' }} />
        <div style={{ position: 'absolute', top: '10%', right: '5%', width: '15px', height: '15px', borderRight: '2px solid rgba(255,255,255,0.2)', borderTop: '2px solid rgba(255,255,255,0.2)' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '5%', width: '15px', height: '15px', borderLeft: '2px solid rgba(255,255,255,0.2)', borderBottom: '2px solid rgba(255,255,255,0.2)' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: '15px', height: '15px', borderRight: '2px solid rgba(255,255,255,0.2)', borderBottom: '2px solid rgba(255,255,255,0.2)' }} />

        {/* Vector representation of bike and rider */}
        <svg viewBox="0 0 100 80" style={{ width: '80%', height: '80%', opacity: 0.65 }}>
          <line x1="10" y1="70" x2="90" y2="70" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="2 2" />
          <line x1="20" y1="70" x2="35" y2="40" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <line x1="80" y1="70" x2="65" y2="40" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

          {/* Wheel 1 */}
          <circle cx="35" cy="58" r="8" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
          {/* Wheel 2 */}
          <circle cx="65" cy="58" r="8" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
          {/* Frame & Engine */}
          <path d="M 35 58 L 45 48 L 58 48 L 65 58 Z" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
          {/* Handlebars */}
          <path d="M 42 42 L 39 36 L 44 36" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
          {/* Rider */}
          <path d="M 45 48 L 47 34 L 52 28 L 56 36 L 50 48" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
          {/* Head */}
          <circle cx="53" cy="22" r="5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
          
          {current.triple === 'VIOLATION' && (
            <>
              <path d="M 50 48 L 53 36 L 57 32 L 60 48" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" />
              <circle cx="58" cy="26" r="4.5" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" />
              <path d="M 56 48 L 59 40 L 64 38 L 65 48" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              <circle cx="63" cy="32" r="4" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            </>
          )}
        </svg>

        {/* Laser Scanning line */}
        <div className={`scanner-sweep-line ${scanStep === 'scanning' || scanStep === 'analyzing' ? 'active' : ''}`} />

        {/* Bounding Box overlay 1: Rider Head (Helmet status) */}
        {(scanStep === 'analyzing' || scanStep === 'done') && (
          <div style={{
            position: 'absolute',
            top: '12%',
            left: '48%',
            width: '12%',
            height: '18%',
            border: `2px solid ${current.helmet === 'OK' ? 'var(--severity-low)' : 'var(--severity-high)'}`,
            boxShadow: `0 0 8px ${current.helmet === 'OK' ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            transition: 'all 0.3s ease'
          }}>
            <span style={{
              background: current.helmet === 'OK' ? 'var(--severity-low)' : 'var(--severity-high)',
              color: 'white',
              fontSize: '0.55rem',
              fontWeight: 'bold',
              padding: '1px 3px',
              whiteSpace: 'nowrap'
            }}>
              {current.helmetText} ({current.helmetConf})
            </span>
          </div>
        )}

        {/* Bounding Box overlay 2: Number Plate */}
        {(scanStep === 'analyzing' || scanStep === 'done') && (
          <div style={{
            position: 'absolute',
            bottom: '22%',
            left: '58%',
            width: '15%',
            height: '10%',
            border: '2px solid var(--primary-light)',
            boxShadow: '0 0 8px var(--primary-glow)',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            transition: 'all 0.3s ease'
          }}>
            <span style={{
              background: 'var(--primary-light)',
              color: 'white',
              fontSize: '0.55rem',
              fontWeight: 'bold',
              padding: '1px 3px',
              whiteSpace: 'nowrap',
              alignSelf: 'flex-start'
            }}>
              PLATE (91%)
            </span>
          </div>
        )}

        {/* Triple Riding Bounding Box */}
        {(scanStep === 'analyzing' || scanStep === 'done') && current.triple === 'VIOLATION' && (
          <div style={{
            position: 'absolute',
            top: '20%',
            left: '45%',
            width: '26%',
            height: '52%',
            border: '2px solid var(--severity-medium)',
            boxShadow: '0 0 8px rgba(245,158,11,0.4)',
            zIndex: 9,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            transition: 'all 0.3s ease'
          }}>
            <span style={{
              background: 'var(--severity-medium)',
              color: 'white',
              fontSize: '0.55rem',
              fontWeight: 'bold',
              padding: '1px 3px',
              whiteSpace: 'nowrap'
            }}>
              TRIPLE RIDING
            </span>
          </div>
        )}
      </div>

      {/* Analysis Output Log */}
      <div style={{
        background: 'rgba(0,0,0,0.6)',
        padding: '16px 20px',
        borderTop: '1px solid var(--card-border)',
        fontFamily: 'monospace',
        fontSize: '0.75rem',
        color: '#c084fc',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        minHeight: '110px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#86efac' }}>
          <span>&gt; AI_ENGINE_STATUS:</span>
          <span>{scanStep.toUpperCase()}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>&gt; OCR_PLATE_EXTRACTION:</span>
          <span style={{ color: 'white', fontWeight: 'bold', background: 'rgba(255,255,255,0.05)', padding: '0 4px', borderRadius: '2px' }}>
            {typedPlate || (scanStep === 'scanning' ? 'Scanning...' : 'Awaiting...')}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: current.helmet === 'OK' ? '#86efac' : '#fca5a5' }}>
          <span>&gt; SAFETY_HELMET_STATE:</span>
          <span>{scanStep === 'idle' || scanStep === 'scanning' ? 'Checking...' : current.helmetText}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: current.triple === 'OK' ? '#86efac' : '#fca5a5' }}>
          <span>&gt; OCCUPANCY_ENGINE:</span>
          <span>{scanStep === 'idle' || scanStep === 'scanning' ? 'Analyzing...' : current.triple === 'OK' ? 'COMPLIANT' : 'TRIPLE RIDING VIOL'}</span>
        </div>
        {scanStep === 'done' && (
          <div style={{
            marginTop: '4px',
            padding: '4px 8px',
            background: current.severity === 'HIGH' ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
            border: `1px solid ${current.severity === 'HIGH' ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
            borderRadius: '4px',
            color: current.severity === 'HIGH' ? '#fca5a5' : '#86efac',
            textAlign: 'center',
            fontSize: '0.7rem',
            fontWeight: 'bold',
          }}>
            {current.severity === 'HIGH' ? '🚨 HIGH THREAT SEVERITY: Detections logged' : '✅ COMPLIANT TRAFFIC DETECTED'}
          </div>
        )}
      </div>
    </div>
  );
};

const LandingPage = () => {
  return (
    <div className="page-wrapper" style={{ paddingTop: '20px' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '40px',
        alignItems: 'center',
        padding: '40px 0 60px 0',
        position: 'relative',
        marginBottom: '40px'
      }}>
        <div className="hero-glow" style={{ top: '30%', left: '50%', transform: 'translate(-50%, -50%)' }}></div>
        <header className="landing-hero" style={{ textAlign: 'left', padding: '0', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <div className="hero-subtitle-pills" style={{ justifyContent: 'flex-start', marginBottom: '20px' }}>
            <span className="hero-pill hero-pill-accent">AI-Powered</span>
            <span className="hero-pill">Real-time Analysis</span>
            <span className="hero-pill">Traffic Enforcement</span>
          </div>
          <h1 style={{ textAlign: 'left', fontSize: '3.2rem', marginBottom: '20px', lineHeight: '1.2' }}>Smart Traffic<br />Violation Detection</h1>
          <p style={{ textAlign: 'left', margin: '0 0 35px 0', fontSize: '1.15rem', maxWidth: '100%', lineHeight: '1.6' }}>
            State-of-the-art edge AI suite designed for Indian road conditions. 
            Automatically detects two-wheeler safety violations, plate standard compliance, 
            and extracts registration numbers in real time.
          </p>
          <Link to="/login" className="hero-cta-btn">
            <span>Access Control Room</span>
            <ArrowRight size={18} />
          </Link>
        </header>

        <div className="hero-preview-section" style={{ width: '100%', maxWidth: '460px', justifySelf: 'center', zIndex: 2 }}>
          <AIConsoleWidget />
        </div>
      </div>

      {/* Animated Statistics */}
      <section className="landing-stats-grid">
        <div className="landing-stat-box">
          <div className="landing-stat-val">
            <CountUp end={14820} suffix="+" />
          </div>
          <div className="landing-stat-lbl">Total Violations Logged</div>
        </div>
        <div className="landing-stat-box">
          <div className="landing-stat-val">
            <CountUp end={6940} suffix="+" />
          </div>
          <div className="landing-stat-lbl">No-Helmet Incidents Detected</div>
        </div>
        <div className="landing-stat-box">
          <div className="landing-stat-val">
            <CountUp end={11230} suffix="+" />
          </div>
          <div className="landing-stat-lbl">License Plates OCR Read</div>
        </div>
      </section>

      {/* Feature Section */}
      <section style={{ marginBottom: '80px' }}>
        <h2 className="section-title">Core Detection Engines</h2>
        <p className="section-subtitle">
          Our specialized neural networks process high-resolution video streams to classify events and extract meta-data instantly.
        </p>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-container">
              <ShieldAlert size={24} />
            </div>
            <h3>Helmet Detection</h3>
            <p>
              Employs a custom YOLOv8 model trained on Indian traffic datasets to identify riders traveling without standard protective gear.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-container">
              <Users size={24} />
            </div>
            <h3>Triple Riding</h3>
            <p>
              Rule engine tracking bounding box overlaps and skeletal coordinates of riders to flag illegal triple-riding offenses.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-container">
              <ShieldCheck size={24} />
            </div>
            <h3>HSRP Compliance</h3>
            <p>
              Deep learning classifier (MobileNetV2) verifying presence of High Security Registration Plates, identifying outdated non-compliant designs.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-container">
              <Eye size={24} />
            </div>
            <h3>ANPR OCR Engine</h3>
            <p>
              Localized EasyOCR text extraction pipeline optimized to capture and transcribe license plates under poor lighting and skewed angles.
            </p>
          </div>
        </div>
      </section>

      {/* Pipeline / How it works Section */}
      <section style={{ marginBottom: '40px' }}>
        <h2 className="section-title">Detection Pipeline</h2>
        <p className="section-subtitle">
          How telemetry flows from highway cameras to the enforcement system dashboard.
        </p>

        <div className="how-it-works-flow">
          <div className="flow-step">
            <div className="flow-step-num">1</div>
            <Camera size={28} className="logo-icon" style={{ margin: '10px 0' }} />
            <h4>Traffic Camera</h4>
            <p>Capture high-frame-rate feeds of vehicles passing through checking points.</p>
          </div>

          <div className="flow-arrow">→</div>

          <div className="flow-step">
            <div className="flow-step-num">2</div>
            <Cpu size={28} className="logo-icon" style={{ margin: '10px 0' }} />
            <h4>AI Detection</h4>
            <p>YOLOv8 & MobileNet perform object identification and classification of violations.</p>
          </div>

          <div className="flow-arrow">→</div>

          <div className="flow-step">
            <div className="flow-step-num">3</div>
            <Sliders size={28} className="logo-icon" style={{ margin: '10px 0' }} />
            <h4>Rule Validation</h4>
            <p>Check HSRP standards, helmet usage, and rider count against traffic rules.</p>
          </div>

          <div className="flow-arrow">→</div>

          <div className="flow-step">
            <div className="flow-step-num">4</div>
            <Bell size={28} className="logo-icon" style={{ margin: '10px 0' }} />
            <h4>Alert Trigger</h4>
            <p>Instantly flag violations, extract registration details, and store in database.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
