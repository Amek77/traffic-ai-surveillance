import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldAlert, 
  LayoutDashboard, 
  FileSpreadsheet, 
  Upload, 
  LogOut, 
  User, 
  Sun, 
  Moon 
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isLightTheme, setIsLightTheme] = useState(() => {
    return localStorage.getItem('theme') === 'light';
  });
  const [activeAccent, setActiveAccent] = useState(() => {
    return localStorage.getItem('accent') || 'purple';
  });

  useEffect(() => {
    if (isLightTheme) {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
    localStorage.setItem('theme', isLightTheme ? 'light' : 'dark');
  }, [isLightTheme]);

  useEffect(() => {
    const accents = ['purple', 'cyber', 'emerald', 'indigo'];
    accents.forEach(acc => {
      document.body.classList.remove(`accent-${acc}`);
    });
    document.body.classList.add(`accent-${activeAccent}`);
    localStorage.setItem('accent', activeAccent);
  }, [activeAccent]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <ShieldAlert className="logo-icon" size={28} />
          <span>SVDS <span className="logo-accent">AI</span></span>
        </Link>

        {user && (
          <div className="nav-links">
            <NavLink 
              to="/dashboard" 
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </NavLink>
            <NavLink 
              to="/violations" 
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
            >
              <FileSpreadsheet size={18} />
              <span>Violations</span>
            </NavLink>
            <NavLink 
              to="/upload" 
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
            >
              <Upload size={18} />
              <span>Upload & Detect</span>
            </NavLink>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Dynamic Theme Picker */}
          <div className="theme-customizer" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="accent-picker" style={{ 
              display: 'flex', 
              gap: '6px', 
              padding: '4px 8px', 
              background: 'var(--bg-subtle-strong)', 
              borderRadius: '20px', 
              border: '1px solid var(--card-border)' 
            }}>
              {[
                { name: 'purple', color: '#6C3EE8', label: 'Midnight Purple' },
                { name: 'cyber', color: '#ec4899', label: 'Cyberpunk Neon' },
                { name: 'emerald', color: '#10B981', label: 'Emerald Eco' },
                { name: 'indigo', color: '#3B82F6', label: 'Classic Indigo' }
              ].map(acc => (
                <button
                  key={acc.name}
                  onClick={() => setActiveAccent(acc.name)}
                  style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    backgroundColor: acc.color,
                    border: activeAccent === acc.name ? '1px solid var(--text-primary)' : 'none',
                    cursor: 'pointer',
                    padding: 0,
                    outline: 'none',
                    boxShadow: activeAccent === acc.name ? `0 0 6px ${acc.color}` : 'none',
                    transform: activeAccent === acc.name ? 'scale(1.15)' : 'scale(1)',
                    transition: 'all 0.15s ease'
                  }}
                  title={acc.label}
                  aria-label={acc.label}
                />
              ))}
            </div>

            <button
              onClick={() => setIsLightTheme(!isLightTheme)}
              style={{
                background: 'transparent',
                border: '1px solid var(--card-border)',
                color: 'var(--text-primary)',
                padding: '6px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                transition: 'var(--transition)'
              }}
              title={isLightTheme ? "Switch to Dark Theme" : "Switch to Light Theme"}
              aria-label={isLightTheme ? "Switch to Dark Theme" : "Switch to Light Theme"}
            >
              {isLightTheme ? <Moon size={15} /> : <Sun size={15} />}
            </button>
          </div>

          <div className="nav-user-section">
            {user ? (
              <div className="user-profile">
                <div className="user-info">
                  <User size={16} className="user-avatar-icon" />
                  <span className="user-name">{user.name}</span>
                  <span className={`role-badge ${user.role?.toLowerCase() === 'admin' ? 'role-admin' : 'role-user'}`}>
                    {user.role || 'User'}
                  </span>
                </div>
                <button onClick={handleLogout} className="logout-btn" title="Logout">
                  <LogOut size={18} />
                  <span className="logout-text">Logout</span>
                </button>
              </div>
            ) : (
              <Link to="/login" className="login-nav-btn">
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
