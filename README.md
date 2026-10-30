# ResumeIQ

AI-powered resume analyzer that scores resumes for ATS compatibility, flags formatting issues, and surfaces keyword gaps against a target job description — built with the MERN stack and Google Gemini.

**Live app:** [resumeiq-fgu1.onrender.com](https://resumeiq-fgu1.onrender.com)

---

## Overview

ResumeIQ was built after months of manually iterating on my own resume for job applications — this tool automates that process. Upload a resume (PDF or DOCX), optionally paste a job description, and get back a structured analysis: an ATS compatibility score, missing keywords, formatting issues, and concrete suggestions.

## Features

- **Resume parsing** — extracts text from PDF and DOCX files
- **Repeatable scoring engine** — ATS score is deterministic keyword coverage against the job description; structural checks cover contact info, sections, and length. Gemini provides written feedback, not the score.
- **Keyword gap analysis** — compares resume content against a pasted job description
- **Job-tailored resume drafts** — builds an editable, downloadable draft that emphasizes relevant experience from the source resume without adding unsupported claims
- **JWT authentication** — register/login, protected routes
- **Analysis history** — past scans saved per user in MongoDB
- **Rate limiting** — protects the analysis and resume-drafting endpoints from abuse

## Tech Stack

**Frontend:** React, Vite, React Router, Axios
**Backend:** Node.js, Express, MongoDB (Mongoose), JWT, Multer
**AI:** Google Gemini API (`gemini-2.5-flash`)
**Parsing:** pdf-parse (PDF), mammoth (DOCX)
**Deployment:** Render (Web Service + Static Site)

## Architecture

```
resumeiq/
├── backend/
│   ├── routes/        # auth, resume analysis, history
│   ├── models/        # User, Analysis (MongoDB schemas)
│   ├── middleware/     # JWT auth guard
│   └── utils/          # PDF/DOCX parsing, heuristic checks, Gemini integration
└── frontend/
    ├── src/pages/       # Login, Register, Analyze, History
    ├── src/components/  # Navbar, ResultsPanel, ScoreGauge
    └── src/context/     # Auth state
```

## Design Decisions

- **Deterministic score** — ATS score uses unique, meaningful job-description terms found in the resume. The combined score weights keyword coverage at 70% and structural checks at 30%. With no job description, the structural score is used. Gemini is used for written feedback only, so repeated analyses of the same extracted text and job description have the same score.
- **Structured JSON output** — Gemini is called with `responseMimeType: application/json` and a fixed schema, so the frontend never has to parse free-form text out of a model response.
- **Files deleted after processing** — uploaded resumes are parsed to text and immediately removed from disk; nothing is stored beyond the extracted analysis.
- **Configurable API URL** — the frontend reads `VITE_API_URL` at build time, falling back to `localhost:5000` for local development, so the same codebase deploys cleanly to production without code changes.

## Running Locally

**Backend**
```bash
cd backend
npm install
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET, GEMINI_API_KEY
npm run dev
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```
Runs at `http://localhost:5173`, backend at `http://localhost:5000`.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create an account |
| POST | `/api/auth/login` | Log in |
| POST | `/api/resume/analyze` | Upload + analyze a resume (auth required) |
| GET | `/api/resume/history` | List past analyses (auth required) |
| GET | `/api/resume/history/:id` | Get a single past analysis (auth required) |

---

Built by [Priya Kumari](https://github.com/Sociallypriya)
