import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/analyze");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page page-narrow">
      <p className="eyebrow">Sign in</p>
      <h1 className="page-title">Welcome back</h1>
      <p className="page-subtitle">Log in to analyze your resume.</p>

      <form className="card" onSubmit={handleSubmit}>
        {error && <div className="form-error">{error}</div>}

        <div className="form-field">
          <label className="form-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading && <span className="spinner" />}
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>

      <p className="form-footer-link">
        Don't have an account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
}
