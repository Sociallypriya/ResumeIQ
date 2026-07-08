import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../api/apiClient";

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchHistory() {
      try {
        const { data } = await apiClient.get("/resume/history");
        setHistory(data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load history.");
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  return (
    <div className="page">
      <p className="eyebrow">History</p>
      <h1 className="page-title">Past analyses</h1>
      <p className="page-subtitle">Your last 20 resume scans, most recent first.</p>

      {error && <div className="form-error">{error}</div>}

      {loading ? (
        <p style={{ color: "var(--muted)", fontSize: 14 }}>Loading...</p>
      ) : history.length === 0 ? (
        <div className="empty-state card">
          <span className="eyebrow">No scans yet</span>
          Run your first analysis to see it appear here.
        </div>
      ) : (
        history.map((item) => (
          <Link className="history-item" to={`/history/${item._id}`} key={item._id}>
            <div className="history-meta">
              <span className="history-filename">{item.fileName}</span>
              <span className="history-date">
                {new Date(item.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
            <span className="history-score">{item.combinedScore}</span>
          </Link>
        ))
      )}
    </div>
  );
}
