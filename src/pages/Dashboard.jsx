import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import StatCard from '../components/StatCard';
import { 
  FileSpreadsheet, 
  ShieldAlert, 
  Flame, 
  CheckCircle,
  Calendar,
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

// CCTV Canvas Simulator
const vehicleTypes = ['car', 'bike_ok', 'bike_viol', 'car'];
const plates = ['DL 3C AQ 1234', 'HR 26 DK 5678', 'MH 02 BY 9999', 'KA 51 MB 4321', 'UP 16 CT 0001', 'GJ 01 ZY 7777'];
const violationsList = ['NO HELMET', 'TRIPLE RIDING', 'NON HSRP'];

const CCTVCanvas = ({ onAlert }) => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let vehicles = [];
    let animationFrameId;
    let spawnTimer;

    const spawnVehicle = () => {
      const type = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
      const plate = plates[Math.floor(Math.random() * plates.length)];
      const hasViol = type === 'bike_viol';
      const violations = hasViol ? [violationsList[Math.floor(Math.random() * 2)], 'NON HSRP'] : [];
      
      vehicles.push({
        id: Math.random().toString(),
        x: Math.random() > 0.5 ? 80 : 180,
        y: 320,
        speed: 1.2 + Math.random() * 1.2,
        type,
        plate,
        violations,
        detected: false
      });
    };

    spawnVehicle();

    spawnTimer = setInterval(() => {
      if (vehicles.length < 3) {
        spawnVehicle();
      }
    }, 4500);

    const draw = () => {
      ctx.fillStyle = '#0a0a14';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = 'var(--card-border)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(30, 0); ctx.lineTo(30, 300);
      ctx.moveTo(250, 0); ctx.lineTo(250, 300);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 2;
      ctx.setLineDash([15, 15]);
      ctx.beginPath();
      ctx.moveTo(140, 0);
      ctx.lineTo(140, 300);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = 'var(--primary-glow)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(30, 120);
      ctx.lineTo(250, 120);
      ctx.stroke();

      ctx.fillStyle = 'rgba(108, 62, 232, 0.08)';
      ctx.fillRect(30, 100, 220, 20);
      ctx.fillStyle = 'var(--primary-light)';
      ctx.font = '8px monospace';
      ctx.fillText('CHECKPOINT LINE - AI DETECTION', 65, 112);

      vehicles = vehicles.filter(v => {
        v.y -= v.speed;
        const onScreen = v.y > -50;
        
        if (v.y <= 120 && !v.detected) {
          v.detected = true;
          onAlert({
            id: v.id,
            timestamp: new Date().toISOString(),
            plateNumber: v.plate,
            severity: v.violations.length > 0 ? 'HIGH' : 'NONE',
            violations: v.violations,
            hsrpStatus: v.violations.includes('NON HSRP') ? 'NON_HSRP' : 'HSRP'
          });
        }

        if (onScreen) {
          if (v.type === 'car') {
            ctx.strokeStyle = '#3B82F6';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(v.x - 15, v.y - 25, 30, 50);
            ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
            ctx.fillRect(v.x - 15, v.y - 25, 30, 50);
            
            ctx.fillStyle = '#3B82F6';
            ctx.fillRect(v.x - 15, v.y - 35, 22, 10);
            ctx.fillStyle = 'white';
            ctx.font = '7px monospace';
            ctx.fillText('CAR', v.x - 12, v.y - 27);
          } else {
            const isViol = v.type === 'bike_viol';
            ctx.strokeStyle = isViol ? 'var(--severity-high)' : 'var(--severity-low)';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(v.x - 12, v.y - 18, 24, 36);
            ctx.fillStyle = isViol ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)';
            ctx.fillRect(v.x - 12, v.y - 18, 24, 36);

            ctx.fillStyle = isViol ? 'var(--severity-high)' : 'var(--severity-low)';
            ctx.fillRect(v.x - 12, v.y - 28, 24, 10);
            ctx.fillStyle = 'white';
            ctx.font = '7px monospace';
            ctx.fillText(isViol ? 'VIOL' : 'OK', v.x - 9, v.y - 20);

            if (isViol && v.y < 160 && v.y > 80) {
              ctx.strokeStyle = 'var(--severity-high)';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.arc(v.x, v.y - 6, 5, 0, Math.PI * 2);
              ctx.stroke();
            }
          }
        }
        return onScreen;
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearInterval(spawnTimer);
    };
  }, [onAlert]);

  return (
    <div style={{ position: 'relative', background: '#04040a', borderRadius: '12px', border: '1px solid var(--card-border)', overflow: 'hidden' }}>
      <canvas 
        ref={canvasRef} 
        width={280} 
        height={260} 
        style={{ display: 'block', width: '100%', height: '260px' }} 
      />
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        background: 'rgba(0,0,0,0.6)',
        color: '#ef4444',
        padding: '3px 8px',
        borderRadius: '4px',
        fontSize: '0.65rem',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        letterSpacing: '0.5px'
      }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }}></span>
        <span>CCTV SIMULATOR</span>
      </div>
    </div>
  );
};

// Alert Feed Ticker
const AlertTicker = ({ alerts }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '260px',
      background: 'var(--card-bg)',
      border: '1px solid var(--card-border)',
      borderRadius: '12px',
      padding: '16px',
      overflow: 'hidden'
    }}>
      <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Real-Time Alert Feed</span>
        <span style={{ fontSize: '0.65rem', color: 'var(--primary-light)', background: 'rgba(139, 92, 246, 0.1)', padding: '2px 8px', borderRadius: '20px' }}>
          Active
        </span>
      </h3>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        overflowY: 'auto',
        flex: 1,
        paddingRight: '4px'
      }}>
        {alerts.slice(0, 10).map((alert, index) => {
          const isViol = alert.violations.length > 0;
          return (
            <div 
              key={alert.id + index}
              style={{
                background: isViol ? 'rgba(239, 68, 68, 0.05)' : 'rgba(34, 197, 94, 0.03)',
                borderLeft: `3px solid ${isViol ? 'var(--severity-high)' : 'var(--severity-low)'}`,
                padding: '8px 12px',
                borderRadius: '4px',
                fontSize: '0.75rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                animation: 'fadeIn 0.3s ease'
              }}
            >
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {alert.plateNumber}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '2px' }}>
                  {isViol ? alert.violations.join(' | ') : 'NO VIOLATION'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className={`badge badge-${alert.severity.toLowerCase()}`} style={{ fontSize: '0.6rem', padding: '1px 6px' }}>
                  {alert.severity}
                </span>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', marginTop: '2px' }}>
                  {new Date(alert.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

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

const Dashboard = () => {
  const [summary, setSummary] = useState(MOCK_SUMMARY);
  const [byType, setByType] = useState(MOCK_BY_TYPE);
  const [bySeverity, setBySeverity] = useState(MOCK_BY_SEVERITY);
  const [dailyTrend, setDailyTrend] = useState(MOCK_DAILY_TREND);
  const [recentViolations, setRecentViolations] = useState(MOCK_RECENT_VIOLATIONS);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsingMock, setIsUsingMock] = useState(false);
  const [liveAlerts, setLiveAlerts] = useState(MOCK_RECENT_VIOLATIONS);

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

  const handleLiveAlert = (newAlert) => {
    setLiveAlerts(prev => [newAlert, ...prev]);

    if (newAlert.violations.length > 0) {
      setSummary(prev => {
        const nextSummary = { ...prev };
        nextSummary.total += 1;
        nextSummary.today += 1;
        if (newAlert.severity === 'HIGH') {
          nextSummary.high += 1;
        } else if (newAlert.severity === 'LOW') {
          nextSummary.low += 1;
        } else {
          nextSummary.medium += 1;
        }
        return nextSummary;
      });

      setByType(prev => {
        return prev.map(t => {
          if (newAlert.violations.includes(t.name)) {
            return { ...t, value: t.value + 1 };
          }
          return t;
        });
      });

      setBySeverity(prev => {
        return prev.map(s => {
          if (s.name === newAlert.severity) {
            return { ...s, value: s.value + 1 };
          }
          return s;
        });
      });
    }
  };

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
      <div className="page-header" style={{ marginBottom: '25px' }}>
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

      {/* CCTV & Live alert grid */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <CCTVCanvas onAlert={handleLiveAlert} />
        </div>
        <div>
          <AlertTicker alerts={liveAlerts} />
        </div>
      </section>

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
    </div>
  );
};

export default Dashboard;
