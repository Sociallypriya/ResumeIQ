const fs = require("fs");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

/**
 * Extracts raw text from an uploaded resume file (PDF or DOCX).
 * @param {string} filePath - path to the uploaded file on disk
 * @param {string} mimetype - mimetype from multer
 * @returns {Promise<string>} extracted plain text
 */
async function extractResumeText(filePath, mimetype) {
  const buffer = fs.readFileSync(filePath);

  if (mimetype === "application/pdf") {
    const data = await pdfParse(buffer);
    return cleanText(data.text);
  }

  if (
    mimetype ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return cleanText(result.value);
  }

  throw new Error("Unsupported file type. Please upload a PDF or DOCX file.");
}

function cleanText(text) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

module.exports = { extractResumeText };
