# 📊 EngageMatric — AI Student Engagement & Attention Tracker

> **An AI-assisted full-stack application to track, analyze, and improve student engagement in online classes using Google Sheets as a database and intelligent AI insights.**

---

## 🚀 Overview

EngageMatric is a data-driven platform designed to help educators understand student engagement in learning environments.

It collects post-class data via Google Forms, processes it through a custom Node.js backend, and enhances it with AI-powered sentiment analysis using Google Gemini. The system identifies at-risk students, visualizes engagement trends through a modern React dashboard, and maintains a structured historical record in Google Sheets.

---

## 🎯 Objectives

* Collect and store engagement data systematically via automated Google Forms.
* Compute engagement scores using weighted criteria (Quiz Scores + Sentiment + Participation).
* Detect at-risk students automatically using predefined engagement thresholds.
* Analyze student feedback sentiment using Google Gemini AI.
* Visualize engagement trends and individual student performance via a dynamic dashboard.

---

## ✨ Key Features

### 📥 1. Automated Data Sync
Teachers can generate Google Forms directly from the dashboard. Once students submit the form, the Express.js backend pulls the responses, analyzes them, and automatically updates the Master Google Sheet.

### 🧮 2. Engagement Scoring System
**Formula:**
`Engagement Score = (0.4 × Participation) + (0.4 × Quiz Score) + (0.2 × Sentiment Score)`

### 🤖 3. AI Sentiment Analysis
Student feedback is automatically processed by **Google Gemini 2.0 Flash** (with Groq as a fallback) to determine the emotional sentiment:
* Positive (100 pts)
* Neutral (50 pts)
* Negative (0 pts)

### 🚨 4. At-Risk Student Detection
Students are automatically flagged as **At Risk** if their Engagement Score drops below 40%.

### 📊 5. Comprehensive React Dashboard
A sleek, responsive dashboard built with React that provides:
* Class engagement averages & trends.
* Individual student profiles and historical data.
* Risk detection alerts and participation leaderboards.

---

## 🏗️ System Architecture

```text
Student (Google Form) 
      ↓
Node.js Backend (Express)  ←→  Google Gemini API (Sentiment Analysis)
      ↓
Google Sheets (Master Database via OAuth2)
      ↓
Node.js Backend (Data Processing & Local Caching)
      ↓
React Frontend (Vite Dashboard)
```

---

## 🧰 Tech Stack

* **Frontend:** React.js, Vite, Vanilla CSS, Lucide-React
* **Backend:** Node.js, Express.js
* **Database:** Google Sheets API (OAuth2)
* **AI Engine:** Google Gemini API (Groq as fallback)
* **Deployment:** Vercel (Frontend), Render (Backend)

---

## 📁 Project Structure

```text
EngageMatric/
│
├── frontend/               # React Dashboard (Vite)
│   ├── src/                # React Components, Pages, and API utilities
│   ├── package.json
│   └── .env                # Contains VITE_API_URL
│
├── backend/                # Node.js Express Server
│   ├── routes/             # API Endpoints
│   ├── utils/              # Google Auth, Sheets DB, Gemini integrations
│   ├── package.json
│   └── .env                # Contains API Keys and OAuth Credentials
│
└── README.md
```

---

## 🛠️ Setup Instructions

### 1. Clone Repository
```bash
git clone https://github.com/SumitRoyChowdhury/EngageMetrics.git
cd EngageMetrics
```

### 2. Backend Setup
1. Open the `backend` directory: `cd backend`
2. Install dependencies: `npm install`
3. Create a `.env` file with the following variables:
   ```env
   PORT=5001
   FRONTEND_URL=http://localhost:5173
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   GOOGLE_REDIRECT_URL=http://localhost:5001/api/auth/google/callback
   MASTER_SPREADSHEET_ID=your_google_sheet_id
   GEMINI_API_KEY=your_gemini_key
   GROQ_API_KEY=your_groq_key
   ```
4. Start the backend server: `npm start` (or `npm run dev` for nodemon).

### 3. Frontend Setup
1. Open the `frontend` directory: `cd ../frontend`
2. Install dependencies: `npm install`
3. Create a `.env` file:
   ```env
   VITE_API_URL=http://localhost:5001/api
   ```
4. Start the frontend development server: `npm run dev`

### 4. Authentication Setup
1. Open the frontend at `http://localhost:5173`.
2. Click **Connect Google** to authenticate with your Google Workspace.
3. Once authenticated, the backend will bootstrap the Google Sheet with the necessary tabs and start syncing data!

---

## 🌐 Deployment

* **Frontend:** Deployed via Vercel (`engage-metrics-plum.vercel.app`)
* **Backend:** Deployed via Render (`engagemetrics-rmu4.onrender.com`)

*Note: When deploying the backend to an ephemeral filesystem like Render, ensure `GOOGLE_REFRESH_TOKEN` is set in the environment variables to bypass the 7-day token expiration limit of Google Cloud testing apps.*

---

## 👨‍💻 Contributors

* Sumit Roy Chowdhury
* Kumar Roushan
* Shivraj Bissa
* Mayank Shekhar Chaturvedi
