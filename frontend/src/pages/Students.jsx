import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Search, Eye } from 'lucide-react';

const Students = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [weekFilter, setWeekFilter] = useState(''); // Default to Latest/All

  const fetchData = async () => {
    setLoading(true);
    const classroomId = localStorage.getItem('selectedClassroom');
    try {
      const url = `/students?classroomId=${classroomId || ''}${weekFilter ? `&week=${weekFilter}` : ''}`;
      const res = await api.get(url);
      setStudents(res.data);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    window.addEventListener('classroomChanged', fetchData);
    return () => window.removeEventListener('classroomChanged', fetchData);
  }, [weekFilter]);

  const filteredStudents = students.filter(student => {
    const matchesSearch = (student.studentName || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === '' || student.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCategoryBadge = (category) => {
    const styles = {
      'High': 'badge-high',
      'Medium': 'badge-medium',
      'Low': 'badge-low',
      'At-Risk': 'badge-at-risk'
    };
    return <span className={`badge ${styles[category] || 'badge-medium'}`}>{category}</span>;
  };

  return (
    <div className="students-page animate-fade">
      <header className="page-header">
        <h1>Student Directory</h1>
        <p>Manage and monitor individual student performance metrics</p>
      </header>

      <div className="filters-bar card">
        <div className="search-box">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search students..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <div className="filter-item">
            <label>Category</label>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">All</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
              <option value="At-Risk">At-Risk</option>
            </select>
          </div>

          <div className="filter-item">
            <label>Week</label>
            <select value={weekFilter} onChange={(e) => setWeekFilter(e.target.value)}>
              <option value="">Latest / All</option>
              <option value="1">Week 1</option>
              <option value="2">Week 2</option>
              <option value="3">Week 3</option>
              <option value="4">Week 4</option>
            </select>
          </div>
        </div>
      </div>

      <div className="table-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Avg Quiz</th>
                <th>Sentiment</th>
                <th>Participation</th>
                <th>Weekly Score</th>
                <th>Category</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" className="text-center" style={{ padding: '3rem' }}>Loading student records...</td></tr>
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map(student => (
                  <tr key={student.studentId || Math.random()}>
                    <td>
                      <div className="student-cell">
                        <div className="avatar-sm">{(student.studentName || '?').charAt(0)}</div>
                        <div className="student-info">
                          <span className="name">{student.studentName || 'Unknown Student'}</span>
                          <span className="id">{student.studentId || 'N/A'}</span>
                        </div>
                      </div>
                    </td>
                    <td>{typeof student.avgQuiz === 'number' ? student.avgQuiz.toFixed(1) : '—'}</td>
                    <td>
                      {student.avgSentiment === null ? '—' : (
                        <span className={`sentiment-text ${student.avgSentiment >= 75 ? 'pos' : student.avgSentiment >= 40 ? 'neu' : 'neg'}`}>
                          {student.avgSentiment >= 75 ? '😊' : student.avgSentiment >= 40 ? '😐' : '😟'} {student.avgSentiment.toFixed(0)}%
                        </span>
                      )}
                    </td>
                    <td>{student.participation}%</td>
                    <td className="font-bold">
                      {typeof student.weeklyScore === 'number' ? `${student.weeklyScore.toFixed(1)}%` : '—'}
                    </td>
                    <td>{getCategoryBadge(student.category || 'Medium')}</td>
                    <td>
                      {student.category === 'No Data' ? (
                        <span className="status-dot empty" title="No submissions"></span>
                      ) : student.atRiskFlag ? (
                        <span className="status-dot risk" title={student.flagReason}></span>
                      ) : (
                        <span className="status-dot stable" title="Stable"></span>
                      )}
                    </td>
                    <td>
                      <button 
                        className="btn-outline btn-sm btn-icon"
                        onClick={() => navigate(`/students/${student.studentId}`)}
                      >
                        <Eye size={15} />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="8" className="text-center" style={{ padding: '3rem' }}>No students found matching your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .students-page {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .filters-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1.5rem;
          padding: 1rem 1.25rem;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: var(--background);
          border: 1.5px solid var(--border);
          padding: 0 1rem;
          border-radius: var(--radius);
          flex: 1;
          max-width: 350px;
          transition: var(--transition);
        }

        .search-box:focus-within {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .search-box input {
          border: none;
          background: none;
          padding: 0.65rem 0;
          width: 100%;
          box-shadow: none !important;
        }

        .search-box input:focus {
          box-shadow: none !important;
        }

        .filter-group {
          display: flex;
          gap: 1rem;
        }

        .filter-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .filter-item label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-secondary);
          white-space: nowrap;
        }

        .filter-item select {
          padding: 0.45rem 1.5rem 0.45rem 0.75rem;
          font-size: 0.85rem;
        }

        .student-cell {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .avatar-sm {
          width: 30px;
          height: 30px;
          background: linear-gradient(135deg, var(--primary), var(--primary-hover));
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
          flex-shrink: 0;
        }

        .student-info {
          display: flex;
          flex-direction: column;
        }

        .student-info .name {
          font-weight: 600;
          font-size: 0.9rem;
        }

        .student-info .id {
          font-size: 0.72rem;
          color: var(--text-secondary);
        }

        .status-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          display: inline-block;
        }
        .status-dot.risk { 
          background-color: var(--danger); 
          box-shadow: 0 0 0 3px var(--danger-light); 
        }
        .status-dot.stable { 
          background-color: var(--success); 
          box-shadow: 0 0 0 3px var(--success-light); 
        }
        .status-dot.empty {
          background-color: var(--border);
          box-shadow: 0 0 0 3px var(--background);
        }

        .sentiment-text { font-size: 0.82rem; font-weight: 600; }
        .sentiment-text.pos { color: var(--success); }
        .sentiment-text.neu { color: var(--text-secondary); }
        .sentiment-text.neg { color: var(--danger); }

        .btn-icon {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
        }

        @media (max-width: 900px) {
          .filters-bar { flex-direction: column; align-items: stretch; gap: 1rem; }
          .search-box { max-width: none; }
          .filter-group { justify-content: space-between; }
        }
      `}</style>
    </div>
  );
};

export default Students;
