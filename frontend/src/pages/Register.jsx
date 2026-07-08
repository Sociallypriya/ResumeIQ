import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(name, email, password);
      navigate("/analyze");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page page-narrow">
      <p className="eyebrow">Create account</p>
      <h1 className="page-title">Get started</h1>
      <p className="page-subtitle">Create an account to start analyzing resumes.</p>

      <form className="card" onSubmit={handleSubmit}>
        {error && <div className="form-error">{error}</div>}

        <div className="form-field">
          <label className="form-label" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            type="text"
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

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
            minLength={6}
          />
        </div>

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading && <span className="spinner" />}
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="form-footer-link">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}
