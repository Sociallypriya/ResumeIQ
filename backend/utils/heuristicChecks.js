/**
 * Deterministic, rule-based ATS checks.
 * Kept separate from the LLM score so the result isn't purely
 * "black box" — combining heuristic + LLM makes the score defensible
 * and cheaper to compute (no API call needed for these checks).
 */
function runHeuristicChecks(resumeText) {
  const issues = [];
  const wordCount = resumeText.split(/\s+/).filter(Boolean).length;

  // Length check
  if (wordCount < 150) {
    issues.push("Resume seems too short — ATS systems may flag thin content.");
  }
  if (wordCount > 1200) {
    issues.push("Resume is quite long — consider trimming to 1-2 pages worth of content.");
  }

  // Contact info presence
  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(resumeText);
  if (!hasEmail) issues.push("No email address detected.");

  const hasPhone = /(\+?\d[\d\s-]{8,}\d)/.test(resumeText);
  if (!hasPhone) issues.push("No phone number detected.");

  // Common ATS-unfriendly patterns
  if (/table|tab-delimited/i.test(resumeText)) {
    issues.push("Possible table usage detected — tables can break ATS parsing.");
  }

  // Section presence (basic keyword check)
  const sections = ["experience", "education", "skills", "projects"];
  const missingSections = sections.filter(
    (s) => !new RegExp(s, "i").test(resumeText)
  );
  if (missingSections.length > 0) {
    issues.push(`Missing or unlabeled sections: ${missingSections.join(", ")}`);
  }

  // Simple heuristic score out of 100
  let score = 100;
  score -= issues.length * 10;
  score = Math.max(0, Math.min(100, score));

  return { heuristicScore: score, heuristicIssues: issues, wordCount };
}

module.exports = { runHeuristicChecks };
