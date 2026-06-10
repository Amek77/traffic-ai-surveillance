import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import StatCard from '../components/StatCard';
import { 
  FileSpreadsheet, 
  ShieldAlert, 
  Flame, 
  CheckCircle,
  ChevronRight,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart as RechartsLineChart,
  Line
} from 'recharts';



// Mock datasets for offline development / fallback
const MOCK_SUMMARY = { total: 1248, today: 85, high: 234, medium: 412, low: 602 };
const MOCK_BY_TYPE = [
  { name: 'NO HELMET', value: 580 },
  { name: 'TRIPLE RIDING', value: 240 },
  { name: 'NON HSRP', value: 428 }
];
const MOCK_BY_SEVERITY = [
  { name: 'LOW', value: 602 },
  { name: 'MEDIUM', value: 412 },
  { name: 'HIGH', value: 234 }
];
const MOCK_DAILY_TREND = [
  { date: '06-02', count: 45 },
  { date: '06-03', count: 68 },
  { date: '06-04', count: 52 },
  { date: '06-05', count: 90 },
  { date: '06-06', count: 75 },
  { date: '06-07', count: 88 },
  { date: '06-08', count: 85 }
];
const MOCK_RECENT_VIOLATIONS = [
  { id: '1', timestamp: '2026-06-08T10:15:30Z', plateNumber: 'DL3CAQ1234', severity: 'HIGH', violations: ['NO HELMET', 'TRIPLE RIDING'], hsrpStatus: 'NON_HSRP' },
  { id: '2', timestamp: '2026-06-08T09:42:15Z', plateNumber: 'HR26DK5678', severity: 'MEDIUM', violations: ['NON HSRP'], hsrpStatus: 'NON_HSRP' },
  { id: '3', timestamp: '2026-06-08T08:12:00Z', plateNumber: 'MH02BY9999', severity: 'LOW', violations: ['NO HELMET'], hsrpStatus: 'HSRP' },
  { id: '4', timestamp: '2026-06-08T07:30:45Z', plateNumber: 'KA51MB4321', severity: 'HIGH', violations: ['NO HELMET', 'NON HSRP'], hsrpStatus: 'NON_HSRP' },
  { id: '5', timestamp: '2026-06-08T06:05:10Z', plateNumber: 'UP16CT0001', severity: 'LOW', violations: [], hsrpStatus: 'HSRP' }
];

const COLORS_SEVERITY = {
  HIGH: '#EF4444',
  MEDIUM: '#F59E0B',
  LOW: '#22C55E',
  NONE: '#6B7280'
};

const COLORS_TYPES = ['#6C3EE8', '#3B82F6', '#10B981'];

const ModelPerformanceView = () => {
  const [selectedGraph, setSelectedGraph] = useState(null);

  const graphs = [
    {
      id: 'results',
      title: 'YOLOv8 Training Progress & Loss',
      src: '/model_graphs/results.png',
      description: 'Tracks bounding box regression loss, classification loss, and performance metrics (Precision, Recall, mAP50, mAP50-95) across 30 epochs of training. It shows stable convergence without overfitting.',
      model: 'YOLOv8s Object Detector'
    },
    {
      id: 'confusion',
      title: 'YOLOv8 Confusion Matrix',
      src: '/model_graphs/confusion_matrix.png',
      description: 'Displays per-class accuracy and misclassification rates, helping identify overlap between riders, helmets, and plates. Higher diagonal values represent correct predictions.',
      model: 'YOLOv8s Object Detector'
    },
    {
      id: 'pr_curve',
      title: 'Precision-Recall Curve',
      src: '/model_graphs/BoxPR_curve.png',
      description: 'Plots precision against recall. The area under the curve (AUC) represents the average precision (AP) for each category. Higher area indicates a more robust detector.',
      model: 'YOLOv8s Object Detector'
    },
    {
      id: 'f1_curve',
      title: 'F1-Confidence Curve',
      src: '/model_graphs/BoxF1_curve.png',
      description: 'F1 score (harmonic mean of precision and recall) plotted against confidence thresholds, indicating the optimal confidence threshold (typically ~0.25 - 0.40) for peak detection performance.',
      model: 'YOLOv8s Object Detector'
    }
  ];

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      {/* Model Overview Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {/* YOLOv8 Card */}
        <div style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: '12px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '120px',
            height: '120px',
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <span style={{
                background: 'rgba(139, 92, 246, 0.15)',
                color: 'var(--primary-light)',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                textTransform: 'uppercase'
              }}>YOLOv8s</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Object Detection Model</h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '20px' }}>
              Core neural network trained to recognize multi-class features in traffic images. Responsible for locating vehicle riders, helmets, no-helmets, and license plates.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Weights File</span>
                <span style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>best.pt (22.5 MB)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Input Resolution</span>
                <span style={{ color: 'var(--text-primary)' }}>640 &times; 640 px</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Classes Tracked</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Helmet, No Helmet, Rider, Number Plate</span>
              </div>
            </div>
          </div>
        </div>

        {/* HSRP MobileNetV2 Card */}
        <div style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: '12px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '120px',
            height: '120px',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <span style={{
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10B981',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                textTransform: 'uppercase'
              }}>MobileNetV2</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>HSRP License Plate Classifier</h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '20px' }}>
              Lightweight deep convolutional neural network fine-tuned specifically to evaluate cropped license plate images. Classifies plates into HSRP standard or non-HSRP style.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Weights File</span>
                <span style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>hsrp_classifier.pth (9.1 MB)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Input Resolution</span>
                <span style={{ color: 'var(--text-primary)' }}>224 &times; 224 px</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Classes Tracked</span>
                <span style={{ color: '#10B981', fontWeight: 600 }}>HSRP (Compliant), Non-HSRP (Violation)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Graphs Grid */}
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '18px', color: 'var(--text-primary)' }}>
        Model Performance Curves & Validation Graphs
      </h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        marginBottom: '40px'
      }}>
        {graphs.map((g) => (
          <div 
            key={g.id}
            onClick={() => setSelectedGraph(g)}
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              borderRadius: '12px',
              padding: '16px',
              cursor: 'pointer',
              transition: 'transform 0.25s ease, border-color 0.25s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = 'var(--primary-light)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.borderColor = 'var(--card-border)';
            }}
          >
            <div style={{
              width: '100%',
              height: '180px',
              borderRadius: '8px',
              background: '#070712',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.03)'
            }}>
              <img 
                src={g.src} 
                alt={g.title} 
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain'
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  const parent = e.target.parentNode;
                  parent.innerHTML = '<span style="color:var(--text-muted);font-size:0.75rem;">Graph placeholder</span>';
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--primary-light)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>
                {g.model}
              </div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>{g.title}</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 }}>
                {g.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedGraph && (
        <div 
          onClick={() => setSelectedGraph(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(5, 5, 12, 0.92)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            animation: 'fadeIn 0.2s ease',
            backdropFilter: 'blur(8px)'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#0d0d1e',
              border: '1px solid var(--card-border)',
              borderRadius: '16px',
              maxWidth: '850px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
            }}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 24px',
              borderBottom: '1px solid rgba(255,255,255,0.05)'
            }}>
              <div>
                <span style={{ fontSize: '0.65rem', color: 'var(--primary-light)', fontWeight: 'bold', textTransform: 'uppercase' }}>
                  {selectedGraph.model}
                </span>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {selectedGraph.title}
                </h4>
              </div>
              <button 
                onClick={() => setSelectedGraph(null)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s',
                  lineHeight: '1'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
              >
                &times;
              </button>
            </div>

            {/* Modal Image Area */}
            <div style={{
              background: '#05050c',
              padding: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              maxHeight: '450px',
              overflow: 'hidden'
            }}>
              <img 
                src={selectedGraph.src} 
                alt={selectedGraph.title} 
                style={{
                  maxWidth: '100%',
                  maxHeight: '400px',
                  objectFit: 'contain',
                  borderRadius: '4px'
                }}
              />
            </div>

            {/* Modal Description */}
            <div style={{
              padding: '20px 24px',
              background: '#0d0d1e',
              borderTop: '1px solid rgba(255,255,255,0.05)'
            }}>
              <h5 style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Analysis & Interpretation
              </h5>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                {selectedGraph.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Dashboard = () => {
  const [summary, setSummary] = useState(MOCK_SUMMARY);
  const [byType, setByType] = useState(MOCK_BY_TYPE);
  const [bySeverity, setBySeverity] = useState(MOCK_BY_SEVERITY);
  const [dailyTrend, setDailyTrend] = useState(MOCK_DAILY_TREND);
  const [recentViolations, setRecentViolations] = useState(MOCK_RECENT_VIOLATIONS);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsingMock, setIsUsingMock] = useState(false);
  const [activeTab, setActiveTab] = useState('live');

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const [
          resSummary,
          resByType,
          resBySeverity,
          resTrend,
          resViolations
        ] = await Promise.all([
          api.get('/analytics/summary').catch(() => null),
          api.get('/analytics/by-type').catch(() => null),
          api.get('/analytics/by-severity').catch(() => null),
          api.get('/analytics/daily-trend').catch(() => null),
          api.get('/violations?page=1').catch(() => null)
        ]);

        let usedMock = false;

        if (resSummary?.data?.data) {
          setSummary(resSummary.data.data);
        } else {
          usedMock = true;
        }

        if (resByType?.data?.data) {
          setByType(resByType.data.data);
        } else {
          usedMock = true;
        }

        if (resBySeverity?.data?.data) {
          setBySeverity(resBySeverity.data.data);
        } else {
          usedMock = true;
        }

        if (resTrend?.data?.data) {
          setDailyTrend(resTrend.data.data);
        } else {
          usedMock = true;
        }

        if (resViolations?.data?.data) {
          const vData = resViolations.data.data;
          const targetArray = Array.isArray(vData) ? vData : (vData.violations || []);
          const mapped = targetArray.map(v => ({
            id: v._id,
            imageUrl: v.image_path,
            plateNumber: v.plate_number,
            severity: v.severity,
            violations: v.violations,
            timestamp: v.timestamp,
            hsrpStatus: v.hsrp_status
          }));
          setRecentViolations(mapped.slice(0, 5));
        } else {
          usedMock = true;
        }

        setIsUsingMock(usedMock);
      } catch (err) {
        console.error('Failed to fetch API data, falling back to mocks:', err);
        setIsUsingMock(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);



  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' - ' + date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div className="page-title-section">
          <h1>Analytics Dashboard</h1>
          <p>Real-time traffic safety indicators and system telemetry</p>
        </div>
        
        {isUsingMock && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            color: '#fcd34d',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertTriangle size={16} />
            <span>Using mock dataset (Backend offline at port 5000)</span>
          </div>
        )}
      </div>

      {/* Sleek Tab Navigation */}
      <div className="dashboard-tabs" style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '28px',
        paddingBottom: '2px',
        borderBottom: '1px solid var(--card-border)'
      }}>
        <button 
          onClick={() => setActiveTab('live')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'live' ? 'rgba(108, 62, 232, 0.08)' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'live' ? '3px solid var(--primary-light)' : '3px solid transparent',
            color: activeTab === 'live' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderRadius: '6px 6px 0 0'
          }}
        >
          <TrendingUp size={16} />
          Live Operations & Analytics
        </button>
        <button 
          onClick={() => setActiveTab('model')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'model' ? 'rgba(108, 62, 232, 0.08)' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'model' ? '3px solid var(--primary-light)' : '3px solid transparent',
            color: activeTab === 'model' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderRadius: '6px 6px 0 0'
          }}
        >
          <ShieldAlert size={16} />
          AI Model Performance & Curves
        </button>
      </div>

      {activeTab === 'live' ? (
        <>


          {/* 4 Stat Cards */}
          <section className="stats-container">
            <StatCard 
              icon={FileSpreadsheet} 
              value={summary.total} 
              label="Total Violations" 
              theme="purple" 
            />
            <StatCard 
              icon={TrendingUp} 
              value={summary.today} 
              label="Today's Detections" 
              theme="blue" 
            />
            <StatCard 
              icon={Flame} 
              value={summary.high} 
              label="High Severity" 
              theme="red" 
            />
            <StatCard 
              icon={CheckCircle} 
              value={summary.low} 
              label="Low Severity" 
              theme="green" 
            />
          </section>

          {/* Chart Grid */}
          <div className="dashboard-grid">
            {/* Pie Chart: Types */}
            <div className="chart-card col-6">
              <h3 className="chart-card-title">Violation Breakdown by Type</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={byType}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {byType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS_TYPES[index % COLORS_TYPES.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111122', borderColor: '#1e1e36', borderRadius: '8px' }} 
                      itemStyle={{ color: '#f3f4f6' }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      iconType="circle"
                      formatter={(value) => <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar Chart: Severity */}
            <div className="chart-card col-6">
              <h3 className="chart-card-title">Violations by Severity</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={bySeverity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e1e36" vertical={false} />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} />
                    <YAxis stroke="#6b7280" fontSize={11} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111122', borderColor: '#1e1e36', borderRadius: '8px' }} 
                      itemStyle={{ color: '#f3f4f6' }}
                      cursor={{ fill: 'rgba(255, 255, 255, 0.02)' }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {bySeverity.map((entry, index) => {
                        const sevColor = COLORS_SEVERITY[entry.name.toUpperCase()] || '#6C3EE8';
                        return <Cell key={`cell-${index}`} fill={sevColor} />;
                      })}
                    </Bar>
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Line Chart: Daily Trend */}
            <div className="chart-card col-12">
              <h3 className="chart-card-title">Daily Violation Trend (Last 7 Days)</h3>
              <div className="chart-container" style={{ height: '260px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={dailyTrend} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e1e36" />
                    <XAxis dataKey="date" stroke="#6b7280" fontSize={11} tickLine={false} />
                    <YAxis stroke="#6b7280" fontSize={11} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111122', borderColor: '#1e1e36', borderRadius: '8px' }} 
                      itemStyle={{ color: '#f3f4f6' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#8b5cf6" 
                      strokeWidth={3} 
                      dot={{ fill: '#6C3EE8', r: 4, strokeWidth: 2 }} 
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent Violations Panel */}
          <section className="recent-violations-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Recent Violation Incidents</h3>
              <Link to="/violations" className="table-view-more">
                <span>View All Records</span>
                <ChevronRight size={16} />
              </Link>
            </div>

            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Plate Number</th>
                    <th>Severity</th>
                    <th>HSRP Standard</th>
                    <th>Violations</th>
                  </tr>
                </thead>
                <tbody>
                  {recentViolations && recentViolations.length > 0 ? (
                    recentViolations.map((v) => {
                      const isHsrp = v.hsrpStatus === 'HSRP' || v.hsrpStatus === true || v.hsrpStatus?.toString()?.toUpperCase() === 'COMPLIANT';
                      return (
                        <tr key={v.id}>
                          <td style={{ color: 'var(--text-secondary)' }}>{formatDate(v.timestamp)}</td>
                          <td style={{ fontWeight: 600, letterSpacing: '0.5px' }}>{v.plateNumber || 'N/A'}</td>
                          <td>
                            <span className={`badge badge-${v.severity?.toLowerCase() || 'none'}`}>
                              {v.severity || 'NONE'}
                            </span>
                          </td>
                          <td>
                            <span className={`hsrp-status-badge ${isHsrp ? 'hsrp-compliant' : 'hsrp-non-compliant'}`} style={{ padding: '2px 8px', fontSize: '0.75rem' }}>
                              {isHsrp ? 'Compliant' : 'Non-HSRP'}
                            </span>
                          </td>
                          <td>
                            <div className="table-badge-list">
                              {v.violations && v.violations.length > 0 ? (
                                v.violations.map((tag, i) => (
                                  <span key={i} className="table-tag">{tag}</span>
                                ))
                              ) : (
                                <span className="table-tag" style={{ color: 'var(--severity-low)', borderColor: 'rgba(34, 197, 94, 0.2)', background: 'rgba(34, 197, 94, 0.05)' }}>
                                  NONE
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ textGrid: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                        No violation records logged.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        <ModelPerformanceView />
      )}
    </div>
  );
};

export default Dashboard;
