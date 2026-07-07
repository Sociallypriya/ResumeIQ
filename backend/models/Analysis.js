const mongoose = require("mongoose");

const analysisSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fileName: { type: String, required: true },
    jobDescriptionProvided: { type: Boolean, default: false },
    atsScore: { type: Number, required: true },
    heuristicScore: { type: Number, required: true },
    combinedScore: { type: Number, required: true },
    summary: { type: String },
    strengths: [String],
    weaknesses: [String],
    missingKeywords: [String],
    formattingIssues: [String],
    suggestions: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Analysis", analysisSchema);
