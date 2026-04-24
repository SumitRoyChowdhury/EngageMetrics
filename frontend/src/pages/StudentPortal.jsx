import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Send, CheckCircle, User, Mail, BookOpen, MessageSquare, Star, ArrowRight, ArrowLeft } from 'lucide-react';

const StudentPortal = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [step, setStep] = useState(1); // 1: Info, 2: Feedback, 3: Success
  const [formData, setFormData] = useState({
    urn: '',
    name: '',
    classroomId: '',
    week: '1',
    quizScore: '',
    feedback: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get('/classrooms');
        setClassrooms(res.data);
      } catch (err) { console.error(err); }
    };
    fetchClasses();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmitInfo = (e) => {
    e.preventDefault();
    setStep(2);
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/submissions', formData);
      setStep(3);
    } catch (err) {
      alert('Failed to submit feedback. Ensure your backend is running.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 3) return (
    <div className="portal-page">
      <div className="portal-card success-card animate-fade">
        <div className="success-icon-wrap">
          <CheckCircle size={48} color="#16A34A" />
        </div>
        <h2>Submission Received!</h2>
        <p>Thank you for submitting your results, <strong>{formData.name}</strong>!</p>
        <button className="btn-primary mt-4" onClick={() => window.location.reload()}>Submit Another</button>
      </div>
      <style>{portalStyles}</style>
    </div>
  );

  return (
    <div className="portal-page">
      <div className="portal-card animate-fade">
        <div className="portal-card-header">
          <div className="portal-logo">
            <BookOpen size={24} />
          </div>
          <h1>EngageMatric</h1>
          <p>Submit your weekly progress and feedback</p>
        </div>

        {/* Step Indicator */}
        <div className="step-indicator">
          <div className={`step-dot ${step >= 1 ? 'active' : ''}`}>
            <span>1</span>
            <div className="step-label">Details</div>
          </div>
          <div className="step-line"></div>
          <div className={`step-dot ${step >= 2 ? 'active' : ''}`}>
            <span>2</span>
            <div className="step-label">Feedback</div>
          </div>
        </div>

        {step === 1 && (
          <form onSubmit={handleSubmitInfo} className="portal-form">
            <div className="portal-field">
              <label><User size={15} /> Full Name</label>
              <input 
                name="name" required placeholder="John Doe"
                value={formData.name} onChange={handleChange}
              />
            </div>
            <div className="portal-field">
              <label><Mail size={15} /> Student URN</label>
              <input 
                name="urn" required placeholder="Enter URN"
                value={formData.urn} onChange={handleChange}
              />
            </div>
            <div className="form-row">
              <div className="portal-field">
                <label>Classroom</label>
                <select name="classroomId" required value={formData.classroomId} onChange={handleChange}>
                  <option value="">Select...</option>
                  {classrooms.map(c => <option key={c.ID} value={c.ID}>{c.Name}</option>)}
                </select>
              </div>
              <div className="portal-field">
                <label>Week</label>
                <input 
                  name="week" type="number" min="1" max="52" required
                  value={formData.week} onChange={handleChange}
                />
              </div>
            </div>
            <div className="portal-field">
              <label>Quiz Score (%)</label>
              <input 
                name="quizScore" type="number" min="0" max="100" required placeholder="85"
                value={formData.quizScore} onChange={handleChange}
              />
            </div>
            <button type="submit" className="btn-primary btn-full">
              Next: Feedback
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmitFeedback} className="portal-form">
            <div className="portal-field">
              <label><MessageSquare size={15} /> How was this week's lesson?</label>
              <textarea 
                name="feedback" required rows="5"
                placeholder="Share your thoughts on the content, pace, and difficulty..."
                value={formData.feedback} onChange={handleChange}
              ></textarea>
            </div>
            <div className="form-info-note">
              <Star size={14} />
              Your feedback will be analyzed and used to improve future lessons.
            </div>
            <div className="btn-group-portal">
              <button type="button" className="btn-outline" onClick={() => setStep(1)}>
                <ArrowLeft size={16} />
                Back
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Submitting...' : 'Complete Submission'}
              </button>
            </div>
          </form>
        )}
      </div>

      <style>{portalStyles}</style>
    </div>
  );
};

const portalStyles = `
  .portal-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 50%, #dbeafe 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  [data-theme='dark'] .portal-page {
    background: linear-gradient(135deg, #0F172A 0%, #1a1e3a 50%, #1E293B 100%);
  }

  .portal-card {
    width: 100%;
    max-width: 480px;
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 2.5rem;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04);
  }

  .portal-card-header {
    text-align: center;
    margin-bottom: 1.75rem;
  }

  .portal-logo {
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

  .portal-card-header h1 { 
    font-size: 1.5rem; 
    margin-bottom: 0.4rem; 
    background: linear-gradient(135deg, #2563EB, #7c3aed);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .portal-card-header p { color: var(--text-secondary); font-size: 0.88rem; }

  .step-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0;
    margin-bottom: 2rem;
  }

  .step-dot {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.35rem;
  }

  .step-dot span {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.8rem;
    background: var(--border);
    color: var(--text-secondary);
    transition: all 0.3s ease;
  }

  .step-dot.active span {
    background: linear-gradient(135deg, #2563EB, #1D4ED8);
    color: white;
    box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
  }

  .step-label {
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--text-secondary);
  }

  .step-dot.active .step-label {
    color: var(--primary);
  }

  .step-line {
    width: 60px;
    height: 2px;
    background: var(--border);
    margin: 0 0.5rem;
    margin-bottom: 1.2rem;
  }

  .portal-form { display: flex; flex-direction: column; gap: 1.15rem; }

  .portal-field { display: flex; flex-direction: column; gap: 0.4rem; }
  .portal-field label { 
    font-size: 0.82rem; 
    font-weight: 600; 
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .portal-field input,
  .portal-field select,
  .portal-field textarea {
    width: 100%;
  }

  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

  .btn-group-portal { display: flex; gap: 0.75rem; margin-top: 0.25rem; }
  .btn-group-portal button { flex: 1; justify-content: center; }

  .form-info-note {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.78rem;
    color: var(--text-secondary);
    padding: 0.75rem 1rem;
    background: var(--background);
    border-radius: var(--radius);
    border: 1px solid var(--border);
  }

  .success-card {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 3rem 2rem;
  }

  .success-icon-wrap {
    width: 80px;
    height: 80px;
    background: rgba(22, 163, 74, 0.1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 0.5rem;
  }

  .success-card h2 { font-size: 1.4rem; }
  .success-card p { color: var(--text-secondary); font-size: 0.95rem; }

  .mt-4 { margin-top: 1.5rem; }
  .btn-full { width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem; height: 46px; }
`;

export default StudentPortal;
