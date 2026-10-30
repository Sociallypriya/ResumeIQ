import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";

export default function Navbar({ theme, onToggleTheme }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  if (!user) return null;

  function handleLogout() {
    setAccountMenuOpen(false);
    logout();
    navigate("/login");
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="brand">
          Resume<span className="brand-iq">IQ</span>
        </div>
        <nav className="nav-links">
          <NavLink
            to="/analyze"
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
          >
            Analyze
          </NavLink>
          <NavLink
            to="/history"
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
          >
            History
          </NavLink>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <div
            className="account-menu-wrap"
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setAccountMenuOpen(false);
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") setAccountMenuOpen(false);
            }}
          >
            <button
              className="profile-avatar-button"
              type="button"
              aria-label="Open account menu"
              aria-expanded={accountMenuOpen}
              aria-controls="account-menu"
              onClick={() => setAccountMenuOpen((open) => !open)}
            >
              {user.name?.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "U"}
            </button>
            {accountMenuOpen && (
              <div className="account-menu" id="account-menu">
                <div className="account-menu-identity">
                  <strong>{user.name}</strong>
                  <span>{user.email}</span>
                </div>
                <Link
                  className="account-menu-item"
                  to="/profile"
                  onClick={() => setAccountMenuOpen(false)}
                >
                  Profile settings
                </Link>
                <button className="account-menu-item" type="button" onClick={handleLogout}>
                  Log out
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
