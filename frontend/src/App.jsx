import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import ThemeToggle from "./components/ThemeToggle";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Analyze from "./pages/Analyze";
import History from "./pages/History";
import HistoryDetail from "./pages/HistoryDetail";
import Profile from "./pages/Profile";

export default function App() {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("resumeiq_theme");
    if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem("resumeiq_theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-shell">
          <AuthAwareChrome theme={theme} onToggleTheme={toggleTheme} />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/analyze"
              element={
                <ProtectedRoute>
                  <Analyze />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history/:id"
              element={
                <ProtectedRoute>
                  <HistoryDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/analyze" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

function AuthAwareChrome({ theme, onToggleTheme }) {
  const { user } = useAuth();

  return user ? (
    <Navbar theme={theme} onToggleTheme={onToggleTheme} />
  ) : (
    <ThemeToggle theme={theme} onToggle={onToggleTheme} guest />
  );
}
