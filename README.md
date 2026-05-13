# Husl OS v2 — AI-Powered Business Operating System

> Built by **Rahul Nema**

A full-stack, AI-native business management platform featuring role-based access control, real-time analytics, RAG-powered natural language queries, voice integration, and automated HR & payroll workflows.

## 🧠 Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, TailwindCSS, Recharts, Framer Motion |
| Backend | Node.js, Express, MongoDB (Mongoose), JWT Auth |
| AI Engine | Python, Flask, OpenRouter (GPT-4o mini), ElevenLabs TTS |
| Database | MongoDB Atlas |
| Real-time | Socket.IO |
| Email | Nodemailer (Gmail) |
| Scheduling | Calendly API Integration |

## ✨ Key Features

- **Role-Based Access Control** — CEO, Manager, Employee dashboards with granular permissions
- **AI Analytics** — Natural language queries over business data via RAG (Retrieval Augmented Generation)
- **Voice Interface** — ElevenLabs TTS-powered AI voice agent
- **HR & Payroll** — Attendance tracking, leave management, performance reviews, automated payroll calculation
- **Project Management** — Task assignment, deadline tracking, automated n8n webhook notifications
- **Real-time Updates** — Socket.IO powered live data sync across dashboards

## 📁 Repository Structure

```
├── frontend/          # Vite + React UI (TailwindCSS, Recharts)
├── backend/           # Node.js + Express REST API
└── Auto-LLM/
    └── analytics-llm/ # Python + Flask AI & RAG Engine
```

## 🛠 Local Development

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB Atlas account (free tier)

### Setup

1. **Clone & configure environment variables:**
   ```bash
   cp backend/.env.example backend/.env
   cp Auto-LLM/analytics-llm/.env.example Auto-LLM/analytics-llm/.env
   cp frontend/.env.example frontend/.env
   # Fill in your API keys in each .env file
   ```

2. **Start the Node.js backend:**
   ```bash
   cd backend && npm install && npm run dev
   ```

3. **Start the Python AI API:**
   ```bash
   cd Auto-LLM/analytics-llm
   pip install -r requirements.txt
   python api.py
   ```

4. **Start the Vite frontend:**
   ```bash
   cd frontend && npm install && npm run dev
   ```

## 🔑 Required API Keys (all have free tiers)

- **MongoDB Atlas** — [cloud.mongodb.com](https://cloud.mongodb.com) (free 512MB cluster)
- **OpenRouter** — [openrouter.ai/keys](https://openrouter.ai/keys) (free credits)
- **ElevenLabs** — [elevenlabs.io](https://elevenlabs.io) (free 10k chars/month)
- **Google AI Studio** — [aistudio.google.com](https://aistudio.google.com) (free Gemini API)
- **Calendly** — [calendly.com](https://calendly.com) (optional, free tier)

## 🚀 Deployment

| Service | Platform |
|---|---|
| Frontend | Vercel |
| Backend API | Railway |
| Python AI Engine | Railway |
| Database | MongoDB Atlas |
