import React, { useMemo, useState } from "react";
import AppShell from "../components/AppShell.jsx";

const RULES = [
  {
    id: "r1",
    order: "01",
    title: "Refund Auto-tag",
    enabled: true,
    summary:
      'If message contains "refund", add tag "Complaint" and assign to Support',
    teamAvatars: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDJA7FeAqBwK74piL3kqo_ZfoAAIWrsEzA2p5STgJrrGnD7s-Uqq_Qf-sHDYBSgqeLpJZoPXlaC4v_4tPeIkuodEL5ILN25I7RTmoXmeAzELyIiL2zAfMBQoQ5pAAiXea0ntDt7lAcBT8yQeqtb2EpznFAtIw3a_4XlYTGb1DkBfxAx2PKPJ1c2a17sZGKcJI-Ngs0w2qMmoo9IZjBsqt3bSgpzqHpF1vC4pdzi8wU_5M_aCjNuIhYuS6T72odz1-Fcl0S1q07KBEI",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBb_V_0iTt3CP0puV8FmXK4ehoEEzgnN9uzaTG4eP6F9ar8op22Fu4l8qdwiERGE21LWILpnTMIfb2QjbWDc97aDOzSbjnvGmpSrvyyIJQRav0DVPMq16p7alFrQY-xviyNpLpCEq3RHfrwcTuobgohiNPd88WjDP5wm28lp8qmoEmNwJODBUPT3fmXUkEhocCAcQQFKx77tODDNTRr41DbEwKG2bB2wJFkIZuQETH5nyQMdrIWYXkVdcwW-czS92kPAw89pKGtmk8",
    ],
    teamMore: "+5",
  },
  {
    id: "r2",
    order: "02",
    title: "Instagram Routing",
    enabled: true,
    summary: "If channel = Instagram, assign to Social Team",
    teamAvatars: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDHohHlt_394OwVFFKCVEVKeUg6VEjxlSOQXlqGY23YXytxfjvxcgdUBLA64RMby_eG9GLgTlVkULbD6KA27B5sVRyLBLJ3pj6rwCKYseCzupMt1Kx0pKBMK1t5HoVjIFtlVVZyZJQRDunAG_t0AuGq-URUNPDyx5oDBMbdFAwtaCp1WaEK9fUWcmPi_TRb5PnysxJUGSLAutSZ3tiwB13fjGPXmRSjfpsI277TdXnEVxIpg8G1mTK89LoHCLA-2tieT_zhEt0Kzag",
    ],
    teamMore: "+2",
  },
  {
    id: "r3",
    order: "03",
    title: "Reddit Community",
    enabled: false,
    summary: "If channel = Reddit, assign to Community Manager",
  },
];

function Drawer({ open, onClose, children }) {
  return (
    <>
      <div
        className={[
          "fixed inset-0 z-40 bg-black/40 transition-opacity",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
        onClick={onClose}
      />

      <aside
        className={[
          "fixed inset-y-0 right-0 z-50 w-full sm:w-[520px] bg-background-dark border-l border-primary/20",
          "shadow-[-20px_0_50px_rgba(0,0,0,0.5)] flex flex-col",
          "transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        {children}
      </aside>
    </>
  );
}

export default function InboxRules({ theme, setTheme }) {
  const [q, setQ] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Create rule form (simple UI state)
  const [ruleName, setRuleName] = useState("");
  const [field, setField] = useState("Message Content");
  const [op, setOp] = useState("Contains");
  const [value, setValue] = useState("refund");
  const [assignTo, setAssignTo] = useState("Support Team");
  const [tags, setTags] = useState(["Complaint"]);
  const [tagInput, setTagInput] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return RULES;
    return RULES.filter((r) => {
      return (
        r.title.toLowerCase().includes(s) ||
        r.summary.toLowerCase().includes(s) ||
        (r.enabled ? "enabled" : "disabled").includes(s)
      );
    });
  }, [q]);

  const addTag = () => {
    const t = tagInput.trim();
    if (!t) return;
    if (tags.includes(t)) return;
    setTags([...tags, t]);
    setTagInput("");
  };

  const removeTag = (t) => setTags(tags.filter((x) => x !== t));

  return (
    <AppShell theme={theme} setTheme={setTheme} active="inboxRules" topSearchPlaceholder="Search rules or tags...">
      {/* Header row (same like screenshot: search left, create right) */}
      <header className="h-20 border-b border-primary/10 flex items-center justify-between px-8 bg-background-dark/20 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-4">
          <div className="text-slate-400">
            <span className="material-symbols-outlined">search</span>
          </div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-sm w-72 placeholder:text-slate-500 text-white"
            placeholder="Search rules or tags..."
            type="text"
          />
        </div>

        <div className="flex items-center gap-4">
          <button className="relative p-2 text-slate-400 hover:text-white">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-1 right-1 size-2 bg-primary rounded-full" />
          </button>

          <div className="h-8 w-[1px] bg-primary/20 mx-2" />

          <button
            onClick={() => setDrawerOpen(true)}
            className="bg-primary hover:bg-primary/90 text-background-dark px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(19,241,226,0.2)]"
          >
            <span className="material-symbols-outlined text-sm font-bold">add</span>
            Create rule
          </button>
        </div>
      </header>

      {/* Page content */}
      <div className="flex-1 overflow-y-auto p-10 bg-gradient-to-br from-background-dark to-[#0c1a1a] custom-scrollbar">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10">
            <h2 className="text-4xl font-extrabold text-white tracking-tight mb-2">Inbox Rules</h2>
            <p className="text-slate-400 text-lg">
              Automate conversation routing and tagging to streamline your team's workflow.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {filtered.map((r) => {
              const disabledStyle = !r.enabled;
              return (
                <div
                  key={r.id}
                  className={[
                    disabledStyle
                      ? "bg-background-dark/40 border border-slate-800/50 grayscale opacity-60"
                      : "glass-card hover:bg-primary/5 border border-primary/10",
                    "rounded-xl p-6 flex items-center gap-6 transition-all",
                  ].join(" ")}
                >
                  <div className="flex flex-col items-center gap-1 text-slate-500 cursor-grab select-none">
                    <span className="material-symbols-outlined">drag_indicator</span>
                    {r.order ? <span className="text-xs font-bold text-primary">{r.order}</span> : null}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3
                        className={[
                          "font-bold text-lg",
                          disabledStyle ? "text-slate-400 line-through" : "text-white",
                        ].join(" ")}
                      >
                        {r.title}
                      </h3>

                      {r.enabled ? (
                        <span className="bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border border-primary/20">
                          Enabled
                        </span>
                      ) : (
                        <span className="bg-slate-800 text-slate-500 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded">
                          Disabled
                        </span>
                      )}
                    </div>

                    <p className={["text-sm leading-relaxed", disabledStyle ? "text-slate-500" : "text-slate-300"].join(" ")}>
                      {r.id === "r1" ? (
                        <>
                          If message contains{" "}
                          <span className="text-primary font-mono bg-primary/10 px-1 rounded">"refund"</span>, add tag{" "}
                          <span className="text-primary font-mono bg-primary/10 px-1 rounded">"Complaint"</span> and assign to{" "}
                          <span className="text-white font-medium underline decoration-primary/50 underline-offset-4">
                            Support
                          </span>
                        </>
                      ) : r.id === "r2" ? (
                        <>
                          If channel ={" "}
                          <span className="text-primary font-mono bg-primary/10 px-1 rounded">Instagram</span>, assign to{" "}
                          <span className="text-white font-medium underline decoration-primary/50 underline-offset-4">
                            Social Team
                          </span>
                        </>
                      ) : (
                        <>If channel = Reddit, assign to Community Manager</>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    {r.enabled && r.teamAvatars ? (
                      <div className="flex -space-x-2">
                        {r.teamAvatars.map((src, i) => (
                          <img
                            key={i}
                            alt="Team member"
                            className="size-8 rounded-full border-2 border-background-dark object-cover"
                            src={src}
                          />
                        ))}
                        {r.teamMore ? (
                          <div className="size-8 rounded-full bg-slate-800 border-2 border-background-dark flex items-center justify-center text-[10px] text-slate-400">
                            {r.teamMore}
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {r.enabled ? (
                      <>
                        <button className="p-2 text-slate-400 hover:text-primary transition-colors">
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                        <button className="p-2 text-slate-400 hover:text-red-400 transition-colors">
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="p-2 text-slate-600 hover:text-primary transition-colors">
                          <span className="material-symbols-outlined">play_arrow</span>
                        </button>
                        <button className="p-2 text-slate-600 hover:text-red-400 transition-colors">
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Create rule drawer */}
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        {/* Drawer header */}
        <div className="p-8 border-b border-primary/10 flex items-center justify-between bg-primary/5">
          <div>
            <h2 className="text-2xl font-bold text-white">Create rule</h2>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-bold">
              New Automation Workflow
            </p>
          </div>

          <button
            onClick={() => setDrawerOpen(false)}
            className="size-10 flex items-center justify-center rounded-full hover:bg-primary/10 text-slate-400 hover:text-white transition-all"
            aria-label="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Drawer body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          {/* Name */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-primary/80 uppercase tracking-widest">
              Rule Name
            </label>
            <input
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
              className="w-full bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary/30 text-white placeholder:text-slate-600 transition-all"
              placeholder="e.g. VIP Priority Support"
              type="text"
            />
          </div>

          {/* Condition Builder */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-primary/80 uppercase tracking-widest">
                Condition Builder
              </label>
              <button className="text-[10px] font-bold text-primary hover:underline uppercase">
                Add group
              </button>
            </div>

            <div className="p-5 rounded-xl border border-primary/10 bg-primary/5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 space-y-1.5">
                  <p className="text-[10px] text-slate-500 font-bold ml-1 uppercase">Field</p>
                  <select
                    value={field}
                    onChange={(e) => setField(e.target.value)}
                    className="w-full bg-background-dark border-primary/10 rounded-lg text-sm text-slate-200 py-2.5 focus:border-primary focus:ring-0"
                  >
                    <option>Message Content</option>
                    <option>Channel Name</option>
                    <option>Sender Email</option>
                    <option>Priority Score</option>
                  </select>
                </div>

                <div className="flex-1 space-y-1.5">
                  <p className="text-[10px] text-slate-500 font-bold ml-1 uppercase">Operator</p>
                  <select
                    value={op}
                    onChange={(e) => setOp(e.target.value)}
                    className="w-full bg-background-dark border-primary/10 rounded-lg text-sm text-slate-200 py-2.5 focus:border-primary focus:ring-0"
                  >
                    <option>Contains</option>
                    <option>Equals</option>
                    <option>Starts with</option>
                    <option>Does not contain</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] text-slate-500 font-bold ml-1 uppercase">Value</p>
                <input
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full bg-background-dark border border-primary/10 rounded-lg text-sm text-slate-200 py-2.5 focus:border-primary focus:ring-0"
                  type="text"
                  placeholder="refund"
                />
              </div>
            </div>

            <button className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-primary/30 rounded-xl text-primary/60 hover:text-primary hover:border-primary/60 hover:bg-primary/5 transition-all text-sm font-medium">
              <span className="material-symbols-outlined text-sm">add_circle</span>
              Add condition
            </button>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <label className="text-sm font-bold text-primary/80 uppercase tracking-widest">
              Actions
            </label>

            <div className="space-y-4">
              {/* Assign to */}
              <div className="flex items-center gap-4">
                <div className="size-10 shrink-0 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">person_add</span>
                </div>

                <div className="flex-1">
                  <p className="text-xs text-slate-500 font-bold uppercase mb-1">Assign to</p>
                  <select
                    value={assignTo}
                    onChange={(e) => setAssignTo(e.target.value)}
                    className="w-full bg-background-dark border border-primary/10 rounded-lg text-sm text-slate-200 py-2 focus:border-primary focus:ring-0"
                  >
                    <option>Support Team</option>
                    <option>Social Managers</option>
                    <option>Escalation Squad</option>
                  </select>
                </div>
              </div>

              {/* Add tag */}
              <div className="flex items-center gap-4">
                <div className="size-10 shrink-0 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">label</span>
                </div>

                <div className="flex-1">
                  <p className="text-xs text-slate-500 font-bold uppercase mb-1">Add tag</p>

                  <div className="flex flex-wrap gap-2 p-2 min-h-[42px] bg-background-dark border border-primary/10 rounded-lg">
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="bg-primary text-background-dark text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"
                      >
                        {t}
                        <button
                          className="leading-none"
                          onClick={() => removeTag(t)}
                          aria-label={`Remove ${t}`}
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[12px] cursor-pointer">
                            close
                          </span>
                        </button>
                      </span>
                    ))}

                    <input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                      className="bg-transparent border-none p-0 text-sm w-24 focus:ring-0 text-white placeholder:text-slate-600"
                      placeholder="Add..."
                      type="text"
                    />
                  </div>

                  <div className="mt-2">
                    <button
                      onClick={addTag}
                      className="text-[10px] font-bold text-primary/80 hover:text-primary uppercase tracking-widest"
                      type="button"
                    >
                      Add tag
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Drawer footer */}
        <div className="p-8 border-t border-primary/10 bg-background-dark/80 backdrop-blur-md flex gap-4">
          <button
            onClick={() => setDrawerOpen(false)}
            className="flex-1 py-3 px-6 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all font-bold"
          >
            Cancel
          </button>

          <button
            onClick={() => {
              // UI only for now
              setDrawerOpen(false);
            }}
            className="flex-[2] py-3 px-6 rounded-xl bg-primary text-background-dark font-extrabold shadow-[0_0_20px_rgba(19,241,226,0.3)] hover:scale-[1.02] transition-all"
          >
            Save Rule
          </button>
        </div>
      </Drawer>
    </AppShell>
  );
}
