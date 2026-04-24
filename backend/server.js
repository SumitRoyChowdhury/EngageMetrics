require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5001;

const googleAuth = require('./utils/googleAuth');
const { google } = require('googleapis');
const sheetsDB = require('./utils/sheetsDB');

// Allow local dev + deployed frontend
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

// ─────────────────────────────────────────────────────────
// BOOT-UP: Bootstrap sheets + pull data into local cache
// ─────────────────────────────────────────────────────────
setTimeout(async () => {
  try {
    await sheetsDB.bootstrap();
    console.log('[Boot] Bootstrap and initial data pull complete.');
  } catch (err) {
    console.error('[Boot] Bootstrap error:', err.message);
  }
}, 3000);

// ─────────────────────────────────────────────────────────
// AUTH ROUTES
// ─────────────────────────────────────────────────────────
app.get('/api/auth/google/url', (req, res) => {
  res.json({ url: googleAuth.getAuthUrl() });
});

app.get('/api/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  try {
    await googleAuth.saveToken(code);
    await sheetsDB.bootstrap(); // Bootstrap + pull data after auth
    res.send('Authentication successful! You can close this tab and return to EngageMatric.');
  } catch (err) {
    res.status(500).send('Error during authentication: ' + err.message);
  }
});

app.get('/api/auth/google/status', (req, res) => {
  const client = googleAuth.getClient();
  res.json({ connected: !!(client.credentials.access_token || client.credentials.refresh_token) });
});

// ─────────────────────────────────────────────────────────
// WORKSPACES — All reads from local cache (zero Sheets API calls)
// ─────────────────────────────────────────────────────────
app.get('/api/workspaces', async (req, res) => {
  const workspaces = await sheetsDB.getRows(sheetsDB.TABS.WORKSPACES);
  res.json(workspaces);
});

app.post('/api/workspaces', async (req, res) => {
  const { date, label } = req.body;
  const workspace = {
    ID: 'WS-' + Date.now(),
    Date: date,
    Label: label || '',
    CreatedAt: new Date().toISOString()
  };
  await sheetsDB.upsertRecord(sheetsDB.TABS.WORKSPACES, workspace);
  // Auto-push to Google Sheets
  sheetsDB.pushToSheets().catch(err => console.error('[Auto-Push] Workspace error:', err.message));
  res.status(201).json(workspace);
});

app.delete('/api/workspaces/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await sheetsDB.deleteRecord(sheetsDB.TABS.WORKSPACES, 'ID', id);
    res.json({ success: true, message: 'Workspace deleted successfully.' });
  } catch (err) {
    console.error('Delete Workspace Error:', err.message);
    res.status(404).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────
// CLASSROOMS — All reads from local cache
// ─────────────────────────────────────────────────────────
app.get('/api/classrooms', async (req, res) => {
  const { workspaceId } = req.query;
  const [classrooms, allRecords] = await Promise.all([
    sheetsDB.getRows(sheetsDB.TABS.CLASSROOMS),
    sheetsDB.getRows(sheetsDB.TABS.MASTER_RECORDS)
  ]);

  const mapped = classrooms.map(c => {
    const classRecords = allRecords.filter(r => r.ClassroomID === c.ID);
    const avg = classRecords.length > 0
      ? (classRecords.reduce((acc, r) => acc + (parseFloat(r.EngagementScore) || 0), 0) / classRecords.length)
      : 0;
    return { ...c, AvgScore: Math.round(avg) };
  });

  if (workspaceId) {
    return res.json(mapped.filter(r => r.WorkspaceID === workspaceId));
  }
  res.json(mapped);
});

app.post('/api/classrooms', async (req, res) => {
  const { workspaceId, subject, batch } = req.body;
  const classroom = {
    ID: 'CLS-' + Date.now(),
    WorkspaceID: workspaceId,
    Name: `${subject} - ${batch}`,
    Subject: subject,
    Batch: batch,
    CreatedAt: new Date().toISOString()
  };
  await sheetsDB.upsertRecord(sheetsDB.TABS.CLASSROOMS, classroom);
  // Auto-push to Google Sheets
  sheetsDB.pushToSheets().catch(err => console.error('[Auto-Push] Classroom error:', err.message));
  res.status(201).json(classroom);
});

app.delete('/api/classrooms/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await sheetsDB.deleteRecord(sheetsDB.TABS.CLASSROOMS, 'ID', id);
    res.json({ success: true, message: 'Classroom deleted successfully.' });
  } catch (err) {
    console.error('Delete Classroom Error:', err.message);
    res.status(404).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────
// QUIZZES — All reads from local cache
// ─────────────────────────────────────────────────────────
app.get('/api/quizzes', async (req, res) => {
  const { classroomId } = req.query;
  const allQuizzes = await sheetsDB.getRows(sheetsDB.TABS.QUIZZES);
  const quizzes = classroomId ? allQuizzes.filter(q => q.ClassroomID === classroomId) : allQuizzes;

  const mappedQuizzes = quizzes.map(q => {
    let status = 'Active';
    if (q.EndTime) {
      if (new Date() > new Date(q.EndTime)) {
        status = 'Expired';
      }
    }
    return {
      id: q.QuizID,
      title: q.Title,
      week: q.Week,
      url: q.FormURL,
      status: status,
      endTime: q.EndTime,
      hasFeedback: q.IncludeFeedback === 'Yes'
    };
  });

  res.json(mappedQuizzes);
});

app.delete('/api/quizzes/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`[DELETE /api/quizzes] Attempting to delete QuizID: "${id}"`);
  try {
    await sheetsDB.deleteRecord(sheetsDB.TABS.QUIZZES, 'QuizID', id);
    res.json({ success: true, message: 'Quiz deleted successfully.' });
  } catch (err) {
    console.error('Delete Quiz Error:', err.message);
    const all = await sheetsDB.getRows(sheetsDB.TABS.QUIZZES);
    res.status(404).json({
      success: false,
      message: err.message,
      debug: { receivedId: id, availableIds: all.map(q => q.QuizID) }
    });
  }
});

// ─────────────────────────────────────────────────────────
// PARTICIPATION — Manual teacher-entered scores
// ─────────────────────────────────────────────────────────
app.get('/api/participation', async (req, res) => {
  const { classroomId, week } = req.query;
  const allEntries = await sheetsDB.getRows(sheetsDB.TABS.PARTICIPATION_RECORDS);
  let filtered = allEntries;
  if (classroomId) filtered = filtered.filter(e => e.ClassroomID === classroomId);
  if (week) filtered = filtered.filter(e => String(e.Week) === String(week));
  res.json(filtered);
});

app.post('/api/participation', async (req, res) => {
  const { entries } = req.body; // Array of { URN, ClassroomID, Week, Score }
  if (!Array.isArray(entries)) return res.status(400).json({ message: 'Invalid payload' });

  const formatted = entries.map(e => ({
    ...e,
    Timestamp: new Date().toISOString()
  }));

  await sheetsDB.upsertRecords(sheetsDB.TABS.PARTICIPATION_RECORDS, formatted, ['URN', 'Week']);
  // Auto-push to Google Sheets
  sheetsDB.pushToSheets().catch(err => console.error('[Auto-Push] Participation error:', err.message));
  res.json({ success: true, message: `Updated ${entries.length} participation records.` });
});

// ─────────────────────────────────────────────────────────
// STATS — Computed from local cache
// ─────────────────────────────────────────────────────────
app.get('/api/stats', async (req, res) => {
  const { classroomId, workspaceId } = req.query;
  const [allRecords, classrooms] = await Promise.all([
    sheetsDB.getRows(sheetsDB.TABS.MASTER_RECORDS),
    sheetsDB.getRows(sheetsDB.TABS.CLASSROOMS)
  ]);

  // Filter by classroom or workspace
  let records = allRecords;
  if (classroomId) {
    records = allRecords.filter(r => r.ClassroomID === classroomId);
  } else if (workspaceId) {
    const wsClassroomIds = classrooms.filter(c => c.WorkspaceID === workspaceId).map(c => c.ID);
    records = allRecords.filter(r => wsClassroomIds.includes(r.ClassroomID));
  }

  if (records.length === 0) {
    return res.json({
      classAvg: 0,
      totalStudents: 0,
      atRiskCount: 0,
      sentimentDist: { Positive: 0, Neutral: 0, Negative: 0 },
      categoryDist: { High: 0, Medium: 0, Low: 0, 'At-Risk': 0 },
      weeklyTrendData: [0, 0, 0, 0]
    });
  }

  const classAvg = records.reduce((acc, r) => acc + (parseFloat(r.EngagementScore) || 0), 0) / records.length;
  const uniqueStudents = [...new Set(records.map(r => String(r.URN || '').trim().toLowerCase()))].filter(u => u).length;
  const atRiskCount = records.filter(r => parseFloat(r.EngagementScore) < 45).length;

  const sentiments = { Positive: 0, Neutral: 0, Negative: 0 };
  const categories = { High: 0, Medium: 0, Low: 0, 'At-Risk': 0 };

  const weekScores = {};
  const weekCounts = {};

  records.forEach(r => {
    sentiments[r.Sentiment]++;
    const score = parseFloat(r.EngagementScore);
    if (score >= 75) categories.High++;
    else if (score >= 50) categories.Medium++;
    else if (score >= 45) categories.Low++;
    else categories['At-Risk']++;

    // Group for weekly trend
    const w = r.Week || '1';
    weekScores[w] = (weekScores[w] || 0) + score;
    weekCounts[w] = (weekCounts[w] || 0) + 1;
  });

  const uniqueWeeks = Object.keys(weekScores).sort((a, b) => parseInt(a) - parseInt(b)).slice(-4);
  const weeklyTrendData = uniqueWeeks.map(w => parseFloat((weekScores[w] / weekCounts[w]).toFixed(1)));
  const weeklyTrendLabels = uniqueWeeks.map(w => `Week ${w}`);

  const topPerformerRecord = [...records].sort((a, b) => (parseFloat(b.EngagementScore) || 0) - (parseFloat(a.EngagementScore) || 0))[0];
  const topPerformer = topPerformerRecord ? topPerformerRecord.StudentName : 'N/A';

  res.json({
    classAvg: classAvg.toFixed(1),
    totalStudents: uniqueStudents,
    atRiskCount,
    topPerformer,
    sentimentDist: {
      Positive: ((sentiments.Positive / records.length) * 100).toFixed(1),
      Neutral: ((sentiments.Neutral / records.length) * 100).toFixed(1),
      Negative: ((sentiments.Negative / records.length) * 100).toFixed(1)
    },
    categoryDist: categories,
    weeklyTrendData,
    weeklyTrendLabels
  });
});

// ─────────────────────────────────────────────────────────
// STUDENTS — Aggregated from local cache
// ─────────────────────────────────────────────────────────
app.get('/api/students', async (req, res) => {
  const { classroomId, week } = req.query;
  const targetWeek = week ? parseInt(week) : null;
  
  const [allStudents, allRecords, allQuizzes, allManualPart] = await Promise.all([
    sheetsDB.getRows(sheetsDB.TABS.STUDENTS),
    sheetsDB.getRows(sheetsDB.TABS.MASTER_RECORDS),
    sheetsDB.getRows(sheetsDB.TABS.QUIZZES),
    sheetsDB.getRows(sheetsDB.TABS.PARTICIPATION_RECORDS)
  ]);

  // 1. Identify which students belong in this context
  let classroomStudents = [];
  if (classroomId) {
    classroomStudents = allStudents.filter(s => 
      (s.ClassroomIDs || '').split(',').includes(classroomId)
    );
    
    // Fallback: If no students in registry for this class, derived from submissions
    if (classroomStudents.length === 0) {
      const urnsInClass = [...new Set(allRecords.filter(r => r.ClassroomID === classroomId).map(r => String(r.URN || '').trim().toLowerCase()))].filter(u => u);
      classroomStudents = urnsInClass.map(urn => {
        const rec = allRecords.find(r => String(r.URN || '').trim().toLowerCase() === urn);
        return { URN: urn, Name: rec?.StudentName || urn, ClassroomIDs: classroomId };
      });
    }
  } else {
    // Show all unique students in the system
    const urnMap = new Map();
    // Start with Registry Students
    allStudents.forEach(s => urnMap.set(String(s.URN || '').trim().toLowerCase(), { URN: s.URN, Name: s.Name || s.URN }));
    // Add any from MasterRecords not in Registry
    allRecords.forEach(r => {
      const urn = String(r.URN || '').trim().toLowerCase();
      if (!urnMap.has(urn)) {
        urnMap.set(urn, { URN: r.URN, Name: r.StudentName || r.URN });
      }
    });
    classroomStudents = Array.from(urnMap.values());
  }

  // 2. Count total quizzes contextually
  const contextQuizzes = classroomId 
    ? allQuizzes.filter(q => q.ClassroomID === classroomId)
    : allQuizzes;
  
  const totalQuizzesAvailable = targetWeek 
    ? contextQuizzes.filter(q => parseInt(q.Week) <= targetWeek).length
    : contextQuizzes.length;

  // 3. Aggregate data for each student
  const aggregated = classroomStudents.map(s => {
    const urn = String(s.URN || '').trim().toLowerCase();
    let studentRecords = allRecords.filter(r => String(r.URN || '').trim().toLowerCase() === urn);
    if (classroomId) {
      studentRecords = studentRecords.filter(r => r.ClassroomID === classroomId);
    }

    // 1. Get automated participation (quiz subs)
    const participationRecords = targetWeek 
      ? studentRecords.filter(r => parseInt(r.Week) <= targetWeek)
      : studentRecords;
    
    // 2. Get manual participation score if exists for targetWeek (Matched on URN + Week)
    const manualPartRecord = targetWeek 
      ? allManualPart.find(p => String(p.URN).trim().toLowerCase() === urn && String(p.Week) === String(targetWeek))
      : null;

    const totalSubs = participationRecords.length;
    const baseQuizzesCount = Math.max(1, totalQuizzesAvailable);
    
    // If manual score exists, it acts as the participation metric for that week
    let participation = Math.min(100, Math.round((totalSubs / baseQuizzesCount) * 100));
    if (manualPartRecord) {
      participation = parseFloat(manualPartRecord.Score) || 0;
    }

    // Specific Week Record
    const specificWeekRecord = targetWeek 
      ? studentRecords.find(r => parseInt(r.Week) === targetWeek)
      : studentRecords[studentRecords.length - 1];

    if (!specificWeekRecord) {
      return {
        studentId: urn,
        studentName: s.Name || urn,
        week: targetWeek || 'Latest',
        avgQuiz: 'N/A',
        avgSentiment: null,
        sentiment: 'No Submission',
        latestFeedback: 'No activity recorded yet.',
        participation,
        weeklyScore: manualPartRecord ? parseFloat(manualPartRecord.Score) : 'N/A',
        category: manualPartRecord ? (parseFloat(manualPartRecord.Score) >= 50 ? 'Medium' : 'Low') : 'No Data',
        atRiskFlag: false,
        flagReason: 'No submissions found.'
      };
    }

    const avgQuiz = parseFloat(specificWeekRecord?.QuizScore) || 0;
    let avgEngagement = parseFloat(specificWeekRecord?.EngagementScore) || 0;
    
    // If manual participation exists for this week, we could factor it into the engagement score
    if (manualPartRecord) {
        // Boost engagement if they have manual participation score? Or replace it?
        // Let's take the higher of the automated engagement or the manual participation
        avgEngagement = Math.max(avgEngagement, parseFloat(manualPartRecord.Score));
    }

    const sentimentLabel = specificWeekRecord?.Sentiment || 'Neutral';
    const sentimentScore = sentimentLabel === 'Positive' ? 100 : (sentimentLabel === 'Negative' ? 0 : 50);

    let category = 'At-Risk';
    if (avgEngagement >= 75) category = 'High';
    else if (avgEngagement >= 55) category = 'Medium';
    else if (avgEngagement >= 40) category = 'Low';

    return {
      studentId: urn,
      studentName: s.Name || urn,
      week: parseInt(specificWeekRecord?.Week) || targetWeek || 1,
      avgQuiz,
      avgSentiment: sentimentScore,
      sentiment: sentimentLabel,
      latestFeedback: (specificWeekRecord?.Feedback || '').trim(),
      participation,
      weeklyScore: avgEngagement,
      category,
      atRiskFlag: avgEngagement < 40,
      flagReason: avgEngagement < 40 ? `Engagement score ${avgEngagement}% is below threshold` : ''
    };
  });

  res.json(aggregated);
});

app.get('/api/students/:id', async (req, res) => {
  const { id } = req.params; // URN
  const targetId = String(id || '').trim().toLowerCase();
  const [records, quizzes] = await Promise.all([
    sheetsDB.getRows(sheetsDB.TABS.MASTER_RECORDS),
    sheetsDB.getRows(sheetsDB.TABS.QUIZZES)
  ]);

  const studentRecords = records.filter(r => String(r.URN || '').trim().toLowerCase() === targetId).sort((a, b) => parseInt(a.Week) - parseInt(b.Week));

  if (studentRecords.length === 0) {
    return res.status(404).json({ message: 'Student not found' });
  }

  const classroomId = studentRecords[0].ClassroomID;
  const totalQuizzesForClass = quizzes.filter(q => q.ClassroomID === classroomId).length || 1;

  const history = studentRecords.map(r => ({
    week: parseInt(r.Week),
    avgQuiz: parseFloat(r.QuizScore) || 0,
    avgSentiment: r.Sentiment === 'Positive' ? 100 : (r.Sentiment === 'Neutral' ? 50 : 0),
    sentiment: r.Sentiment || 'Neutral',
    participation: Math.min(100, Math.round((studentRecords.length / totalQuizzesForClass) * 100)),
    weeklyScore: parseFloat(r.EngagementScore) || 0,
    category: parseFloat(r.EngagementScore) >= 75 ? 'High' : (parseFloat(r.EngagementScore) >= 55 ? 'Medium' : parseFloat(r.EngagementScore) >= 40 ? 'Low' : 'At-Risk'),
    feedback: (r.Feedback || '').trim()
  }));

  res.json({
    id: studentRecords[0].URN,
    name: studentRecords[0].StudentName,
    history
  });
});

// ─────────────────────────────────────────────────────────
// QUIZ CREATION — Only endpoint that calls Google Forms API directly
// ─────────────────────────────────────────────────────────
app.post('/api/quizzes', async (req, res) => {
  const auth = googleAuth.getClient();
  if (!auth.credentials.access_token) {
    return res.status(401).json({ message: 'Google account not connected' });
  }

  const forms = google.forms({ version: 'v1', auth });
  const { title, date, questions, classroomId, week, endTime, includeFeedback } = req.body;

  try {
    const newForm = await forms.forms.create({
      requestBody: { info: { title: `${title} - Week ${week}` } }
    });
    const formId = newForm.data.formId;

    const requests = [
      {
        updateSettings: {
          settings: {
            quizSettings: { isQuiz: true }
          },
          updateMask: 'quizSettings.isQuiz'
        }
      }
    ];

    let index = 0;

    // 1. Email Field
    requests.push({
      createItem: {
        item: {
          title: "Student URN",
          questionItem: {
            question: { required: true, textQuestion: { paragraph: false } }
          }
        },
        location: { index: index++ }
      }
    });

    // 2. Name Field
    requests.push({
      createItem: {
        item: {
          title: "Student Name",
          questionItem: {
            question: { required: true, textQuestion: { paragraph: false } }
          }
        },
        location: { index: index++ }
      }
    });

    // 3. Subject Questions
    questions.forEach((q) => {
      requests.push({
        createItem: {
          item: {
            title: q.text,
            questionItem: {
              question: {
                required: true,
                grading: {
                  pointValue: q.points || 10,
                  correctAnswers: { answers: [{ value: q.correctAnswer }] }
                },
                choiceQuestion: {
                  type: 'RADIO',
                  options: q.options.map(opt => ({ value: opt }))
                }
              }
            }
          },
          location: { index: index++ }
        }
      });
    });

    // 4. Feedback Field (if included)
    if (includeFeedback !== false) {
      requests.push({
        createItem: {
          item: {
            title: "How did you feel about today's class? (Feedback)",
            questionItem: {
              question: { required: false, textQuestion: { paragraph: true } }
            }
          },
          location: { index: index++ }
        }
      });
    }

    const updateRes = await forms.forms.batchUpdate({
      formId,
      requestBody: { requests }
    });

    const createdItems = updateRes.data.replies.filter(r => r.createItem).map(r => r.createItem.itemId);

    const emailFieldId = createdItems[0];
    const nameFieldId = createdItems[1];
    const feedbackFieldId = includeFeedback !== false ? createdItems[createdItems.length - 1] : '';

    const viewUrl = newForm.data.responderUri;

    // Save to local cache + mark dirty for next sheet push
    await sheetsDB.upsertRecord(sheetsDB.TABS.QUIZZES, {
      QuizID: formId,
      ClassroomID: classroomId,
      Week: week,
      Title: title,
      FormURL: viewUrl,
      URNFieldID: emailFieldId,
      NameFieldID: nameFieldId,
      FeedbackFieldID: feedbackFieldId,
      EndTime: endTime || '',
      IncludeFeedback: includeFeedback !== false ? 'Yes' : 'No'
    });

    // Auto-push to Google Sheets
    sheetsDB.pushToSheets().catch(err => console.error('[Auto-Push] Quiz error:', err.message));

    res.json({ formId, url: viewUrl });
  } catch (err) {
    console.error('Quiz Creation Error:', err.message, err.response?.data || '');
    res.status(500).json({ message: 'Failed to create Google Form: ' + err.message });
  }
});

// ─────────────────────────────────────────────────────────
// SYNC: Pull responses from Google Forms → analyze sentiment → store
// Gemini is called ONLY for NEW feedback that hasn't been analyzed yet
// ─────────────────────────────────────────────────────────
const syncQuizById = async (quizId) => {
  const auth = googleAuth.getClient();
  if (!auth.credentials.access_token) return 0;

  const forms = google.forms({ version: 'v1', auth });
  const quizzes = await sheetsDB.getRows(sheetsDB.TABS.QUIZZES);
  const quiz = quizzes.find(q => 
    String(q.QuizID || '').trim().toLowerCase() === String(quizId || '').trim().toLowerCase()
  );
  
  if (!quiz) {
    console.error(`[Sync] Quiz not found for ID: "${quizId}". Available:`, quizzes.map(q => q.QuizID));
    throw new Error('Quiz not found in local records. Try pushing/pulling from Sheets first.');
  }

  // Load existing MasterRecords to detect already processed submissions
  const existingMasterRecords = await sheetsDB.getRows(sheetsDB.TABS.MASTER_RECORDS);

  // Discover Field IDs by Title
  const formMeta = await forms.forms.get({ formId: quiz.QuizID });
  const items = formMeta.data.items || [];

  let urnQID = quiz.URNFieldID;
  let nameQID = quiz.NameFieldID;
  let feedbackQID = quiz.FeedbackFieldID;

  items.forEach(item => {
    if (item.questionItem) {
      const title = item.title?.toLowerCase() || '';
      const qid = item.questionItem.question.questionId;
      if (title.includes('urn') || title.includes('email')) urnQID = qid;
      else if (title.includes('name')) nameQID = qid;
      else if (title.includes('lesson') || title.includes('feedback')) feedbackQID = qid;
    }
  });

  // Fetch Responses from Google Forms
  const responseData = await forms.forms.responses.list({ formId: quiz.QuizID });
  const responses = responseData.data.responses || [];

  let newRecords = [];
  let newRecordsCount = 0;

  // Sort ascending by time
  responses.sort((a, b) => new Date(a.lastSubmittedTime || a.createTime).getTime() - new Date(b.lastSubmittedTime || b.createTime).getTime());

  // Prepare all record templates
  const recordTemplates = responses.map(r => {
    const rAnswers = r.answers || {};
    const studentU = (rAnswers[urnQID]?.textAnswers?.answers[0]?.value || '').trim();
    const studentN = rAnswers[nameQID]?.textAnswers?.answers[0]?.value;
    const feedback = (rAnswers[feedbackQID]?.textAnswers?.answers[0]?.value || '').trim();
    
    // Check if this submission was already processed
    const existing = existingMasterRecords.find(mr =>
      String(mr.URN).trim().toLowerCase() === studentU.toLowerCase() &&
      String(mr.ClassroomID) === String(quiz.ClassroomID) &&
      String(mr.Week) === String(quiz.Week)
    );

    if (existing) {
      const hasRealSentiment = existing.Sentiment && existing.Sentiment !== 'Neutral';
      const hasFeedbackButNeutral = feedback.trim() && existing.Sentiment === 'Neutral';
      if (hasRealSentiment || (!hasFeedbackButNeutral && existing.Sentiment)) {
        return null; // Skip
      }
    }

    const totalPoints = r.totalScore || 0;
    const questionsCount = Object.keys(rAnswers).length - 3;
    let quizScore = 0;
    if (questionsCount > 0) {
      quizScore = (totalPoints / (questionsCount * 10)) * 100;
    }

    return {
      Timestamp: r.lastSubmittedTime || new Date().toISOString(),
      URN: studentU || 'Unknown',
      StudentName: studentN || 'Unknown',
      feedback,
      quizScore,
      ClassroomID: quiz.ClassroomID,
      Week: quiz.Week
    };
  }).filter(r => r !== null);

  newRecordsCount = recordTemplates.length;
  console.log(`[Sync] Analyzing sentiment for ${newRecordsCount} responses...`);

  // Process in batches of 5
  const BATCH_SIZE = 5;
  for (let i = 0; i < recordTemplates.length; i += BATCH_SIZE) {
    const batch = recordTemplates.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(async (tmpl) => {
      const sentimentResult = await sheetsDB.getSentimentLabel(tmpl.feedback);
      const sentimentStr = sentimentResult.category;
      const sentimentScore = sentimentResult.score;
      const engagementScore = sheetsDB.calculateEngagement(tmpl.quizScore, sentimentScore);

      newRecords.push({
        Timestamp: tmpl.Timestamp,
        URN: tmpl.URN,
        StudentName: tmpl.StudentName,
        ClassroomID: tmpl.ClassroomID,
        Week: tmpl.Week,
        QuizScore: tmpl.quizScore,
        Feedback: tmpl.feedback,
        Sentiment: sentimentStr,
        FeedbackScore: sentimentScore.toString(),
        EngagementScore: engagementScore
      });
    }));
    console.log(`[Sync] Processed batch ${Math.floor(i/BATCH_SIZE)+1}/${Math.ceil(recordTemplates.length/BATCH_SIZE)}`);
  }

  if (newRecords.length > 0) {
    await sheetsDB.upsertRecords(sheetsDB.TABS.MASTER_RECORDS, newRecords, ['URN', 'ClassroomID', 'Week']);

    // Also update the Students registry tab
    const studentUpdates = newRecords.map(r => ({
      URN: r.URN,
      Name: r.StudentName,
      ClassroomIDs: quiz.ClassroomID
    }));

    for (const student of studentUpdates) {
      const existing = (await sheetsDB.getRows(sheetsDB.TABS.STUDENTS)).find(s => s.URN === student.URN);
      if (existing) {
        const classIds = new Set((existing.ClassroomIDs || '').split(',').filter(id => id));
        classIds.add(student.ClassroomIDs);
        student.ClassroomIDs = Array.from(classIds).join(',');
      }
      await sheetsDB.upsertRecord(sheetsDB.TABS.STUDENTS, student, ['URN']);
    }

    console.log(`[Sync] Processed ${newRecords.length} new record(s) for quiz ${quizId}`);
  }

  return newRecordsCount;
};

const syncAllQuizzes = async () => {
  const quizzes = await sheetsDB.getRows(sheetsDB.TABS.QUIZZES);
  let totalNew = 0;
  for (const q of quizzes) {
    if (q.QuizID) {
      try {
        const fresh = await syncQuizById(q.QuizID);
        totalNew += fresh;
      } catch (e) {
        console.error(`Sync error for ${q.QuizID}:`, e.message);
      }
    }
  }
  return totalNew;
};

// Sync Live Responses for a SPECIFIC quiz
app.post('/api/quizzes/:id/sync', async (req, res) => {
  try {
    const newCount = await syncQuizById(req.params.id);
    
    if (newCount > 0) {
      // 1-minute delayed push to Google Sheets after sync
      console.log(`[Sync] Scheduling auto-push to Sheets in 60s for ${newCount} new responses...`);
      setTimeout(() => {
        sheetsDB.pushToSheets()
          .then(() => console.log('[Auto-Push] Sync data pushed to Google Sheets successfully.'))
          .catch(err => console.error('[Auto-Push] Sync data push failed:', err.message));
      }, 60000);

      res.json({ success: true, message: `Syncing started. ${newCount} NEW response(s) will be saved to Sheets in 1 minute.` });
    } else {
      res.json({ success: true, message: `No new responses found for this quiz.` });
    }
  } catch (err) {
    console.error(`[SYNC ERROR]`, err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Sync Live Responses from Google Forms (Manual Trigger - All)
app.post('/api/sync-responses', async (req, res) => {
  try {
    const synced = await syncAllQuizzes();
    res.json({ success: true, message: `Synced ${synced} NEW response(s) across all active quizzes.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────
// SHEETS SYNC — Pull/Push data between local cache and Google Sheets
// ─────────────────────────────────────────────────────────
app.post('/api/sheets/pull', async (req, res) => {
  try {
    const success = await sheetsDB.pullFromSheets();
    res.json({ success, message: success ? 'Pulled data from Google Sheets.' : 'Pull failed or not authenticated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/sheets/push', async (req, res) => {
  try {
    const success = await sheetsDB.pushToSheets();
    res.json({ success, message: success ? 'Pushed data to Google Sheets.' : 'Push failed or nothing to push.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/sheets/full-sync', async (req, res) => {
  try {
    await sheetsDB.fullSync();
    res.json({ success: true, message: 'Full bidirectional sync complete.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────
// SUBMISSIONS — Direct student submission endpoint
// ─────────────────────────────────────────────────────────
app.post('/api/submissions', async (req, res) => {
  const { urn, name, classroomId, week, quizScore, feedback } = req.body;

  // Call Gemini once for sentiment (cached permanently)
  const sentimentResult = await sheetsDB.getSentimentLabel(feedback);
  const sentimentStr = sentimentResult.category;
  const sentimentScore = sentimentResult.score;
  const engagementScore = sheetsDB.calculateEngagement(quizScore, sentimentScore);

  const record = {
    Timestamp: new Date().toISOString(),
    URN: urn,
    StudentName: name,
    ClassroomID: classroomId,
    Week: week,
    QuizScore: quizScore,
    Feedback: feedback,
    Sentiment: sentimentStr,
    FeedbackScore: sentimentScore.toString(),
    EngagementScore: engagementScore
  };

  // Upsert ensures (URN + Classroom + Week) is a unique composite key
  await sheetsDB.upsertRecord(sheetsDB.TABS.MASTER_RECORDS, record, ['URN', 'ClassroomID', 'Week']);

  // Also update the Students registry tab
  const existingStudent = (await sheetsDB.getRows(sheetsDB.TABS.STUDENTS)).find(s => s.URN === urn);
  let classroomIds = classroomId;
  if (existingStudent) {
    const classIds = new Set((existingStudent.ClassroomIDs || '').split(',').filter(id => id));
    classIds.add(classroomId);
    classroomIds = Array.from(classIds).join(',');
  }
  await sheetsDB.upsertRecord(sheetsDB.TABS.STUDENTS, { URN: urn, Name: name, ClassroomIDs: classroomIds }, ['URN']);

  res.json({ success: true, record });
});

// ─────────────────────────────────────────────────────────
// SERVER START
// ─────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`EngageMatric Backend running on port ${PORT}`);
});
