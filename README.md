# 🔬 ResearchOS

> **AI-Powered Research Management Workspace**
> Manage ideas, tasks, deliverables, and daily reports in one unified dashboard.

![Project Status](https://img.shields.io/badge/Status-Active-success)
![Frontend](https://img.shields.io/badge/Frontend-Next.js-black)
![Backend](https://img.shields.io/badge/Backend-FastAPI-009688)
![Database](https://img.shields.io/badge/Database-PostgreSQL-336791)

## 🚀 Live Demo

- **Frontend (Web App)**: [https://research-os-fe.vercel.app](https://research-os-fe.vercel.app)
- **Backend (API Docs)**: [https://researchos-backend.onrender.com/docs](https://researchos-backend.onrender.com/docs)

---

## 🌟 Features

- **📊 Dashboard**: Real-time overview of research progress, idea status, and task completion.
- **💡 Idea Management**: Track research ideas from inception to publication.
- **✅ Task & Gantt Chart**: Manage tasks with dependencies and visualize timeline.
- **📝 Daily Reports & AI Analysis**: Upload markdown reports and let AI summarize and tag them automatically.
- **🤖 AI Integration**: Automatic risk detection, next action recommendations, and progress tracking using OpenAI.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Vanilla CSS (Modern, Responsive)
- **Deployment**: Vercel (Automatic CI/CD)

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL (via SQLAlchemy)
- **AI**: OpenAI GPT-4o-mini
- **Deployment**: Render (Automatic CI/CD)

---

## 💻 Local Development Guide

Follow these steps to set up the project locally.

### 1. Clone the Repository

```bash
git clone https://github.com/hacuit/ResearchOS.git
cd ResearchOS
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
# Activate (Windows)
.\venv\Scripts\Activate
# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
copy .env.example .env
# ⚠️ Open .env and add your OPENAI_API_KEY
```

Run the backend server:
```bash
# Run server (Auto-reload)
uvicorn app.main:app --reload
```
> Server running at: http://localhost:8000

### 3. Frontend Setup

Open a new terminal.

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local file
echo "NEXT_PUBLIC_API_BASE=http://localhost:8000" > .env.local

# Run development server
npm run dev
```
> App running at: http://localhost:3000

---

## 🔄 Deployment & CI/CD

This project is configured with **Automated Continuous Deployment**:

| Component | Platform | Trigger |
|-----------|----------|---------|
| **Frontend** | [Vercel](https://vercel.com) | Push to `main` (frontend/**) |
| **Backend** | [Render](https://render.com) | Push to `main` (backend/**) |

### Environment Variables Required

**Frontend (Vercel)**
- `NEXT_PUBLIC_API_BASE`: URL of the deployed backend (e.g., `https://researchos-backend.onrender.com`)

**Backend (Render)**
- `OPENAI_API_KEY`: Your OpenAI API Key
- `DATABASE_URL`: PostgreSQL Connection String (Auto-configured on Render)
- `OWNER_PASSWORD`: Admin password for the workspace
