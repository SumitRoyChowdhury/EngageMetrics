import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { 
  TrendingUp, 
  MessageSquare, 
  Award, 
  Target,
  ChevronLeft,
  Sparkles
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const StudentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const res = await api.get(`/students/${id}`);
        setData(res.data);
      } catch (error) {
        console.error('Error fetching student profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStudentData();
  }, [id]);

  if (loading) return <div className="loading">Loading Profile...</div>;
  if (!data || !data.history || data.history.length === 0) return (
    <div className="error-state card" style={{ margin: '3rem auto', maxWidth: '420px', textAlign: 'center' }}>
      <p style={{ marginBottom: '1rem' }}>Student not found or no data available.</p>
      <button className="btn-primary" onClick={() => navigate('/students')}>Back to Students</button>
    </div>
  );

  const latest = data.history[data.history.length - 1];

  const chartData = {
    labels: data.history.map(h => `Week ${h.week}`),
    datasets: [{
      label: 'Weekly Performance Score',
      data: data.history.map(h => h.weeklyScore),
      borderColor: '#2563EB',
      backgroundColor: 'rgba(37, 99, 235, 0.08)',
      fill: true,
      tension: 0.4,
      pointRadius: 5,
      pointHoverRadius: 7,
      pointBackgroundColor: '#2563EB',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { 
        min: 0, max: 100,
        grid: { color: 'rgba(0,0,0,0.04)', drawBorder: false },
        ticks: { font: { size: 11 } }
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 } }
      }
    }
  };

  const getCategoryColor = (cat) => {
    const c = (cat || '').toLowerCase();
    if (c === 'high') return 'badge-success';
    if (c === 'medium') return 'badge-info';
    if (c === 'low') return 'badge-warning';
    return 'badge-danger';
  };

  // Mock AI Suggestion
  const aiSuggestion = "Based on recent trends, this student is struggling with quiz complexity while maintaining high participation. Suggestion: Provide a simplified summary of Week 4's key concepts and offer a 1-on-1 review session focusing on the last 2 quiz errors.";

  return (
    <div className="profile-page animate-fade">
      <header className="profile-header">
        <button className="btn-back" onClick={() => navigate('/students')}>
          <ChevronLeft size={18} />
          Back to Students
        </button>
        
        <div className="student-hero card">
          <div className="hero-main">
            <div className="avatar-lg">{data.name.charAt(0)}</div>
            <div className="hero-text">
              <h1>{data.name}</h1>
              <p>ID: {data.id} • Registered 4 weeks ago</p>
            </div>
          </div>
          <div className="hero-stats">
            <div className="stat-pill">
              <span className="label">Status</span>
              <span className={`badge ${getCategoryColor(latest.category)}`}>{latest.category}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="profile-grid">
        <div className="metrics-summary">
          <div className="mini-card">
            <div className="icon score"><Target size={18} /></div>
            <div className="info">
              <span className="val">{typeof latest.weeklyScore === 'number' ? latest.weeklyScore.toFixed(1) : latest.weeklyScore}%</span>
              <span className="lbl">Latest Score</span>
            </div>
          </div>
          <div className="mini-card">
            <div className="icon quiz"><Award size={18} /></div>
            <div className="info">
              <span className="val">{typeof latest.avgQuiz === 'number' ? latest.avgQuiz.toFixed(1) : latest.avgQuiz}</span>
              <span className="lbl">Avg Quiz</span>
            </div>
          </div>
          <div className="mini-card">
            <div className="icon part"><TrendingUp size={18} /></div>
            <div className="info">
              <span className="val">{latest.participation}%</span>
              <span className="lbl">Participation</span>
            </div>
          </div>
        </div>

        <div className="chart-section card">
          <h3>Performance Trend</h3>
          <div className="profile-chart-wrapper">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        <div className="ai-suggestion card">
          <div className="ai-header">
            <Sparkles size={20} />
            <h3>AI Educator Insight</h3>
          </div>
          <p className="ai-text">{aiSuggestion}</p>
          <div className="ai-footer">
            <button className="btn-primary btn-sm">Generate New Path</button>
          </div>
        </div>

        <div className="feedback-section card">
          <div className="section-header">
            <MessageSquare size={18} />
            <h3>Feedback & Sentiment History</h3>
          </div>
          <div className="feedback-list">
            {data.history.map((h) => (
              <div key={h.week} className="feedback-item">
                <div className="item-left">
                  <div className="week-label">Week {h.week}</div>
                  <div className={`sentiment-badge ${h.avgSentiment >= 75 ? 'pos' : (h.avgSentiment >= 40 ? 'neu' : 'neg')}`}>
                    {h.avgSentiment >= 75 ? '😊 Positive' : (h.avgSentiment >= 40 ? '😐 Neutral' : '😟 Negative')}
                  </div>
                </div>
                <div className="item-content">
                   {h.feedback || 'No feedback provided for this week.'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .profile-page {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .btn-back {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: none;
          color: var(--text-secondary);
          margin-bottom: 1rem;
          font-weight: 500;
          font-size: 0.88rem;
          padding: 0.4rem 0;
          border: none;
        }

        .btn-back:hover {
          color: var(--primary);
        }

        .student-hero {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.75rem;
          gap: 1rem;
        }

        .hero-main {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }

        .avatar-lg {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, var(--primary), var(--primary-hover));
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
          font-weight: 700;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
        }

        .hero-text h1 {
          font-size: 1.4rem;
          margin-bottom: 0.2rem;
        }

        .hero-text p {
          color: var(--text-secondary);
          font-size: 0.85rem;
        }

        .stat-pill {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.4rem;
        }

        .stat-pill .label {
          font-size: 0.7rem;
          color: var(--text-secondary);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .profile-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
        }

        .metrics-summary {
          grid-column: span 2;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        .mini-card {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 1.15rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          box-shadow: var(--shadow);
          transition: var(--transition);
        }

        .mini-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }

        .mini-card .icon {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .icon.score { background: var(--primary-light); color: var(--primary); }
        .icon.quiz { background: var(--success-light); color: var(--success); }
        .icon.part { background: var(--warning-light); color: var(--warning); }

        .mini-card .val { font-size: 1.15rem; font-weight: 700; display: block; }
        .mini-card .lbl { font-size: 0.78rem; color: var(--text-secondary); }

        .chart-section { 
          display: flex;
          flex-direction: column;
        }
        .chart-section h3 { margin-bottom: 1rem; font-size: 0.95rem; }
        .profile-chart-wrapper { height: 260px; flex: 1; }

        .ai-suggestion {
          background: linear-gradient(135deg, rgba(37, 99, 235, 0.04) 0%, rgba(124, 58, 237, 0.06) 100%);
          border: 1.5px dashed var(--primary);
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .ai-header {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          color: var(--primary);
        }

        .ai-header h3 {
          font-size: 0.95rem;
        }

        .ai-text {
          line-height: 1.65;
          color: var(--text-primary);
          font-size: 0.9rem;
          font-style: italic;
        }

        .feedback-section {
          grid-column: span 2;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          margin-bottom: 1.25rem;
          color: var(--text-secondary);
        }

        .section-header h3 {
          font-size: 0.95rem;
        }

        .feedback-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .feedback-item {
          display: flex;
          gap: 1.25rem;
          padding: 1rem 1.25rem;
          background: var(--background);
          border-radius: var(--radius);
          border: 1px solid var(--border);
          transition: var(--transition);
        }

        .feedback-item:hover {
          border-color: var(--primary);
        }

        .item-left {
          flex-shrink: 0;
          width: 110px;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .week-label { font-weight: 700; font-size: 0.88rem; }

        .sentiment-badge {
          font-size: 0.68rem;
          font-weight: 700;
          text-transform: uppercase;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          text-align: center;
          white-space: nowrap;
        }

        .sentiment-badge.pos { background: #DCFCE7; color: #166534; }
        .sentiment-badge.neu { background: #F1F5F9; color: #475569; }
        .sentiment-badge.neg { background: #FEE2E2; color: #991B1B; }

        .item-content {
          font-size: 0.9rem;
          color: var(--text-primary);
          line-height: 1.6;
        }

        @media (max-width: 900px) {
          .profile-grid { grid-template-columns: 1fr; }
          .metrics-summary, .feedback-section { grid-column: span 1; }
          .student-hero { flex-direction: column; align-items: flex-start; }
          .stat-pill { align-items: flex-start; }
          .metrics-summary { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default StudentProfile;
