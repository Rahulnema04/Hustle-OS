---
title: Hustle OS Analytics LLM
emoji: 🤖
colorFrom: purple
colorTo: indigo
sdk: docker
pinned: false
app_port: 7860
---

# Hustle OS — Analytics LLM & Voice Agent

A Flask-based AI analytics server powering the Hustle OS platform.

## Features

- **📊 Analytics API** — MongoDB-backed project, employee, and summary endpoints
- **🤖 RAG Agent** — Ask natural language questions about your business data
- **🎤 Voice Pipeline** — Speech-to-Text (Whisper) → RAG → Text-to-Speech (ElevenLabs)
- **🔌 WebSocket Streaming** — Real-time voice streaming via Socket.IO

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/analytics/health` | Health check |
| GET | `/api/analytics/projects` | Project analytics |
| GET | `/api/analytics/employees` | Employee reports |
| GET | `/api/analytics/summary` | Full summary |
| GET | `/api/analytics/insights` | LLM-generated insights |
| POST | `/api/analytics/refresh` | Refresh cache |
| POST | `/api/analytics/rag/query` | RAG Q&A |
| POST | `/api/analytics/rag/voice-query` | Voice pipeline |
| WS | `/ws/voice` | Native WebSocket voice |
| WS | `/socket.io/` | Socket.IO voice (legacy) |

## Environment Variables (set in HF Space Secrets)

| Variable | Description |
|---|---|
| `OPENROUTER_API_KEY` | OpenRouter API key |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `ELEVENLABS_API_KEY` | ElevenLabs TTS API key |
| `ELEVENLABS_VOICE_ID` | ElevenLabs voice ID |
| `ANALYTICS_MODEL` | LLM model (default: `deepseek/deepseek-v3-base:free`) |
| `DB_NAME` | MongoDB database name (default: `test`) |
| `BACKEND_URL` | Node.js backend URL (for action execution) |
