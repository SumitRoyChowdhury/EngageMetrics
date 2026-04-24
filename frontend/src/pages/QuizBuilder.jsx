import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle2, 
  Copy,
  Layout,
  X
} from 'lucide-react';
import api from '../utils/api';

const QuizBuilder = ({ prefilledClassroomId, onQuizCreated }) => {
  const [quizInfo, setQuizInfo] = useState({ 
    title: '', 
    date: new Date().toISOString().split('T')[0],
    week: '1',
    endTime: '',
    includeFeedback: true
  });
  const [questions, setQuestions] = useState([
    { id: 1, text: '', type: 'MCQ', options: ['', ''], correctAnswer: '', points: 10 }
  ]);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createdForm, setCreatedForm] = useState(null);

  const addQuestion = () => {
    setQuestions([...questions, { 
      id: Date.now(), 
      text: '', 
      type: 'MCQ', 
      options: ['', ''], 
      correctAnswer: '', 
      points: 10 
    }]);
  };

  const removeQuestion = (id) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter(q => q.id !== id));
  };

  const updateQuestion = (id, fields) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...fields } : q));
  };

  const addOption = (qId) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) return { ...q, options: [...q.options, ''] };
      return q;
    }));
  };

  const removeOption = (qId, idx) => {
    setQuestions(questions.map(q => {
      if (q.id === qId && q.options.length > 2) {
        const newOpts = [...q.options];
        newOpts.splice(idx, 1);
        return { ...q, options: newOpts };
      }
      return q;
    }));
  };

  const handleCreateRealForm = async () => {
    const classroomId = prefilledClassroomId || localStorage.getItem('selectedClassroom');
    if (!classroomId) {
      alert('Please select a Classroom before creating a quiz.');
      return;
    }
    if (!quizInfo.title.trim()) {
      alert('Please enter a quiz title.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.post('/quizzes', { 
        ...quizInfo, 
        questions, 
        classroomId, 
        week: quizInfo.week 
      });
      setCreatedForm(res.data);
      setShowModal(true);
      if (onQuizCreated) onQuizCreated();
    } catch (error) {
      console.error('Error creating Google Form:', error);
      alert(error.response?.data?.message || 'Failed to create Google Form. Please ensure you are connected to Google.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="quiz-builder animate-fade">
      <header className="page-header">
        <h1>Quiz Architecture</h1>
        <p>Design interactive assessments and sync with Google Forms</p>
      </header>

      <div className="builder-layout">
        {/* LEFT PANEL: Editor */}
        <div className="editor-panel">
          <div className="card builder-form">
            <div className="form-section">
              <h3>Quiz Metadata</h3>
              <div className="meta-row">
                <div className="field">
                  <label>Quiz Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g., Week 4 Reflection"
                    value={quizInfo.title}
                    onChange={(e) => setQuizInfo({ ...quizInfo, title: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Week Number</label>
                  <select 
                    value={quizInfo.week} 
                    onChange={(e) => setQuizInfo({ ...quizInfo, week: e.target.value })}
                  >
                    <option value="1">Week 1</option>
                    <option value="2">Week 2</option>
                    <option value="3">Week 3</option>
                    <option value="4">Week 4</option>
                  </select>
                </div>
                <div className="field">
                  <label>Date</label>
                  <input 
                    type="date"
                    value={quizInfo.date}
                    onChange={(e) => setQuizInfo({ ...quizInfo, date: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Quiz Settings</h3>
              <div className="meta-row">
                <div className="field">
                  <label>Expiry / End Time (Optional)</label>
                  <input 
                    type="datetime-local" 
                    value={quizInfo.endTime} 
                    onChange={(e) => setQuizInfo({ ...quizInfo, endTime: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Include Feedback</label>
                  <div className="toggle-group">
                    <button 
                      className={`toggle-btn ${quizInfo.includeFeedback ? 'active' : ''}`} 
                      onClick={() => setQuizInfo({ ...quizInfo, includeFeedback: true })}
                    >
                      Yes
                    </button>
                    <button 
                      className={`toggle-btn ${!quizInfo.includeFeedback ? 'active' : ''}`} 
                      onClick={() => setQuizInfo({ ...quizInfo, includeFeedback: false })}
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="questions-section">
              <div className="q-section-header">
                <h3>Assessment Items</h3>
                <button className="btn-outline btn-sm" onClick={addQuestion}>
                  <Plus size={15} /> Add Question
                </button>
              </div>

              {questions.map((q, idx) => (
                <div key={q.id} className="question-block card">
                  <div className="q-header">
                    <span className="q-number">Q{idx + 1}</span>
                    <button className="q-delete-btn" onClick={() => removeQuestion(q.id)} title="Remove question">
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="q-body">
                    <textarea 
                      placeholder="Enter your question here..."
                      value={q.text}
                      onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
                      rows="2"
                    />

                    <div className="q-meta">
                      <div className="field">
                        <label>Type</label>
                        <select 
                          value={q.type} 
                          onChange={(e) => updateQuestion(q.id, { type: e.target.value })}
                        >
                          <option value="MCQ">Multiple Choice</option>
                          <option value="Checkbox">Checkboxes</option>
                          <option value="Short">Short Answer</option>
                        </select>
                      </div>
                      <div className="field">
                        <label>Points</label>
                        <input 
                          type="number" 
                          value={q.points} 
                          min="1"
                          onChange={(e) => updateQuestion(q.id, { points: parseInt(e.target.value) || 10 })}
                        />
                      </div>
                    </div>

                    {q.type !== 'Short' && (
                      <div className="options-area">
                        <label>Options <span className="text-secondary" style={{fontWeight: 400, fontSize: '0.75rem'}}>(select correct answer)</span></label>
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx} className="option-row">
                            <input 
                              type="radio" 
                              name={`correct-${q.id}`} 
                              checked={q.correctAnswer === opt && opt !== ''}
                              onChange={() => updateQuestion(q.id, { correctAnswer: opt })}
                            />
                            <input 
                              type="text" 
                              placeholder={`Option ${oIdx + 1}`}
                              value={opt}
                              onChange={(e) => {
                                const newOpts = [...q.options];
                                newOpts[oIdx] = e.target.value;
                                updateQuestion(q.id, { options: newOpts });
                              }}
                            />
                            <button className="opt-delete" onClick={() => removeOption(q.id, oIdx)} title="Remove option">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                        <button className="add-opt-btn" onClick={() => addOption(q.id)}>
                          + Add Option
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Preview */}
        <div className="preview-panel">
          <div className="sticky-preview card">
            <div className="preview-header">
              <Layout size={16} />
              <h3>Live Preview</h3>
            </div>
            
            <div className="preview-content">
              {quizInfo.title ? (
                <div className="preview-quiz">
                  <h2 className="preview-title">{quizInfo.title}</h2>
                  <p className="preview-date">{quizInfo.date} • Week {quizInfo.week}</p>
                  
                  <div className="preview-questions">
                    {questions.map((q, idx) => (
                      <div key={q.id} className="preview-q">
                        <p className="p-q-text"><strong>{idx + 1}.</strong> {q.text || 'Untitled Question'}</p>
                        {q.type !== 'Short' ? (
                          <div className="p-options">
                            {q.options.map((opt, i) => (
                              <div key={i} className="p-opt">
                                <div className="p-circle"></div>
                                <span>{opt || `Option ${i + 1}`}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-short">Short answer text...</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="empty-preview">
                   <CheckCircle2 size={40} />
                   <p>Start building to see preview</p>
                </div>
              )}
            </div>

            <div className="builder-actions">
              <button 
                className="btn-primary btn-full"
                onClick={handleCreateRealForm}
                disabled={saving || !quizInfo.title.trim()}
              >
                <Save size={17} /> {saving ? 'Creating Form...' : 'Create Google Form'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content animate-fade" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h2>{createdForm ? '🎉 Form Created!' : 'Export to Google Forms'}</h2>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              {createdForm ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    width: '64px', height: '64px', 
                    background: 'var(--success-light)', 
                    borderRadius: '50%', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1rem'
                  }}>
                    <CheckCircle2 size={32} color="var(--success)" />
                  </div>
                  <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Your Google Form has been created and configured as a quiz.</p>
                  
                  <div style={{ textAlign: 'left' }}>
                    <div className="form-group">
                      <label>Generated Link</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input type="text" value={createdForm.responderUri || createdForm.url || ''} readOnly style={{ flex: 1, fontSize: '0.82rem' }} />
                        <button className="btn-secondary btn-sm" onClick={() => navigator.clipboard.writeText(createdForm.responderUri || createdForm.url || '')}>
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="info-box mt-3" style={{ textAlign: 'left' }}>
                    <p><strong>Note:</strong> Responses will be automatically collected. Use the <strong>Sync Data</strong> button in the navbar to pull them into EngageMatric.</p>
                  </div>
                </div>
              ) : null}
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={() => setShowModal(false)}>Got it!</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .builder-layout {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 1.5rem;
          margin-top: 1.5rem;
        }

        .editor-panel {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .builder-form { padding: 2rem; }

        .form-section { margin-bottom: 2rem; }
        .form-section h3 { 
          margin-bottom: 1.25rem; 
          border-left: 3px solid var(--primary); 
          padding-left: 0.85rem; 
          font-size: 0.95rem;
        }

        .meta-row { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 1.25rem; }
        .field { display: flex; flex-direction: column; gap: 0.4rem; flex: 1; }
        .field label { font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); }

        .q-section-header { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          margin-bottom: 1.5rem;
          padding-top: 0.75rem;
          border-top: 1px solid var(--border);
        }

        .q-section-header h3 {
          border-left: none;
          padding-left: 0;
        }

        .question-block {
          padding: 1.25rem;
          margin-bottom: 1rem;
          border: 1.5px solid var(--border);
          transition: var(--transition);
        }

        .question-block:hover {
          border-color: var(--primary);
        }

        .q-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .q-number { 
          font-weight: 700; 
          color: white; 
          font-size: 0.75rem;
          background: var(--primary);
          padding: 0.2rem 0.6rem;
          border-radius: 4px;
        }

        .q-delete-btn {
          background: none;
          border: none;
          color: var(--text-secondary);
          padding: 0.35rem;
          border-radius: 6px;
          cursor: pointer;
          transition: var(--transition);
        }
        .q-delete-btn:hover { color: var(--danger); background: var(--danger-light); }

        .q-body { display: flex; flex-direction: column; gap: 1rem; }
        .q-body textarea { min-height: 60px; resize: vertical; }

        .q-meta { display: flex; gap: 1.25rem; }

        .options-area { display: flex; flex-direction: column; gap: 0.6rem; }
        .options-area > label { font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); }

        .option-row { display: flex; align-items: center; gap: 0.6rem; }
        .option-row input[type="radio"] { 
          width: 16px; height: 16px; 
          accent-color: var(--primary);
          flex-shrink: 0;
        }
        .option-row input[type="text"] { flex: 1; }

        .opt-delete {
          background: none;
          border: none;
          color: var(--text-secondary);
          padding: 0.3rem;
          border-radius: 4px;
          cursor: pointer;
          flex-shrink: 0;
        }
        .opt-delete:hover { color: var(--danger); }

        .add-opt-btn { 
          background: none; 
          color: var(--primary); 
          font-weight: 600; 
          text-align: left; 
          padding: 0.4rem 0; 
          width: fit-content; 
          font-size: 0.82rem;
          border: none;
          cursor: pointer;
        }
        .add-opt-btn:hover { text-decoration: underline; }

        .preview-panel { position: relative; }
        .sticky-preview { 
          position: sticky; 
          top: calc(var(--navbar-height) + 1rem); 
          padding: 1.25rem;
          max-height: calc(100vh - var(--navbar-height) - 2rem);
          display: flex;
          flex-direction: column;
        }

        .preview-header { 
          display: flex; align-items: center; gap: 0.6rem; 
          margin-bottom: 1rem; color: var(--text-secondary); 
          font-size: 0.85rem;
        }
        .preview-header h3 { font-size: 0.88rem; }

        .preview-content { 
          flex: 1; overflow-y: auto; 
          background: var(--background); 
          border-radius: var(--radius); 
          padding: 1rem; 
          border: 1px solid var(--border); 
        }

        .preview-title { font-size: 1.1rem; margin-bottom: 0.2rem; }
        .preview-date { font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 1.25rem; }

        .preview-q { margin-bottom: 1rem; border-bottom: 1px solid var(--border); padding-bottom: 0.85rem; }
        .preview-q:last-child { border-bottom: none; }
        .p-q-text { font-size: 0.85rem; margin-bottom: 0.6rem; }
        .p-opt { display: flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; margin-bottom: 0.35rem; }
        .p-circle { width: 14px; height: 14px; border: 1.5px solid var(--border); border-radius: 50%; flex-shrink: 0; }
        .p-short { font-size: 0.78rem; font-style: italic; color: var(--text-secondary); border-bottom: 1px dashed var(--border); width: fit-content; }

        .builder-actions { margin-top: 1.25rem; }
        .btn-full { 
          width: 100%; display: flex; align-items: center; 
          justify-content: center; gap: 0.6rem; height: 44px; 
        }

        .empty-preview { 
          height: 100%; display: flex; flex-direction: column; 
          align-items: center; justify-content: center; 
          color: var(--text-secondary); gap: 0.75rem; 
          min-height: 200px;
        }
        .empty-preview p { font-size: 0.85rem; }

        @media (max-width: 1024px) {
          .builder-layout { grid-template-columns: 1fr; }
          .sticky-preview { position: static; max-height: none; }
          .meta-row { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default QuizBuilder;
