import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { 
  UserPlus, 
  Trash2, 
  User, 
  Mail, 
  Key, 
  ShieldCheck, 
  ShieldAlert, 
  Loader2, 
  AlertTriangle 
} from 'lucide-react';

const Operators = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const response = await api.get('/auth/users');
      if (response.data && response.data.success) {
        setUsers(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to retrieve system user accounts.');
      // Local fallback for offline simulation
      setUsers([
        { _id: '1', name: 'System Administrator', email: 'admin@traffic.gov.in', role: 'admin', createdAt: '2026-06-01T00:00:00Z' },
        { _id: '2', name: 'Traffic Operator', email: 'officer@traffic.gov.in', role: 'user', createdAt: '2026-06-02T00:00:00Z' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setErrorMsg('Please fill in all fields.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await api.post('/auth/users', { name, email, password, role });
      if (response.data && response.data.success) {
        setSuccessMsg(`Account for "${name}" created successfully!`);
        setName('');
        setEmail('');
        setPassword('');
        setRole('user');
        fetchUsers();
      }
    } catch (err) {
      console.error('Failed to create user:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to register new operator account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (id, userName) => {
    if (!window.confirm(`Are you sure you want to permanently delete the operator account for "${userName}"?`)) return;

    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await api.delete(`/auth/users/${id}`);
      if (response.data && response.data.success) {
        setSuccessMsg(`Operator account for "${userName}" deleted successfully.`);
        fetchUsers();
      }
    } catch (err) {
      console.error('Failed to delete user:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to remove user account.');
    }
  };

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="page-wrapper animate-fade-in">
      <div className="page-header" style={{ marginBottom: '30px' }}>
        <div className="page-title-section">
          <h1>System Operators & Admins</h1>
          <p>Add new members, define roles, and audit security access accounts</p>
        </div>
      </div>

      {successMsg && (
        <div style={{
          background: 'rgba(34, 197, 94, 0.08)',
          border: '1px solid rgba(34, 197, 94, 0.2)',
          color: '#86efac',
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '0.85rem',
          marginBottom: '20px'
        }}>
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          color: '#fca5a5',
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '0.85rem',
          marginBottom: '20px'
        }}>
          {errorMsg}
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '30px',
        alignItems: 'start'
      }}>
        {/* Left Side: Create User Form */}
        <div style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserPlus size={20} className="logo-accent" />
            <span>Add New System Member</span>
          </h2>

          <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="input-group">
              <label>Full Name</label>
              <div className="auth-input-wrapper" style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-subtle-strong)', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '0 12px' }}>
                <User size={16} style={{ color: 'var(--text-muted)', marginRight: '8px' }} />
                <input 
                  type="text" 
                  placeholder="e.g. Officer Vinay Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', width: '100%', height: '40px', outline: 'none', fontSize: '0.9rem' }}
                />
              </div>
            </div>

            <div className="input-group">
              <label>Email Address</label>
              <div className="auth-input-wrapper" style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-subtle-strong)', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '0 12px' }}>
                <Mail size={16} style={{ color: 'var(--text-muted)', marginRight: '8px' }} />
                <input 
                  type="email" 
                  placeholder="e.g. vinay.kumar@traffic.gov.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', width: '100%', height: '40px', outline: 'none', fontSize: '0.9rem' }}
                />
              </div>
            </div>

            <div className="input-group">
              <label>Temporary Password</label>
              <div className="auth-input-wrapper" style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-subtle-strong)', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '0 12px' }}>
                <Key size={16} style={{ color: 'var(--text-muted)', marginRight: '8px' }} />
                <input 
                  type="password" 
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', width: '100%', height: '40px', outline: 'none', fontSize: '0.9rem' }}
                />
              </div>
            </div>

            <div className="input-group">
              <label>Access Privilege Level (Role)</label>
              <select 
                className="filter-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{ width: '100%', height: '42px', borderRadius: '8px', background: 'var(--bg-subtle-strong)', border: '1px solid var(--card-border)', color: 'var(--text-primary)', padding: '0 10px', fontSize: '0.9rem' }}
              >
                <option value="user">Operator (Standard Access)</option>
                <option value="admin">Administrator (Full Access)</option>
              </select>
            </div>

            <button 
              type="submit" 
              className="detect-btn" 
              disabled={submitting} 
              style={{ marginTop: '10px', height: '42px' }}
            >
              {submitting ? (
                <>
                  <Loader2 className="spinner" size={16} />
                  <span>Adding Member...</span>
                </>
              ) : (
                <span>Register Account</span>
              )}
            </button>
          </form>
        </div>

        {/* Right Side: Active User Accounts List */}
        <div style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: '12px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Active Access Accounts</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--primary-light)', background: 'rgba(108, 62, 232, 0.1)', padding: '2px 8px', borderRadius: '12px' }}>
              {users.length} Total
            </span>
          </h2>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
              <Loader2 className="spinner" size={24} />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {users.map((userItem) => {
                const isAdmin = userItem.role === 'admin';
                return (
                  <div 
                    key={userItem._id}
                    style={{
                      background: 'var(--bg-subtle-strong)',
                      border: '1px solid var(--card-border)',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                        {userItem.name}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
                        {userItem.email} &bull; Joined {formatDate(userItem.createdAt || userItem.created_at)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className={`role-badge ${isAdmin ? 'role-admin' : 'role-user'}`} style={{ fontSize: '0.65rem' }}>
                        {isAdmin ? 'Admin' : 'Operator'}
                      </span>
                      <button 
                        onClick={() => handleDeleteUser(userItem._id, userItem.name)}
                        className="delete-violation-btn" 
                        title="Delete Operator"
                        style={{ padding: '6px', height: 'auto', width: 'auto' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Operators;
