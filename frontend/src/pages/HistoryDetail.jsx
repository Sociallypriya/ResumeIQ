import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import apiClient from "../api/apiClient";
import ResultsPanel from "../components/ResultsPanel";

export default function HistoryDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchDetail() {
      try {
        const { data } = await apiClient.get(`/resume/history/${id}`);
        setData(data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load analysis.");
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
  }, [id]);

  return (
    <div className="page">
      <p className="eyebrow">
        <Link to="/history" style={{ color: "inherit", textDecoration: "none" }}>
          ← History
        </Link>
      </p>
      <h1 className="page-title">{data?.fileName || "Analysis"}</h1>
      <p className="page-subtitle">
        {data ? new Date(data.createdAt).toLocaleString() : ""}
      </p>

      {error && <div className="form-error">{error}</div>}
      {loading ? (
        <p style={{ color: "var(--muted)", fontSize: 14 }}>Loading...</p>
      ) : (
        <ResultsPanel data={data} animate={false} />
      )}
    </div>
  );
}
