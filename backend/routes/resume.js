const express = require("express");
const multer = require("multer");
const rateLimit = require("express-rate-limit");
const fs = require("fs");
const path = require("path");

const { verifyToken } = require("../middleware/auth");
const { extractResumeText } = require("../utils/parseResume");
const { runHeuristicChecks } = require("../utils/heuristicChecks");
const {
  analyzeResumeWithLLM,
  buildTailoredResumeWithLLM,
} = require("../utils/llmAnalyze");
const Analysis = require("../models/Analysis");

const router = express.Router();

// --- Multer setup: store uploads temporarily on disk ---
const upload = multer({
  dest: path.join(__dirname, "..", "uploads"),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only PDF and DOCX files are allowed."));
    }
    cb(null, true);
  },
});

// --- Rate limit: protect the expensive LLM route from abuse ---
const analyzeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per user IP per window
  message: { message: "Too many analysis requests. Please try again later." },
});

const tailorLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: "Too many resume draft requests. Please try again later." },
});

// POST /api/resume/analyze
router.post(
  "/analyze",
  verifyToken,
  analyzeLimiter,
  upload.single("resume"),
  async (req, res) => {
    let filePath;
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No resume file uploaded." });
      }
      filePath = req.file.path;

      const jobDescription = req.body.jobDescription || "";
      const requestedLabel = (req.body.analysisLabel || "").trim();
      const jobTitle = jobDescription
        .split(/\r?\n/)
        .map((line) => line.replace(/^\s*(?:#+|[-*•])\s*/, "").trim())
        .find((line) => line.length > 0);
      const analysisLabel = (requestedLabel || jobTitle || "General resume review")
        .replace(/\s+/g, " ")
        .slice(0, 80);

      // 1. Extract text from PDF/DOCX
      const resumeText = await extractResumeText(filePath, req.file.mimetype);

      if (resumeText.length < 50) {
        return res.status(422).json({
          message: "Could not extract meaningful text. Try a different file.",
        });
      }

      // 2. Deterministic heuristic checks (fast, free, no API call)
      const { atsScore, heuristicScore, heuristicIssues, wordCount } =
        runHeuristicChecks(resumeText, jobDescription);

      // 3. LLM-based analysis (semantic, context-aware)
      const llmResult = await analyzeResumeWithLLM(resumeText, jobDescription);

      // 4. Combine deterministic keyword alignment with structural checks.
      const combinedScore = Math.round(
        atsScore * 0.7 + heuristicScore * 0.3
      );

      // 5. Persist to history
      const savedAnalysis = await Analysis.create({
        user: req.user.id,
        fileName: req.file.originalname,
        analysisLabel: analysisLabel || undefined,
        jobDescriptionProvided: Boolean(jobDescription),
        atsScore,
        heuristicScore,
        combinedScore,
        summary: llmResult.summary,
        strengths: llmResult.strengths,
        weaknesses: llmResult.weaknesses,
        missingKeywords: llmResult.missingKeywords,
        formattingIssues: [...llmResult.formattingIssues, ...heuristicIssues],
        suggestions: llmResult.suggestions,
      });

      res.json({
        analysisId: savedAnalysis._id,
        analysisLabel: savedAnalysis.analysisLabel,
        combinedScore,
        atsScore,
        heuristicScore,
        wordCount,
        summary: llmResult.summary,
        strengths: llmResult.strengths,
        weaknesses: llmResult.weaknesses,
        missingKeywords: llmResult.missingKeywords,
        formattingIssues: [...llmResult.formattingIssues, ...heuristicIssues],
        suggestions: llmResult.suggestions,
      });
    } catch (err) {
      console.error("Analysis error:", err);
      res.status(500).json({ message: "Analysis failed.", error: err.message });
    } finally {
      // Always clean up the uploaded file from disk
      if (filePath && fs.existsSync(filePath)) {
        fs.unlink(filePath, () => {});
      }
    }
  }
);

// POST /api/resume/tailor
router.post(
  "/tailor",
  verifyToken,
  tailorLimiter,
  upload.single("resume"),
  async (req, res) => {
    let filePath;
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Please upload your resume again to build a tailored draft." });
      }
      filePath = req.file.path;
      const jobDescription = (req.body.jobDescription || "").trim();
      if (!jobDescription) {
        return res.status(400).json({ message: "Add a job description to build a tailored resume." });
      }

      const resumeText = await extractResumeText(filePath, req.file.mimetype);
      if (resumeText.length < 50) {
        return res.status(422).json({
          message: "Could not extract meaningful text. Try a different file.",
        });
      }

      const draft = await buildTailoredResumeWithLLM(resumeText, jobDescription);
      res.json({ draft });
    } catch (err) {
      console.error("Resume tailoring error:", err);
      res.status(500).json({ message: "Could not build the tailored resume. Please try again." });
    } finally {
      if (filePath && fs.existsSync(filePath)) {
        fs.unlink(filePath, () => {});
      }
    }
  }
);

// GET /api/resume/history
router.get("/history", verifyToken, async (req, res) => {
  try {
    const history = await Analysis.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch history.", error: err.message });
  }
});

// GET /api/resume/history/:id
router.get("/history/:id", verifyToken, async (req, res) => {
  try {
    const record = await Analysis.findOne({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!record) return res.status(404).json({ message: "Analysis not found." });
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch analysis.", error: err.message });
  }
});

module.exports = router;
