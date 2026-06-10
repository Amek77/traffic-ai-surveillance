import React from 'react';
import { Calendar, Tag, ShieldCheck, ShieldAlert, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ViolationCard = ({ violation, onDelete, onClick }) => {
  const { user } = useAuth();
  const { id, imageUrl, plateNumber, severity, violations, timestamp, hsrpStatus } = violation;

  const getImageUrl = (path) => {
    if (!path) return 'https://placehold.co/600x400/0a0a0f/ffffff?text=No+Image+Available';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    // For localhost backend or relative uploads path
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `http://localhost:5000${cleanPath}`;
  };

  const getSeverityBadgeClass = (sev) => {
    switch (sev?.toUpperCase()) {
      case 'HIGH':
        return 'severity-badge-high';
      case 'MEDIUM':
        return 'severity-badge-medium';
      case 'LOW':
        return 'severity-badge-low';
      case 'NONE':
      default:
        return 'severity-badge-none';
    }
  };

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
    } catch (e) {
      return dateStr;
    }
  };

  const isHsrp = hsrpStatus === 'HSRP' || hsrpStatus === true || hsrpStatus?.toString()?.toUpperCase() === 'COMPLIANT';

  return (
    <div className="violation-card" onClick={onClick} style={{ cursor: 'pointer' }}>
      <div className="violation-card-img-container">
        <img 
          src={getImageUrl(imageUrl)} 
          alt={`Violation by ${plateNumber || 'Unknown Vehicle'}`} 
          className="violation-card-img"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://placehold.co/600x400/0a0a0f/888888?text=Vehicle+Image+Unavailable';
          }}
        />
        <div className="violation-card-badge-container">
          <span className={`violation-severity-badge ${getSeverityBadgeClass(severity)}`}>
            {severity || 'NONE'}
          </span>
        </div>
      </div>

      <div className="violation-card-body">
        <div className="violation-card-header">
          <h3 className="plate-number-display">{plateNumber || 'NO PLATE'}</h3>
          {user?.role === 'admin' && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDelete && onDelete(id);
              }} 
              className="delete-violation-btn" 
              title="Delete Record"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>

        <div className="violation-info-grid">
          <div className="info-row">
            <Calendar size={14} className="info-icon" />
            <span className="info-text">{formatDate(timestamp)}</span>
          </div>

          <div className="info-row">
            {isHsrp ? (
              <span className="hsrp-status-badge hsrp-compliant">
                <ShieldCheck size={14} />
                <span>HSRP Compliant</span>
              </span>
            ) : (
              <span className="hsrp-status-badge hsrp-non-compliant">
                <ShieldAlert size={14} />
                <span>Non-HSRP Plate</span>
              </span>
            )}
          </div>
        </div>

        <div className="violation-tags-list">
          {violations && violations.length > 0 ? (
            violations.map((v, i) => (
              <span key={i} className="violation-tag">
                <Tag size={10} className="tag-icon" />
                {v}
              </span>
            ))
          ) : (
            <span className="violation-tag no-violations">
              <ShieldCheck size={10} className="tag-icon" />
              NO VIOLATION
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViolationCard;
