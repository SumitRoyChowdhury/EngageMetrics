import React, { useState, useEffect } from 'react';
import { FileText, Copy, ExternalLink, Calendar, CheckCircle, Clock } from 'lucide-react';
import api from '../utils/api';

const QuizManager = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchQuizzes = async () => {
    setLoading(true);
    const classroomId = localStorage.getItem('selectedClassroom');
    try {
      const res = await api.get(`/quizzes?classroomId=${classroomId || ''}`);
      setQuizzes(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
    window.addEventListener('classroomChanged', fetchQuizzes);
    return () => window.removeEventListener('classroomChanged', fetchQuizzes);
  }, []);

  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url);
    alert('Copied to clipboard');
  };

  if (loading) return <div className="loading">Loading quizzes...</div>;

  return (
    <div className="quiz-manager-page animate-fade">
      <div className="page-header">
        <div>
          <h1>Quiz Manager</h1>
          <p>Manage and track all generated quizzes for this classroom.</p>
        </div>
      </div>

      <div className="quiz-list mt-4">
        {quizzes.length === 0 ? (
          <div className="empty-state card">No quizzes found for this classroom. Generate one from the Quiz Builder.</div>
        ) : (
          quizzes.map((quiz) => (
            <div key={quiz.id} className="quiz-card card">
              <div className="quiz-header">
                <div>
                  <h3>{quiz.title} • Week {quiz.week}</h3>
                  <div className="quiz-meta">
                    <span className="metadata"><Calendar size={14}/> {quiz.endTime ? new Date(quiz.endTime).toLocaleString() : 'No expiry'}</span>
                    {quiz.hasFeedback && <span className="metadata sentiment-badge"><CheckCircle size={14}/> Includes Feedback</span>}
                  </div>
                </div>
                <div className={`status-badge ${quiz.status.toLowerCase()}`}>
                  {quiz.status === 'Active' ? <Clock size={16}/> : <CheckCircle size={16}/>}
                  {quiz.status}
                </div>
              </div>
              
              <div className="quiz-actions mt-3">
                <input type="text" value={quiz.url} readOnly className="link-input" />
                <button onClick={() => copyToClipboard(quiz.url)} className="btn-secondary btn-sm" title="Copy Link">
                  <Copy size={16} />
                </button>
                <a href={quiz.url} target="_blank" rel="noreferrer" className="btn-primary btn-sm" title="Open Link">
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>
          ))
        )}
      </div>

      <style>{`
        .quiz-manager-page {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .quiz-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .quiz-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .quiz-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .quiz-meta {
          display: flex;
          gap: 1rem;
          margin-top: 0.5rem;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }
        .metadata {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        .sentiment-badge {
          color: var(--success);
        }
        .status-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.25rem 0.75rem;
          border-radius: 99px;
          font-size: 0.875rem;
          font-weight: 500;
        }
        .status-badge.active {
          background-color: rgba(37, 99, 235, 0.1);
          color: #2563EB;
        }
        .status-badge.expired {
          background-color: rgba(220, 38, 38, 0.1);
          color: #DC2626;
        }
        .quiz-actions {
          display: flex;
          gap: 0.5rem;
          align-items: stretch;
        }
        .link-input {
          flex: 1;
          padding: 0.5rem;
          border: 1px solid var(--border-color);
          border-radius: 6px;
          background: var(--background);
          color: var(--text-primary);
          font-size: 0.875rem;
        }
        .btn-sm {
          padding: 0.5rem;
        }
      `}</style>
    </div>
  );
};

export default QuizManager;
