# 📊 EngageMetrics — AI Student Engagement & Attention Tracker

> **An AI-assisted system to track, analyze, and improve student engagement in online classes using structured data and intelligent insights.**

---

## 🚀 Overview

EngageMetrics is a data-driven platform designed to help educators understand student engagement in online learning environments.

It collects post-class data (participation, quiz performance, and feedback), processes it using rule-based logic, and enhances it with AI-powered sentiment analysis using ChatGPT. The system identifies at-risk students, visualizes engagement trends, and generates actionable teaching suggestions.

---

## 🎯 Problem Statement

In online classes, teachers lack a structured way to:

* Measure student engagement objectively
* Identify disengaged or struggling students
* Understand feedback at scale
* Improve teaching strategies based on data

**EngageMetrics solves this by combining structured analytics with AI insights.**

---

## 🎯 Objectives

* Collect and store engagement data systematically
* Calculate engagement scores using weighted criteria
* Classify students into engagement levels
* Detect at-risk students using rule-based logic
* Analyze feedback sentiment using AI
* Generate actionable insights for educators
* Visualize engagement trends via dashboards
* Produce weekly summary reports

---

## ✨ Key Features

### 📥 1. Engagement Data Collection

Data is collected using Google Forms:

* Participation rating
* Quiz score (%)
* Chat activity summary
* Written feedback

---

### 🧮 2. Engagement Scoring System

**Weight Distribution:**

* Participation → 40%
* Quiz Performance → 40%
* Sentiment Score → 20%

**Formula:**

```
Engagement Score = 
(0.4 × Participation) + 
(0.4 × Quiz Score) + 
(0.2 × Sentiment Score)
```

---

### 🏷️ 3. Student Categorization

| Score Range | Category          |
| ----------- | ----------------- |
| ≥ 75        | High Engagement   |
| 50–74       | Medium Engagement |
| < 50        | Low Engagement    |

---

### 🤖 4. Feedback Sentiment Analysis

Student feedback is analyzed using ChatGPT and classified as:

* Positive
* Neutral
* Negative

**Sentiment Mapping:**

| Sentiment | Score |
| --------- | ----- |
| Positive  | 100   |
| Neutral   | 50    |
| Negative  | 0     |

---

### 🚨 5. At-Risk Student Detection

Students are flagged as **At Risk** if:

* Engagement Score < 45
  **OR**
* Engagement declines for 2 consecutive weeks

---

### 📊 6. Dashboard & Analytics

Built using Google Sheets:

* Class engagement trends
* Individual student tracking
* Sentiment distribution charts
* Weekly comparisons

---

### 💡 7. AI-Generated Suggestions

ChatGPT generates:

* Teaching improvement strategies
* Engagement enhancement ideas
* Performance-based recommendations

---

### 🧾 8. Weekly Reports

Reports are created using Canva, including:

* Class engagement summary
* Student distribution
* At-risk students
* AI-generated suggestions

---

## 🏗️ System Architecture

```
Google Forms
     ↓
Google Sheets (Raw Data)
     ↓
n8n Workflow Automation
     ↓
ChatGPT (Sentiment Analysis)
     ↓
Score Calculation & Logic
     ↓
Google Sheets (Processed Data)
     ↓
Dashboard Visualization
     ↓
AI Suggestions
     ↓
Canva Report
```

---

## ⚙️ Workflow Explanation

1. Students submit engagement data via Google Forms
2. Data is stored in Google Sheets
3. n8n triggers automation on new entries
4. ChatGPT analyzes feedback sentiment
5. Engagement score is calculated
6. Students are categorized and evaluated
7. At-risk students are flagged
8. Results are updated in Sheets
9. Dashboard visualizes insights
10. AI generates suggestions
11. Weekly report is created in Canva

---

## 🧰 Tech Stack

* **Frontend:** HTML, CSS, JavaScript
* **Automation:** n8n
* **Database:** Google Sheets
* **Data Collection:** Google Forms
* **AI Engine:** OpenAI (ChatGPT API)
* **Reporting:** Canva
* **Deployment:** Vercel / Netlify
* **Version Control:** GitHub

---

## 📁 Project Structure

```
EngageMetrics/
│
├── frontend/               # Website UI (deployed)
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── workflows/
│   └── n8n-workflow.json   # Exported workflow
│
├── screenshots/
│   ├── dashboard.png
│   ├── report.png
│
├── README.md
```

---

## 🛠️ Setup Instructions

### 1. Clone Repository

```
git clone https://github.com/your-username/EngageMetrics.git
cd EngageMetrics
```

---

### 2. Setup Google Sheets

* Create a response sheet linked to Google Forms
* Add columns for:

  * Participation
  * Quiz Score
  * Feedback
  * Sentiment
  * Score
  * Category
  * At-Risk

---

### 3. Setup n8n Workflow

* Import `n8n-workflow.json`
* Configure:

  * Google Sheets credentials
  * OpenAI API key

---

### 4. Run Frontend

* Open `index.html`
  OR
* Deploy via Vercel / Netlify

---

## 🌐 Deployment

### Frontend Deployment

* Deploy using Vercel or Netlify

### n8n Deployment

* Use:

  * n8n Cloud
  * Railway
  * Render

---

## ⚠️ Limitations

* No real-time engagement tracking
* Dependent on user input accuracy
* Sentiment classification depends on prompt quality
* No predictive machine learning (rule-based system)

---

## 🔮 Future Enhancements

* Real-time engagement monitoring
* Machine learning prediction models
* LMS integration (Google Classroom, Moodle)
* Automated report generation
* Advanced analytics dashboard

---

## 🧠 Key Insight

> EngageMetrics demonstrates how AI + no-code tools can be combined to create a powerful, scalable student engagement analysis system without complex machine learning.

---

## 👨‍💻 Contributors

* Sumit Roy Chowdhury
* Kumar Roushan
* Shivraj Bissa
* Mayank Shekhar Chaturvedi

---

## ⭐ Acknowledgements

* OpenAI (ChatGPT API)
* Google Forms & Sheets
* n8n Workflow Automation
* Canva

---
