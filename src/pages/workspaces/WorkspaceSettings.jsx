import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { dummyWorkspace } from "../../lib/workspaceDummy.js";

export default function WorkspaceSettings() {
  const { workspaceId } = useParams();
  const [name, setName] = useState(dummyWorkspace.name);
  const [tz, setTz] = useState("Asia/Karachi");

  return (
    <div className="min-h-screen bg-background-dark text-slate-100 p-8">
      <div className="text-sm text-slate-400">
        <Link to="/workspaces" className="hover:text-primary">Workspaces</Link> /{" "}
        <Link to={`/workspaces/${workspaceId}`} className="hover:text-primary">{dummyWorkspace.name}</Link> /{" "}
        <span className="text-slate-200">Settings</span>
      </div>

      <h1 className="text-2xl font-extrabold tracking-tight mt-2">Workspace Settings</h1>

      <div className="mt-6 max-w-2xl space-y-4">
        <div className="glass border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-bold">Details</h2>

          <div className="mt-4 space-y-3">
            <div>
              <label className="text-sm font-semibold text-slate-300">Workspace name</label>
              <input
                className="mt-2 w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-primary/60"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-300">Timezone</label>
              <select
                className="mt-2 w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-primary/60"
                value={tz}
                onChange={(e) => setTz(e.target.value)}
              >
                <option>Asia/Karachi</option>
                <option>UTC</option>
                <option>Europe/Berlin</option>
                <option>America/New_York</option>
              </select>
            </div>

            <button className="mt-2 bg-primary text-background-dark px-5 py-3 rounded-lg text-sm font-bold hover:opacity-90">
              Save changes (dummy)
            </button>
          </div>
        </div>

        <div className="glass border border-red-500/20 rounded-xl p-6">
          <h2 className="text-lg font-bold text-red-200">Danger Zone</h2>
          <p className="text-sm text-slate-400 mt-1">
            Deleting a workspace is permanent (dummy for now).
          </p>

          <button className="mt-4 bg-red-500/20 border border-red-500/30 text-red-200 px-5 py-3 rounded-lg text-sm font-bold hover:bg-red-500/30">
            Delete workspace
          </button>
        </div>
      </div>
    </div>
  );
}