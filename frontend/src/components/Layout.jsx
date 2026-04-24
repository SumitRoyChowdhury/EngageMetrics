import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = ({ children }) => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [teacherName, setTeacherName] = useState('Prof. Roushan');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <Navbar 
          theme={theme} 
          toggleTheme={toggleTheme} 
          teacherName={teacherName} 
        />
        <main className="content-area">
          {children}
        </main>
      </div>

      <style>{`
        .layout {
          display: flex;
          min-height: 100vh;
        }

        .main-content {
          flex: 1;
          margin-left: var(--sidebar-width);
          width: calc(100% - var(--sidebar-width));
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--background);
        }

        .content-area {
          padding: 2rem;
          flex: 1;
          max-width: 1400px;
          width: 100%;
          margin: 0 auto;
        }

        @media (max-width: 768px) {
          .main-content {
            margin-left: 0;
            width: 100%;
            padding-bottom: 72px; /* Space for mobile nav */
          }
          .content-area {
            padding: 1.25rem 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Layout;
