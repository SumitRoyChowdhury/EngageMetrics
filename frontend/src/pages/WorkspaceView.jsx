import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { ArrowLeft, Plus, ArrowRight, BookOpen, Clock, CalendarDays, X, Layers, Trash2 } from 'lucide-react';

/* ─── Create Classroom Modal ─────────────────────────── */
const CreateClassroomModal = ({ workspaceId, onClose, onCreated }) => {
  const [form, setForm] = useState({ subject: '', batch: 'Batch A' });
  const [loading, setLoading] = useState(false);

  const batches = ['Batch A','Batch B','Batch C','Batch D'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/classrooms', { ...form, workspaceId });
      onCreated(res.data);
      onClose();
    } catch {
      alert('Failed to create classroom');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content create-cls-modal animate-fade" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Classroom</h2>
          <button onClick={onClose}><X size={20}/></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group" style={{marginBottom:'1rem'}}>
              <label>Subject</label>
              <input required placeholder="e.g. Physics, Math..."
                value={form.subject} onChange={e => setForm({...form, subject: e.target.value})}/>
            </div>
            <div className="form-group">
              <label><Layers size={13}/> Batch</label>
              <select value={form.batch} onChange={e => setForm({...form, batch: e.target.value})}>
                {batches.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading || !form.subject}>
              {loading ? 'Creating...' : 'Create Classroom'}
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
        .form-group input, .form-group select { width: 100%; box-sizing: border-box; }
      `}</style>
    </div>
  );
};


const WorkspaceView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetchWorkspaceData();
  }, [id]);

  const fetchWorkspaceData = async () => {
    setLoading(true);
    try {
      const [wRes, cRes] = await Promise.all([
        api.get('/workspaces'),
        api.get(`/classrooms?workspaceId=${id}`)
      ]);
      setWorkspace(wRes.data.find(w => w.ID === id));
      setClassrooms(cRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClassroomCreated = (cls) => {
    setClassrooms(prev => [...prev, cls]);
  };

  const handleDeleteClassroom = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this classroom? This action cannot be undone.')) return;
    try {
      await api.delete(`/classrooms/${id}`);
      setClassrooms(prev => prev.filter(c => c.ID !== id));
    } catch (err) {
      alert('Failed to delete classroom.');
    }
  };

  if (loading) return <div className="loading">Loading Workspace...</div>;
  if (!workspace) return (
    <div className="error-state card" style={{ margin: '3rem auto', maxWidth: '400px', textAlign: 'center' }}>
      <p style={{ marginBottom: '1rem' }}>Workspace not found.</p>
      <button className="btn-primary" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
    </div>
  );

  return (
    <div className="workspace-view animate-fade">
      {/* Header */}
      <header className="ws-header">
        <div className="ws-title-row">
          <button className="back-btn" onClick={() => navigate('/dashboard')}><ArrowLeft size={18}/></button>
          <div>
            <h1>{workspace.Label || workspace.Date}</h1>
            <div className="ws-meta">
              <span className="ws-tag"><CalendarDays size={12}/> {workspace.Date}</span>
              <span className="ws-tag"><Layers size={12}/> {classrooms.length} Classrooms</span>
            </div>
          </div>
        </div>
      </header>

      {/* Overview Analytics for this Day */}
      <div className="card ws-daily-stats">
        <h3 className="card-section-title">Daily Activity Summary</h3>
        <div className="ov-kpi-grid" style={{gridTemplateColumns:'repeat(4, 1fr)', marginTop:'1rem'}}>
           <div className="card kpi-mini">
              <div className="kpi-val">{classrooms.length}</div>
              <div className="kpi-label">Classrooms</div>
           </div>
           <div className="card kpi-mini">
              <div className="kpi-val">
                {classrooms.length > 0 
                  ? Math.round(classrooms.reduce((acc, c) => acc + (c.AvgScore || 0), 0) / classrooms.length)
                  : 0}%
              </div>
              <div className="kpi-label">Day Avg Score</div>
           </div>
           <div className="card kpi-mini">
              <div className="kpi-val">{workspace.Participation || '0'}%</div>
              <div className="kpi-label">Est. Participation</div>
           </div>
           <div className="card kpi-mini">
              <div className="kpi-val" style={{fontSize:'0.9rem', color:'var(--primary)'}}>
                 {workspace.Date}
              </div>
              <div className="kpi-label">Session Date</div>
           </div>
        </div>
      </div>

      {/* Classrooms List */}
      <section className="classrooms-section">
        <div className="section-head" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <h2>Classrooms in this Workspace</h2>
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={16}/> New Classroom
          </button>
        </div>

        {classrooms.length === 0 ? (
          <div className="empty-state" onClick={() => setShowCreate(true)} style={{cursor:'pointer'}}>
            <BookOpen size={32} style={{marginBottom:'0.75rem',opacity:0.4}}/>
            <p>No classrooms yet for this day. Click to create one.</p>
          </div>
        ) : (
          <div className="cls-grid">
            {classrooms.map(cls => (
              <div key={cls.ID} className="cls-card card" onClick={() => navigate(`/classrooms/${cls.ID}`)}>
                <div className="cls-card-bar" style={{background:`linear-gradient(90deg, #10B981, #3b82f6)`}}/>
                <div className="cls-card-body">
                  <div className="cls-card-tags">
                    <span className="cls-tag" style={{background:`rgba(16,185,129,0.1)`,color:'#10B981'}}>{cls.Subject}</span>
                    <span className="cls-tag" style={{background:`rgba(59,130,246,0.1)`,color:'#3b82f6'}}>{cls.Batch}</span>
                  </div>
                  <h3>{cls.Name}</h3>
                </div>
                <div className="cls-card-footer">
                  <span>Enter Classroom</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button className="del-btn" onClick={(e) => handleDeleteClassroom(e, cls.ID)} title="Delete Classroom">
                      <Trash2 size={13}/>
                    </button>
                    <ArrowRight size={14}/>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Create Modal ── */}
      {showCreate && (
        <CreateClassroomModal workspaceId={id} onClose={() => setShowCreate(false)} onCreated={handleClassroomCreated}/>
      )}

      <style>{`
        .workspace-view { display: flex; flex-direction: column; gap: 1.5rem; }
        .ws-header { display: flex; flex-direction: column; gap: 1.25rem; }
        .ws-title-row { display: flex; align-items: flex-start; gap: 1rem; }
        .back-btn {
          background: var(--card-bg); border: 1.5px solid var(--border);
          width: 38px; height: 38px; border-radius: var(--radius);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: var(--text-secondary); flex-shrink: 0;
          margin-top: 0.2rem;
        }
        .back-btn:hover { color: var(--primary); border-color: var(--primary); background: var(--primary-light); }
        .ws-header h1 { font-size: 1.7rem; margin-bottom: 0.4rem; }
        .ws-meta { display: flex; gap: 0.6rem; flex-wrap: wrap; }
        .ws-tag {
          font-size: 0.72rem; font-weight: 700; padding: 0.25rem 0.6rem;
          border-radius: 20px; background: var(--border); color: var(--text-secondary);
          display: flex; align-items: center; gap: 0.3rem;
        }
        
        .classrooms-section { display: flex; flex-direction: column; gap: 1.25rem; margin-top: 1rem; }
        .cls-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1.25rem; }
        
        .cls-card { cursor: pointer; padding: 0; overflow: hidden; transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s; display: flex; flex-direction: column; }
        .cls-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); border-color: transparent; }
        .cls-card-bar { height: 4px; flex-shrink: 0; }
        .cls-card-body { padding: 1.25rem 1.25rem 0.75rem; flex: 1; }
        .cls-card-tags { display: flex; gap: 0.4rem; margin-bottom: 0.75rem; flex-wrap: wrap; }
        .cls-tag { font-size: 0.65rem; font-weight: 700; padding: 0.2rem 0.55rem; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.03em; }
        .cls-card-body h3 { font-size: 1.05rem; margin-bottom: 0.25rem; }
        .cls-card-footer { display: flex; align-items: center; justify-content: space-between; padding: 0.65rem 1.25rem; border-top: 1px solid var(--border); font-size: 0.78rem; font-weight: 600; color: var(--primary); background: var(--background); transition: background 0.2s; }
        .cls-card:hover .cls-card-footer { background: var(--primary-light); }
        .del-btn { background: none; border: none; color: var(--text-secondary); cursor: pointer; padding: 3px; display: flex; align-items: center; justify-content: center; border-radius: 4px; transition: 0.2s; }
        .del-btn:hover { background: var(--danger-light); color: var(--danger); }
      `}</style>
    </div>
  );
};

export default WorkspaceView;
