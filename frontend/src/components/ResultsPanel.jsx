import { useEffect, useState } from "react";
import ScoreGauge from "./ScoreGauge";

export default function ResultsPanel({ data, animate = true }) {
  const [showScan, setShowScan] = useState(animate);

  useEffect(() => {
    if (!animate) return;
    const t = setTimeout(() => setShowScan(false), 1500);
    return () => clearTimeout(t);
  }, [animate]);

  if (!data) return null;

  return (
    <div className="scan-stage card">
      {showScan && <div className="scan-line" />}

      <ScoreGauge score={data.combinedScore} />

      <div className="result-section">
        <h3>Summary</h3>
        <p style={{ margin: 0, fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.6 }}>
          {data.summary}
        </p>
      </div>

      <div className="results-grid">
        <div className="result-section">
          <h3>Strengths</h3>
          <ul className="result-list">
            {(data.strengths || []).map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>

        <div className="result-section">
          <h3>Weaknesses</h3>
          <ul className="result-list">
            {(data.weaknesses || []).map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="result-section">
        <h3>Missing keywords</h3>
        <div className="tag-row">
          {(data.missingKeywords || []).map((k, i) => (
            <span className="tag" key={i}>
              {k}
            </span>
          ))}
        </div>
      </div>

      <div className="result-section">
        <h3>Formatting issues</h3>
        <ul className="result-list">
          {(data.formattingIssues || []).map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </div>

      <div className="result-section">
        <h3>Suggestions</h3>
        <ul className="result-list">
          {(data.suggestions || []).map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
