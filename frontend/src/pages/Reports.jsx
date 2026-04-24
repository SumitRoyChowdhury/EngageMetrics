import React, { useState, useEffect, useMemo } from 'react';
import {
  FileBarChart, Sparkles, Crown, AlertCircle, Share2, Download,
  Lightbulb, X, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp,
  BarChart3, PieChart, Users, Brain
} from 'lucide-react';
import api from '../utils/api';

/* ── helper: generate suggestions from real data ── */
function generateSuggestions(stats) {
  const suggestions = [];
  const avg = parseFloat(stats.classAvg) || 0;
  const risk = stats.atRiskCount || 0;
  const total = stats.totalStudents || 0;
  const cat = stats.categoryDist || {};
  const negPct = parseFloat(stats.sentimentDist?.Negative) || 0;
  const trend = stats.weeklyTrendData || [];
  const lastTwo = trend.slice(-2);
  const trending = lastTwo.length === 2 ? lastTwo[1] - lastTwo[0] : 0;

  if (avg < 50) {
    suggestions.push({
      title: 'Low Class Average Alert',
      desc: `Class average is ${avg}%. Consider introducing short recap sessions at the start of each class and peer-tutoring pairs to boost understanding.`,
      impact: 'Critical', color: '#DC2626',
      steps: [
        'Identify the 3 weakest topics from recent quiz data',
        'Create 10-minute recap slides for each topic',
        'Pair low-performing students with high-performers for peer tutoring',
        'Run a short re-assessment after 1 week to measure improvement'
      ]
    });
  } else if (avg < 70) {
    suggestions.push({
      title: 'Targeted Micro-Assessments',
      desc: `Class average sits at ${avg}%. Introduce 5-minute "Quick Checks" at the start of each session to identify and address knowledge gaps early.`,
      impact: 'High Impact', color: '#D97706',
      steps: [
        'Prepare 3 quick-check questions per session covering last class material',
        'Use a show-of-hands or quick poll to gauge understanding',
        'Note which topics get less than 60% correct responses',
        'Dedicate extra 5 minutes to those topics before moving on'
      ]
    });
  } else {
    suggestions.push({
      title: 'Maintain Momentum',
      desc: `Excellent class average of ${avg}%. Keep the momentum by introducing challenge problems for top performers while maintaining support for others.`,
      impact: 'Sustain', color: '#16A34A',
      steps: [
        'Introduce optional "stretch" problems for top-scoring students',
        'Create a student leadership role — let top performers co-teach a segment',
        'Document current teaching methods that are working well',
        'Set a higher benchmark goal for next week to keep students challenged'
      ]
    });
  }

  if (risk > 0 && total > 0) {
    const riskPct = Math.round((risk / total) * 100);
    suggestions.push({
      title: 'At-Risk Intervention Needed',
      desc: `${risk} student${risk > 1 ? 's' : ''} (${riskPct}%) are flagged at-risk. Schedule one-on-one check-ins and consider assigning study-buddies from the High engagement group.`,
      impact: 'Urgent', color: '#DC2626',
      steps: [
        'Open the Students page and filter by "At-Risk" category',
        'Schedule a 10-minute private check-in with each at-risk student this week',
        'Assign each a study-buddy from the "High" engagement group',
        'Set up a weekly participation goal and track it for the next 3 weeks'
      ]
    });
  }

  if (negPct > 30) {
    suggestions.push({
      title: 'Address Negative Sentiment',
      desc: `${negPct}% of student feedback is negative. Review recent feedback comments for common themes and consider adjusting teaching pace or incorporating more interactive elements.`,
      impact: 'Sentiment Fix', color: '#DC2626',
      steps: [
        'Read all negative feedback comments from the Students profiles',
        'Group complaints into categories (pace, difficulty, engagement, clarity)',
        'Address the top complaint category in next class with a format change',
        'Run an anonymous quick poll after class to measure sentiment shift'
      ]
    });
  } else if (negPct > 10) {
    suggestions.push({
      title: 'Feedback Personalization',
      desc: `${negPct}% negative sentiment detected. Use personalized written feedback for struggling students — research shows this correlates with improved quiz scores.`,
      impact: 'Retention', color: '#D97706',
      steps: [
        'Identify students who left negative feedback from their profiles',
        'Write a 2-3 sentence personalized response acknowledging their concern',
        'Include one specific action you will take based on their feedback',
        'Follow up next week to check if they noticed the improvement'
      ]
    });
  }

  if ((cat.Low || 0) > (cat.Medium || 0)) {
    suggestions.push({
      title: 'Gamification for Low Group',
      desc: `${cat.Low} students in "Low" engagement exceed the "Medium" group. Introducing a "Participation Streak" badge system could motivate them to ascend.`,
      impact: 'Engagement', color: '#2563EB',
      steps: [
        'Announce a "3-Week Streak" challenge — consistent participation earns recognition',
        'Create a visible leaderboard or shout-out in class for improving students',
        'Offer small incentives (bonus points, class privileges) for moving up a tier',
        'Review the Low group list weekly and celebrate anyone who moves to Medium'
      ]
    });
  }

  if (trending < -5) {
    suggestions.push({
      title: 'Declining Trend Detected',
      desc: `Scores dropped by ${Math.abs(trending.toFixed(1))} points from last week. Consider revisiting recent topics and offering optional review sessions.`,
      impact: 'Trend Alert', color: '#DC2626',
      steps: [
        'Compare this week\'s quiz topics with last week to find difficulty spikes',
        'Offer a 15-minute optional review session before the next quiz',
        'Simplify the next quiz slightly to rebuild student confidence',
        'Monitor if the trend reverses — if not, schedule a curriculum review'
      ]
    });
  } else if (trending > 5) {
    suggestions.push({
      title: 'Positive Trend — Keep Going!',
      desc: `Scores improved by ${trending.toFixed(1)} points this week. The current teaching strategies are working — document what changed for future reference.`,
      impact: 'Positive', color: '#16A34A',
      steps: [
        'Note which teaching methods you used this week (group work, visuals, etc.)',
        'Save the quiz format that yielded better results as a template',
        'Share your approach with colleagues for cross-classroom impact',
        'Gradually increase difficulty next week to keep the upward trajectory'
      ]
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      title: 'Steady Performance',
      desc: 'All metrics look stable. Focus on maintaining consistency and exploring new ways to challenge high performers.',
      impact: 'Info', color: '#2563EB',
      steps: [
        'Review your current approach — consistency is a strength',
        'Introduce one new interactive activity this week as an experiment',
        'Ask students for topic suggestions to increase ownership',
        'Set a small improvement goal (e.g., +3% class average) for next week'
      ]
    });
  }

  return suggestions.slice(0, 4);
}

/* ── helper: CSV generation ── */
function buildCSV(stats) {
  const cat = stats.categoryDist || {};
  const sent = stats.sentimentDist || {};
  const lines = [
    ['Metric', 'Value'],
    ['Class Average', `${stats.classAvg}%`],
    ['Total Students', stats.totalStudents],
    ['Top Performer', stats.topPerformer || 'N/A'],
    ['At-Risk Count', stats.atRiskCount],
    ['High Engagement', cat.High || 0],
    ['Medium Engagement', cat.Medium || 0],
    ['Low Engagement', cat.Low || 0],
    ['At-Risk Engagement', cat['At-Risk'] || 0],
    ['Positive Sentiment %', `${sent.Positive || 0}%`],
    ['Neutral Sentiment %', `${sent.Neutral || 0}%`],
    ['Negative Sentiment %', `${sent.Negative || 0}%`],
  ];
  if (stats.weeklyTrendLabels) {
    stats.weeklyTrendLabels.forEach((l, i) => {
      lines.push([`${l} Avg`, stats.weeklyTrendData[i]]);
    });
  }
  return lines.map(r => r.join(',')).join('\n');
}

function downloadCSV(stats) {
  const csv = buildCSV(stats);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `engagematric_report_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── Mini SVG bar chart ── */
function TrendChart({ data, labels }) {
  if (!data || data.length === 0) return <div className="empty-chart">No trend data yet</div>;
  const max = Math.max(...data, 1);
  return (
    <div className="trend-chart">
      {data.map((v, i) => (
        <div key={i} className="trend-bar-wrap">
          <div className="trend-val">{v}</div>
          <div className="trend-bar" style={{ height: `${(v / max) * 100}%` }} />
          <div className="trend-lbl">{labels?.[i] || `W${i + 1}`}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Donut chart for sentiment ── */
function SentimentDonut({ dist }) {
  const pos = parseFloat(dist?.Positive) || 0;
  const neu = parseFloat(dist?.Neutral) || 0;
  const neg = parseFloat(dist?.Negative) || 0;
  const total = pos + neu + neg || 1;
  const r = 40, cx = 50, cy = 50, circ = 2 * Math.PI * r;
  const s1 = (pos / total) * circ;
  const s2 = (neu / total) * circ;
  const s3 = (neg / total) * circ;
  let offset = circ * 0.25;
  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 100 100" className="donut-svg">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#16A34A" strokeWidth="12"
          strokeDasharray={`${s1} ${circ - s1}`} strokeDashoffset={offset} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#2563EB" strokeWidth="12"
          strokeDasharray={`${s2} ${circ - s2}`} strokeDashoffset={offset - s1} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#DC2626" strokeWidth="12"
          strokeDasharray={`${s3} ${circ - s3}`} strokeDashoffset={offset - s1 - s2} />
      </svg>
      <div className="donut-legend">
        <span><span className="dot" style={{ background: '#16A34A' }} /> Positive {dist?.Positive || 0}%</span>
        <span><span className="dot" style={{ background: '#2563EB' }} /> Neutral {dist?.Neutral || 0}%</span>
        <span><span className="dot" style={{ background: '#DC2626' }} /> Negative {dist?.Negative || 0}%</span>
      </div>
    </div>
  );
}

/* ══════════════════ MAIN COMPONENT ══════════════════ */
const Reports = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCanvaModal, setShowCanvaModal] = useState(false);
  const [expandedTip, setExpandedTip] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get('/stats');
        if (!cancelled) setStats(res.data);
      } catch (err) {
        console.error('Stats fetch error:', err);
        if (!cancelled) setError(err.message || 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchStats();
    return () => { cancelled = true; };
  }, []);

  const aiSuggestions = useMemo(() => {
    if (!stats) return [];
    return generateSuggestions(stats);
  }, [stats]);

  /* ── LOADING ── */
  if (loading) return <div className="loading">Generating Reports…</div>;

  /* ── ERROR ── */
  if (error) return (
    <div className="error-state card">
      <AlertCircle size={28} style={{ marginBottom: 8, color: '#DC2626' }} />
      <p>Unable to load report data.</p>
      <p style={{ fontSize: '.8rem', color: 'var(--text-secondary)' }}>{error}</p>
      <button className="btn-primary mt-2" onClick={() => window.location.reload()}>Retry</button>
    </div>
  );

  if (!stats) return <div className="error-state card">No data available.</div>;

  const totalStudents = stats.totalStudents || 0;
  const cat = stats.categoryDist || { High: 0, Medium: 0, Low: 0, 'At-Risk': 0 };
  const catTotal = cat.High + cat.Medium + cat.Low + cat['At-Risk'] || 1;
  const avg = parseFloat(stats.classAvg) || 0;
  const trendIcon = stats.weeklyTrendData?.length >= 2
    ? (stats.weeklyTrendData.at(-1) > stats.weeklyTrendData.at(-2) ? <TrendingUp size={16} color="#16A34A" /> : stats.weeklyTrendData.at(-1) < stats.weeklyTrendData.at(-2) ? <TrendingDown size={16} color="#DC2626" /> : <Minus size={14} />)
    : null;

  return (
    <div className="reports-page animate-fade">
      <header className="page-header">
        <h1>Executive Summary</h1>
        <p>Weekly performance analysis and AI-driven pedagogical recommendations</p>
      </header>

      <div className="reports-grid">
        {/* ───── KPI cards ───── */}
        <section className="kpi-row">
          <div className="kpi card">
            <BarChart3 size={18} className="kpi-icon blue" />
            <span className="kpi-label">Class Average</span>
            <span className="kpi-value">{stats.classAvg}%</span>
            {trendIcon && <span className="kpi-trend">{trendIcon}</span>}
          </div>
          <div className="kpi card">
            <Users size={18} className="kpi-icon green" />
            <span className="kpi-label">Total Students</span>
            <span className="kpi-value">{totalStudents}</span>
          </div>
          <div className="kpi card">
            <Crown size={18} className="kpi-icon gold" />
            <span className="kpi-label">Top Performer</span>
            <span className="kpi-value small">{stats.topPerformer || 'N/A'}</span>
          </div>
          <div className="kpi card">
            <AlertCircle size={18} className="kpi-icon red" />
            <span className="kpi-label">At-Risk</span>
            <span className="kpi-value">{stats.atRiskCount}</span>
          </div>
        </section>

        {/* ───── Distribution + Sentiment row ───── */}
        <section className="viz-row">
          <div className="card viz-card">
            <div className="section-title"><FileBarChart size={18} /><h2>Engagement Distribution</h2></div>
            <div className="progress-stack">
              <div className="stack-segment high" style={{ width: `${(cat.High / catTotal) * 100}%` }} />
              <div className="stack-segment medium" style={{ width: `${(cat.Medium / catTotal) * 100}%` }} />
              <div className="stack-segment low" style={{ width: `${(cat.Low / catTotal) * 100}%` }} />
              <div className="stack-segment risk" style={{ width: `${(cat['At-Risk'] / catTotal) * 100}%` }} />
            </div>
            <div className="stack-legend">
              <div className="l-item"><span className="dot high" /> High ({cat.High})</div>
              <div className="l-item"><span className="dot medium" /> Med ({cat.Medium})</div>
              <div className="l-item"><span className="dot low" /> Low ({cat.Low})</div>
              <div className="l-item"><span className="dot risk" /> Risk ({cat['At-Risk']})</div>
            </div>
          </div>
          <div className="card viz-card">
            <div className="section-title"><PieChart size={18} /><h2>Sentiment Breakdown</h2></div>
            <SentimentDonut dist={stats.sentimentDist} />
          </div>
        </section>

        {/* ───── Trend chart ───── */}
        <section className="card trend-section">
          <div className="section-title"><TrendingUp size={18} /><h2>Weekly Trend</h2></div>
          <TrendChart data={stats.weeklyTrendData} labels={stats.weeklyTrendLabels} />
        </section>

        {/* ───── AI Suggestions ───── */}
        <section className="suggestions-section">
          <div className="section-title"><Brain size={20} color="#2563EB" /><h2>AI Educator Insights</h2></div>
          <div className="suggestions-list">
            {aiSuggestions.map((s, idx) => (
              <div key={idx} className="suggestion-card card">
                <div className="sug-header">
                  <div className="sug-icon"><Lightbulb size={16} /></div>
                  <span className="sug-impact" style={{ color: s.color, background: `${s.color}15` }}>{s.impact}</span>
                </div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
                <div className="sug-footer">
                  <button className="btn-link" onClick={() => setExpandedTip(expandedTip === idx ? null : idx)}>
                    {expandedTip === idx ? 'Hide Details' : 'View Strategy →'}
                  </button>
                </div>
                {expandedTip === idx && (
                  <div className="strategy-detail animate-fade">
                    <p>💡 <strong>Implementation steps:</strong></p>
                    <ol>
                      {(s.steps || []).map((step, si) => (
                        <li key={si}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ───── Export CTA ───── */}
        <section className="export-section">
          <div className="export-content">
            <div className="export-text">
              <h2>Presentation Ready?</h2>
              <p>Export your classroom data directly to Canva for beautiful, parent-ready reports or faculty presentations.</p>
            </div>
          </div>
          <div className="export-actions">
            <button className="export-btn" onClick={() => downloadCSV(stats)}>
              <Download size={16} /> Download CSV
            </button>
            <button className="export-btn canva" onClick={() => setShowCanvaModal(true)}>
              <Share2 size={16} /> Canva Guide
            </button>
          </div>
        </section>
      </div>

      {/* ───── Canva Modal ───── */}
      {showCanvaModal && (
        <div className="modal-overlay" onClick={() => setShowCanvaModal(false)}>
          <div className="modal-content animate-fade" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Canva Report Guide</h2>
              <button onClick={() => setShowCanvaModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="canva-steps">
                <div className="c-step">
                  <div className="c-step-num">1</div>
                  <div>
                    <h3>Download CSV</h3>
                    <p>Download the structured CSV summary using the button below.</p>
                    <button className="btn-outline btn-sm mt-1" onClick={() => downloadCSV(stats)}>
                      <Download size={15} /> Download CSV Summary
                    </button>
                  </div>
                </div>
                <div className="c-step">
                  <div className="c-step-num">2</div>
                  <div>
                    <h3>Import to Canva</h3>
                    <p>Open Canva, select a Report Template, then <strong>Apps → Bulk Create → Upload CSV</strong>.</p>
                  </div>
                </div>
                <div className="c-step">
                  <div className="c-step-num">3</div>
                  <div>
                    <h3>Bind Data</h3>
                    <p>Right-click elements and select <strong>Connect Data</strong> to map EngageMatric metrics to your design.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={() => setShowCanvaModal(false)}>Got it!</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .reports-page { display:flex; flex-direction:column; gap:1.5rem; }

        /* KPI row */
        .kpi-row { display:grid; grid-template-columns:repeat(4,1fr); gap:1rem; }
        .kpi { display:flex; flex-direction:column; align-items:flex-start; gap:.35rem; position:relative; }
        .kpi-icon { padding:6px; border-radius:8px; }
        .kpi-icon.blue { color:#2563EB; background:rgba(37,99,235,.1); }
        .kpi-icon.green { color:#16A34A; background:rgba(22,163,74,.1); }
        .kpi-icon.gold { color:#D97706; background:rgba(217,119,6,.1); }
        .kpi-icon.red { color:#DC2626; background:rgba(220,38,38,.1); }
        .kpi-label { font-size:.7rem; font-weight:600; color:var(--text-secondary); text-transform:uppercase; letter-spacing:.03em; }
        .kpi-value { font-size:1.5rem; font-weight:700; color:var(--text-primary); }
        .kpi-value.small { font-size:1rem; }
        .kpi-trend { position:absolute; top:1rem; right:1rem; }

        /* Viz row */
        .viz-row { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
        .viz-card { min-height:180px; }
        .section-title { display:flex; align-items:center; gap:.6rem; margin-bottom:1.25rem; }
        .section-title h2 { font-size:1rem; }

        /* Progress stack */
        .progress-stack { height:10px; display:flex; background:var(--background); border-radius:6px; overflow:hidden; margin-bottom:.85rem; }
        .stack-segment { height:100%; transition:width .6s ease; min-width:2px; }
        .stack-segment.high { background:var(--success); }
        .stack-segment.medium { background:var(--primary); }
        .stack-segment.low { background:var(--warning); }
        .stack-segment.risk { background:var(--danger); }
        .stack-legend { display:flex; gap:.75rem; flex-wrap:wrap; }
        .l-item { display:flex; align-items:center; gap:.35rem; font-size:.72rem; color:var(--text-secondary); font-weight:600; }
        .dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
        .dot.high { background:var(--success); }
        .dot.medium { background:var(--primary); }
        .dot.low { background:var(--warning); }
        .dot.risk { background:var(--danger); }

        /* Donut */
        .donut-wrap { display:flex; align-items:center; gap:1.5rem; }
        .donut-svg { width:100px; height:100px; flex-shrink:0; }
        .donut-legend { display:flex; flex-direction:column; gap:.5rem; font-size:.78rem; font-weight:600; color:var(--text-secondary); }
        .donut-legend .dot { display:inline-block; width:8px; height:8px; border-radius:50%; margin-right:6px; }

        /* Trend */
        .trend-section { }
        .trend-chart { display:flex; align-items:flex-end; gap:1rem; height:140px; padding-top:1rem; }
        .trend-bar-wrap { flex:1; display:flex; flex-direction:column; align-items:center; gap:.3rem; height:100%; justify-content:flex-end; }
        .trend-bar { width:100%; max-width:48px; background:linear-gradient(180deg,#2563EB,#1e3a8a); border-radius:6px 6px 0 0; min-height:4px; transition:height .5s ease; }
        .trend-val { font-size:.72rem; font-weight:700; color:var(--text-primary); }
        .trend-lbl { font-size:.68rem; color:var(--text-secondary); font-weight:600; }
        .empty-chart { text-align:center; color:var(--text-secondary); padding:2rem; font-size:.9rem; }

        /* Suggestions */
        .suggestions-section { margin-top:.5rem; }
        .suggestions-list { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
        .suggestion-card { padding:1.25rem; transition:transform .2s,box-shadow .2s; }
        .suggestion-card:hover { transform:translateY(-3px); box-shadow:var(--shadow-lg); }
        .sug-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:.75rem; }
        .sug-icon { width:32px; height:32px; background:var(--primary-light); color:var(--primary); border-radius:50%; display:flex; align-items:center; justify-content:center; }
        .sug-impact { font-size:.62rem; font-weight:700; text-transform:uppercase; letter-spacing:.04em; padding:.2rem .6rem; border-radius:20px; }
        .suggestion-card h3 { font-size:.95rem; margin-bottom:.4rem; }
        .suggestion-card p { font-size:.83rem; color:var(--text-secondary); line-height:1.55; }
        .sug-footer { margin-top:.75rem; }
        .btn-link { background:none; color:var(--primary); font-weight:600; font-size:.82rem; padding:0; border:none; cursor:pointer; }
        .btn-link:hover { text-decoration:underline; }
        .strategy-detail { margin-top:.75rem; padding:.75rem 1rem; background:var(--primary-light); border-radius:8px; font-size:.82rem; line-height:1.6; }
        .strategy-detail ol { margin:.5rem 0 0 1.2rem; }
        .strategy-detail li { margin-bottom:.25rem; }

        /* Export */
        .export-section {
          display:flex; align-items:center; justify-content:space-between;
          padding:2rem 2.5rem;
          background:linear-gradient(135deg,#2563EB 0%,#1e3a8a 100%);
          color:white; border-radius:var(--radius);
          box-shadow:0 4px 20px rgba(37,99,235,.3);
          gap:2rem;
        }
        .export-section h2 { color:white; margin-bottom:.4rem; font-size:1.2rem; }
        .export-section p { color:rgba(255,255,255,.8); max-width:480px; font-size:.88rem; line-height:1.5; }
        .export-actions { display:flex; gap:.75rem; flex-shrink:0; }
        .export-btn {
          display:flex; align-items:center; gap:.5rem;
          background:white; color:#2563EB;
          padding:.7rem 1.25rem; border-radius:var(--radius);
          font-weight:700; font-size:.82rem; border:none; cursor:pointer;
          transition:var(--transition); white-space:nowrap;
          box-shadow:0 2px 10px rgba(0,0,0,.1);
        }
        .export-btn:hover { transform:translateY(-2px); box-shadow:0 4px 15px rgba(0,0,0,.15); }
        .export-btn.canva { background:rgba(255,255,255,.15); color:white; border:1px solid rgba(255,255,255,.3); }
        .export-btn.canva:hover { background:rgba(255,255,255,.25); }

        /* Canva modal */
        .canva-steps { display:flex; flex-direction:column; gap:1.75rem; }
        .c-step { display:flex; gap:1rem; align-items:flex-start; }
        .c-step-num { width:30px; height:30px; background:linear-gradient(135deg,var(--primary),var(--primary-hover)); color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:.8rem; font-weight:700; flex-shrink:0; }
        .c-step h3 { font-size:.95rem; margin-bottom:.35rem; color:var(--primary); }
        .c-step p { font-size:.88rem; color:var(--text-secondary); line-height:1.5; }

        @media (max-width:1024px) {
          .kpi-row { grid-template-columns:repeat(2,1fr); }
          .viz-row { grid-template-columns:1fr; }
          .suggestions-list { grid-template-columns:1fr; }
          .export-section { flex-direction:column; text-align:center; padding:2rem; }
          .export-actions { justify-content:center; }
        }
        @media (max-width:600px) {
          .kpi-row { grid-template-columns:1fr; }
          .donut-wrap { flex-direction:column; }
        }
      `}</style>
    </div>
  );
};

export default Reports;
