# Hustle OS

A full-stack project and team management platform with an integrated AI analytics layer. Built for internal operational use — managing employees, projects, tasks, and performance data in one place.

**Live:** [hustle-os-ten.vercel.app](https://hustle-os-ten.vercel.app) &nbsp;|&nbsp; **Repo:** [github.com/Rahulnema04/Hustle-OS](https://github.com/Rahulnema04/Hustle-OS)

---

## Overview

Hustle OS started as a way to replace scattered spreadsheets and Notion pages with a unified operations platform. It handles day-to-day task management but layers an AI system on top that lets you query your own data in plain English — or by voice.

The platform is role-based. A CEO sees everything. Managers see their team. Employees see their own work. Each role gets a tailored dashboard with the data that matters to them.

---

## What It Does

**Core Platform**
- Role-based access control (CEO / Manager / HR / Employee)
- Project and task management with status tracking
- Leave request workflows with manager and HR approval stages
- Employee records, performance tracking, and points system
- Real-time updates via WebSockets

**AI Layer (Analytics LLM)**
- Ask questions about your data in plain English — *"How many projects are overdue?"*, *"Who has the highest task completion rate?"*
- Voice interface: speak a question, get a spoken response back
- Powered by a RAG (Retrieval-Augmented Generation) pipeline that pulls live data from MongoDB and answers through an LLM
- Text-to-Speech via ElevenLabs, Speech-to-Text via local Faster-Whisper

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express.js, JWT auth |
| AI Server | Python, Flask, Flask-SocketIO |
| Database | MongoDB Atlas |
| LLM | OpenRouter (DeepSeek V4 Flash — free tier) |
| STT | Faster-Whisper (runs locally) |
| TTS | ElevenLabs API |
| Deployment | Vercel (frontend), Render (backend + AI server) |

---

## Project Structure

```
Hustle-OS/
├── frontend/          # React/Vite application
├── backend/           # Node.js/Express API + MongoDB models
└── Auto-LLM/
    └── analytics-llm/ # Python Flask AI server (RAG + Voice)
```

---

## Running Locally

You'll need Node.js 18+, Python 3.10+, and a MongoDB Atlas connection string.

**Backend**
```bash
cd backend
npm install
npm run dev         # runs on :5000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev         # runs on :5173
```

**AI Server**
```bash
cd Auto-LLM/analytics-llm
pip install -r requirements.txt
python3 api.py      # runs on :5002
```

**Environment variables** — copy `.env.example` in each directory and fill in your keys:

| Service | Required keys |
|---|---|
| Backend | `MONGODB_URI`, `JWT_SECRET`, `NODE_ENV` |
| AI Server | `OPENROUTER_API_KEY`, `MONGODB_URI`, `ELEVENLABS_API_KEY` |
| Frontend | `VITE_API_URL`, `VITE_BACKEND_URL` |

---

## Deployment

| Service | Platform | Notes |
|---|---|---|
| Frontend | Vercel | Root dir: `frontend`, auto-detects Vite |
| Node Backend | Render | Root dir: `backend`, start: `npm start` |
| Python AI | Render | Root dir: `Auto-LLM/analytics-llm`, start: `gunicorn -k eventlet -w 1 api:app` |

All three services auto-deploy on push to `main`.

---

## Default Accounts (Development)

| Role | Email | Password |
|---|---|---|
| CEO | ceo@hustlesystem.com | krishna123 |
| Manager | manageronetwo@example.com | password123 |
| Employee | developertest@example.com | password123 |

The login page also has quick-fill buttons for each role for faster testing.

---

## Status

Active development. Core platform is stable and deployed. The AI/voice layer is functional but continues to improve as more data is added.

---

Built by [Rahul Nema](https://github.com/Rahulnema04)
