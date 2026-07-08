import { useRef, useState } from "react";
import apiClient from "../api/apiClient";
import ResultsPanel from "../components/ResultsPanel";

export default function Analyze() {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const inputRef = useRef(null);

  function handleFileChange(selected) {
    if (!selected) return;
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(selected.type)) {
      setError("Please upload a PDF or DOCX file.");
      return;
    }
    setError("");
    setFile(selected);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragActive(false);
    handleFileChange(e.dataTransfer.files?.[0]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) {
      setError("Please select a resume file first.");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("resume", file);
    if (jobDescription.trim()) {
      formData.append("jobDescription", jobDescription.trim());
    }

    try {
      const { data } = await apiClient.post("/resume/analyze", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || "Analysis failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <p className="eyebrow">Analyze</p>
      <h1 className="page-title">Scan your resume</h1>
      <p className="page-subtitle">
        Upload a PDF or DOCX resume. Add a job description to check keyword
        alignment, or leave it blank for general feedback.
      </p>

      <form className="card" onSubmit={handleSubmit}>
        {error && <div className="form-error">{error}</div>}

        <div
          className={`dropzone${dragActive ? " drag-active" : ""}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx"
            style={{ display: "none" }}
            onChange={(e) => handleFileChange(e.target.files?.[0])}
          />
          {file ? (
            <div className="dropzone-filename">{file.name}</div>
          ) : (
            <>
              <div style={{ fontWeight: 600, fontSize: 14 }}>
                Click to choose a file, or drag it here
              </div>
              <div className="dropzone-hint">PDF or DOCX, up to 5MB</div>
            </>
          )}
        </div>

        <div className="form-field" style={{ marginTop: 20 }}>
          <label className="form-label" htmlFor="jd">
            Job description (optional)
          </label>
          <textarea
            id="jd"
            className="form-textarea"
            placeholder="Paste the job description to check keyword alignment..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
        </div>

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading && <span className="spinner" />}
          {loading ? "Scanning..." : "Run analysis"}
        </button>
      </form>

      {result && (
        <div style={{ marginTop: 28 }}>
          <ResultsPanel data={result} animate />
        </div>
      )}
    </div>
  );
}
