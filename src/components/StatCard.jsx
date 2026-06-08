import React from 'react';

const StatCard = ({ icon: Icon, value, label, theme = 'purple' }) => {
  // theme can be: purple, blue, red, green
  return (
    <div className={`stat-card stat-theme-${theme}`}>
      <div className="stat-card-glow"></div>
      <div className="stat-card-inner">
        <div className="stat-card-header">
          <span className="stat-card-label">{label}</span>
          <div className="stat-card-icon-container">
            {Icon && <Icon size={20} className="stat-card-icon" />}
          </div>
        </div>
        <div className="stat-card-value">{value}</div>
      </div>
    </div>
  );
};

export default StatCard;
