import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import ViolationCard from '../components/ViolationCard';
import { useAuth } from '../context/AuthContext';
import { exportViolationPDF } from '../utils/exportPDF';
import { 
  Search, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Inbox, 
  Loader2, 
  AlertTriangle,
  X,
  FileText,
  Calendar,
  MapPin,
  ShieldCheck
} from 'lucide-react';

const getMockDetails = (v) => {
  const violationsList = v.violations || [];
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
  if (v.hsrpStatus === 'NON_HSRP' || violationsList.includes('NON HSRP')) {
    fineAmount += 5000;
    fineBreakdown.push({
      violation: 'NON HSRP',
      section: 'Section 192 (MVA)',
      amount: 5000,
      penalty: '₹5,000 fine for registration plate violation'
    });
  }
  
  const aiAnalysis = v.aiAnalysis || (violationsList.length === 0
    ? `AI System Analysis: Vehicle with plate number "${v.plateNumber}" was scanned. The system confirms full compliance: all occupants are wearing protective helmets, occupancy count matches safety thresholds, and the license plate adheres to HSRP regulations. No offenses recorded.`
    : `AI System Analysis: Vehicle "${v.plateNumber}" was flagged at the checkpoint. The automated scanner logged: ${violationsList.join(', ')}. The cumulative fine of ₹${fineAmount} has been generated, and challan is recommended.`);
    
  return {
    location: v.location || { latitude: 17.3850, longitude: 78.4867, address: 'Challan Checkpoint, Hyderabad, India' },
    aiAnalysis,
    fineAmount,
    fineBreakdown
  };
};

const MOCK_VIOLATIONS = [
  { id: '1', imageUrl: '/uploads/violation_1.jpg', plateNumber: 'DL3CAQ1234', severity: 'HIGH', violations: ['NO HELMET', 'TRIPLE RIDING'], timestamp: '2026-06-08T10:15:30Z', hsrpStatus: 'NON_HSRP' },
  { id: '2', imageUrl: '/uploads/violation_2.jpg', plateNumber: 'HR26DK5678', severity: 'MEDIUM', violations: ['NON HSRP'], timestamp: '2026-06-08T09:42:15Z', hsrpStatus: 'NON_HSRP' },
  { id: '3', imageUrl: '/uploads/violation_3.jpg', plateNumber: 'MH02BY9999', severity: 'LOW', violations: ['NO HELMET'], timestamp: '2026-06-08T08:12:00Z', hsrpStatus: 'HSRP' },
  { id: '4', imageUrl: '/uploads/violation_4.jpg', plateNumber: 'KA51MB4321', severity: 'HIGH', violations: ['NO HELMET', 'NON HSRP'], timestamp: '2026-06-08T07:30:45Z', hsrpStatus: 'NON_HSRP' },
  { id: '5', imageUrl: '/uploads/violation_5.jpg', plateNumber: 'UP16CT0001', severity: 'NONE', violations: [], timestamp: '2026-06-08T06:05:10Z', hsrpStatus: 'HSRP' },
  { id: '6', imageUrl: '/uploads/violation_6.jpg', plateNumber: 'MH12PQ4567', severity: 'MEDIUM', violations: ['TRIPLE RIDING'], timestamp: '2026-06-07T18:22:40Z', hsrpStatus: 'HSRP' },
  { id: '7', imageUrl: '/uploads/violation_7.jpg', plateNumber: 'KA03HA9988', severity: 'HIGH', violations: ['NO HELMET', 'TRIPLE RIDING', 'NON HSRP'], timestamp: '2026-06-07T14:15:10Z', hsrpStatus: 'NON_HSRP' },
  { id: '8', imageUrl: '/uploads/violation_8.jpg', plateNumber: 'DL1CAB2233', severity: 'LOW', violations: ['NON HSRP'], timestamp: '2026-06-07T11:02:15Z', hsrpStatus: 'NON_HSRP' }
];

const Violations = () => {
  const { user } = useAuth();

  // Filter states
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Data states
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isUsingMock, setIsUsingMock] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const [selectedViolation, setSelectedViolation] = useState(null);
  const modalMapRef = useRef(null);

  const limitPerPage = 6;

  useEffect(() => {
    if (!selectedViolation || !window.L) return;

    const timer = setTimeout(() => {
      const mapContainer = document.getElementById('modal-map');
      if (mapContainer && !modalMapRef.current) {
        const lat = selectedViolation.location?.latitude || 17.3850;
        const lng = selectedViolation.location?.longitude || 78.4867;
        const addressText = selectedViolation.location?.address || 'Challan Checkpoint, Hyderabad, India';

        const map = window.L.map('modal-map').setView([lat, lng], 15);
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        window.L.marker([lat, lng]).addTo(map)
          .bindPopup(addressText)
          .openPopup();

        modalMapRef.current = map;
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (modalMapRef.current) {
        modalMapRef.current.remove();
        modalMapRef.current = null;
      }
    };
  }, [selectedViolation]);

  const fetchViolations = async (pageNumber = 1) => {
    setLoading(true);
    setStatusMsg('');
    try {
      // Construct query params
      const params = {
        page: pageNumber,
        limit: limitPerPage
      };
      if (severityFilter !== 'ALL') params.severity = severityFilter;
      if (typeFilter !== 'ALL') params.type = typeFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.get('/violations', { params });
      const resPayload = response.data;
      
      if (resPayload && resPayload.success) {
        setIsUsingMock(false);
        const vData = resPayload.data;
        const vPagination = resPayload.pagination;
        
        if (Array.isArray(vData)) {
          const mapped = vData.map(v => ({
            id: v._id,
            imageUrl: v.image_path,
            plateNumber: v.plate_number,
            severity: v.severity,
            violations: v.violations,
            timestamp: v.timestamp,
            hsrpStatus: v.hsrp_status,
            location: v.location || { latitude: 17.3850, longitude: 78.4867, address: 'Challan Checkpoint, Hyderabad, India' },
            aiAnalysis: v.ai_analysis || '',
            fineAmount: v.fine_amount || 0,
            fineBreakdown: v.fine_breakdown || []
          }));
          setViolations(mapped);
          setTotalPages(vPagination?.pages || 1);
        } else {
          throw new Error('Unrecognized response structure');
        }
      }
    } catch (err) {
      console.warn('API error, executing local mock-based filtering:', err);
      setIsUsingMock(true);
      
      // Perform local filtering on mock data
      let filtered = [...MOCK_VIOLATIONS];

      if (severityFilter !== 'ALL') {
        filtered = filtered.filter(v => v.severity?.toUpperCase() === severityFilter.toUpperCase());
      }
      if (typeFilter !== 'ALL') {
        filtered = filtered.filter(v => 
          v.violations?.some(tag => tag.replace(' ', '_').toUpperCase() === typeFilter.replace(' ', '_').toUpperCase())
        );
      }
      if (startDate) {
        const start = new Date(startDate).getTime();
        filtered = filtered.filter(v => new Date(v.timestamp).getTime() >= start);
      }
      if (endDate) {
        const end = new Date(endDate).getTime() + 86400000; // include full day
        filtered = filtered.filter(v => new Date(v.timestamp).getTime() <= end);
      }

      // Slice for pagination
      const totalCount = filtered.length;
      const computedTotalPages = Math.ceil(totalCount / limitPerPage) || 1;
      setTotalPages(computedTotalPages);
      
      const startIndex = (pageNumber - 1) * limitPerPage;
      const slicedData = filtered.slice(startIndex, startIndex + limitPerPage).map(v => {
        const details = getMockDetails(v);
        return {
          ...v,
          location: details.location,
          aiAnalysis: details.aiAnalysis,
          fineAmount: details.fineAmount,
          fineBreakdown: details.fineBreakdown
        };
      });
      
      setViolations(slicedData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchViolations(1);
    setCurrentPage(1);
  }, []);

  const handleApplyFilters = (e) => {
    e.preventDefault();
    fetchViolations(1);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      fetchViolations(newPage);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this violation record?')) return;

    try {
      await api.delete(`/violations/${id}`);
      setStatusMsg('Record deleted successfully');
      // Refetch
      fetchViolations(currentPage);
    } catch (err) {
      console.error('Failed to delete violation from server:', err);
      // Local fallback simulation
      if (isUsingMock) {
        const index = MOCK_VIOLATIONS.findIndex(v => v.id === id);
        if (index > -1) {
          MOCK_VIOLATIONS.splice(index, 1);
          setStatusMsg('Record deleted from mock list');
          fetchViolations(currentPage);
        }
      } else {
        alert('Failed to delete record. Authentication expired or server unreachable.');
      }
    }
  };

  const handleExportCSV = async () => {
    try {
      // Pass current filters as query params
      const params = {};
      if (severityFilter !== 'ALL') params.severity = severityFilter;
      if (typeFilter !== 'ALL') params.type = typeFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.get('/violations/export/csv', { 
        params,
        responseType: 'blob' 
      });

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `traffic_violations_export_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('CSV export failed:', err);
      
      // Standalone browser export simulation for testing when API fails
      if (isUsingMock) {
        let headers = 'ID,Plate Number,Severity,Timestamp,HSRP Status,Violations\n';
        let csvContent = MOCK_VIOLATIONS.map(v => 
          `"${v.id}","${v.plateNumber}","${v.severity}","${v.timestamp}","${v.hsrpStatus}","${v.violations.join('; ')}"`
        ).join('\n');
        
        const blob = new Blob([headers + csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `mock_violations_export_${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        alert('Unable to export CSV. Please check your credentials or API connection.');
      }
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-header" style={{ marginBottom: '10px' }}>
        <div className="page-title-section">
          <h1>Violation Records</h1>
          <p>Search, filter, delete, and download CSV sheets of road violations</p>
        </div>
      </div>

      {isUsingMock && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          color: '#fcd34d',
          padding: '10px 16px',
          borderRadius: '8px',
          fontSize: '0.85rem',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertTriangle size={16} />
          <span>Local Mock Filter Mode Active (API offline at port 5000)</span>
        </div>
      )}

      {statusMsg && (
        <div style={{
          background: 'rgba(34, 197, 94, 0.08)',
          border: '1px solid rgba(34, 197, 94, 0.2)',
          color: '#86efac',
          padding: '10px 16px',
          borderRadius: '8px',
          fontSize: '0.85rem',
          marginBottom: '20px'
        }}>
          {statusMsg}
        </div>
      )}

      {/* Filter panel */}
      <form onSubmit={handleApplyFilters} className="filter-bar">
        <div className="filter-group">
          <label>Severity Level</label>
          <select 
            className="filter-select"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
          >
            <option value="ALL">ALL SEVERITIES</option>
            <option value="HIGH">HIGH SEVERITY</option>
            <option value="MEDIUM">MEDIUM SEVERITY</option>
            <option value="LOW">LOW SEVERITY</option>
            <option value="NONE">NO SEVERITY</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Violation Type</label>
          <select 
            className="filter-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="ALL">ALL TYPES</option>
            <option value="NO HELMET">NO HELMET</option>
            <option value="TRIPLE RIDING">TRIPLE RIDING</option>
            <option value="NON HSRP">NON HSRP</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Start Date</label>
          <input 
            type="date" 
            className="filter-input"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>End Date</label>
          <input 
            type="date" 
            className="filter-input"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div className="filter-btn-group">
          <button type="submit" className="filter-apply-btn">
            <Search size={16} />
            <span>Apply</span>
          </button>
          {user?.role === 'admin' && (
            <button type="button" onClick={handleExportCSV} className="filter-export-btn">
              <Download size={16} />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </form>

      {/* Grid listing */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0' }}>
          <Loader2 className="spinner" size={32} style={{ color: 'var(--primary-light)' }} />
          <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Loading violation records...</p>
        </div>
      ) : violations.length > 0 ? (
        <>
          <div className="violations-grid">
            {violations.map((violation) => (
              <ViolationCard 
                key={violation.id} 
                violation={violation} 
                onDelete={handleDelete} 
                onClick={() => setSelectedViolation(violation)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination-container">
              <button 
                onClick={() => handlePageChange(currentPage - 1)} 
                disabled={currentPage === 1}
                className="pagination-btn"
                title="Previous Page"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="pagination-info">
                Page <strong>{currentPage}</strong> of {totalPages}
              </span>
              <button 
                onClick={() => handlePageChange(currentPage + 1)} 
                disabled={currentPage === totalPages}
                className="pagination-btn"
                title="Next Page"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          <Inbox className="empty-state-icon" size={48} />
          <h3>No Records Found</h3>
          <p>We couldn't find any violation records matching the selected filter criteria.</p>
        </div>
      )}

      {/* Detailed Review Modal Overlay */}
      {selectedViolation && (
        <div className="modal-overlay" onClick={() => setSelectedViolation(null)}>
          <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Violation Case Details: <span className="logo-accent">{selectedViolation.plateNumber || 'NO PLATE'}</span>
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button 
                  onClick={() => exportViolationPDF(selectedViolation)} 
                  className="filter-export-btn"
                  style={{ height: '36px', padding: '0 16px', fontSize: '0.8rem' }}
                  title="Download PDF Challan"
                >
                  <Download size={14} />
                  <span>Download PDF</span>
                </button>
                <button className="modal-close-btn" onClick={() => setSelectedViolation(null)}>
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="modal-body">
              {/* Left column: Annotated image */}
              <div className="modal-image-panel">
                <div className="modal-image-wrapper">
                  <img 
                    src={selectedViolation.imageUrl ? (selectedViolation.imageUrl.startsWith('http') ? selectedViolation.imageUrl : `http://localhost:5000${selectedViolation.imageUrl.startsWith('/') ? '' : '/'}${selectedViolation.imageUrl}`) : 'https://placehold.co/600x400/0a0a0f/ffffff?text=No+Image+Available'} 
                    alt="Violation context snapshot"
                    className="modal-image"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://placehold.co/600x400/0a0a0f/888888?text=Vehicle+Image+Unavailable';
                    }}
                  />
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {selectedViolation.violations && selectedViolation.violations.length > 0 ? (
                    selectedViolation.violations.map((tag, idx) => (
                      <span key={idx} className="violation-tag" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="violation-tag no-violations" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                      <ShieldCheck size={14} style={{ marginRight: '4px' }} />
                      COMPLIANT VEHICLE
                    </span>
                  )}
                </div>
              </div>
              
              {/* Right column: Info & location & fines */}
              <div className="modal-info-panel" style={{ textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <Calendar size={15} className="logo-accent" />
                    <span>{new Date(selectedViolation.timestamp).toLocaleString('en-IN')}</span>
                  </div>
                  <span className={`badge ${
                    selectedViolation.severity?.toUpperCase() === 'HIGH' ? 'badge-high' :
                    selectedViolation.severity?.toUpperCase() === 'MEDIUM' ? 'badge-medium' :
                    selectedViolation.severity?.toUpperCase() === 'LOW' ? 'badge-low' : 'badge-none'
                  }`} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                    {selectedViolation.severity || 'NONE'}
                  </span>
                </div>

                {/* GPS Location Tag map */}
                <div style={{ border: '1px solid var(--card-border)', borderRadius: '8px', padding: '14px', background: 'var(--bg-subtle-strong)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>
                    <MapPin size={16} className="logo-accent" />
                    <span>Checkpoint GPS Mapping</span>
                  </div>
                  <div id="modal-map" style={{ height: '160px', borderRadius: '6px', border: '1px solid var(--card-border)', background: '#0a0a0f', zIndex: 1, marginBottom: '10px' }} />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4', margin: 0 }}>
                    <strong>Address:</strong> {selectedViolation.location?.address || 'Challan Checkpoint, Hyderabad, India'}
                  </p>
                </div>

                {/* Indian standard fines table */}
                <div style={{ border: '1px solid var(--card-border)', borderRadius: '8px', padding: '14px', background: 'var(--bg-subtle-strong)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Indian Motor Vehicle Act Challan</span>
                    <strong style={{ fontSize: '1.1rem', color: 'var(--primary-light)' }}>
                      ₹{(selectedViolation.fineAmount || 0).toLocaleString('en-IN')}
                    </strong>
                  </div>
                  
                  {selectedViolation.fineBreakdown && selectedViolation.fineBreakdown.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--card-border)', textAlign: 'left' }}>
                            <th style={{ padding: '4px 6px', fontWeight: 600 }}>Violation</th>
                            <th style={{ padding: '4px 6px', fontWeight: 600 }}>Section</th>
                            <th style={{ padding: '4px 6px', fontWeight: 600, textAlign: 'right' }}>Fine</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedViolation.fineBreakdown.map((item, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                              <td style={{ padding: '6px 4px', color: 'var(--text-primary)', fontWeight: 500 }}>{item.violation}</td>
                              <td style={{ padding: '6px 4px' }}>{item.section}</td>
                              <td style={{ padding: '6px 4px', textAlign: 'right', color: 'var(--text-primary)', fontWeight: 'bold' }}>₹{item.amount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ padding: '6px 10px', background: 'rgba(34, 197, 94, 0.05)', borderRadius: '4px', fontSize: '0.75rem', color: '#86efac' }}>
                      No fines applicable.
                    </div>
                  )}
                </div>

                {/* AI generated analysis card */}
                <div style={{ border: '1px solid var(--card-border)', borderRadius: '8px', padding: '14px', background: 'var(--bg-subtle-strong)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    <FileText size={16} className="logo-accent" />
                    <span>AI Safety Narrative</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', lineHeight: '1.5', color: 'var(--text-secondary)', margin: 0, fontStyle: 'italic' }}>
                    {selectedViolation.aiAnalysis || 'No safety report compiled for this check.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Violations;
