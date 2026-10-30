# ResumeIQ — Backend

## Setup
```bash
cd backend
npm install
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET, OPENAI_API_KEY
npm run dev
```

## API Endpoints

### Auth
- `POST /api/auth/register` — { name, email, password } → { message } (account created; log in separately)
- `POST /api/auth/login` — { email, password } → { token, user }

### Resume Analysis (requires `Authorization: Bearer <token>`)
- `POST /api/resume/analyze` — multipart/form-data
  - `resume` (file: PDF or DOCX, max 5MB)
  - `jobDescription` (optional text field)
  - Returns: combinedScore, atsScore, heuristicScore, summary, strengths,
    weaknesses, missingKeywords, formattingIssues, suggestions
- `POST /api/resume/tailor` — multipart/form-data
  - `resume` (file: PDF or DOCX, max 5MB)
  - `jobDescription` (required text field)
  - Returns an editable plain-text resume draft; source files are deleted after processing.
- `GET /api/resume/history` — last 20 analyses for the logged-in user
- `GET /api/resume/history/:id` — single analysis by id

## Design decisions (for interview talking points)
1. **Deterministic scoring** — ATS score is the percentage of unique, meaningful
   job-description terms found in the resume; the combined score weights this 70%
   and structural checks 30%. Gemini supplies written feedback, not the score.
2. **Structured JSON output** — used `response_format: json_object` so
   the frontend never has to regex-parse free text out of a model reply.
3. **Files deleted after processing** — uploaded resumes are parsed to
   text then removed from disk immediately (privacy + storage cost).
4. **JWT auth reused from NEST** — same middleware pattern, so this was
   fast to bolt on and is consistent across your projects.

## Next steps (frontend, day 2)
- Upload form (drag-and-drop) + optional JD textarea
- Results dashboard: score gauge, tag list for keywords, suggestion cards
- History page reusing your NEST-style list/table components
