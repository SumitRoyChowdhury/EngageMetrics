const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '../tokens.json');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URL
);

// Auto-save refreshed tokens to disk so they survive restarts
oauth2Client.on('tokens', (tokens) => {
  try {
    let saved = {};
    if (fs.existsSync(TOKEN_PATH)) {
      saved = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
    }
    // Merge new tokens (refresh may only return access_token, keep existing refresh_token)
    const merged = { ...saved, ...tokens };
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(merged));
    console.log('[Auth] Tokens auto-refreshed and saved to disk.');
  } catch (err) {
    console.error('[Auth] Failed to save refreshed tokens:', err.message);
  }
});

const getAuthUrl = () => {
  const scopes = [
    'https://www.googleapis.com/auth/forms.body',
    'https://www.googleapis.com/auth/forms.responses.readonly',
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file'
  ];
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });
};

const saveToken = async (code) => {
  const { tokens } = await oauth2Client.getToken(code);
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
  oauth2Client.setCredentials(tokens);
  return tokens;
};

const getClient = () => {
  if (fs.existsSync(TOKEN_PATH)) {
    const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH));
    oauth2Client.setCredentials(tokens);
  } else if (process.env.GOOGLE_REFRESH_TOKEN) {
    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });
  }
  return oauth2Client;
};

module.exports = {
  getAuthUrl,
  saveToken,
  getClient
};
