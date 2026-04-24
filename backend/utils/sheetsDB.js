const { google } = require('googleapis');
const googleAuth = require('./googleAuth');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// ─────────────────────────────────────────────────────────
// TAB & HEADER DEFINITIONS
// ─────────────────────────────────────────────────────────
const TABS = {
  WORKSPACES: 'Workspaces',
  CLASSROOMS: 'Classrooms',
  STUDENTS: 'Students',
  QUIZZES: 'Quizzes',
  MASTER_RECORDS: 'MasterRecords',
  PARTICIPATION_RECORDS: 'ParticipationRecords'
};

const HEADERS = {
  [TABS.WORKSPACES]: ['ID', 'Date', 'Label', 'CreatedAt', 'Participation'],
  [TABS.CLASSROOMS]: ['ID', 'WorkspaceID', 'Name', 'Subject', 'Batch', 'CreatedAt'],
  [TABS.STUDENTS]: ['URN', 'Name', 'ClassroomIDs'],
  [TABS.QUIZZES]: ['QuizID', 'ClassroomID', 'Week', 'Title', 'FormURL', 'URNFieldID', 'NameFieldID', 'FeedbackFieldID', 'EndTime', 'IncludeFeedback'],
  [TABS.MASTER_RECORDS]: ['Timestamp', 'URN', 'StudentName', 'ClassroomID', 'Week', 'QuizScore', 'Feedback', 'Sentiment', 'FeedbackScore', 'EngagementScore'],
  [TABS.PARTICIPATION_RECORDS]: ['URN', 'ClassroomID', 'Week', 'Score', 'Timestamp']
};

/**
 * Helper to execute Google API calls with retry on Quota Exceeded (429)
 */
const executeWithRetry = async (fn, retries = 3, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if ((err.status === 429 || err.code === 429 || err.message.includes('Quota exceeded')) && i < retries - 1) {
        console.warn(`[Google API] Quota exceeded. Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
        continue;
      }
      throw err;
    }
  }
};

// ─────────────────────────────────────────────────────────
// LOCAL JSON CACHE — All API reads come from here (zero Google API calls)
// ─────────────────────────────────────────────────────────
const CACHE_PATH = path.join(__dirname, '../data/cache.json');
const DATA_DIR = path.join(__dirname, '../data');

// In-memory store
let localDB = {};

/**
 * Load the local cache from disk into memory
 */
const loadCache = () => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(CACHE_PATH)) {
      const raw = fs.readFileSync(CACHE_PATH, 'utf-8');
      localDB = JSON.parse(raw);
      console.log('[Cache] Loaded local cache from disk.');
    } else {
      // Initialize empty structure
      localDB = {};
      Object.values(TABS).forEach(tab => { localDB[tab] = []; });
      saveCache();
      console.log('[Cache] Initialized empty local cache.');
    }
  } catch (err) {
    console.error('[Cache] Load error:', err.message);
    localDB = {};
    Object.values(TABS).forEach(tab => { localDB[tab] = []; });
  }
};

/**
 * Save the in-memory cache to disk
 */
const saveCache = () => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(CACHE_PATH, JSON.stringify(localDB, null, 2));
  } catch (err) {
    console.error('[Cache] Save error:', err.message);
  }
};

// Load cache on module initialization
loadCache();

// ─────────────────────────────────────────────────────────
// LOCAL READ — Instant, no Google API calls
// ─────────────────────────────────────────────────────────
/**
 * Get all rows from a tab — reads from LOCAL CACHE only
 */
const getRows = async (tab) => {
  return localDB[tab] || [];
};

// ─────────────────────────────────────────────────────────
// LOCAL WRITE — Updates cache + persists to disk
// ─────────────────────────────────────────────────────────
/**
 * Upsert a record into the local cache
 */
const upsertRecord = async (tab, data, matchKeys = []) => {
  if (!localDB[tab]) localDB[tab] = [];

  let rowIndex = -1;
  if (matchKeys.length > 0) {
    rowIndex = localDB[tab].findIndex(row =>
      matchKeys.every(key => String(row[key]).trim().toLowerCase() === String(data[key]).trim().toLowerCase())
    );
  } else {
    // For tabs like Workspaces/Classrooms/Quizzes, match by primary key
    const primaryKeys = {
      [TABS.WORKSPACES]: 'ID',
      [TABS.CLASSROOMS]: 'ID',
      [TABS.QUIZZES]: 'QuizID',
    };
    const pk = primaryKeys[tab];
    if (pk && data[pk]) {
      rowIndex = localDB[tab].findIndex(row => String(row[pk]) === String(data[pk]));
    }
  }

  if (rowIndex !== -1) {
    localDB[tab][rowIndex] = { ...localDB[tab][rowIndex], ...data };
  } else {
    localDB[tab].push(data);
  }

  saveCache();
  // Mark that this tab has unsaved changes for next sheet flush
  if (!localDB._dirty) localDB._dirty = {};
  localDB._dirty[tab] = true;
};

/**
 * Bulk upsert records into the local cache (batched, efficient)
 */
const upsertRecords = async (tab, records, matchKeys = []) => {
  if (!localDB[tab]) localDB[tab] = [];

  for (const data of records) {
    let rowIndex = -1;
    if (matchKeys.length > 0) {
      rowIndex = localDB[tab].findIndex(row =>
        matchKeys.every(key => String(row[key]).trim().toLowerCase() === String(data[key]).trim().toLowerCase())
      );
    }

    if (rowIndex !== -1) {
      localDB[tab][rowIndex] = { ...localDB[tab][rowIndex], ...data };
    } else {
      localDB[tab].push(data);
    }
  }

  saveCache();
  if (!localDB._dirty) localDB._dirty = {};
  localDB._dirty[tab] = true;
};

/**
 * Delete a record from the local cache
 */
const deleteRecord = async (tab, keyField, keyValue) => {
  if (!localDB[tab]) localDB[tab] = [];

  let rowIndex = localDB[tab].findIndex(row =>
    String(row[keyField] || '').trim() === String(keyValue).trim()
  );

  // Fallback: for Quizzes, try matching in FormURL
  if (rowIndex === -1 && tab === TABS.QUIZZES) {
    rowIndex = localDB[tab].findIndex(row =>
      String(row['FormURL'] || '').includes(String(keyValue).trim()) ||
      String(row['Title'] || '').trim() === String(keyValue).trim()
    );
  }

  if (rowIndex === -1) {
    const available = localDB[tab].map(r => r[keyField]);
    throw new Error(`Record with ${keyField}="${keyValue}" not found. Available: ${JSON.stringify(available)}`);
  }

  localDB[tab].splice(rowIndex, 1);
  saveCache();
  if (!localDB._dirty) localDB._dirty = {};
  localDB._dirty[tab] = true;
  console.log(`[Cache] Deleted record ${keyField}="${keyValue}" from ${tab}`);
  return true;
};

// ─────────────────────────────────────────────────────────
// GOOGLE SHEETS SYNC — Only called explicitly, not on every request
// ─────────────────────────────────────────────────────────

/**
 * Pull ALL data from Google Sheets into local cache (full refresh)
 */
const pullFromSheets = async () => {
  const auth = googleAuth.getClient();
  if (!auth.credentials.access_token) {
    console.log('[Sheets] Not authenticated, skipping pull.');
    return false;
  }

  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = process.env.MASTER_SPREADSHEET_ID;
  if (!spreadsheetId) return false;

  console.log('[Sheets] Pulling data from Google Sheets...');

  try {
    // Use a single batchGet call to fetch ALL tabs at once (1 API call instead of 5)
    const tabNames = Object.values(TABS);
    const ranges = tabNames.map(tab => `${tab}!A:Z`);

    const res = await executeWithRetry(() => sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges
    }));

    const valueRanges = res.data.valueRanges || [];

    tabNames.forEach((tab, idx) => {
      const rows = valueRanges[idx]?.values || [];
      if (rows.length === 0) {
        localDB[tab] = [];
        return;
      }
      const headers = rows[0];
      localDB[tab] = rows.slice(1).map(row => {
        const obj = {};
        headers.forEach((h, i) => { obj[h] = row[i] || ''; });
        return obj;
      });
    });

    // Clear dirty flags since we just pulled fresh data
    localDB._dirty = {};
    saveCache();
    console.log(`[Sheets] Pull complete. Loaded ${tabNames.map(t => `${t}:${(localDB[t]||[]).length}`).join(', ')}`);
    return true;
  } catch (err) {
    console.error('[Sheets] Pull error:', err.message);
    return false;
  }
};

/**
 * Push dirty tabs from local cache back to Google Sheets (batch write)
 */
const pushToSheets = async (forceTabs = null) => {
  const auth = googleAuth.getClient();
  if (!auth.credentials.access_token) {
    console.log('[Sheets] Not authenticated, skipping push.');
    return false;
  }

  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = process.env.MASTER_SPREADSHEET_ID;
  if (!spreadsheetId) return false;

  const dirtyTabs = forceTabs || Object.keys(localDB._dirty || {}).filter(k => localDB._dirty[k]);
  if (dirtyTabs.length === 0) {
    console.log('[Sheets] Nothing dirty to push.');
    return true;
  }

  console.log(`[Sheets] Pushing dirty tabs: ${dirtyTabs.join(', ')}`);

  try {
    // For each dirty tab, clear existing data and rewrite entirely
    // This is more reliable than individual row updates
    const data = [];

    for (const tab of dirtyTabs) {
      const headers = HEADERS[tab];
      if (!headers) continue;
      const rows = (localDB[tab] || []).map(record =>
        headers.map(h => record[h] !== undefined && record[h] !== null ? String(record[h]) : '')
      );

      data.push({
        range: `${tab}!A1`,
        values: [headers, ...rows]
      });
    }

    if (data.length > 0) {
      // First, clear the ranges
      await executeWithRetry(() => sheets.spreadsheets.values.batchClear({
        spreadsheetId,
        requestBody: {
          ranges: dirtyTabs.map(tab => `${tab}!A:Z`)
        }
      }));

      // Then write all data in one batch call
      await executeWithRetry(() => sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
          valueInputOption: 'RAW',
          data
        }
      }));
    }

    // Clear dirty flags for pushed tabs
    dirtyTabs.forEach(tab => {
      if (localDB._dirty) localDB._dirty[tab] = false;
    });
    saveCache();

    console.log('[Sheets] Push complete.');
    return true;
  } catch (err) {
    console.error('[Sheets] Push error:', err.message);
    return false;
  }
};

/**
 * Full bidirectional sync: pull from sheets, then push dirty local changes
 */
const fullSync = async () => {
  await pullFromSheets();
  await pushToSheets();
};

// ─────────────────────────────────────────────────────────
// BOOTSTRAP — Create sheet tabs if they don't exist
// ─────────────────────────────────────────────────────────
const bootstrap = async () => {
  const auth = googleAuth.getClient();
  if (!auth.credentials.access_token) return;

  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = process.env.MASTER_SPREADSHEET_ID;
  if (!spreadsheetId) return;

  try {
    const meta = await executeWithRetry(() => sheets.spreadsheets.get({ spreadsheetId }));
    const existingTabs = meta.data.sheets.map(s => s.properties.title);

    const tabsToCreate = Object.values(TABS).filter(t => !existingTabs.includes(t));

    if (tabsToCreate.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: tabsToCreate.map(title => ({
            addSheet: { properties: { title } }
          }))
        }
      });

      // Add headers
      const data = tabsToCreate.map(tab => ({
        range: `${tab}!A1`,
        values: [HEADERS[tab]]
      }));

      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
          valueInputOption: 'RAW',
          data
        }
      });
      console.log('[Bootstrap] Spreadsheet tabs created successfully.');
    }

    // After bootstrap, pull existing data from sheets into local cache
    await pullFromSheets();
  } catch (err) {
    console.error('[Bootstrap] Error:', err.message);
  }
};

// ─────────────────────────────────────────────────────────
// GEMINI SENTIMENT ANALYSIS — Called ONCE per new feedback
// ─────────────────────────────────────────────────────────
const SENTIMENT_CACHE_PATH = path.join(__dirname, '../data/sentiment_cache.json');
let sentimentCache = {};

// Load sentiment cache from disk
const loadSentimentCache = () => {
  try {
    if (fs.existsSync(SENTIMENT_CACHE_PATH)) {
      sentimentCache = JSON.parse(fs.readFileSync(SENTIMENT_CACHE_PATH, 'utf-8'));
    }
  } catch (err) {
    sentimentCache = {};
  }
};
loadSentimentCache();

const saveSentimentCache = () => {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(SENTIMENT_CACHE_PATH, JSON.stringify(sentimentCache, null, 2));
  } catch (err) {
    console.error('[Sentiment Cache] Save error:', err.message);
  }
};

/**
 * Call Gemini API for sentiment analysis — called only ONCE per unique feedback text
 * Uses the correct model name: gemini-2.0-flash
 */
const getGeminiSentiment = async (feedbackText, retryCount = 0) => {
  if (!feedbackText || feedbackText.trim() === '') return { category: 'Neutral', score: 50 };

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('[Gemini] No API key configured, defaulting to Neutral.');
      return { category: 'Neutral', score: 50 };
    }

    // Rate limiting: small delay between calls (reduced for performance)
    if (retryCount === 0) {
      await new Promise(r => setTimeout(r, 100));
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Analyze the sentiment of the following student feedback about a class. Respond with ONLY one word: Positive, Neutral, or Negative.\n\nFeedback: "${feedbackText}"`
          }]
        }]
      })
    });

    if (response.status === 429 && retryCount < 3) {
      const waitTime = (retryCount + 1) * 3000;
      console.warn(`[Gemini] Rate limited (429). Retrying in ${waitTime}ms...`);
      await new Promise(r => setTimeout(r, waitTime));
      return getGeminiSentiment(feedbackText, retryCount + 1);
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google API returned ${response.status}: ${errorText.substring(0, 100)}`);
    }

    const data = await response.json();
    const resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (resultText) {
      const sentimentStr = resultText.trim().toLowerCase();
      console.log(`[Gemini] "${feedbackText.substring(0, 30)}..." → ${sentimentStr}`);
      if (sentimentStr.includes('positive')) return { category: 'Positive', score: 100, isFallback: false };
      if (sentimentStr.includes('negative')) return { category: 'Negative', score: 0, isFallback: false };
      return { category: 'Neutral', score: 50, isFallback: false };
    } else {
      throw new Error(`[Gemini] Empty/unexpected response formatting.`);
    }
  } catch (err) {
    if (err.message.includes('ENOTFOUND')) {
      console.error('[Gemini] DNS/Network Error (ENOTFOUND). Please check your internet connection.');
      throw new Error('Network error: Could not reach Google APIs. Check your internet connection.');
    }
    console.error('[Gemini] API error:', err.message);
    throw err;
  }
};
/**
 * Call Groq API for sentiment analysis — fallback if Gemini fails
 */
const getGroqSentiment = async (feedbackText) => {
  if (!feedbackText || feedbackText.trim() === '') return { category: 'Neutral', score: 50, isFallback: false };

  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('No GROQ_API_KEY configured.');
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{
          role: 'user',
          content: `Analyze the sentiment of the following student feedback about a class. Respond with ONLY one word: Positive, Neutral, or Negative.\n\nFeedback: "${feedbackText}"`
        }],
        temperature: 0.1,
        max_tokens: 10
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Groq] Error Payload:`, errorText);
      throw new Error(`Groq API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const resultText = data?.choices?.[0]?.message?.content;

    if (resultText) {
      const sentimentStr = resultText.trim().toLowerCase();
      console.log(`[Groq] "${feedbackText.substring(0, 30)}..." → ${sentimentStr}`);
      if (sentimentStr.includes('positive')) return { category: 'Positive', score: 100, isFallback: false };
      if (sentimentStr.includes('negative')) return { category: 'Negative', score: 0, isFallback: false };
      return { category: 'Neutral', score: 50, isFallback: false };
    } else {
      throw new Error(`[Groq] Empty/unexpected response formatting.`);
    }
  } catch (err) {
    console.error('[Groq] API error:', err.message);
    return { category: 'Neutral', score: 50, isFallback: true };
  }
};

/**
 * Get sentiment label — uses disk-persistent cache to ensure Gemini/Groq is called only ONCE per feedback
 */
const getSentimentLabel = async (text) => {
  if (!text || text.trim() === '') return { category: 'Neutral', score: 50, isFallback: false };

  const cacheKey = text.trim().toLowerCase();

  // Check persistent cache first
  if (sentimentCache[cacheKey]) {
    console.log(`[Sentiment] Cache HIT for: "${text.substring(0, 30)}..."`);
    return sentimentCache[cacheKey];
  }

  console.log(`[Sentiment] Cache MISS — calling Gemini for: "${text.substring(0, 30)}..."`);
  
  let result;
  try {
    result = await getGeminiSentiment(text);
  } catch (err) {
    console.error('[Gemini] API error:', err.message);
    console.log(`[Sentiment] Gemini failed, falling back to Groq...`);
    try {
      result = await getGroqSentiment(text);
    } catch (groqErr) {
      console.error('[Groq] API fallback error:', groqErr.message);
      console.log(`[Sentiment] Both AI models failed. Defaulting to Neutral fallback.`);
      result = { category: 'Neutral', score: 50, isFallback: true };
    }
  }

  // Only persist to cache if it was a successful Gemini/Groq call, not an error fallback
  if (!result.isFallback) {
    sentimentCache[cacheKey] = result;
    saveSentimentCache();
  }

  return result;
};

/**
 * Calculate engagement score
 */
const calculateEngagement = (quizScore, sentimentScoreOrStr = 50) => {
  const quizWeight = 0.7;
  const sentimentWeight = 0.3;

  let sScore = 50;
  if (typeof sentimentScoreOrStr === 'number') {
    sScore = sentimentScoreOrStr;
  } else if (typeof sentimentScoreOrStr === 'string') {
    if (sentimentScoreOrStr === 'Positive') sScore = 100;
    else if (sentimentScoreOrStr === 'Negative') sScore = 0;
  }

  return (parseFloat(quizScore || 0) * quizWeight) + (sScore * sentimentWeight);
};

module.exports = {
  TABS,
  HEADERS,
  bootstrap,
  getRows,
  upsertRecord,
  upsertRecords,
  deleteRecord,
  getSentimentLabel,
  calculateEngagement,
  pullFromSheets,
  pushToSheets,
  fullSync,
  loadCache,
  saveCache
};
