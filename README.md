# VedaAI — AI Assessment Creator

A full-stack AI-powered assessment/question paper generator built as a monorepo. Teachers can create assignments, configure question types, and generate structured exam papers using Google Gemini AI — all with real-time progress updates via WebSocket.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                          MONOREPO                               │
│                                                                 │
│  ┌──────────────┐  ┌──────────────────┐  ┌────────────────┐    │
│  │  apps/web    │  │  apps/server     │  │ packages/shared│    │
│  │  (Next.js)   │  │  (Express + TS)  │  │ (Types)        │    │
│  │              │  │                  │  └────────────────┘    │
│  │  • Zustand   │◄─┤  • MongoDB       │                        │
│  │  • WebSocket │  │  • Redis         │                        │
│  │  • App Router│  │  • BullMQ        │                        │
│  └──────┬───────┘  │  • WebSocket     │                        │
│         │          │  • Gemini AI     │                        │
│         │ REST API │                  │                        │
│         └──────────►                  │                        │
│         │ WS ◄─────┤                  │                        │
│         └──────────►──────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Teacher** fills the creation form (subject, class, question types, marks, optional PDF upload)
2. **Frontend** sends `POST /api/assignments` to the backend
3. **Backend** saves to MongoDB, adds a job to **BullMQ** queue
4. **Worker** picks up the job, calls **Google Gemini** with a structured prompt
5. Gemini returns structured JSON → worker **parses & validates** → saves to **MongoDB** + caches in **Redis**
6. **WebSocket** broadcasts real-time progress (queued → generating → completed)
7. **Frontend** receives the WebSocket event and renders the structured exam paper
8. Teacher can **download as PDF** or **regenerate**

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Zustand, WebSocket |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB (Mongoose) |
| Cache | Redis (ioredis) |
| Queue | BullMQ |
| AI | Google Gemini 1.5 Flash |
| Monorepo | npm Workspaces + Turborepo |

## Setup Instructions

### Prerequisites

- Node.js ≥ 18
- MongoDB (local or Atlas)
- Redis (local or cloud)
- Google Gemini API Key ([Get one here](https://aistudio.google.com/apikey))

### 1. Clone & Install

```bash
git clone <repo-url>
cd VedaAI
npm install
```

### 2. Configure Environment

```bash
# Backend
cp apps/server/.env.example apps/server/.env
# Edit apps/server/.env and set:
#   GEMINI_API_KEY=your_key_here
#   MONGODB_URI=mongodb://localhost:27017/vedaai
#   REDIS_URL=redis://localhost:6379
```

### 3. Start Development

```bash
# Start both frontend and backend
npm run dev

# Or individually:
npm run dev:web      # Frontend on http://localhost:3000
npm run dev:server   # Backend on http://localhost:5000
```

### 4. Open the App

Navigate to [http://localhost:3000](http://localhost:3000)

## Features

- **Assignment Creation** — Multi-step form with file upload, date picker, question type grid with counters
- **AI Generation** — Structured prompt engineering with Google Gemini, JSON schema enforcement
- **Real-time Updates** — WebSocket broadcasts job progress (queued → generating → done)
- **Question Paper Output** — A4-styled exam paper with sections, difficulty badges, answer key
- **PDF Export** — Download formatted question paper as PDF
- **Caching** — Redis caching with 1-hour TTL for generated papers
- **Background Jobs** — BullMQ queue with retry logic (3 attempts, exponential backoff)
- **PDF Parsing** — Extract text from uploaded PDFs for AI context
- **Responsive** — Mobile-first design with bottom navigation
- **Search & Filter** — Search assignments by title or subject

## Project Structure

```
VedaAI/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   └── src/
│   │       ├── app/            # Pages (Dashboard, Create, Output)
│   │       ├── components/     # Reusable UI components
│   │       ├── store/          # Zustand state management
│   │       ├── hooks/          # WebSocket hook
│   │       └── styles/         # Global CSS design system
│   └── server/                 # Express backend
│       └── src/
│           ├── config/         # DB, Redis, Queue setup
│           ├── models/         # Mongoose schemas
│           ├── routes/         # API endpoints
│           ├── services/       # AI + PDF services
│           ├── workers/        # BullMQ job processors
│           └── ws/             # WebSocket manager
└── packages/
    └── shared/                 # Shared TypeScript types
```
