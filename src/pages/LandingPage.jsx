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
  FileText,
  BookOpen,
  Info,
  Scale
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

const LandingPage = () => {
  return (
    <div className="page-wrapper" style={{ paddingTop: '20px', display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 80px)' }}>
      {/* Hero Section */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '60px 20px 80px 20px',
        position: 'relative',
        maxWidth: '850px',
        margin: '0 auto',
        zIndex: 2
      }}>
        <div className="hero-glow" style={{ top: '40%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.15 }}></div>
        
        <div className="hero-subtitle-pills" style={{ marginBottom: '24px' }}>
          <span className="hero-pill hero-pill-accent">AI-Powered</span>
          <span className="hero-pill">Real-time Analysis</span>
          <span className="hero-pill">Traffic Enforcement</span>
        </div>

        <h1 style={{ fontSize: '3.5rem', marginBottom: '24px', lineHeight: '1.15', fontWeight: 800 }}>
          Smart Traffic <span className="logo-accent">Violation Detection</span>
        </h1>
        
        <p style={{ margin: '0 0 40px 0', fontSize: '1.2rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          State-of-the-art automated traffic checking checkpoint suite optimized for Indian road safety conditions. 
          Instantly recognizes safety helmet compliance, triple-riding offenses, HSRP plate status, and extracts vehicle registration numbers in real time.
        </p>

        <Link to="/login" className="hero-cta-btn" style={{ padding: '16px 36px', fontSize: '1.05rem', gap: '10px' }}>
          <span>Access Operator Control Room</span>
          <ArrowRight size={20} />
        </Link>
      </div>

      {/* Animated Statistics */}
      <section className="landing-stats-grid" style={{ marginBottom: '80px' }}>
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

      {/* Indian standard fines guides */}
      <section style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: '16px',
        padding: '30px',
        marginBottom: '80px',
        textAlign: 'left'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Scale className="logo-accent" size={22} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Indian Motor Vehicles Act Penalty Guidelines</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '24px', lineHeight: 1.5 }}>
          The enforcement platform automatically processes images to identify traffic safety violations and computes legal penalties directly under the standard Motor Vehicles Act (MVA) codes.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', minWidth: '500px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--card-border)', textAlign: 'left' }}>
                <th style={{ padding: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>Traffic Violation</th>
                <th style={{ padding: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>MVA Section Code</th>
                <th style={{ padding: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>Penalty Standard Fine</th>
                <th style={{ padding: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>Legal Enforcement Action</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--card-border)' }}>
                <td style={{ padding: '14px 12px', fontWeight: 500 }}>No Helmet Violation</td>
                <td style={{ padding: '14px 12px', color: 'var(--text-secondary)' }}>Section 129 r/w 194D</td>
                <td style={{ padding: '14px 12px', fontWeight: 600, color: 'var(--severity-high)' }}>₹1,000</td>
                <td style={{ padding: '14px 12px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>3-month driving license suspension recommendation</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--card-border)' }}>
                <td style={{ padding: '14px 12px', fontWeight: 500 }}>Triple Riding Violation</td>
                <td style={{ padding: '14px 12px', color: 'var(--text-secondary)' }}>Section 128 r/w 194C</td>
                <td style={{ padding: '14px 12px', fontWeight: 600, color: 'var(--severity-high)' }}>₹1,000</td>
                <td style={{ padding: '14px 12px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>3-month driving license disqualification</td>
              </tr>
              <tr>
                <td style={{ padding: '14px 12px', fontWeight: 500 }}>Non-HSRP Plate Class</td>
                <td style={{ padding: '14px 12px', color: 'var(--text-secondary)' }}>Section 39 r/w 192</td>
                <td style={{ padding: '14px 12px', fontWeight: 600, color: 'var(--severity-high)' }}>₹5,000</td>
                <td style={{ padding: '14px 12px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Mandatory registration plate compliance challan</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Feature Section */}
      <section style={{ marginBottom: '80px' }}>
        <h2 className="section-title">Core Safety Detection Engines</h2>
        <p className="section-subtitle">
          Specialized deep learning models work in combination with rule engines to compile road violation details.
        </p>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-container">
              <ShieldAlert size={24} />
            </div>
            <h3>YOLOv8 Helmet Detection</h3>
            <p>
              Custom YOLO detector tracking helmet wearing states for riders and pillions, flagging safety helmet infractions.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-container">
              <Users size={24} />
            </div>
            <h3>Skeletal Triple Riding Check</h3>
            <p>
              Occupancy-count rule engine evaluating head coordinates and bounding boxes to verify two-wheeler passenger limits.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-container">
              <ShieldCheck size={24} />
            </div>
            <h3>MobileNetV2 HSRP Class</h3>
            <p>
              High Security Registration Plate classifier auditing whether license plates conform to modern security standards.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-container">
              <Eye size={24} />
            </div>
            <h3>EasyOCR Text Reader</h3>
            <p>
              Automated Number Plate Recognition (ANPR) crop OTSU binarizer and text transcriber for license plate parsing.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-container">
              <FileText size={24} />
            </div>
            <h3>PDF Challan Generator</h3>
            <p>
              Exports printable PDF traffic tickets detailing vehicle parameters, GPS checkpoint mappings, fine tables, and AI safety analyses.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-container">
              <Sliders size={24} />
            </div>
            <h3>Location GPS Mapping</h3>
            <p>
              Interactive Leaflet mapping tools allowing operators to tag exact camera checkpoint positions before analysis.
            </p>
          </div>
        </div>
      </section>

      {/* Pipeline / How it works Section */}
      <section style={{ marginBottom: '80px' }}>
        <h2 className="section-title">Operational Checking Pipeline</h2>
        <p className="section-subtitle">
          How telemetry flows from checking points to system logs.
        </p>

        <div className="how-it-works-flow">
          <div className="flow-step">
            <div className="flow-step-num">1</div>
            <Camera size={28} className="logo-icon" style={{ margin: '10px 0' }} />
            <h4>Image Upload</h4>
            <p>Checkpoint cameras or operators upload traffic photograph feeds.</p>
          </div>

          <div className="flow-arrow">→</div>

          <div className="flow-step">
            <div className="flow-step-num">2</div>
            <Cpu size={28} className="logo-icon" style={{ margin: '10px 0' }} />
            <h4>AI Diagnostics</h4>
            <p>YOLOv8 and MobileNet networks audit heads, riders, and plate compliance.</p>
          </div>

          <div className="flow-arrow">→</div>

          <div className="flow-step">
            <div className="flow-step-num">3</div>
            <Sliders size={28} className="logo-icon" style={{ margin: '10px 0' }} />
            <h4>Fine Calculations</h4>
            <p>Rules compile Indian standard legal challans based on detected offenses.</p>
          </div>

          <div className="flow-arrow">→</div>

          <div className="flow-step">
            <div className="flow-step-num">4</div>
            <Bell size={28} className="logo-icon" style={{ margin: '10px 0' }} />
            <h4>Challan PDF</h4>
            <p>Operators review coordinates, view AI reports, and print PDF challans.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        borderTop: '1px solid var(--card-border)',
        background: 'var(--card-bg)',
        padding: '40px 20px 20px 20px',
        textAlign: 'left',
        fontSize: '0.85rem',
        color: 'var(--text-secondary)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '30px',
          marginBottom: '30px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '12px' }}>
              <ShieldAlert className="logo-accent" size={20} />
              <span>SVDS Traffic AI</span>
            </div>
            <p style={{ lineHeight: 1.5, margin: 0 }}>
              Smart Video Detection Suite (SVDS) using advanced deep learning networks to automate traffic enforcement and enhance highway safety.
            </p>
          </div>

          <div>
            <h4 style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BookOpen size={16} className="logo-accent" />
              <span>Legal Guidelines</span>
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>Section 194D (Helmet Penalties)</li>
              <li>Section 194C (Triple Riding Penalties)</li>
              <li>Section 192 (HSRP Plate Penalties)</li>
              <li>Motor Vehicles Act 1988 Amendment</li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Info size={16} className="logo-accent" />
              <span>Operator Hub</span>
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>
                <Link to="/login" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = 'var(--primary-light)'} onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}>
                  Control Room Login
                </Link>
              </li>
              <li>GPS Coordinates Log</li>
              <li>Automated Auditing Tools</li>
              <li>System Analytics Console</li>
            </ul>
          </div>
        </div>

        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          paddingTop: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          fontSize: '0.8rem',
          color: 'var(--text-muted)'
        }}>
          <span>&copy; {new Date().getFullYear()} SVDS Traffic Systems. Automated Enforcement Authority.</span>
          <span>Designed with high-accuracy YOLOv8 & MobileNetV2 edge classifiers.</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
