import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  RefreshCcw, 
  RefreshCw,
  Clipboard,
  Search,
  X,
  ExternalLink,
  Layers
} from 'lucide-react';
import api from '../utils/api';

const SheetsSync = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date().toLocaleTimeString());
  const [selectedWeek, setSelectedWeek] = useState('1');

  useEffect(() => {
    fetchData();
  }, [selectedWeek]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/students?week=${selectedWeek}`);
      setData(res.data);
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    const csvContent = [
      ['Student Name', 'Week', 'Avg Quiz', 'Sentiment', 'Participation', 'Weekly Score', 'Category'],
      ...data.map(r => [r.studentName, r.week, r.avgQuiz, r.avgSentiment, r.participation, r.weeklyScore, r.category])
    ].map(e => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `engagematric_week${selectedWeek}_data.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCategoryClass = (category) => {
    const c = (category || '').toLowerCase().replace(/\s+/g, '-');
    return c;
  };

  return (
    <div className="sheets-sync animate-fade">
      <header className="page-header">
        <div className="header-top">
           <h1>Cloud Data Synchronizer</h1>
           <div className="last-sync">Last updated: {lastRefreshed}</div>
        </div>
        <p>Preview and export your master engagement ledger to Google Sheets</p>
      </header>

      <div className="sync-actions card">
        <div className="search-placeholder">
          <Layers size={16} />
          <div className="week-selector-wrapper">
            <label>View Week:</label>
            <select 
              value={selectedWeek} 
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="week-select"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(w => (
                <option key={w} value={w}>Week {w}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="sync-btn-group">
          <button className="btn-outline btn-sm" onClick={fetchData} disabled={loading}>
            <RefreshCcw size={15} className={loading ? 'spin-icon' : ''} /> 
            Refresh
          </button>
          <button className="btn-outline btn-sm" onClick={downloadCSV}>
            <Download size={15} /> 
            CSV
          </button>
          <button className="btn-primary btn-sm" onClick={() => setShowModal(true)}>
            <RefreshCw size={15} /> 
            Sync to Sheets
          </button>
        </div>
      </div>

      <div className="ledger-wrapper card">
        <div className="ledger-header">
          <FileSpreadsheet size={18} />
          <h3>Master Ledger Preview</h3>
          <span className="record-count">{data.length} records</span>
        </div>
        
        {data.length === 0 ? (
          <div className="empty-state">No data available. Sync student responses first.</div>
        ) : (
          <div className="table-responsive">
            <table className="ledger-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Week</th>
                  <th>Avg Quiz</th>
                  <th>Sentiment</th>
                  <th>Part.</th>
                  <th>Score</th>
                  <th>Category</th>
                  <th>Flag</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => (
                  <tr key={idx} className={`${getCategoryClass(row.category)}-row`}>
                    <td className="font-medium">{row.studentName}</td>
                    <td>W{row.week}</td>
                    <td>{typeof row.avgQuiz === 'number' ? row.avgQuiz.toFixed(1) : (row.avgQuiz || '—')}</td>
                    <td>{typeof row.avgSentiment === 'number' ? row.avgSentiment.toFixed(1) : (row.avgSentiment || '—')}</td>
                    <td>{row.participation}%</td>
                    <td className="font-bold">{typeof row.weeklyScore === 'number' ? row.weeklyScore.toFixed(1) : (row.weeklyScore || '—')}</td>
                    <td>
                      <span className={`pill pill-${getCategoryClass(row.category)}`}>
                        {row.category}
                      </span>
                    </td>
                    <td className="center">
                      {row.atRiskFlag ? <div className="risk-dot">!</div> : <span style={{ color: 'var(--text-secondary)' }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sync Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content animate-fade" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Apps Script Configuration</h2>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                Paste this code into the target Google Sheet's Apps Script editor (<strong>Extensions → Apps Script</strong>).
              </p>
              
              <div className="script-editor">
                <pre>{`function syncEngageMatricData() {
  const url = 'http://localhost:5001/api/sync-endpoint';
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  
  const options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify({ sheetData: data })
  };
  
  UrlFetchApp.fetch(url, options);
}`}</pre>
              </div>

              <div className="setup-steps">
                <h4>Setup Instructions:</h4>
                <ol>
                  <li>Click <strong>Copy Script</strong> above to copy the payload.</li>
                  <li>Go to your Google Sheet.</li>
                  <li>In the menu bar, click <strong>Extensions → Apps Script</strong>.</li>
                  <li>Paste the script and click Save.</li>
                  <li>Set up a trigger (clock icon) to run <code>syncEngageMatricData</code> on form submit.</li>
                </ol>
              </div>

              <div className="sync-info-card">
                <Clipboard size={20} color="var(--primary)" />
                <div>
                  <h4>Data Sync Configured</h4>
                  <p>Your Google form responses will automatically populate the MasterRecords sheet.</p>
                </div>
              </div>

              <button className="btn-outline btn-sm mt-3" onClick={() => window.open('https://docs.google.com/spreadsheets', '_blank')}>
                <ExternalLink size={15} /> Open Google Sheets
              </button>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={() => setShowModal(false)}>Done</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .header-top { display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 0.5rem; }
        .last-sync { 
          font-size: 0.78rem; 
          color: var(--text-secondary); 
          margin-bottom: 0.5rem;
          background: var(--primary-light);
          padding: 0.3rem 0.75rem;
          border-radius: 20px;
          color: var(--primary);
          font-weight: 600;
        }

        .sync-actions { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          margin-top: 1.5rem;
          padding: 0.85rem 1.25rem;
          gap: 1rem;
        }

        .search-placeholder { 
          display: flex; 
          align-items: center; 
          gap: 1rem; 
          color: var(--text-secondary); 
          font-size: 0.85rem; 
          font-weight: 500;
        }
        .week-selector-wrapper {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .week-select {
          padding: 0.35rem 0.75rem;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: var(--background);
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--primary);
          cursor: pointer;
          outline: none;
        }
        .week-select:focus {
          border-color: var(--primary);
        }
        .sync-btn-group { display: flex; gap: 0.5rem; }

        .ledger-wrapper { margin-top: 1.25rem; }

        .ledger-header { 
          display: flex; 
          align-items: center; 
          gap: 0.6rem; 
          margin-bottom: 1.25rem; 
          padding-bottom: 0.85rem;
          border-bottom: 1px solid var(--border); 
        }

        .ledger-header h3 { font-size: 0.95rem; flex: 1; }

        .record-count {
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--primary);
          background: var(--primary-light);
          padding: 0.2rem 0.6rem;
          border-radius: 20px;
        }

        .ledger-table { width: 100%; border-collapse: collapse; }
        .ledger-table th { 
          background: var(--background); 
          padding: 0.7rem 0.75rem; 
          font-size: 0.7rem; 
          text-transform: uppercase; 
          letter-spacing: 0.04em;
          color: var(--text-secondary); 
          border-bottom: 2px solid var(--border);
          text-align: center;
          font-weight: 700;
        }
        .ledger-table th:first-child { text-align: left; }
        .ledger-table td { 
          padding: 0.7rem 0.75rem; 
          border-bottom: 1px solid var(--border); 
          font-size: 0.82rem; 
          text-align: center; 
        }
        
        .font-medium { font-weight: 500; text-align: left !important; }
        .font-bold { font-weight: 700; }

        .high-row { background-color: rgba(22, 163, 74, 0.03); }
        .at-risk-row { background-color: rgba(220, 38, 38, 0.03); }
        
        .pill { 
          padding: 0.18rem 0.5rem; 
          border-radius: 4px; 
          font-size: 0.68rem; 
          font-weight: 700; 
          display: inline-block;
        }
        .pill-high { background: #dcfce7; color: #166534; }
        .pill-medium { background: #dbeafe; color: #1e40af; }
        .pill-low { background: #fef3c7; color: #92400e; }
        .pill-at-risk { background: #fee2e2; color: #991b1b; }

        .risk-dot { 
          width: 22px; height: 22px; 
          background: var(--danger); color: white; 
          border-radius: 50%; 
          display: flex; align-items: center; justify-content: center; 
          margin: 0 auto; font-size: 0.75rem; font-weight: 700; 
        }

        .spin-icon { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .script-editor { 
          background: #1e293b; 
          color: #f8fafc; 
          padding: 1.25rem; 
          border-radius: var(--radius); 
          max-height: 280px; 
          overflow-y: auto;
          margin-bottom: 1.25rem;
        }
        .script-editor pre { 
          font-size: 0.82rem; 
          font-family: 'SF Mono', 'Consolas', monospace; 
          white-space: pre-wrap; 
          margin: 0; 
          line-height: 1.6;
        }

        .setup-steps { 
          background: var(--background); 
          padding: 1.25rem; 
          border-radius: var(--radius); 
          margin-bottom: 1.25rem;
          border: 1px solid var(--border);
        }
        .setup-steps h4 { margin: 0 0 0.65rem 0; font-size: 0.92rem; font-weight: 700; }
        .setup-steps ol { padding-left: 1.25rem; margin: 0; }
        .setup-steps li { font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.4rem; line-height: 1.5; }
        .setup-steps code {
          background: var(--primary-light);
          color: var(--primary);
          padding: 0.1rem 0.4rem;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .sync-info-card {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
          padding: 1rem;
          background: var(--primary-light);
          border-radius: var(--radius);
          border: 1px solid rgba(37, 99, 235, 0.15);
        }
        .sync-info-card h4 { font-size: 0.9rem; margin-bottom: 0.25rem; color: var(--primary); }
        .sync-info-card p { font-size: 0.82rem; color: var(--text-secondary); margin: 0; }

        .mt-3 { margin-top: 1rem; }
        .center { text-align: center; }

        @media (max-width: 768px) {
          .sync-actions { flex-direction: column; align-items: stretch; }
          .sync-btn-group { justify-content: flex-end; }
        }
      `}</style>
    </div>
  );
};

export default SheetsSync;
