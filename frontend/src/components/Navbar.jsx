import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  function handleLogout() {
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
          <button className="nav-logout" onClick={handleLogout}>
            Log out
          </button>
        </nav>
      </div>
    </header>
  );
}
