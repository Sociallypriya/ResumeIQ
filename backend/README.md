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
- `POST /api/auth/register` — { name, email, password } → { token, user }
- `POST /api/auth/login` — { email, password } → { token, user }

### Resume Analysis (requires `Authorization: Bearer <token>`)
- `POST /api/resume/analyze` — multipart/form-data
  - `resume` (file: PDF or DOCX, max 5MB)
  - `jobDescription` (optional text field)
  - Returns: combinedScore, atsScore, heuristicScore, summary, strengths,
    weaknesses, missingKeywords, formattingIssues, suggestions
- `GET /api/resume/history` — last 20 analyses for the logged-in user
- `GET /api/resume/history/:id` — single analysis by id

## Design decisions (for interview talking points)
1. **Heuristic + LLM hybrid score** — heuristic checks (contact info,
   section presence, length) are free and deterministic; the LLM adds
   semantic understanding (does this resume actually sound strong).
   Combined 70/30 weighted toward LLM.
2. **Structured JSON output** — used `response_format: json_object` so
   the frontend never has to regex-parse free text out of a model reply.
3. **Rate limiting on `/analyze`** — protects against cost abuse since
   each call hits a paid LLM API.
4. **Files deleted after processing** — uploaded resumes are parsed to
   text then removed from disk immediately (privacy + storage cost).
5. **JWT auth reused from NEST** — same middleware pattern, so this was
   fast to bolt on and is consistent across your projects.

## Next steps (frontend, day 2)
- Upload form (drag-and-drop) + optional JD textarea
- Results dashboard: score gauge, tag list for keywords, suggestion cards
- History page reusing your NEST-style list/table components
