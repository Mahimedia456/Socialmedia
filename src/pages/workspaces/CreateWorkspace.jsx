import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../../components/AppShell.jsx";
import { supabase } from "../../lib/supabaseClient.js";

const ACTIVE_WORKSPACES = [
  {
    id: "enterprise",
    icon: "corporate_fare",
    name: "Enterprise Brand",
    meta: "12 Members • Global Office",
  },
  {
    id: "launch",
    icon: "campaign",
    name: "Social Media Launch",
    meta: "5 Members • Campaign Unit",
  },
];

function Toast({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed bottom-8 right-8 z-[100]">
      <div className="bg-slate-900 border-l-4 border-primary px-6 py-4 rounded-lg shadow-2xl flex items-center gap-4 min-w-80">
        <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
        </div>
        <div>
          <p className="text-slate-100 font-bold text-sm">Workspace created</p>
          <p className="text-slate-400 text-xs">You can now invite your team members.</p>
        </div>
        <button onClick={onClose} className="ml-auto text-slate-500 hover:text-white">
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>
    </div>
  );
}

export default function CreateWorkspace({ theme, setTheme }) {
  const nav = useNavigate();

  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [defaultRole, setDefaultRole] = useState("Viewer");

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const canSave = useMemo(() => name.trim().length >= 3, [name]);

  async function onCreate(e) {
    e.preventDefault();
    if (!canSave || saving) return;

    setSaving(true);
    setErrorMsg("");

    try {
      const { data: ws, error } = await supabase
        .from("workspaces")
        .insert({
          name: name.trim(),
          description: desc.trim() || null,
          timezone: "Asia/Karachi",
        })
        .select("id,name")
        .single();

      if (error) throw error;

      // Optional: store default role somewhere if you later use invites
      // defaultRole is captured but not inserted into DB for now.

      setToast(true);

      setTimeout(() => {
        nav(`/workspaces/${ws.id}`, { replace: true });
      }, 350);
    } catch (err) {
      console.error("Create workspace failed:", err);
      setErrorMsg(err?.message || "Create workspace failed");
    } finally {
      setSaving(false);
    }
  }

  function onCancel() {
    nav("/workspaces");
  }

  return (
    <AppShell theme={theme} setTheme={setTheme} active="workspaces" topTitle={null}>
      <main className="flex-1 overflow-y-auto custom-scrollbar p-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* LEFT FORM */}
            <section className="flex flex-col gap-8">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">
                  Create New Workspace
                </h1>
                <p className="text-white/60 mt-2">
                  Set up a dedicated environment for your brand or team projects.
                </p>
              </div>

              {errorMsg ? (
                <div className="glass-panel border border-red-500/30 bg-red-500/5 rounded-xl p-4">
                  <p className="text-red-200 font-bold text-sm">Error</p>
                  <p className="text-red-200/70 text-xs mt-1">{errorMsg}</p>
                </div>
              ) : null}

              <form
                onSubmit={onCreate}
                className="space-y-6 glass-panel p-8 rounded-xl border border-glass-border"
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/70">
                    Workspace Name (Required)
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-black/20 border border-glass-border rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary focus:border-primary transition-all text-white placeholder:text-white/30 outline-none"
                    placeholder="e.g. Marketing Team"
                    type="text"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/70">
                    Description (Optional)
                  </label>
                  <textarea
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    className="w-full bg-black/20 border border-glass-border rounded-xl p-4 focus:ring-1 focus:ring-primary focus:border-primary transition-all text-white placeholder:text-white/30 outline-none"
                    placeholder="Briefly describe the purpose of this workspace..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/70">
                    Default Member Role
                  </label>

                  <div className="relative">
                    <select
                      value={defaultRole}
                      onChange={(e) => setDefaultRole(e.target.value)}
                      className="w-full appearance-none bg-black/20 border border-glass-border rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary focus:border-primary transition-all text-white outline-none"
                    >
                      <option>Viewer</option>
                      <option>Editor</option>
                      <option>Admin</option>
                    </select>

                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-primary">
                      <span className="material-symbols-outlined">expand_more</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-4 pt-4 border-t border-glass-border">
                  <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold text-white/70 hover:bg-white/5 transition-all"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={!canSave || saving}
                    className="px-6 py-2.5 rounded-xl text-sm font-black bg-primary text-background-dark hover:opacity-90 shadow-lg shadow-primary/20 transition-all disabled:opacity-60"
                  >
                    {saving ? "Creating..." : "Create workspace"}
                  </button>
                </div>
              </form>
            </section>

            {/* RIGHT PREVIEW */}
            <section className="flex flex-col gap-8 opacity-40 select-none">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  Active Workspaces
                </h2>
                <p className="text-white/60 mt-1">Manage your connected environments</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {ACTIVE_WORKSPACES.map((w) => (
                  <div
                    key={w.id}
                    className="p-6 glass-panel rounded-xl border border-glass-border flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-xl bg-primary/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary">
                          {w.icon}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-bold text-white">{w.name}</h4>
                        <p className="text-xs text-white/60">{w.meta}</p>
                      </div>
                    </div>

                    <span className="material-symbols-outlined text-white/40">
                      more_vert
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        <Toast open={toast} onClose={() => setToast(false)} />
      </main>
    </AppShell>
  );
}