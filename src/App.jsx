// src/App.jsx
import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { applyTheme, getInitialTheme } from "./lib/theme";

// AUTH (moved)
import Login from "./pages/auth/Login.jsx";
import ForgotPassword from "./pages/auth/ForgotPassword.jsx";
import ResetPassword from "./pages/auth/ResetPassword.jsx";
import VerifyEmail from "./pages/auth/VerifyEmail.jsx";
import MetaCallback from "./pages/auth/MetaCallback.jsx";

// MAIN (still root pages)
import Dashboard from "./pages/Dashboard.jsx";
import Inbox from "./pages/Inbox.jsx";
import ConversationDetail from "./pages/ConversationDetail.jsx";
import Publisher from "./pages/Publisher.jsx";
import Analytics from "./pages/Analytics.jsx";
import Contacts from "./pages/Contacts.jsx";
import Calendar from "./pages/Calendar.jsx";

// SETTINGS (root pages)
import Settings from "./pages/Settings.jsx";
import InboxRules from "./pages/InboxRules.jsx";
import TeamRoles from "./pages/TeamRoles.jsx";

// WORKSPACES (moved)
import WorkspacesList from "./pages/workspaces/WorkspacesList.jsx";
import CreateWorkspace from "./pages/workspaces/CreateWorkspace.jsx";
import WorkspaceOverview from "./pages/workspaces/WorkspaceOverview.jsx";
import WorkspaceTeam from "./pages/workspaces/WorkspaceTeam.jsx";
import WorkspaceSettings from "./pages/workspaces/WorkspaceSettings.jsx";

// CONNECTIONS (moved)
import ChannelConnections from "./pages/connections/ChannelConnections.jsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.jsx";
import TermsConditions from "./pages/TermsConditions.jsx";

function isAuthed() {
  return !!localStorage.getItem("access_token");
}

function RequireAuth({ children }) {
  if (!isAuthed()) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const [theme, setTheme] = useState(getInitialTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <Routes>
      {/* Default */}
      <Route
        path="/"
        element={<Navigate to={isAuthed() ? "/workspaces" : "/login"} replace />}
      />

      {/* Auth */}
      <Route path="/login" element={<Login theme={theme} setTheme={setTheme} />} />
      <Route
        path="/forgot-password"
        element={<ForgotPassword theme={theme} setTheme={setTheme} />}
      />
      <Route
        path="/verify-email"
        element={<VerifyEmail theme={theme} setTheme={setTheme} />}
      />
      <Route
        path="/reset-password"
        element={<ResetPassword theme={theme} setTheme={setTheme} />}
      />

      {/* ✅ Meta callback (redirectUri points here) */}
      <Route
        path="/auth/meta/callback"
        element={
          <RequireAuth>
            <MetaCallback />
          </RequireAuth>
        }
      />

      {/* Main */}
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <Dashboard theme={theme} setTheme={setTheme} />
          </RequireAuth>
        }
      />
      <Route
        path="/inbox"
        element={
          <RequireAuth>
            <Inbox theme={theme} setTheme={setTheme} />
          </RequireAuth>
        }
      />
      <Route
        path="/conversations/:id"
        element={
          <RequireAuth>
            <ConversationDetail theme={theme} setTheme={setTheme} />
          </RequireAuth>
        }
      /><Route path="/privacy-policy" element={<PrivacyPolicy theme={theme} setTheme={setTheme} />} />
<Route path="/terms" element={<TermsConditions theme={theme} setTheme={setTheme} />} />
      <Route
        path="/publisher"
        element={
          <RequireAuth>
            <Publisher theme={theme} setTheme={setTheme} />
          </RequireAuth>
        }
      />
      <Route
        path="/calendar"
        element={
          <RequireAuth>
            <Calendar theme={theme} setTheme={setTheme} />
          </RequireAuth>
        }
      />
      <Route
        path="/analytics"
        element={
          <RequireAuth>
            <Analytics theme={theme} setTheme={setTheme} />
          </RequireAuth>
        }
      />
      <Route
        path="/contacts"
        element={
          <RequireAuth>
            <Contacts theme={theme} setTheme={setTheme} />
          </RequireAuth>
        }
      />

      {/* ✅ GLOBAL Connections page (no workspace required) */}
      <Route
        path="/connections"
        element={
          <RequireAuth>
            <ChannelConnections theme={theme} setTheme={setTheme} />
          </RequireAuth>
        }
      />

      {/* Settings */}
      <Route
        path="/settings"
        element={
          <RequireAuth>
            <Settings theme={theme} setTheme={setTheme} />
          </RequireAuth>
        }
      />
      <Route
        path="/settings/inbox-rules"
        element={
          <RequireAuth>
            <InboxRules theme={theme} setTheme={setTheme} />
          </RequireAuth>
        }
      />
      <Route
        path="/settings/team-roles"
        element={
          <RequireAuth>
            <TeamRoles theme={theme} setTheme={setTheme} />
          </RequireAuth>
        }
      />

      {/* Workspaces */}
      <Route
        path="/workspaces"
        element={
          <RequireAuth>
            <WorkspacesList theme={theme} setTheme={setTheme} />
          </RequireAuth>
        }
      />
      <Route path="/workspaces/create" element={<Navigate to="/workspaces/new" replace />} />
      <Route
        path="/workspaces/new"
        element={
          <RequireAuth>
            <CreateWorkspace theme={theme} setTheme={setTheme} />
          </RequireAuth>
        }
      />

      {/* Workspace children */}
      <Route
        path="/workspaces/:workspaceId/team"
        element={
          <RequireAuth>
            <WorkspaceTeam theme={theme} setTheme={setTheme} />
          </RequireAuth>
        }
      />

      {/* ✅ Workspace Connections (still supported) */}
      <Route
        path="/workspaces/:workspaceId/connections"
        element={
          <RequireAuth>
            <ChannelConnections theme={theme} setTheme={setTheme} />
          </RequireAuth>
        }
      />

      <Route
        path="/workspaces/:workspaceId/settings"
        element={
          <RequireAuth>
            <WorkspaceSettings theme={theme} setTheme={setTheme} />
          </RequireAuth>
        }
      />

      <Route
        path="/workspaces/:workspaceId"
        element={
          <RequireAuth>
            <WorkspaceOverview theme={theme} setTheme={setTheme} />
          </RequireAuth>
        }
      />

      {/* Default */}
      <Route
        path="*"
        element={<Navigate to={isAuthed() ? "/workspaces" : "/login"} replace />}
      />
    </Routes>
  );
}