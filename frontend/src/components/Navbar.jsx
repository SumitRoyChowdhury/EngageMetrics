import React, { useState, useEffect } from 'react';
import GoogleConnect from './GoogleConnect';
import api from '../utils/api';
import { Sun, Moon, Bell, Plus, Users as ClassroomIcon, RefreshCw, Home } from 'lucide-react';

const Navbar = ({ theme, toggleTheme, teacherName }) => {
  const [syncing, setSyncing] = useState(false);

  const handleHomeClick = () => {
    window.location.href = '/dashboard';
  };

  const handleSyncData = async () => {
    setSyncing(true);
    try {
      const res = await api.post('/sync-responses');
      alert(res.data.message);
      window.dispatchEvent(new Event('classroomChanged')); // Refresh dashboard
    } catch (err) {
      alert('Sync failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setSyncing(false);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <button 
            className="home-btn" 
            onClick={handleHomeClick} 
            title="Go to Dashboard"
          >
            <Home size={18} />
            <span className="home-btn-text">Dashboard</span>
          </button>
        </div>

        <div className="navbar-right">
          <button 
            className={`sync-btn ${syncing ? 'spinning' : ''}`} 
            onClick={handleSyncData} 
            disabled={syncing}
            title="Sync live data from Google Forms"
          >
            <RefreshCw size={15} />
            <span className="sync-text">{syncing ? 'Syncing...' : 'Sync'}</span>
          </button>

          <GoogleConnect />
          
          <button className="icon-btn theme-toggle" onClick={toggleTheme} title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button className="icon-btn">
            <Bell size={18} />
            <span className="badge-dot"></span>
          </button>

          <div className="user-profile">
            <div className="avatar">{teacherName.charAt(0)}</div>
            <span className="user-name">{teacherName}</span>
          </div>
        </div>
      </div>

      <style>{`
        .navbar {
          height: var(--navbar-height);
          background-color: var(--card-bg);
          border-bottom: 1px solid var(--border);
          position: sticky;
          top: 0;
          z-index: 90;
          padding: 0 1.5rem;
          backdrop-filter: blur(12px);
          background: rgba(255, 255, 255, 0.85);
        }

        [data-theme='dark'] .navbar {
          background: rgba(30, 41, 59, 0.9);
        }

        .navbar-container {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .navbar-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          min-width: 0;
        }

        .home-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          padding: 0.45rem 0.8rem;
          height: 36px;
          border-radius: 8px;
          border: 1.5px solid var(--border);
          background: var(--background);
          color: var(--text-secondary);
          cursor: pointer;
          transition: var(--transition);
          font-weight: 600;
          font-size: 0.8rem;
          white-space: nowrap;
        }

        .home-btn:hover {
          color: var(--primary);
          border-color: var(--primary);
          background: var(--primary-light);
        }

        .class-selector {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--background);
          padding: 0.35rem 0.65rem;
          border-radius: 8px;
          border: 1.5px solid var(--border);
          color: var(--text-secondary);
        }

        .class-selector select {
          border: none;
          background: none;
          font-weight: 600;
          font-size: 0.8rem;
          padding: 0;
          cursor: pointer;
          color: var(--text-primary);
          max-width: 200px;
        }

        .class-selector select:focus {
          box-shadow: none;
        }

        .add-class-btn {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.45rem 0.8rem;
          height: 36px;
          border-radius: 8px;
          background: var(--primary);
          color: white;
          border: none;
          font-weight: 600;
          font-size: 0.8rem;
          cursor: pointer;
          transition: var(--transition);
          white-space: nowrap;
        }

        .add-class-btn:hover {
          background: var(--primary-hover);
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
        }

        .sync-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--primary-light);
          color: var(--primary);
          padding: 0.4rem 0.85rem;
          border-radius: 20px;
          border: 1.5px solid transparent;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition);
        }

        .sync-btn:hover:not(:disabled) {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }

        .sync-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .spinning svg {
          animation: spin 1.5s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Add Modal Styles */
        .add-modal {
          max-width: 440px;
        }

        .add-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .add-modal-header h2 {
          font-size: 1.2rem;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          color: var(--text-secondary);
          padding: 0;
          cursor: pointer;
          line-height: 1;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }

        .close-btn:hover {
          background: var(--background);
          color: var(--text-primary);
        }

        .navbar-right {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .icon-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-secondary);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.45rem;
          border-radius: 8px;
          transition: var(--transition);
          width: 36px;
          height: 36px;
        }

        .icon-btn:hover {
          color: var(--primary);
          background: var(--primary-light);
        }

        .badge-dot {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 7px;
          height: 7px;
          background: var(--danger);
          border-radius: 50%;
          border: 2px solid var(--card-bg);
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding-left: 0.75rem;
          border-left: 1px solid var(--border);
          margin-left: 0.25rem;
        }

        .avatar {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, var(--primary), var(--primary-hover));
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.8rem;
          box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
        }

        .user-name {
          font-weight: 600;
          font-size: 0.85rem;
          color: var(--text-primary);
        }

        @media (max-width: 1024px) {
          .add-class-text { display: none; }
          .sync-text { display: none; }
        }

        @media (max-width: 768px) {
          .navbar { padding: 0 0.75rem; }
          .user-name { display: none; }
          .user-profile { padding-left: 0.5rem; }
          .home-btn-text { display: none; }
          .home-btn { padding: 0; width: 36px; justify-content: center; }
          .add-class-text { display: none; }
          .sync-text { display: none; }
          .class-selector select { max-width: 120px; }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
