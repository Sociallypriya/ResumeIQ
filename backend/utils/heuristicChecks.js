const STOP_WORDS = new Set(`a an and are as at be by for from has have in into is it its of on or our that the their this to was were will with you your about across after all also among any apply applying appropriate based best both build can candidate candidates capable company closely collaborate comfortable committed common communicate communication complete comprehensive concepts consider create current demonstrate demonstrated detail different duties effective employment ensure environment equivalent etc example excellent existing familiar field focus focused following general good great highly ideal including incorporate information looking maintain make may minimum must new numerous obtain opportunity other overview part perform plus preferred priority profile provide proven qualifications qualified required requirements responsible responsibilities role seek seeking senior should similar strong successful summary support take teams them there those typical understanding understand use used using various want who work years year`.split(/\s+/));

function tokenize(value) {
  return new Set(
    value
      .normalize("NFKD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .match(/[a-z0-9]+/g)
      ?.filter((token) => token.length > 1 && !STOP_WORDS.has(token)) || []
  );
}

function scoreKeywordAlignment(resumeText, jobDescription, fallbackScore) {
  const requiredKeywords = tokenize(jobDescription);
  if (!requiredKeywords.size) return fallbackScore;

  const resumeKeywords = tokenize(resumeText);
  let matched = 0;
  for (const keyword of requiredKeywords) {
    if (resumeKeywords.has(keyword)) matched += 1;
  }
  return Math.round((matched / requiredKeywords.size) * 100);
}

/** Scores use deterministic text and section checks so identical inputs score identically. */
function runHeuristicChecks(resumeText, jobDescription = "") {
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

  const atsScore = scoreKeywordAlignment(resumeText, jobDescription, score);
  return { atsScore, heuristicScore: score, heuristicIssues: issues, wordCount };
}

module.exports = { runHeuristicChecks };
