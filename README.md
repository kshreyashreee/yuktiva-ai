<div align="center">

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=32&pause=1000&color=7C3AED&center=true&vCenter=true&width=700&lines=%E2%9A%A1+Yuktiva+AI;Multi-Agent+Content+Operations;ET+GenAI+Hackathon+2026" alt="Typing SVG" />

<br/>

**Phase 2 Prototype Submission — ET GenAI Hackathon 2026**  
**Problem Statement 1: AI for Enterprise Content Operations**

*Multi-agent system automating content creation, compliance review, localization & distribution.*

<br/>

[![License: MIT](https://img.shields.io/badge/License-MIT-violet.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-brightgreen)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org)
[![Groq](https://img.shields.io/badge/Powered%20by-Groq%20LLaMA%203.3-orange)](https://groq.com)
[![Hackathon](https://img.shields.io/badge/ET%20GenAI-Hackathon%202026-purple)](https://economictimes.com)

<br/>

[📖 Setup Guide](#-local-setup) · [🏗️ Architecture](#️-architecture) 

</div>

## 🎯 What is Yuktiva AI?

**Yuktiva AI** is a production-grade multi-agent platform that automates the complete enterprise content lifecycle — from raw product specifications to fully-compliant, localized, multi-channel content — powered by **Groq's ultra-fast LLaMA 3.3 70B**, with human-in-the-loop approval gates.

### Core Capabilities

| Pipeline | Agents | What it does |
|---|---|---|
| 🚀 **Product Launch** | 5 agents | Spec → Blog + Social + FAQ + Ad copy + Localization + Distribution plan |
| 🔍 **Fact Check** | 3 agents | Content → Claim extraction → Cross-verification → Credibility report |
| 📊 **Strategy Pivot** | 3 agents | Analytics → Insights → Recommendations → 4-week content calendar |
| 🛡️ **Compliance Review** | 3 agents | Content → Violation scan → Compliant rewrite → Audit report |

### Smart Model Routing (Cost Efficiency Bonus)

| Task | Model Used | Why |
|---|---|---|
| Drafter, Compliance, Research, Strategy | `llama-3.3-70b-versatile` | Complex reasoning, long outputs |
| Localizer, Publisher, Calendar, Audit Report | `llama-3.1-8b-instant` | Fast transforms, structured output |

This dual-model routing achieves **comparable results at ~40% lower cost** — directly scoring the hackathon's cost-efficiency bonus criterion.

---
## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        YUKTIVA AI PLATFORM                       │
│                                                                   │
│  ┌─────────────┐    SSE Stream    ┌────────────────────────────┐ │
│  │   React UI   │ ◄────────────── │     Express.js Server       │ │
│  │  (Vite 5)   │ ────POST /run──► │     (Node.js 18+)           │ │
│  └─────────────┘                  └────────────┬───────────────┘ │
│                                                │                  │
│                              ┌─────────────────▼──────────────┐  │
│                              │   Groq API (LLaMA 3.3 / 3.1)   │  │
│                              │   llama-3.3-70b-versatile (L)   │  │
│                              │   llama-3.1-8b-instant    (S)   │  │
│                              └─────────────────────────────────┘  │
│                                                                   │
│   PRODUCT LAUNCH PIPELINE:                                        │
│   ①Drafter(L)→②Localizer(S)→③BrandReview(S)→④Compliance(L)→⑤Publisher(S) │
│                              ▼                                    │
│              👤 HUMAN APPROVAL GATE                              │
│                              ▼                                    │
│              Published to Social Channels                         │
└─────────────────────────────────────────────────────────────────┘
```

---
<!--## 🚀 Live Demo

> 🌐 Web App: *[Coming Soon]*
> 🎬 Pitch Video: *[Coming Soon]* --->


**Demo credentials (auto-seeded on first run):**

| Role | Email | Password |
|---|---|---|
| 🔴 Admin | `admin@yuktiva.ai` | `admin123` |
| 🟢 User | `alice@company.com` | `pass123` |
| 🟢 User | `bob@company.com` | `pass123` |

---

## 💻 Local Setup

### Prerequisites

| Tool | Version | Download |
|---|---|---|
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| npm | 9+ | Included with Node.js |
| Groq API Key | Free | [console.groq.com](https://console.groq.com) |

### Get Your Free Groq API Key

1. Go to **[console.groq.com](https://console.groq.com)**
2. Sign up (free, no credit card needed)
3. Click **API Keys** → **Create API Key**
4. Copy the key starting with `gsk_...`

---

### 🪟 Windows

```powershell
git clone https://github.com/YOUR_USERNAME/yuktiva-ai.git
cd yuktiva-ai

# Set up environment
copy .env.example .env
# Open .env in Notepad, set: GROQ_API_KEY=gsk_your_key_here

# Install dependencies
cd server; npm install; cd ../client; npm install; cd ..

# Start both servers
npm run dev
# Frontend → http://localhost:5173
# Backend  → http://localhost:3001
```

### 🍎 macOS / 🐧 Linux

```bash
git clone https://github.com/YOUR_USERNAME/yuktiva-ai.git
cd yuktiva-ai

cp .env.example .env
nano .env   # set GROQ_API_KEY=gsk_your_key_here

cd server && npm install && cd ../client && npm install && cd ..
npm run dev
```

### ⚙️ .env Configuration

```env
# REQUIRED — free from https://console.groq.com/
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

PORT=3001
NODE_ENV=development
JWT_SECRET=any-long-random-string
CLIENT_URL=http://localhost:5173
```

---

## ☁️ Deployment

### Vercel (Frontend) + Railway (Backend)

```bash
# Backend → Railway
npm i -g @railway/cli
railway login && railway init && railway up
# Set env vars: GROQ_API_KEY, JWT_SECRET, PORT, NODE_ENV=production, CLIENT_URL

# Frontend → Vercel
cd client && npm run build
npm i -g vercel && vercel --prod
```

### Render (Fullstack)

Set build: `cd server && npm install`  
Set start: `node server/index.js`  
Add all env vars in Render dashboard.

---

## 🧭 Navigation Guide

1. **Login** → Use demo button → Sign In
2. **Create Project** → New Project → fill name + about section
3. **Run Pipeline** → Open project → click any pipeline card → enter content → **Run Pipeline**
4. **Watch agents** work in real-time on the right panel
5. **Review in Approval Gate** → approve/reject each content item
6. **Documents tab** → upload PDFs/DOCX to use as pipeline context
7. **System Logs** → live log viewer, download `.log` file (Admin only)
8. **Social Connect** → save platform handles per project

---

## 📁 File Structure

```
yuktiva-ai/
├── .env.example              ← copy to .env, add GROQ_API_KEY
├── README.md
├── package.json              ← root scripts (npm run dev)
├── server/
│   ├── index.js              ← Express entry point
│   ├── package.json          ← includes groq-sdk
│   ├── routes/
│   │   ├── pipeline.js       ← 🤖 All AI agents (Groq-powered)
│   │   ├── auth.js, projects.js, documents.js, logs.js
│   ├── middleware/auth.js    ← JWT verification
│   └── utils/logger.js, fileParser.js
└── client/
    └── src/
        ├── App.jsx, main.jsx
        ├── pages/            ← 11 pages
        ├── components/       ← Layout, Pipeline, Documents, etc.
        └── services/api.js   ← all HTTP calls
```

---

## 🔧 Tech Stack

| Layer | Technology |
|---|---|
| **AI / LLM** | Groq API — `llama-3.3-70b-versatile` + `llama-3.1-8b-instant` |
| **Model Routing** | Large model for reasoning; Small model for transforms |
| **Backend** | Node.js 18 + Express.js |
| **Auth** | JWT + bcrypt, RBAC (user/admin) |
| **File Parsing** | pdf-parse, mammoth, native FS |
| **Streaming** | Server-Sent Events (SSE) |
| **Logging** | Winston (file + in-memory buffer) |
| **Frontend** | React 18 + Vite 5 + Tailwind CSS 3 |

---

## 📄 License

MIT — ET GenAI Hackathon 2026

---

<div align="center">
⚡ <b>Yuktiva AI</b> — Smart. Compliant. Fast. Powered by AI.
</div>
