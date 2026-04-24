import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileBarChart,
  LogOut,
  Sparkles,
  FileSpreadsheet
} from 'lucide-react';

const Sidebar = () => {
  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
    { name: 'Students', icon: <Users size={20} />, path: '/students' },
    { name: 'Participation', icon: <Sparkles size={20} />, path: '/participation' },
    { name: 'Reports', icon: <FileBarChart size={20} />, path: '/reports' },
    { name: 'Sheets Sync', icon: <FileSpreadsheet size={20} />, path: '/sheets-sync' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="logo-icon">
          <Sparkles size={16} />
        </div>
        <span>EngageMatric</span>
      </div>
      
      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {menuItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="nav-item logout" onClick={() => {
          localStorage.removeItem('user');
          window.location.href = '/login';
        }}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>

      <style>{`
        .sidebar {
          width: var(--sidebar-width);
          height: 100vh;
          background-color: var(--card-bg);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          position: fixed;
          left: 0;
          top: 0;
          z-index: 100;
          transition: var(--transition);
        }

        .sidebar-brand {
          padding: 1.75rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--primary);
          border-bottom: 1px solid var(--border);
        }

        .logo-icon {
          background: linear-gradient(135deg, var(--primary), var(--primary-hover));
          color: white;
          width: 34px;
          height: 34px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.85rem;
          box-shadow: 0 2px 6px rgba(37, 99, 235, 0.3);
        }

        .nav-section-label {
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
          padding: 0.5rem 1rem;
          margin-top: 0.5rem;
          opacity: 0.7;
        }

        .sidebar-nav {
          flex: 1;
          padding: 0.5rem 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          overflow-y: auto;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.7rem 1rem;
          color: var(--text-secondary);
          text-decoration: none;
          border-radius: var(--radius);
          transition: var(--transition);
          font-weight: 500;
          font-size: 0.9rem;
          position: relative;
        }

        .nav-item:hover {
          background-color: var(--background);
          color: var(--text-primary);
        }

        .nav-item.active {
          background: var(--primary-light);
          color: var(--primary);
          font-weight: 600;
        }

        .nav-item.active::before {
          content: '';
          position: absolute;
          left: -0.75rem;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 24px;
          background: var(--primary);
          border-radius: 0 4px 4px 0;
        }

        .sidebar-footer {
          padding: 1rem 0.75rem;
          border-top: 1px solid var(--border);
        }

        .logout {
          width: 100%;
          border: none;
          background: none;
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 0.9rem;
        }

        .logout:hover {
          background-color: var(--danger-light);
          color: var(--danger);
        }

        @media (max-width: 768px) {
          .sidebar {
            width: 100%;
            height: auto;
            top: auto;
            bottom: 0;
            border-right: none;
            border-top: 1px solid var(--border);
            flex-direction: row;
            box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
          }
          .sidebar-brand, .sidebar-footer, .nav-section-label {
            display: none;
          }
          .sidebar-nav {
            flex-direction: row;
            justify-content: space-around;
            padding: 0.5rem;
            width: 100%;
            gap: 0;
          }
          .nav-item {
            flex-direction: column;
            gap: 0.2rem;
            font-size: 0.65rem;
            padding: 0.5rem 0.75rem;
          }
          .nav-item.active::before {
            display: none;
          }
        }
      `}</style>
    </aside>
  );
};

export default Sidebar;
