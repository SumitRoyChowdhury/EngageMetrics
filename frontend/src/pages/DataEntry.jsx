import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Settings, 
  Send, 
  Calendar,
  MessageSquare,
  Activity
} from 'lucide-react';
import api from '../utils/api';

const DataEntry = () => {
  const [students, setStudents] = useState([]);
  const [dailyForm, setDailyForm] = useState({
    studentId: '',
    date: new Date().toISOString().split('T')[0],
    quizScore: '',
    feedback: '',
    sentiment: 'Neutral'
  });
  const [weeklyForm, setWeeklyForm] = useState({
    studentId: '',
    week: '1',
    participation: 50
  });

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await api.get('/students');
        setStudents(res.data);
      } catch (error) {
        console.error('Error fetching students:', error);
      }
    };
    fetchStudents();
  }, []);

  // Simple keyword detection for sentiment
  useEffect(() => {
    const text = dailyForm.feedback.toLowerCase();
    if (text.includes('great') || text.includes('excellent') || text.includes('good') || text.includes('happy')) {
      setDailyForm(prev => ({ ...prev, sentiment: 'Positive' }));
    } else if (text.includes('distracted') || text.includes('struggled') || text.includes('poor') || text.includes('sad')) {
      setDailyForm(prev => ({ ...prev, sentiment: 'Negative' }));
    } else {
      setDailyForm(prev => ({ ...prev, sentiment: 'Neutral' }));
    }
  }, [dailyForm.feedback]);

  const handleDailySubmit = async (e) => {
    e.preventDefault();
    try {
      const classroomId = localStorage.getItem('selectedClassroom') || '';
      await api.post('/submissions', {
        urn: dailyForm.studentId,
        name: students.find(s => s.studentId === dailyForm.studentId)?.studentName || dailyForm.studentId,
        classroomId,
        week: '1',
        quizScore: parseFloat(dailyForm.quizScore) || 0,
        feedback: dailyForm.feedback
      });
      alert('Daily entry saved!');
      setDailyForm({ ...dailyForm, quizScore: '', feedback: '' });
    } catch (err) { alert('Error saving data: ' + (err.response?.data?.message || err.message)); }
  };

  const handleWeeklySubmit = async (e) => {
    e.preventDefault();
    try {
      const classroomId = localStorage.getItem('selectedClassroom') || '';
      await api.post('/participation', {
        entries: [{
          URN: weeklyForm.studentId,
          ClassroomID: classroomId,
          Week: weeklyForm.week,
          Score: weeklyForm.participation
        }]
      });
      alert('Weekly participation updated!');
    } catch (err) { alert('Error saving data: ' + (err.response?.data?.message || err.message)); }
  };

  return (
    <div className="data-entry-page animate-fade">
      <header className="page-header">
        <h1>Data Input Hub</h1>
        <p>Record daily observations and weekly engagement ratings</p>
      </header>

      <div className="entry-grid">
        {/* LEFT PANEL: Daily Class Entry */}
        <section className="entry-panel card">
          <div className="panel-header">
            <Calendar size={20} />
            <h2>Daily Class Record</h2>
          </div>
          
          <form className="entry-form" onSubmit={handleDailySubmit}>
            <div className="field">
              <label>Select Student</label>
              <select 
                value={dailyForm.studentId} 
                onChange={e => setDailyForm({...dailyForm, studentId: e.target.value})}
                required
              >
                <option value="">Choose a student...</option>
                {students.map(s => <option key={s.studentId} value={s.studentId}>{s.studentName}</option>)}
              </select>
            </div>

            <div className="field">
              <label>Class Date</label>
              <input 
                type="date" 
                value={dailyForm.date} 
                onChange={e => setDailyForm({...dailyForm, date: e.target.value})}
              />
            </div>

            <div className="field">
              <label>Quiz Score (0 - 100)</label>
              <input 
                type="number" 
                min="0" max="100" 
                placeholder="Enter score..."
                value={dailyForm.quizScore}
                onChange={e => setDailyForm({...dailyForm, quizScore: e.target.value})}
              />
            </div>

            <div className="field">
              <label>Written Feedback</label>
              <textarea 
                placeholder="How was their engagement today?"
                value={dailyForm.feedback}
                onChange={e => setDailyForm({...dailyForm, feedback: e.target.value})}
                rows="4"
              />
            </div>

            <div className="sentiment-preview">
              <label>Detected Sentiment History</label>
              <div className={`sentiment-indicator ${dailyForm.sentiment.toLowerCase()}`}>
                <Activity size={14} />
                <span>{dailyForm.sentiment}</span>
              </div>
            </div>

            <button type="submit" className="btn-primary btn-full mt-1">
              <Send size={18} /> Submit Daily Entry
            </button>
          </form>
        </section>

        {/* RIGHT PANEL: Weekly Participation */}
        <section className="entry-panel card secondary-panel">
          <div className="panel-header">
            <Settings size={20} />
            <h2>Weekly Ratings</h2>
          </div>

          <form className="entry-form" onSubmit={handleWeeklySubmit}>
             <div className="field">
              <label>Student</label>
              <select 
                value={weeklyForm.studentId} 
                onChange={e => setWeeklyForm({...weeklyForm, studentId: e.target.value})}
                required
              >
                <option value="">Select student...</option>
                {students.map(s => <option key={s.studentId} value={s.studentId}>{s.studentName}</option>)}
              </select>
            </div>

            <div className="field">
              <label>Target Week</label>
              <select 
                value={weeklyForm.week}
                onChange={e => setWeeklyForm({...weeklyForm, week: e.target.value})}
              >
                <option value="1">Week 1</option>
                <option value="2">Week 2</option>
                <option value="3">Week 3</option>
                <option value="4">Week 4</option>
                <option value="5">Week 5</option>
                <option value="6">Week 6</option>
              </select>
            </div>

            <div className="field">
              <div className="label-row">
                <label>Participation Rating</label>
                <span className="slider-val">{weeklyForm.participation}%</span>
              </div>
              <input 
                type="range" 
                min="0" max="100" 
                className="slider"
                value={weeklyForm.participation}
                onChange={e => setWeeklyForm({...weeklyForm, participation: e.target.value})}
              />
              <div className="slider-labels">
                <span>Low</span>
                <span>Moderate</span>
                <span>Active</span>
              </div>
            </div>

            <div className="info-box">
              <p>Ratings significantly impact the <strong>Weekly Performance Score</strong> (40% weight).</p>
            </div>

            <button type="submit" className="btn-outline btn-full mt-1">
              Update Participation
            </button>
          </form>
        </section>
      </div>

      <style>{`
        .entry-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 2rem;
          margin-top: 2rem;
        }

        .entry-panel { padding: 2rem; }

        .panel-header { 
          display: flex; 
          align-items: center; 
          gap: 0.75rem; 
          margin-bottom: 2rem;
          color: var(--primary);
        }

        .panel-header h2 { font-size: 1.25rem; }

        .entry-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .field { display: flex; flex-direction: column; gap: 0.5rem; }
        .field label { font-size: 0.875rem; font-weight: 600; color: var(--text-secondary); }

        .label-row { display: flex; justify-content: space-between; align-items: center; }
        .slider-val { font-weight: 700; color: var(--primary); }

        .sentiment-preview { display: flex; flex-direction: column; gap: 0.5rem; }
        .sentiment-preview label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: var(--text-secondary); }

        .sentiment-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-weight: 600;
          font-size: 0.9rem;
          width: fit-content;
        }
        .sentiment-indicator.positive { background: #DCFCE7; color: #16A34A; }
        .sentiment-indicator.neutral { background: #F1F5F9; color: #475569; }
        .sentiment-indicator.negative { background: #FEE2E2; color: #DC2626; }

        .slider {
          -webkit-appearance: none;
          width: 100%;
          height: 6px;
          background: var(--border);
          border-radius: 5px;
          outline: none;
        }
        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          background: var(--primary);
          border-radius: 50%;
          cursor: pointer;
        }

        .slider-labels { display: flex; justify-content: space-between; font-size: 0.7rem; color: var(--text-secondary); margin-top: 0.25rem; }

        .info-box {
          background: var(--background);
          padding: 1rem;
          border-radius: 6px;
          border-left: 4px solid var(--warning);
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .btn-full { width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.75rem; height: 44px; }
        .mt-1 { margin-top: 1rem; }

        @media (max-width: 900px) {
          .entry-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default DataEntry;
