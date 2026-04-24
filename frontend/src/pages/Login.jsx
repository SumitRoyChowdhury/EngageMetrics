import React, { useState } from 'react';
import { LogIn, Mail, Lock, Sparkles } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email && password) {
      localStorage.setItem('user', JSON.stringify({ email, name: 'Prof. Roushan' }));
      window.location.href = '/dashboard';
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-decor">
        <div className="decor-circle c1"></div>
        <div className="decor-circle c2"></div>
        <div className="decor-circle c3"></div>
      </div>

      <div className="login-card animate-fade">
        <div className="login-header">
          <div className="logo">
            <Sparkles size={22} />
          </div>
          <h1>EngageMatric</h1>
          <p>Teacher Engagement Dashboard</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label>
              <Mail size={15} />
              Email Address
            </label>
            <input 
              type="email" 
              placeholder="teacher@engagematric.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="login-field">
            <label>
              <Lock size={15} />
              Password
            </label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" className="btn-primary login-btn">
            <LogIn size={18} />
            Sign In
          </button>
        </form>

        <div className="login-footer">
          <p>Demo: <strong>teacher@engagematric.com</strong> / <strong>admin</strong></p>
        </div>
      </div>

      <style>{`
        .login-page {
          height: 100vh;
          width: 100vw;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 50%, #dbeafe 100%);
          position: relative;
          overflow: hidden;
        }

        [data-theme='dark'] .login-page {
          background: linear-gradient(135deg, #0F172A 0%, #1a1e3a 50%, #1E293B 100%);
        }

        .login-bg-decor {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .decor-circle {
          position: absolute;
          border-radius: 50%;
          opacity: 0.15;
        }

        .c1 {
          width: 400px;
          height: 400px;
          background: linear-gradient(135deg, #2563EB, #7c3aed);
          top: -100px;
          right: -100px;
          animation: float 8s ease-in-out infinite;
        }

        .c2 {
          width: 300px;
          height: 300px;
          background: linear-gradient(135deg, #06b6d4, #2563EB);
          bottom: -80px;
          left: -80px;
          animation: float 10s ease-in-out infinite reverse;
        }

        .c3 {
          width: 200px;
          height: 200px;
          background: linear-gradient(135deg, #8b5cf6, #ec4899);
          top: 50%;
          left: 60%;
          animation: float 6s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.03); }
        }

        .login-card {
          width: 100%;
          max-width: 420px;
          padding: 2.5rem;
          background: var(--card-bg);
          border-radius: 16px;
          border: 1px solid var(--border);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04);
          position: relative;
          z-index: 1;
        }

        .login-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .logo {
          width: 52px;
          height: 52px;
          background: linear-gradient(135deg, #2563EB, #1D4ED8);
          color: white;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        }

        .login-header h1 {
          font-size: 1.6rem;
          margin-bottom: 0.3rem;
          background: linear-gradient(135deg, #2563EB, #7c3aed);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .login-header p {
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .login-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .login-field label {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .login-field input {
          height: 46px;
          font-size: 0.95rem;
        }

        .login-btn {
          margin-top: 0.5rem;
          height: 48px;
          justify-content: center;
          font-size: 0.95rem;
          border-radius: 12px;
        }

        .login-footer {
          margin-top: 1.75rem;
          text-align: center;
          font-size: 0.78rem;
          color: var(--text-secondary);
          padding-top: 1.25rem;
          border-top: 1px solid var(--border);
        }

        .login-footer strong {
          color: var(--text-primary);
        }
      `}</style>
    </div>
  );
};

export default Login;
