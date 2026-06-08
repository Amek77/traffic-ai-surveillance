import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Mail, Lock, LogIn, AlertCircle } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user, login } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please fill in all fields');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);

    const result = await login(email, password);

    setIsSubmitting(false);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setErrorMsg(result.error || 'Authentication failed. Please try again.');
    }
  };

  // Quick fill helper for testing
  const handleQuickFill = (roleType) => {
    if (roleType === 'admin') {
      setEmail('admin@traffic.gov.in');
      setPassword('admin123');
    } else {
      setEmail('officer@traffic.gov.in');
      setPassword('officer123');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-card-glow"></div>
        
        <div className="login-header">
          <div className="login-logo">
            <ShieldAlert size={28} />
          </div>
          <h2>Portal Login</h2>
          <p>Sign in to SVDS Control Room</p>
        </div>

        {errorMsg && (
          <div className="error-alert">
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={18} />
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="officer@traffic.gov.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Security Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="login-submit-btn" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="btn-spinner"></div>
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <LogIn size={18} />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '30px', borderTop: '1px solid var(--card-border)', paddingTop: '20px' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px', textAlign: 'center' }}>
            Testing credentials:
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button 
              type="button" 
              onClick={() => handleQuickFill('admin')}
              style={{
                background: 'rgba(239, 68, 68, 0.05)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#fca5a5',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Fill Admin
            </button>
            <button 
              type="button" 
              onClick={() => handleQuickFill('officer')}
              style={{
                background: 'rgba(108, 62, 232, 0.08)',
                border: '1px solid rgba(108, 62, 232, 0.2)',
                color: '#c084fc',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Fill Operator
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
