import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import QuizBuilder from './QuizBuilder';
import {
  ArrowLeft, CheckCircle, Clock, Trash2,
  MessageSquare, ThumbsUp, ThumbsDown, Minus,
  Users, BarChart2, BookOpen, RefreshCw
} from 'lucide-react';

const ClassroomView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [classroom, setClassroom] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [deleteModal, setDeleteModal] = useState({ open: false, quizId: null, quizTitle: '' });
  const [deleting, setDeleting] = useState(false);
  const [syncingQuizId, setSyncingQuizId] = useState(null);

  useEffect(() => {
    localStorage.setItem('selectedClassroom', id);
    window.dispatchEvent(new Event('classroomChanged'));
    fetchClassroomData();
  }, [id]);

  const fetchClassroomData = async () => {
    setLoading(true);
    try {
      const [classRes, quizzesRes, studentsRes, statsRes] = await Promise.all([
        api.get('/classrooms'),
        api.get(`/quizzes?classroomId=${id}`),
        api.get(`/students?classroomId=${id}`),
        api.get(`/stats?classroomId=${id}`)
      ]);
      setClassroom(classRes.data.find(c => c.ID === id));
      setQuizzes(quizzesRes.data);
      setStudents(studentsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteQuiz = (quizId, quizTitle) => {
    setDeleteModal({ open: true, quizId, quizTitle });
  };

  const confirmDeleteQuiz = async () => {
    setDeleting(true);
    try {
      await api.delete(`/quizzes/${deleteModal.quizId}`);
      setQuizzes(prev => prev.filter(q => q.id !== deleteModal.quizId));
      setDeleteModal({ open: false, quizId: null, quizTitle: '' });
    } catch (err) {
      const errData = err.response?.data;
      console.error('Delete quiz error:', errData || err.message);
      const debugInfo = errData?.debug
        ? `\n\nSent ID: "${errData.debug.receivedId}"\nSheet IDs: ${JSON.stringify(errData.debug.availableIds)}`
        : '';
      alert(`Failed to delete quiz: ${errData?.message || err.message}${debugInfo}`);
    } finally {
      setDeleting(false);
    }
  };

  const syncQuiz = async (quizId) => {
    setSyncingQuizId(quizId);
    try {
      const res = await api.post(`/quizzes/${quizId}/sync`);
      alert(res.data.message);
      fetchClassroomData(); // Refresh metrics
    } catch (err) {
      alert("Sync failed: " + (err.response?.data?.message || err.message));
    } finally {
      setSyncingQuizId(null);
    }
  };

  if (loading) return <div className="loading">Loading Workspace...</div>;
  if (!classroom) return (
    <div className="error-state card" style={{ margin: '3rem auto', maxWidth: '400px', textAlign: 'center' }}>
      <p style={{ marginBottom: '1rem' }}>Classroom not found.</p>
      <button className="btn-primary" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
    </div>
  );

  const pos = stats?.sentimentDist?.Positive || 0;
  const neu = stats?.sentimentDist?.Neutral  || 0;
  const neg = stats?.sentimentDist?.Negative || 0;

  const TABS = [
    { key: 'overview',  label: 'Overview',         icon: <BarChart2 size={15}/> },
    { key: 'students',  label: 'Students',          icon: <Users size={15}/> },
    { key: 'quizzes',   label: 'Quizzes',           icon: <BookOpen size={15}/> },
    { key: 'feedback',  label: 'Feedback Analysis', icon: <MessageSquare size={15}/> },
    { key: 'builder',   label: '+ Create Quiz',     icon: null },
  ];

  return (
    <div className="cls-workspace animate-fade">
      {/* Header */}
      <header className="ws-header">
        <div className="ws-title-row">
          <button className="back-btn" onClick={() => navigate(`/workspaces/${classroom.WorkspaceID}`)}><ArrowLeft size={18}/></button>
          <div>
            <h1>{classroom.Name}</h1>
            <div className="ws-meta">
              <span className="ws-tag">{classroom.Subject}</span>
              <span className="ws-tag">{classroom.Batch}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="ws-tabs">
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`ws-tab ${activeTab === tab.key ? 'active' : ''} ${tab.key === 'builder' ? 'create-tab' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.icon && <span className="tab-icon">{tab.icon}</span>}
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* ─── OVERVIEW TAB ─── */}
      {activeTab === 'overview' && (
        <div className="tab-content animate-fade">
          <div className="ov-kpi-grid">
            <div className="card kpi-mini">
              <div className="kpi-icon" style={{background:'var(--primary-light)',color:'var(--primary)'}}><Users size={18}/></div>
              <div className="kpi-val">{stats?.totalStudents || 0}</div>
              <div className="kpi-label">Total Students</div>
            </div>
            <div className="card kpi-mini">
              <div className="kpi-icon" style={{background:'var(--success-light)',color:'var(--success)'}}><BarChart2 size={18}/></div>
              <div className="kpi-val">{stats?.classAvg || 0}%</div>
              <div className="kpi-label">Avg Score</div>
            </div>
            <div className="card kpi-mini">
              <div className="kpi-icon" style={{background:'var(--success-light)',color:'var(--success)'}}><ThumbsUp size={18}/></div>
              <div className="kpi-val">{pos}%</div>
              <div className="kpi-label">Positive Sentiment</div>
            </div>
            <div className="card kpi-mini">
              <div className="kpi-icon" style={{background:'var(--danger-light)',color:'var(--danger)'}}><ThumbsDown size={18}/></div>
              <div className="kpi-val">{neg}%</div>
              <div className="kpi-label">Negative Sentiment</div>
            </div>
          </div>

          {/* Sentiment bars */}
          <div className="card sentiment-card">
            <h3 className="card-section-title">Feedback Sentiment Breakdown</h3>
            <div className="sentiment-stack-bar">
              {pos > 0  && <div className="stk-seg pos" style={{width:`${pos}%`}} title={`Positive: ${pos}%`}></div>}
              {neu > 0  && <div className="stk-seg neu" style={{width:`${neu}%`}} title={`Neutral: ${neu}%`}></div>}
              {neg > 0  && <div className="stk-seg neg" style={{width:`${neg}%`}} title={`Negative: ${neg}%`}></div>}
            </div>
            <div className="sentiment-legend">
              <span><span className="dot pos"></span> Positive ({pos}%)</span>
              <span><span className="dot neu"></span> Neutral ({neu}%)</span>
              <span><span className="dot neg"></span> Negative ({neg}%)</span>
            </div>
          </div>

          {/* Category breakdown */}
          <div className="card">
            <h3 className="card-section-title">Engagement Category Distribution</h3>
            <div className="category-pills">
              {Object.entries(stats?.categoryDist || {}).map(([cat, count]) => (
                <div key={cat} className={`cat-pill cat-${cat.toLowerCase().replace(/\s+/g,'-')}`}>
                  <span className="cat-count">{count}</span>
                  <span className="cat-name">{cat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── STUDENTS TAB ─── */}
      {activeTab === 'students' && (
        <div className="tab-content animate-fade">
          <div className="card">
            <h3 className="card-section-title" style={{marginBottom:'1.25rem'}}>
              Student Participation — {classroom.Name}
            </h3>
            {students.length === 0 ? (
              <div className="empty-state">No student data yet. Sync responses first.</div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead><tr>
                    <th>Student URN</th>
                    <th>Quiz Avg</th>
                    <th>Participation</th>
                    <th>Weekly Score</th>
                    <th>Category</th>
                    <th>Sentiment</th>
                  </tr></thead>
                  <tbody>
                    {students.map(s => (
                      <tr key={s.studentId} style={s.atRiskFlag ? {background:'rgba(220,38,38,0.03)'} : {}}>
                        <td>
                          <div className="d-flex align-items-center gap-3">
                            <div className="av-sm">{(s.studentName||'?').charAt(0)}</div>
                            <div>
                              <div style={{fontWeight:600}}>{s.studentName}</div>
                              <div style={{fontSize:'0.72rem',color:'var(--text-secondary)'}}>{s.studentId}</div>
                            </div>
                          </div>
                        </td>
                        <td>{typeof s.avgQuiz === 'number' ? s.avgQuiz.toFixed(1) : (s.avgQuiz || '—')}</td>
                        <td>{s.participation||0}%</td>
                        <td><strong>{typeof s.weeklyScore === 'number' ? `${s.weeklyScore.toFixed(1)}%` : (s.weeklyScore || '—')}</strong></td>
                        <td>
                          <span className={`badge badge-${(s.category||'medium').toLowerCase().replace(/\s+/g,'-')}`}>
                            {s.category||'Medium'}
                          </span>
                        </td>
                        <td>
                          {(s.avgSentiment||0) >= 70
                            ? <span className="sentiment-chip pos">😊 Positive</span>
                            : (s.avgSentiment||0) >= 40
                            ? <span className="sentiment-chip neu">😐 Neutral</span>
                            : <span className="sentiment-chip neg">😟 Negative</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── QUIZZES TAB ─── */}
      {activeTab === 'quizzes' && (
        <div className="tab-content animate-fade">
          <div className="card">
            <div className="d-flex justify-content-between align-items-center" style={{marginBottom:'1.25rem'}}>
              <h3 className="card-section-title">Generated Quizzes</h3>
              <button className="btn-primary btn-sm" onClick={() => setActiveTab('builder')}>
                + Create Quiz
              </button>
            </div>
            {quizzes.length === 0 ? (
              <div className="empty-state">No quizzes yet. Use <strong>+ Create Quiz</strong> to generate one.</div>
            ) : (
              <div className="quiz-list">
                {quizzes.map(quiz => (
                  <div key={quiz.id} className="quiz-card">
                    <div className="quiz-info">
                      <h4>{quiz.title}
                        <span className="text-secondary" style={{fontWeight:400,fontSize:'0.82rem'}}> — Week {quiz.week}</span>
                      </h4>
                      <div className="quiz-meta-pills">
                        <span className={`pill ${quiz.status === 'Active' ? 'active' : 'expired'}`}>
                          <Clock size={12}/> {quiz.status}
                        </span>
                        {quiz.hasFeedback && <span className="pill"><CheckCircle size={12}/> Feedback</span>}
                        {quiz.endTime && (
                          <span className="pill">
                            Expires: {new Date(quiz.endTime).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="quiz-actions-group">
                      <button 
                        className="btn-outline btn-sm sync-btn" 
                        onClick={() => syncQuiz(quiz.id)}
                        disabled={syncingQuizId === quiz.id}
                      >
                        <RefreshCw size={13} className={syncingQuizId === quiz.id ? 'animate-spin' : ''}/>
                        {syncingQuizId === quiz.id ? 'Syncing...' : 'Sync'}
                      </button>
                      <a href={quiz.url} target="_blank" rel="noreferrer" className="btn-outline btn-sm">
                        Open Form
                      </a>
                      <button
                        className="btn-delete-quiz"
                        onClick={() => deleteQuiz(quiz.id, quiz.title)}
                        title="Delete quiz"
                      >
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── FEEDBACK ANALYSIS TAB ─── */}
      {activeTab === 'feedback' && (
        <div className="tab-content animate-fade">
          <div className="feedback-grid">
            {/* Summary panel */}
            <div className="card feedback-summary">
              <h3 className="card-section-title">Sentiment Summary</h3>
              <div className="sent-summary-rows">
                <div className="sent-row">
                  <div className="sent-row-left">
                    <ThumbsUp size={16} color="var(--success)"/>
                    <span>Positive</span>
                  </div>
                  <div className="sent-bar-wrap">
                    <div className="sent-bar"><div className="sent-fill pos" style={{width:`${pos}%`}}></div></div>
                    <span className="sent-pct">{pos}%</span>
                  </div>
                </div>
                <div className="sent-row">
                  <div className="sent-row-left">
                    <Minus size={16} color="var(--primary)"/>
                    <span>Neutral</span>
                  </div>
                  <div className="sent-bar-wrap">
                    <div className="sent-bar"><div className="sent-fill neu" style={{width:`${neu}%`}}></div></div>
                    <span className="sent-pct">{neu}%</span>
                  </div>
                </div>
                <div className="sent-row">
                  <div className="sent-row-left">
                    <ThumbsDown size={16} color="var(--danger)"/>
                    <span>Negative</span>
                  </div>
                  <div className="sent-bar-wrap">
                    <div className="sent-bar"><div className="sent-fill neg" style={{width:`${neg}%`}}></div></div>
                    <span className="sent-pct">{neg}%</span>
                  </div>
                </div>
              </div>

              <div className="gemini-note">
                <div className="gemini-badge">✦ Gemini AI</div>
                <p>Sentiment scores are analyzed using Google Gemini LLM on each student's open-ended feedback response.</p>
              </div>
            </div>

            {/* Per-student feedback */}
            <div className="card feedback-list-panel">
              <h3 className="card-section-title">Student Feedback Records</h3>
              {students.length === 0 ? (
                <div className="empty-state">No feedback data synced yet.</div>
              ) : (
                <div className="feedback-records">
                  {students.map(s => {
                    const sentStr  = s.sentiment || 'Neutral';
                    const sentCat  = sentStr === 'Positive' ? 'pos' : sentStr === 'Negative' ? 'neg' : 'neu';
                    const sentEmoji = sentStr === 'Positive' ? '😊' : sentStr === 'Negative' ? '😟' : '😐';
                    return (
                      <div key={s.studentId} className="feedback-record-item">
                        <div className="fb-header">
                          <div className="d-flex align-items-center gap-2">
                            <div className="av-sm">{(s.studentName||'?').charAt(0)}</div>
                            <div>
                              <div style={{fontWeight:600,fontSize:'0.9rem'}}>{s.studentName}</div>
                              <div style={{fontSize:'0.7rem',color:'var(--text-secondary)'}}>{s.studentId}</div>
                            </div>
                          </div>
                          <span className={`sentiment-chip ${sentCat}`}>{sentEmoji} {sentStr}</span>
                        </div>
                        {s.latestFeedback ? (
                          <p className="fb-text">"{s.latestFeedback}"</p>
                        ) : (
                          <p className="fb-text fb-empty">
                            No feedback text yet — click <strong>Sync</strong> in the navbar to pull the latest form responses.
                          </p>
                        )}
                        <div className="fb-meta">
                          Sentiment: <strong>{typeof s.avgSentiment === 'number' ? s.avgSentiment.toFixed(0) : (s.avgSentiment || '—')}/100</strong>
                          &nbsp;·&nbsp;Engagement: <strong>{typeof s.weeklyScore === 'number' ? s.weeklyScore.toFixed(1) : (s.weeklyScore || '—')}%</strong>
                          &nbsp;·&nbsp;Quiz Avg: <strong>{typeof s.avgQuiz === 'number' ? s.avgQuiz.toFixed(1) : (s.avgQuiz || '—')}</strong>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── BUILDER TAB ─── */}
      {activeTab === 'builder' && (
        <div className="tab-content animate-fade">
          <QuizBuilder
            prefilledClassroomId={id}
            onQuizCreated={() => { fetchClassroomData(); setActiveTab('quizzes'); }}
          />
        </div>
      )}

      {/* ─── DELETE MODAL ─── */}
      {deleteModal.open && (
        <div className="modal-overlay" onClick={() => !deleting && setDeleteModal({ open: false, quizId: null, quizTitle: '' })}>
          <div className="modal-content delete-confirm-modal animate-fade" onClick={e => e.stopPropagation()}>
            <div className="delete-modal-icon"><Trash2 size={26}/></div>
            <h2>Delete Quiz?</h2>
            <p>
              Permanently delete <strong>"{deleteModal.quizTitle}"</strong>?
              This removes it from Google Sheets and cannot be undone.
            </p>
            <div className="delete-modal-actions">
              <button className="btn-outline"
                onClick={() => setDeleteModal({ open: false, quizId: null, quizTitle: '' })}
                disabled={deleting}>
                Cancel
              </button>
              <button className="btn-delete-confirm" onClick={confirmDeleteQuiz} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .cls-workspace { display: flex; flex-direction: column; gap: 1.5rem; }

        /* Header */
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
        .ws-header h1 { font-size: 1.5rem; margin-bottom: 0.4rem; }
        .ws-meta { display: flex; gap: 0.4rem; flex-wrap: wrap; }
        .ws-tag {
          font-size: 0.7rem; font-weight: 700; padding: 0.2rem 0.55rem;
          border-radius: 20px; background: var(--primary-light); color: var(--primary);
          text-transform: uppercase; letter-spacing: 0.03em;
        }

        /* Tabs */
        .ws-tabs {
          display: flex; gap: 0;
          border-bottom: 2px solid var(--border);
          overflow-x: auto;
        }
        .ws-tab {
          display: flex; align-items: center; gap: 0.4rem;
          background: none; border: none;
          padding: 0.75rem 1.25rem;
          font-weight: 600; color: var(--text-secondary);
          cursor: pointer; position: relative;
          font-size: 0.85rem; white-space: nowrap;
          transition: var(--transition);
        }
        .ws-tab:hover { color: var(--text-primary); }
        .ws-tab.active { color: var(--primary); }
        .ws-tab.active::after {
          content: ''; position: absolute;
          bottom: -2px; left: 0; width: 100%;
          height: 2px; background: var(--primary);
          border-radius: 2px 2px 0 0;
        }
        .ws-tab.create-tab { color: var(--primary); margin-left: auto; }
        .ws-tab.create-tab.active { color: var(--primary); }

        .tab-content { display: flex; flex-direction: column; gap: 1.25rem; }

        /* Card section title */
        .card-section-title { font-size: 0.95rem; }

        /* Overview KPI */
        .ov-kpi-grid {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem;
        }
        .kpi-mini { padding: 1.25rem; display: flex; flex-direction: column; gap: 0.5rem; }
        .kpi-icon { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
        .kpi-val { font-size: 1.5rem; font-weight: 700; }
        .kpi-label { font-size: 0.75rem; color: var(--text-secondary); font-weight: 500; }

        /* Sentiment bar */
        .sentiment-card { display: flex; flex-direction: column; gap: 0.85rem; }
        .sentiment-stack-bar {
          height: 12px; display: flex; border-radius: 8px; overflow: hidden;
          background: var(--background);
        }
        .stk-seg { height: 100%; transition: width 0.5s ease; }
        .stk-seg.pos { background: var(--success); }
        .stk-seg.neu { background: var(--primary); }
        .stk-seg.neg { background: var(--danger); }
        .sentiment-legend { display: flex; gap: 1.25rem; flex-wrap: wrap; }
        .sentiment-legend span {
          display: flex; align-items: center; gap: 0.4rem;
          font-size: 0.78rem; font-weight: 600; color: var(--text-secondary);
        }
        .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
        .dot.pos { background: var(--success); }
        .dot.neu { background: var(--primary); }
        .dot.neg { background: var(--danger); }

        /* Category Pills */
        .category-pills { display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 0.5rem; }
        .cat-pill {
          display: flex; flex-direction: column; align-items: center;
          padding: 0.85rem 1.5rem; border-radius: var(--radius); gap: 0.25rem;
          border: 1px solid var(--border); min-width: 90px;
        }
        .cat-count { font-size: 1.5rem; font-weight: 700; }
        .cat-name { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; }
        .cat-pill.cat-high { background: var(--success-light); color: var(--success); border-color: rgba(22,163,74,0.2); }
        .cat-pill.cat-medium { background: var(--primary-light); color: var(--primary); border-color: rgba(37,99,235,0.2); }
        .cat-pill.cat-low { background: var(--warning-light); color: var(--warning); border-color: rgba(217,119,6,0.2); }
        .cat-pill.cat-at-risk { background: var(--danger-light); color: var(--danger); border-color: rgba(220,38,38,0.2); }

        /* Avatar */
        .av-sm {
          width: 30px; height: 30px;
          background: linear-gradient(135deg, var(--primary), var(--primary-hover));
          color: white; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.72rem; font-weight: 700; flex-shrink: 0;
        }

        /* Sentiment chip */
        .sentiment-chip {
          font-size: 0.7rem; font-weight: 700; padding: 0.2rem 0.6rem;
          border-radius: 20px; white-space: nowrap;
        }
        .sentiment-chip.pos { background: #dcfce7; color: #166534; }
        .sentiment-chip.neu { background: #dbeafe; color: #1e40af; }
        .sentiment-chip.neg { background: #fee2e2; color: #991b1b; }

        /* Feedback Grid */
        .feedback-grid { display: grid; grid-template-columns: 280px 1fr; gap: 1.25rem; }

        /* Feedback Summary */
        .sent-summary-rows { display: flex; flex-direction: column; gap: 1.1rem; margin-bottom: 1.5rem; }
        .sent-row { display: flex; align-items: center; gap: 1rem; }
        .sent-row-left { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; font-weight: 600; width: 80px; flex-shrink: 0; }
        .sent-bar-wrap { display: flex; align-items: center; gap: 0.6rem; flex: 1; }
        .sent-bar { flex: 1; height: 8px; background: var(--border); border-radius: 4px; overflow: hidden; }
        .sent-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
        .sent-fill.pos { background: var(--success); }
        .sent-fill.neu { background: var(--primary); }
        .sent-fill.neg { background: var(--danger); }
        .sent-pct { font-size: 0.78rem; font-weight: 700; width: 32px; text-align: right; flex-shrink: 0; }

        .gemini-note {
          border-top: 1px solid var(--border);
          padding-top: 1rem; margin-top: 0.5rem;
        }
        .gemini-badge {
          display: inline-flex; align-items: center; gap: 0.35rem;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          color: white; font-size: 0.65rem; font-weight: 700;
          padding: 0.2rem 0.6rem; border-radius: 20px;
          margin-bottom: 0.6rem; letter-spacing: 0.03em;
        }
        .gemini-note p { font-size: 0.78rem; color: var(--text-secondary); line-height: 1.55; }

        /* Feedback records */
        .feedback-records { display: flex; flex-direction: column; gap: 0.85rem; }
        .feedback-record-item {
          padding: 1rem 1.25rem; border: 1px solid var(--border);
          border-radius: var(--radius); transition: var(--transition);
          background: var(--background);
        }
        .feedback-record-item:hover { border-color: var(--primary); background: var(--card-bg); }
        .fb-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem; gap: 1rem; flex-wrap: wrap; }
        .fb-text { font-size: 0.85rem; color: var(--text-primary); line-height: 1.6; margin-bottom: 0.5rem; }
        .fb-meta { font-size: 0.72rem; color: var(--text-secondary); }
        .fb-empty { 
          color: var(--text-secondary) !important; 
          font-style: italic; font-size: 0.83rem !important;
          background: var(--background); padding: 0.6rem 0.85rem;
          border-radius: 6px; border-left: 3px solid var(--border);
        }

        /* Quiz styles */
        .quiz-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .quiz-card {
          padding: 1.25rem; border: 1px solid var(--border);
          border-radius: var(--radius); background: var(--background);
          display: flex; justify-content: space-between; align-items: center;
          gap: 1rem; transition: var(--transition);
        }
        .quiz-card:hover { border-color: var(--primary); background: var(--card-bg); }
        .quiz-info h4 { font-size: 0.95rem; margin-bottom: 0.35rem; }
        .quiz-meta-pills { display: flex; gap: 0.4rem; flex-wrap: wrap; }
        .pill {
          display: flex; align-items: center; gap: 0.3rem;
          font-size: 0.7rem; padding: 0.18rem 0.5rem; border-radius: 20px;
          background: var(--background); color: var(--text-secondary);
          font-weight: 600; border: 1px solid var(--border);
        }
        .pill.active { background: var(--success-light); color: #16A34A; border-color: transparent; }
        .pill.expired { background: var(--danger-light); color: #DC2626; border-color: transparent; }
        .quiz-actions-group { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }
        .btn-delete-quiz {
          width: 32px; height: 32px; padding: 0;
          background: var(--background); color: var(--text-secondary);
          border: 1.5px solid var(--border); border-radius: var(--radius);
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: var(--transition);
        }
        .btn-delete-quiz:hover { background: var(--danger-light); color: var(--danger); border-color: var(--danger); }

        /* Delete Modal */
        .delete-confirm-modal { max-width: 400px; text-align: center; padding: 2.5rem 2rem; }
        .delete-modal-icon {
          width: 60px; height: 60px; background: var(--danger-light); color: var(--danger);
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
          margin: 0 auto 1.25rem;
        }
        .delete-confirm-modal h2 { font-size: 1.2rem; margin-bottom: 0.75rem; }
        .delete-confirm-modal p { color: var(--text-secondary); font-size: 0.9rem; line-height: 1.6; margin-bottom: 1.75rem; }
        .delete-modal-actions { display: flex; gap: 0.75rem; justify-content: center; }
        .delete-modal-actions button { flex: 1; max-width: 160px; height: 42px; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.88rem; }
        .btn-delete-confirm {
          background: var(--danger); color: white;
          border: none; border-radius: var(--radius); cursor: pointer; transition: var(--transition);
        }
        .btn-delete-confirm:hover:not(:disabled) { background: #b91c1c; box-shadow: 0 4px 12px rgba(220,38,38,0.3); transform: translateY(-1px); }
        .btn-delete-confirm:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        @media (max-width: 1024px) {
          .feedback-grid { grid-template-columns: 1fr; }
          .ov-kpi-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .ov-kpi-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </div>
  );
};

export default ClassroomView;
