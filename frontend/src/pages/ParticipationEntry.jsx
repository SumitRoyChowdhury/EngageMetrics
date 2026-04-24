import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Save, Users, Calendar, CheckCircle, Info } from 'lucide-react';

const ParticipationEntry = () => {
    const [classrooms, setClassrooms] = useState([]);
    const [selectedClassroom, setSelectedClassroom] = useState(localStorage.getItem('selectedClassroom') || '');
    const [week, setWeek] = useState('1');
    const [students, setStudents] = useState([]);
    const [scores, setScores] = useState({}); // { URN: score }
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    // Fetch classrooms for the dropdown
    useEffect(() => {
        const fetchClassrooms = async () => {
            try {
                const res = await api.get('/classrooms');
                setClassrooms(res.data || []);
                if (!selectedClassroom && res.data.length > 0) {
                    setSelectedClassroom(res.data[0].ID);
                }
            } catch (err) {
                console.error('Failed to fetch classrooms');
            }
        };
        fetchClassrooms();
    }, []);

    // Fetch students and existing scores when classroom or week changes
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch students based on optional classroom filter
                const studentUrl = selectedClassroom 
                    ? `/students?classroomId=${selectedClassroom}` 
                    : '/students';
                
                const partUrl = selectedClassroom
                    ? `/participation?classroomId=${selectedClassroom}&week=${week}`
                    : `/participation?week=${week}`;

                const [sRes, pRes] = await Promise.all([
                    api.get(studentUrl),
                    api.get(partUrl)
                ]);
                
                setStudents(sRes.data || []);
                
                // Initialize scores from existing records or default to empty
                const existingScores = {};
                (sRes.data || []).forEach(s => {
                    const match = (pRes.data || []).find(p => String(p.URN).toLowerCase() === String(s.studentId).toLowerCase());
                    existingScores[s.studentId] = match ? match.Score : '';
                });
                setScores(existingScores);
            } catch (err) {
                console.error('Failed to fetch students or scores');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [selectedClassroom, week]);

    const handleScoreChange = (urn, value) => {
        // Allow 0-100
        if (value !== '' && (isNaN(value) || value < 0 || value > 100)) return;
        setScores(prev => ({ ...prev, [urn]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage({ text: '', type: '' });
        
        const entries = Object.entries(scores)
            .filter(([_, score]) => score !== '')
            .map(([urn, score]) => ({
                URN: urn,
                ClassroomID: selectedClassroom,
                Week: week,
                Score: score
            }));

        if (entries.length === 0) {
            setMessage({ text: 'Please enter at least one score.', type: 'warning' });
            setSaving(false);
            return;
        }

        try {
            await api.post('/participation', { entries });
            setMessage({ text: 'Participation scores saved successfully!', type: 'success' });
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } catch (err) {
            setMessage({ text: 'Failed to save scores. Please try again.', type: 'danger' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="participation-page animate-fade">
            <header className="page-header">
                <div>
                    <h1>Manual Participation Entry</h1>
                    <p className="text-secondary">Assess and record student participation scores for each week</p>
                </div>
                <button 
                    className="btn-primary" 
                    onClick={handleSave} 
                    disabled={saving || loading || students.length === 0}
                >
                    {saving ? 'Saving...' : <><Save size={16} /> Save Scores</>}
                </button>
            </header>

            <div className="filters-row card">
                <div className="filter-item">
                    <label><Users size={14} /> Classroom</label>
                    <select 
                        value={selectedClassroom} 
                        onChange={(e) => setSelectedClassroom(e.target.value)}
                    >
                        <option value="">All Classrooms / Global</option>
                        {classrooms.map(c => (
                            <option key={c.ID} value={c.ID}>{c.Name}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-item">
                    <label><Calendar size={14} /> Week</label>
                    <select value={week} onChange={(e) => setWeek(e.target.value)}>
                        {[1,2,3,4,5,6,7,8,9,10,11,12].map(w => (
                            <option key={w} value={String(w)}>Week {w}</option>
                        ))}
                    </select>
                </div>
            </div>

            {message.text && (
                <div className={`alert alert-${message.type} animate-fade`}>
                    {message.type === 'success' ? <CheckCircle size={16} /> : <Info size={16} />}
                    {message.text}
                </div>
            )}

            <div className="table-card card">
                {loading ? (
                    <div className="loading-state">Loading students...</div>
                ) : students.length > 0 ? (
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Student Name</th>
                                    <th>URN</th>
                                    <th style={{ width: '200px' }}>Participation Score (0-100)</th>
                                    <th>Indicator</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map(s => (
                                    <tr key={s.studentId}>
                                        <td>
                                            <div className="d-flex align-items-center gap-2">
                                                <div className="av-sm">{(s.studentName || '?').charAt(0)}</div>
                                                <span style={{ fontWeight: 600 }}>{s.studentName}</span>
                                            </div>
                                        </td>
                                        <td className="text-secondary">{s.studentId}</td>
                                        <td>
                                            <div className="score-input-wrap">
                                                <input 
                                                    type="number" 
                                                    className="score-input"
                                                    placeholder="0-100"
                                                    value={scores[s.studentId] || ''}
                                                    onChange={(e) => handleScoreChange(s.studentId, e.target.value)}
                                                />
                                                <span className="unit">%</span>
                                            </div>
                                        </td>
                                        <td>
                                            {scores[s.studentId] !== '' && (
                                                <div className={`score-bar ${parseFloat(scores[s.studentId]) >= 75 ? 'high' : parseFloat(scores[s.studentId]) >= 40 ? 'med' : 'low'}`}>
                                                    <div className="fill" style={{ width: `${scores[s.studentId]}%` }}></div>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="empty-state">
                        <Users size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                        <p>No students found for this classroom.</p>
                    </div>
                )}
            </div>

            <style>{`
                .participation-page { display: flex; flex-direction: column; gap: 1.5rem; }
                .filters-row { display: flex; gap: 1.5rem; padding: 1.25rem; align-items: flex-end; }
                .filter-item { display: flex; flex-direction: column; gap: 0.5rem; flex: 1; max-width: 300px; }
                .filter-item label { font-size: 0.82rem; font-weight: 600; color: var(--text-secondary); display: flex; align-items: center; gap: 0.4rem; }
                
                .score-input-wrap { display: flex; align-items: center; gap: 0.5rem; }
                .score-input { width: 80px; padding: 0.5rem; border: 1px solid var(--border); border-radius: 6px; font-weight: 600; text-align: center; }
                .unit { color: var(--text-secondary); font-size: 0.9rem; font-weight: 600; }

                .score-bar { width: 100px; height: 6px; background: var(--background); border-radius: 3px; overflow: hidden; }
                .score-bar .fill { height: 100%; transition: width 0.3s ease; }
                .score-bar.high .fill { background: var(--success); }
                .score-bar.med .fill { background: var(--warning); }
                .score-bar.low .fill { background: var(--danger); }

                .alert { display: flex; align-items: center; gap: 0.75rem; padding: 1rem; border-radius: var(--radius); font-size: 0.9rem; font-weight: 500; }
                .alert-success { background: #DCFCE7; color: #166534; border: 1px solid #BBF7D0; }
                .alert-warning { background: #FEF3C7; color: #92400E; border: 1px solid #FDE68A; }
                .alert-danger { background: #FEE2E2; color: #991B1B; border: 1px solid #FECACA; }

                .loading-state, .empty-state { padding: 4rem 2rem; text-align: center; color: var(--text-secondary); }
            `}</style>
        </div>
    );
};

export default ParticipationEntry;
