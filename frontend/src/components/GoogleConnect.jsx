import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Cloud, CheckCircle, ExternalLink, Loader } from 'lucide-react';

const GoogleConnect = () => {
  const [status, setStatus] = useState({ connected: false, loading: true });

  const checkStatus = async () => {
    try {
      const res = await api.get('/auth/google/status');
      setStatus({ connected: res.data.connected, loading: false });
    } catch (err) {
      setStatus({ connected: false, loading: false });
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleConnect = async () => {
    try {
      const res = await api.get('/auth/google/url');
      window.open(res.data.url, '_blank');
      
      // Poll for status change
      const interval = setInterval(async () => {
        try {
          const check = await api.get('/auth/google/status');
          if (check.data.connected) {
            setStatus({ connected: true, loading: false });
            clearInterval(interval);
          }
        } catch (e) {
          // ignore polling errors
        }
      }, 3000);

      // Stop polling after 2 minutes
      setTimeout(() => clearInterval(interval), 120000);
    } catch (err) {
      console.error('Auth URL Error:', err.response || err);
      alert('Failed to get auth URL: ' + (err.response?.data?.message || err.message));
    }
  };

  if (status.loading) return (
    <div className="google-status loading-state">
      <Loader size={14} className="spin-anim" />
      <span>Checking...</span>
      <style>{googleStyles}</style>
    </div>
  );

  return (
    <div className={`google-status ${status.connected ? 'connected' : 'disconnected'}`}>
      {status.connected ? (
        <>
          <CheckCircle size={14} />
          <span>Connected</span>
        </>
      ) : (
        <button className="connect-btn" onClick={handleConnect}>
          <Cloud size={14} />
          <span>Connect Google</span>
          <ExternalLink size={12} />
        </button>
      )}

      <style>{googleStyles}</style>
    </div>
  );
};

const googleStyles = `
  .google-status {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.35rem 0.75rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    transition: var(--transition);
  }

  .google-status.connected {
    background: var(--success-light);
    color: var(--success);
  }

  .google-status.disconnected {
    padding: 0;
  }

  .google-status.loading-state {
    color: var(--text-secondary);
    opacity: 0.7;
    font-size: 0.75rem;
  }

  .connect-btn {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    background: linear-gradient(135deg, var(--primary), var(--primary-hover));
    color: white;
    padding: 0.4rem 0.75rem;
    border-radius: 20px;
    border: none;
    font-weight: 600;
    font-size: 0.75rem;
    cursor: pointer;
    transition: var(--transition);
    box-shadow: 0 1px 4px rgba(37, 99, 235, 0.25);
  }

  .connect-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 3px 8px rgba(37, 99, 235, 0.35);
  }

  .spin-anim {
    animation: spinAnim 1s linear infinite;
  }

  @keyframes spinAnim {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

export default GoogleConnect;
