import { useState } from "react";
import apiClient from "../api/apiClient";
import { downloadResumePdf } from "../utils/downloadResumePdf";

export default function ResumeBuilder({ file, jobDescription }) {
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canBuild = Boolean(file && jobDescription.trim());

  async function handleBuild() {
    if (!canBuild) return;

    setError("");
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("jobDescription", jobDescription.trim());
      const { data } = await apiClient.post("/resume/tailor", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setDraft(data.draft);
    } catch (err) {
      setError(err.response?.data?.message || "Could not build the resume draft. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    const baseName = file?.name.replace(/\.[^.]+$/, "") || "resume";
    downloadResumePdf(draft, `${baseName}-tailored.pdf`);
  }

  return (
    <section className="resume-builder result-section" aria-labelledby="resume-builder-title">
      <div className="resume-builder-heading">
        <div>
          <h3 id="resume-builder-title">Build a job-tailored resume</h3>
          <p className="resume-builder-description">
            Create an editable draft that emphasizes relevant details from your resume.
          </p>
        </div>
        <button
          className="btn-primary resume-builder-button"
          type="button"
          onClick={handleBuild}
          disabled={!canBuild || loading}
        >
          {loading && <span className="spinner" />}
          {loading ? "Building draft..." : draft ? "Regenerate draft" : "Build my resume"}
        </button>
      </div>

      {!canBuild && (
        <p className="resume-builder-hint">
          Add a job description and upload a resume to build a tailored draft.
        </p>
      )}
      {error && <div className="form-error">{error}</div>}

      {draft && (
        <>
          <label className="form-label" htmlFor="resume-draft">
            Draft resume — edit before using
          </label>
          <textarea
            id="resume-draft"
            className="form-textarea resume-draft-textarea"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <div className="resume-builder-actions">
            <p className="resume-builder-hint">
              Review every detail to make sure it accurately reflects your experience.
            </p>
            <button className="btn-secondary" type="button" onClick={handleDownload}>
              Download PDF
            </button>
          </div>
        </>
      )}
    </section>
  );
}
