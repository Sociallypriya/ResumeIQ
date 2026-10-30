import { useEffect, useState } from "react";
import apiClient from "../api/apiClient";
import { useAuth } from "../context/AuthContext";

function initials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [createdAt, setCreatedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;
    apiClient
      .get("/auth/profile")
      .then(({ data }) => {
        if (!active) return;
        setName(data.user.name);
        setEmail(data.user.email);
        setCreatedAt(data.user.createdAt);
        updateUser(data.user);
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || "Could not load your profile.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [updateUser]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const { data } = await apiClient.patch("/auth/profile", { name, email });
      setName(data.user.name);
      setEmail(data.user.email);
      setCreatedAt(data.user.createdAt);
      updateUser(data.user);
      setSuccess("Profile updated successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Could not update your profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="page profile-page">
      <p className="eyebrow">Your account</p>
      <h1 className="page-title">Profile</h1>
      <p className="page-subtitle">Manage the name and email linked to your ResumeIQ account.</p>

      <section className="card profile-card" aria-label="Profile details">
        <div className="profile-summary">
          <div className="profile-avatar" aria-hidden="true">{initials(name) || "U"}</div>
          <div className="profile-summary-text">
            <h2>{name || "Your profile"}</h2>
            <p>{email}</p>
            {createdAt && (
              <span>Member since {new Date(createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })}</span>
            )}
          </div>
        </div>

        <form className="profile-form" onSubmit={handleSubmit}>
          {error && <div className="form-error" role="alert">{error}</div>}
          {success && <div className="form-success" role="status">{success}</div>}

          <div className="form-field">
            <label className="form-label" htmlFor="profile-name">Name</label>
            <input
              id="profile-name"
              className="form-input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={80}
              autoComplete="name"
              required
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="profile-email">Email</label>
            <input
              id="profile-email"
              className="form-input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              maxLength={254}
              autoComplete="email"
              required
            />
          </div>

          <button className="btn-primary profile-save" type="submit" disabled={loading || saving}>
            {saving && <span className="spinner" />}
            {loading ? "Loading profile..." : saving ? "Saving..." : "Save changes"}
          </button>
        </form>
      </section>
    </main>
  );
}
