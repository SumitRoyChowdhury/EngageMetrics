import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import {
  TrendingUp, Users, AlertTriangle, BookOpen,
  Plus, ArrowRight, Activity, Star, X,
  CalendarDays, Tag, Layers, Trash2
} from 'lucide-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

/* ─── Create Workspace Modal ─────────────────────────── */
const CreateWorkspaceModal = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({ date: '', label: '', participation: '75' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/workspaces', form);
      onCreated(res.data);
      onClose();
    } catch {
      alert('Failed to create workspace');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content create-cls-modal animate-fade" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Workspace (Day)</h2>
          <button onClick={onClose}><X size={20}/></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label><CalendarDays size={13}/> Date</label>
              <input type="date" required
                value={form.date} onChange={e => setForm({...form, date: e.target.value})}/>
            </div>
            <div className="form-group" style={{marginTop:'1rem'}}>
              <label><Tag size={13}/> Label (Optional)</label>
              <input placeholder="e.g. Monday Sessions"
                value={form.label} onChange={e => setForm({...form, label: e.target.value})}/>
            </div>
            <div className="form-group" style={{marginTop:'1rem'}}>
              <label><Activity size={13}/> Default Participation (%)</label>
              <input type="number" min="0" max="100"
                value={form.participation} onChange={e => setForm({...form, participation: e.target.value})}/>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading || !form.date}>
              {loading ? 'Creating...' : 'Create Workspace'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .create-cls-modal { max-width: 400px; }
        .form-group label {
          display: flex; align-items: center; gap: 0.3rem;
          font-size: 0.82rem; font-weight: 600; color: var(--text-secondary);
          margin-bottom: 0.4rem;
        }
        .form-group input { width: 100%; box-sizing: border-box; }
      `}</style>
    </div>
  );
};

/* ─── Stat Card ──────────────────────────────────────── */
const StatCard = ({ icon, label, value, sub, color = 'primary', trend }) => {
  const colors = {
    primary: { bg: 'var(--primary-light)', fg: 'var(--primary)' },
    success: { bg: 'var(--success-light)', fg: 'var(--success)' },
    warning: { bg: 'var(--warning-light)', fg: 'var(--warning)' },
    danger:  { bg: 'var(--danger-light)',  fg: 'var(--danger)'  },
  };
  const c = colors[color];
  return (
    <div className="stat-card card">
      <div className="sc-top">
        <div className="sc-icon" style={{ background: c.bg, color: c.fg }}>{icon}</div>
        {trend && <span className={`sc-trend ${trend > 0 ? 'up' : 'down'}`}>{trend > 0 ? '+' : ''}{trend}%</span>}
      </div>
      <div className="sc-val">{value}</div>
      <div className="sc-label">{label}</div>
      {sub && <div className="sc-sub">{sub}</div>}
    </div>
  );
};

/* ─── Dashboard ──────────────────────────────────────── */
const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats]           = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [students, setStudents]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    const handler = () => setShowCreate(true);
    window.addEventListener('openCreateClassroomModal', handler);
    return () => window.removeEventListener('openCreateClassroomModal', handler);
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [sRes, wRes, cRes, stRes] = await Promise.all([
        api.get('/stats'),
        api.get('/workspaces'),
        api.get('/classrooms'),
        api.get('/students'),
      ]);
      setStats(sRes.data);
      setWorkspaces(wRes.data || []);
      setClassrooms(cRes.data || []);
      setStudents(stRes.data || []);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleWorkspaceCreated = (ws) => {
    setWorkspaces(prev => [...prev, ws]);
  };

  const handleDeleteWorkspace = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this workspace? This action cannot be undone.')) return;
    try {
      await api.delete(`/workspaces/${id}`);
      setWorkspaces(prev => prev.filter(w => w.ID !== id));
      setClassrooms(prev => prev.filter(c => c.WorkspaceID !== id));
    } catch (err) {
      alert('Failed to delete workspace.');
    }
  };

  /* ── Derived analytics ── */
  const totalStudents = stats?.totalStudents || 0;
  const classAvg      = stats?.classAvg || 0;
  const atRisk        = stats?.atRiskCount || 0;
  const sentiment     = stats?.sentimentDist || { Positive: 0, Neutral: 0, Negative: 0 };
  const catDist       = stats?.categoryDist  || { High: 0, Medium: 0, Low: 0, 'At-Risk': 0 };

  const participationRate = totalStudents > 0
    ? Math.round((students.filter(s => (s.participation || 0) > 0).length / totalStudents) * 100)
    : 0;

  /* ── Chart data ── */
  const sentimentDoughnut = {
    labels: ['Positive', 'Neutral', 'Negative'],
    datasets: [{
      data: [sentiment.Positive || 0, sentiment.Neutral || 0, sentiment.Negative || 0],
      backgroundColor: ['#16A34A', '#2563EB', '#DC2626'],
      borderWidth: 0, spacing: 3, borderRadius: 4,
    }]
  };

  const categoryDoughnut = {
    labels: ['High', 'Medium', 'Low', 'At-Risk'],
    datasets: [{
      data: [catDist.High||0, catDist.Medium||0, catDist.Low||0, catDist['At-Risk']||0],
      backgroundColor: ['#16A34A', '#2563EB', '#D97706', '#DC2626'],
      borderWidth: 0, spacing: 3, borderRadius: 4,
    }]
  };

  const weeklyTrend = {
    labels: stats?.weeklyTrendLabels?.length > 0 ? stats.weeklyTrendLabels : ['Week 1'],
    datasets: [{
      label: 'Avg Score',
      data: stats?.weeklyTrendData?.length > 0 ? stats.weeklyTrendData : [0],
      borderColor: '#2563EB',
      backgroundColor: 'rgba(37,99,235,0.08)',
      fill: true, tension: 0.4, pointRadius: 4,
      pointBackgroundColor: '#2563EB', pointBorderColor: '#fff', pointBorderWidth: 2,
    }]
  };

  const chartOpts = (showLegend = false) => ({
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: showLegend, position: 'bottom',
        labels: { usePointStyle: true, boxWidth: 8, font: { size: 11 }, padding: 12 }
      },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 11 } } },
      x: { grid: { display: false }, ticks: { font: { size: 11 } } }
    }
  });

  const donutOpts = {
    responsive: true, maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, font: { size: 11 }, padding: 10 } }
    }
  };

  if (loading) return <div className="loading">Loading Dashboard...</div>;

  return (
    <div className="dashboard animate-fade">
      {/* ── Page Header ── */}
      <div className="dash-header">
        <div>
          <h1>Teacher Dashboard</h1>
          <p className="text-secondary">Overall platform analytics across all workspaces</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={16}/> Create Workspace
        </button>
      </div>

      {/* ── Analytics KPIs ── */}
      <div className="kpi-grid">
        <StatCard icon={<Users size={20}/>}        label="Total Students"    value={totalStudents}        color="primary"/>
        <StatCard icon={<Activity size={20}/>}     label="Participation Rate" value={`${participationRate}%`} color="success" trend={+2}/>
        <StatCard icon={<TrendingUp size={20}/>}   label="Platform Avg" value={`${classAvg}%`}       color="primary" trend={+1}/>
        <StatCard icon={<Star size={20}/>}         label="Positive Sentiment" value={`${sentiment.Positive||0}%`} color="success"/>
        <StatCard icon={<Layers size={20}/>}     label="Workspaces"  value={workspaces.length}    color="primary"/>
        <StatCard icon={<BookOpen size={20}/>}     label="Total Classrooms"  value={classrooms.length}    color="primary"/>
      </div>

      {/* ── Charts Row ── */}
      <div className="charts-row">
        <div className="chart-panel card">
          <h3 className="chart-title">Weekly Score Trend</h3>
          <div className="chart-box" style={{height:200}}>
            <Line data={weeklyTrend} options={chartOpts()} />
          </div>
        </div>
        <div className="chart-panel card">
          <h3 className="chart-title">Feedback Sentiment</h3>
          <div className="chart-box" style={{height:200}}>
            <Doughnut data={sentimentDoughnut} options={donutOpts}/>
          </div>
        </div>
        <div className="chart-panel card">
          <h3 className="chart-title">Engagement Category</h3>
          <div className="chart-box" style={{height:200}}>
            <Doughnut data={categoryDoughnut} options={donutOpts}/>
          </div>
        </div>
      </div>

      {/* ── Workspaces Section ── */}
      <section className="classrooms-section">
        <div className="section-head">
          <h2>Your Workspaces (Days)</h2>
        </div>

        {workspaces.length === 0 ? (
          <div className="empty-state" onClick={() => setShowCreate(true)} style={{cursor:'pointer'}}>
            <CalendarDays size={32} style={{marginBottom:'0.75rem',opacity:0.4}}/>
            <p>No workspaces yet. Click to create your first day.</p>
          </div>
        ) : (
          <div className="cls-grid">
            {workspaces.map(ws => {
              const wsClassrooms = classrooms.filter(c => c.WorkspaceID === ws.ID);
              const wsAvg = wsClassrooms.length > 0 
                ? Math.round(wsClassrooms.reduce((acc, c) => acc + (c.AvgScore || 0), 0) / wsClassrooms.length)
                : 0;
              return (
                <div key={ws.ID} className="cls-card card" onClick={() => navigate(`/workspaces/${ws.ID}`)}>
                  <div className="cls-card-bar" style={{background:`linear-gradient(90deg, #2563EB, #7c3aed)`}}/>
                  <div className="cls-card-body">
                    <div className="cls-card-tags">
                      <span className="cls-tag" style={{background:`rgba(37,99,235,0.1)`,color:'#2563EB'}}>Date: {ws.Date}</span>
                      {ws.Participation && <span className="cls-tag" style={{background:`rgba(22,163,74,0.1)`,color:'#16A34A'}}>Part: {ws.Participation}%</span>}
                    </div>
                    <h3>{ws.Label || ws.Date}</h3>
                    <div className="d-flex justify-content-between align-items-center mt-1">
                      <p style={{margin:0}}>{wsClassrooms.length} Classrooms</p>
                      <p style={{margin:0,fontWeight:700,color:'var(--primary)'}}>{wsAvg}% Avg</p>
                    </div>
                  </div>
                  <div className="cls-card-footer">
                    <span>Open Workspace</span>
                    <div className="d-flex align-items-center gap-2">
                       <button className="del-btn" onClick={(e) => handleDeleteWorkspace(e, ws.ID)} title="Delete Workspace">
                         <Trash2 size={13}/>
                       </button>
                       <ArrowRight size={14}/>
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="cls-card add-card card" onClick={() => setShowCreate(true)}>
              <Plus size={28} />
              <span>New Workspace</span>
            </div>
          </div>
        )}
      </section>

      {/* ── Create Modal ── */}
      {showCreate && (
        <CreateWorkspaceModal onClose={() => setShowCreate(false)} onCreated={handleWorkspaceCreated}/>
      )}

      <style>{`
        .dashboard { display: flex; flex-direction: column; gap: 2rem; }
        .dash-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap; }
        .dash-header h1 { font-size: 1.75rem; }
        
        .kpi-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 1rem; }
        .stat-card { padding: 1.25rem; display: flex; flex-direction: column; gap: 0.5rem; transition: transform 0.2s, box-shadow 0.2s; }
        .stat-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }
        .sc-top { display: flex; justify-content: space-between; align-items: center; }
        .sc-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
        .sc-trend { font-size: 0.7rem; font-weight: 700; padding: 0.15rem 0.45rem; border-radius: 6px; }
        .sc-trend.up { background: var(--success-light); color: var(--success); }
        .sc-trend.down { background: var(--danger-light); color: var(--danger); }
        .sc-val { font-size: 1.5rem; font-weight: 700; line-height: 1; }
        .sc-label { font-size: 0.78rem; color: var(--text-secondary); font-weight: 500; }
        
        .charts-row { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 1.25rem; }
        .chart-panel { display: flex; flex-direction: column; gap: 0; }
        .chart-title { font-size: 0.88rem; margin-bottom: 1rem; }
        .chart-box { position: relative; }
        
        .classrooms-section { display: flex; flex-direction: column; gap: 1.25rem; }
        .section-head { display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; }
        .section-head h2 { font-size: 1.15rem; }
        
        .cls-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.25rem; }
        
        .cls-card { cursor: pointer; padding: 0; overflow: hidden; transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s; display: flex; flex-direction: column; }
        .cls-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); border-color: transparent; }
        .cls-card-bar { height: 4px; flex-shrink: 0; }
        .cls-card-body { padding: 1.25rem 1.25rem 0.75rem; flex: 1; }
        .cls-card-tags { display: flex; gap: 0.4rem; margin-bottom: 0.75rem; flex-wrap: wrap; }
        .cls-tag { font-size: 0.65rem; font-weight: 700; padding: 0.2rem 0.55rem; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.03em; }
        .cls-card-body h3 { font-size: 1rem; margin-bottom: 0.25rem; }
        .cls-card-body p { font-size: 0.82rem; color: var(--text-secondary); }
        .cls-card-footer { display: flex; align-items: center; justify-content: space-between; padding: 0.65rem 1.25rem; border-top: 1px solid var(--border); font-size: 0.78rem; font-weight: 600; color: var(--primary); background: var(--background); transition: background 0.2s; }
        .cls-card:hover .cls-card-footer { background: var(--primary-light); }
        
        .del-btn { background: none; border: none; color: var(--text-secondary); cursor: pointer; padding: 3px; display: flex; align-items: center; justify-content: center; border-radius: 4px; transition: 0.2s; }
        .del-btn:hover { background: var(--danger-light); color: var(--danger); }
        
        .add-card { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.75rem; min-height: 160px; border: 2px dashed var(--border) !important; color: var(--text-secondary); font-weight: 600; font-size: 0.9rem; transition: all 0.2s; }
        .add-card:hover { border-color: var(--primary) !important; color: var(--primary); background: var(--primary-light); transform: translateY(-3px); }

        @media (max-width: 1280px) {
          .kpi-grid { grid-template-columns: repeat(3, 1fr); }
          .charts-row { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 900px) {
          .kpi-grid { grid-template-columns: repeat(2, 1fr); }
          .charts-row { grid-template-columns: 1fr; }
        }
        @media (max-width: 600px) {
          .kpi-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
