const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Sends resume text (and optional job description) to Gemini and
 * gets back a structured analysis. We force JSON output via
 * responseMimeType so the frontend can render it directly.
 */
async function analyzeResumeWithLLM(resumeText, jobDescription = "") {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.3,
    },
  });

  const systemPrompt = `You are an expert technical recruiter and ATS specialist.
You will be given a resume, and optionally a job description.
Analyze the resume and respond with ONLY valid JSON — no markdown, no preamble, no code fences.

Return JSON in exactly this shape:
{
  "atsScore": <number 0-100>,
  "summary": "<2-3 sentence overall assessment>",
  "strengths": ["<point>", "..."],
  "weaknesses": ["<point>", "..."],
  "missingKeywords": ["<keyword>", "..."],
  "formattingIssues": ["<issue>", "..."],
  "suggestions": ["<actionable suggestion>", "..."]
}

Rules:
- atsScore should reflect how well the resume would pass an automated screen AND appeal to a human reviewer.
- If a job description is provided, missingKeywords MUST be keywords from the JD not present in the resume.
- If no job description is provided, missingKeywords should be generic high-value keywords missing for the candidate's apparent field.
- Keep each array to 3-6 concise items.
- Do not invent facts not implied by the resume text.`;

  const userPrompt = jobDescription
    ? `RESUME:\n${resumeText}\n\nJOB DESCRIPTION:\n${jobDescription}`
    : `RESUME:\n${resumeText}\n\n(No job description provided — give general feedback for the candidate's field.)`;

  const result = await model.generateContent([
    { text: systemPrompt },
    { text: userPrompt },
  ]);

  const raw = result.response.text();

  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error("LLM returned malformed JSON: " + err.message);
  }
}

module.exports = { analyzeResumeWithLLM };