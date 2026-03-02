import React, { useMemo, useState } from "react";
import AppShell from "../components/AppShell.jsx";

const MOCK_CONTACTS = [
  {
    id: "c1",
    name: "Sarah Chen",
    handle: "@sarahc_dev",
    lastSeen: "2m ago",
    count: 14,
    tags: ["VIP", "Developer"],
    source: "Reddit",
    location: "San Francisco, CA",
    active: true,
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBS-oy7dKJ6btmcVCCizmnBsmetGwWq5__0Z_bjkjHwS5jVa4VM_jJKy0AHVLis0Rs7uQLyyMBa4IPxzzvj1Jc10lKcq0BoMr20keY-doLi11qXcjkg1JLW4Pe2WQf-3q3FqOezup7mdNOstdbtd6g7SUTs3Q_t-Y9YWaiMzoQ7ewCWLs3V83_IyKsYh_bkFJH2O7Ds8v8KVMf54o2pJZzl2ARfldmMSH5ZDGpkZmbLEhoTDLM3W2kGYSAGoYEH2rMCmwDFDh9ohWQ",
    channelIcon: "share", // reddit in your design uses "share" (you can swap later)
    channelColor: "text-primary",
    firstInteraction: "Oct 12, 2023",
    totalConversations: "14 Sessions",
    assignedAgent: "Jordan Smith",
    lastActive: "Just now",
    classification: ["VIP_PRIORITY", "TECH_EARLY_ADOPTER", "NORTH_AMERICA"],
    notes: [
      {
        by: "Jordan Smith",
        when: "Yesterday, 4:22 PM",
        text:
          "Client requested early access to the Q1 analytics module. Verify subscription level before approval.",
      },
    ],
    conversations: [
      { channel: "Reddit", convId: "CONV-8812", status: "PENDING", updated: "2h ago" },
      { channel: "Reddit", convId: "CONV-8742", status: "RESOLVED", updated: "Jan 12, 2024" },
    ],
    timeline: [
      { title: "Tag Added: VIP_PRIORITY", meta: "By Jordan Smith • 2 hours ago", highlight: true },
      {
        title: "Assignment Updated",
        meta: "Moved from 'General Support' to 'Priority Desk' • Jan 14, 10:20 AM",
      },
      { title: "Note added by Jordan Smith", meta: `"Client following up on ticket #8812" • Yesterday, 4:22 PM` },
    ],
  },
  {
    id: "c2",
    name: "Marcus Thorne",
    handle: "@m_thorne_chef",
    lastSeen: "1h ago",
    count: 2,
    tags: ["New Customer"],
    source: "Facebook",
    location: "—",
    active: false,
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuArYd6d9xnNpM8i8aAv32IosGwmpLpfNZVcgdk1sTqghW2ldhlBZNtAJPAOFGyS1bAiJZNZoRBi6UKIjtD0JNs3NWyuSCdclO4FrSZxl85A5nP4x7M6mIC6X5fdmK6uHYrrne3O4FupdpfrGAa7I4_qXrln_vWglDxxjkCAqIcjFN6Q6kRmNqcZptVrUtLaITygTQIVVuuSDPmbdNazsWl6B1R9xghuzm6jABCDrZEL4Q4MdYtVtV2HZ_2Hhz9KK06gHHzxfmyAc2M",
    channelIcon: "social_leaderboard",
    channelColor: "text-[#1877F2]",
    firstInteraction: "Jan 08, 2024",
    totalConversations: "2 Sessions",
    assignedAgent: "—",
    lastActive: "1h ago",
    classification: ["NEW_CUSTOMER"],
    notes: [],
    conversations: [],
    timeline: [],
  },
  {
    id: "c3",
    name: "TechPulse Media",
    handle: "@techpulse_news",
    lastSeen: "5h ago",
    count: 128,
    tags: ["Partner", "Media"],
    source: "Instagram",
    location: "—",
    active: false,
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDIrLmDrwNxjqZZKcqlN1QDHXTzb0T89_Q6PAgrbQFf6rrnpA4voltt0LuronFH6_xPh8Ul3Cpfcz5rsSbMlX_JIVGFUqf-SVqs3jhG81AkfWHiV6Xh0hnxFGyR1fjqd895pSvSB8NLtfajNMCpzt6bKJ25HSh7-zgFQQELUWfzt-TTSt2GTqOQDYGUiX0sWmaAQsi2Jm2suaNgoaDILLXEp5uYIdFaZvfstfcXlDlAjHF-KH1wbeS6drNBK9H7Hon4pZcH-E004oU",
    channelIcon: "photo_camera",
    channelColor: "text-[#E4405F]",
    firstInteraction: "Nov 02, 2023",
    totalConversations: "128 Sessions",
    assignedAgent: "Priority Desk",
    lastActive: "5h ago",
    classification: ["PARTNER", "MEDIA"],
    notes: [],
    conversations: [],
    timeline: [],
  },
];

function StatusPill({ status }) {
  const map = {
    PENDING: "bg-yellow-500/10 text-yellow-500",
    RESOLVED: "bg-green-500/10 text-green-500",
    OPEN: "bg-primary/10 text-primary",
  };
  const cls = map[status] || "bg-white/5 text-white/50";
  return (
    <span className={`px-2 py-0.5 ${cls} text-[10px] font-bold rounded`}>{status}</span>
  );
}

function Drawer({ open, onClose, children }) {
  return (
    <>
      {/* Backdrop */}
      <div
        className={[
          "fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={[
          "fixed top-0 right-0 h-full w-full sm:w-[560px] z-50 lg:hidden",
          "transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        <div className="h-full glass-panel border-l border-glass-border flex flex-col">
          <div className="h-16 px-5 flex items-center justify-between border-b border-glass-border bg-white/5">
            <p className="text-sm font-bold text-white">Contact Detail</p>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/5 border border-glass-border flex items-center justify-center hover:bg-white/10"
              aria-label="Close drawer"
            >
              <span className="material-symbols-outlined text-white/60">close</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">{children}</div>
        </div>
      </div>
    </>
  );
}

function ContactDetail({ contact }) {
  if (!contact) return null;

  return (
    <section className="flex flex-col min-h-0">
      {/* Profile Header */}
      <div className="p-8 border-b border-glass-border flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-6">
          <div className="relative">
            <img
              alt={contact.name}
              className="w-24 h-24 rounded-2xl border-2 border-primary object-cover"
              src={contact.avatar}
            />
            {contact.active && (
              <div className="absolute -top-2 -right-2 bg-primary px-2 py-1 rounded-md">
                <span className="text-[10px] font-black text-background-dark">ACTIVE</span>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-2xl font-bold">{contact.name}</h3>
            <p className="text-primary font-medium">{contact.handle}</p>

            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1.5 text-xs text-white/50">
                <span className="material-symbols-outlined text-sm">location_on</span>
                {contact.location}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-white/50">
                <span className="material-symbols-outlined text-sm">share</span>
                Source: {contact.source}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button className="px-6 py-2.5 bg-primary text-background-dark rounded-xl text-sm font-bold flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-lg">forum</span>
            Start conversation
          </button>
          <button className="px-6 py-2.5 bg-white/5 border border-glass-border rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-white/10">
            <span className="material-symbols-outlined text-lg">merge_type</span>
            Merge profile
          </button>
        </div>
      </div>

      <div className="p-8 space-y-10">
        {/* Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-4 bg-white/5 border border-glass-border rounded-xl">
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">
              First Interaction
            </p>
            <p className="text-sm font-semibold">{contact.firstInteraction}</p>
          </div>
          <div className="p-4 bg-white/5 border border-glass-border rounded-xl">
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">
              Total Conversations
            </p>
            <p className="text-sm font-semibold">{contact.totalConversations}</p>
          </div>
          <div className="p-4 bg-white/5 border border-glass-border rounded-xl">
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">
              Assigned Agent
            </p>
            <p className="text-sm font-semibold">{contact.assignedAgent}</p>
          </div>
          <div className="p-4 bg-white/5 border border-glass-border rounded-xl">
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">
              Last Active
            </p>
            <p className="text-sm font-semibold text-primary">{contact.lastActive}</p>
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-white/60">
            <span className="material-symbols-outlined text-lg">label</span>
            Tags &amp; Classification
          </h4>

          <div className="flex flex-wrap gap-2 items-center">
            {(contact.classification || []).map((t) => (
              <span
                key={t}
                className={[
                  "px-3 py-1.5 rounded-lg text-xs font-bold border",
                  t === "VIP_PRIORITY"
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "bg-white/5 text-white/60 border-glass-border",
                ].join(" ")}
              >
                {t}
              </span>
            ))}
            <input
              className="w-28 bg-transparent border-dashed border-white/20 rounded-lg py-1.5 px-3 text-xs focus:ring-0 focus:border-primary placeholder:text-white/20"
              placeholder="+ Add tag"
              type="text"
            />
          </div>
        </div>

        {/* Internal Notes */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-white/60">
            <span className="material-symbols-outlined text-lg">description</span>
            Internal Notes
          </h4>

          <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar pr-2">
            {(contact.notes || []).length === 0 ? (
              <div className="p-4 bg-white/5 rounded-xl border border-glass-border text-sm text-white/40">
                No internal notes yet.
              </div>
            ) : (
              contact.notes.map((n, idx) => (
                <div key={idx} className="p-4 bg-white/5 rounded-xl border border-glass-border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-primary">{n.by}</p>
                    <p className="text-[10px] text-white/30">{n.when}</p>
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed">{n.text}</p>
                </div>
              ))
            )}
          </div>

          <div className="relative">
            <textarea
              className="w-full bg-white/5 border border-glass-border rounded-xl p-4 text-sm focus:ring-0 focus:border-primary min-h-[100px] placeholder:text-white/20"
              placeholder="Write a new internal note..."
            />
            <button className="absolute bottom-4 right-4 p-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30">
              <span className="material-symbols-outlined text-sm">send</span>
            </button>
          </div>
        </div>

        {/* Conversation History */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-white/60">
            <span className="material-symbols-outlined text-lg">history</span>
            Conversation History
          </h4>

          <div className="border border-glass-border rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-[10px] uppercase font-bold text-white/40 tracking-widest">
                <tr>
                  <th className="px-6 py-4">Channel</th>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Updated</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-glass-border">
                {(contact.conversations || []).length === 0 ? (
                  <tr>
                    <td className="px-6 py-6 text-white/40 text-sm" colSpan={5}>
                      No conversation history found for this contact.
                    </td>
                  </tr>
                ) : (
                  contact.conversations.map((c) => (
                    <tr key={c.convId} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-xs">share</span>
                        {c.channel}
                      </td>
                      <td className="px-6 py-4 text-white/60 font-mono">{c.convId}</td>
                      <td className="px-6 py-4">
                        <StatusPill status={c.status} />
                      </td>
                      <td className="px-6 py-4 text-white/40">{c.updated}</td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-primary text-xs font-bold hover:underline">
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="space-y-6 pb-10">
          <h4 className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-white/60">
            <span className="material-symbols-outlined text-lg">timeline</span>
            Activity Timeline
          </h4>

          <div className="relative ml-4 space-y-8 before:content-[''] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[1px] before:bg-glass-border">
            {(contact.timeline || []).length === 0 ? (
              <div className="p-4 bg-white/5 rounded-xl border border-glass-border text-sm text-white/40">
                No activity yet.
              </div>
            ) : (
              contact.timeline.map((t, idx) => (
                <div key={idx} className="relative pl-8">
                  <div
                    className={[
                      "absolute left-[-5px] top-1.5 w-[11px] h-[11px] rounded-full",
                      t.highlight
                        ? "bg-primary ring-4 ring-primary/10"
                        : "bg-white/20 border border-glass-border",
                    ].join(" ")}
                  />
                  <p className={["text-sm font-bold", t.highlight ? "" : "text-white/80"].join(" ")}>
                    {t.title.includes("VIP_PRIORITY") ? (
                      <>
                        Tag Added: <span className="text-primary">VIP_PRIORITY</span>
                      </>
                    ) : (
                      t.title
                    )}
                  </p>
                  <p className="text-xs text-white/40 mt-1">{t.meta}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Contacts({ theme, setTheme }) {
  const [q, setQ] = useState("");
  const [channel, setChannel] = useState("All");
  const [selectedId, setSelectedId] = useState(MOCK_CONTACTS[0]?.id || null);

  // Drawer for mobile
  const [drawerOpen, setDrawerOpen] = useState(false);

  const contacts = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return MOCK_CONTACTS.filter((c) => {
      const matchQ =
        !ql ||
        c.name.toLowerCase().includes(ql) ||
        (c.handle || "").toLowerCase().includes(ql) ||
        (c.tags || []).join(" ").toLowerCase().includes(ql);

      const matchChannel =
        channel === "All" ||
        (c.source || "").toLowerCase() === channel.toLowerCase();

      return matchQ && matchChannel;
    });
  }, [q, channel]);

  const selected = useMemo(
    () => contacts.find((c) => c.id === selectedId) || MOCK_CONTACTS.find((c) => c.id === selectedId),
    [contacts, selectedId]
  );

  const onSelect = (id) => {
    setSelectedId(id);
    // on mobile open drawer
    setDrawerOpen(true);
  };

  return (
    <AppShell theme={theme} setTheme={setTheme} active="contacts" topSearchPlaceholder="Global search contacts, messages...">
      <div className="px-10 py-8 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Contacts</h2>
          <p className="text-white/50 text-sm mt-1">Manage customer profiles and interaction history</p>
        </div>

        <div className="flex items-center gap-4">
          <button className="px-6 py-2.5 bg-white/5 border border-glass-border rounded-xl text-sm font-bold hover:bg-white/10 transition-colors">
            Import
          </button>
          <button className="px-6 py-2.5 bg-primary text-background-dark rounded-xl text-sm font-bold hover:brightness-110 transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">person_add</span>
            Add contact
          </button>
        </div>
      </div>

      {/* Workspace */}
      <div className="flex-1 flex px-10 pb-10 gap-8 min-h-0">
        {/* Left: List */}
        <section className="w-full lg:w-[35%] flex flex-col glass-panel rounded-2xl overflow-hidden border border-glass-border min-h-0">
          <div className="p-6 space-y-4 border-b border-glass-border bg-white/5">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-white/30 text-xl">
                filter_list
              </span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full bg-background-dark border border-glass-border rounded-xl py-2 pl-10 pr-4 text-sm focus:border-primary focus:ring-0 placeholder:text-white/20"
                placeholder="Search contacts..."
                type="text"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
              {[
                { key: "All", label: "All Channels" },
                { key: "Facebook", label: "Facebook" },
                { key: "Instagram", label: "Instagram" },
                { key: "Reddit", label: "Reddit" },
              ].map((t) => {
                const active = channel === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setChannel(t.key)}
                    className={[
                      "px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap border transition-colors",
                      active
                        ? "bg-primary/20 text-primary border-primary/30"
                        : "bg-white/5 text-white/50 border-glass-border hover:text-white",
                    ].join(" ")}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
            {contacts.map((c) => {
              const isActive = c.id === selectedId;
              return (
                <div
                  key={c.id}
                  onClick={() => onSelect(c.id)}
                  className={[
                    "p-4 flex items-start gap-4 cursor-pointer transition-all border-b border-glass-border",
                    isActive
                      ? "border-l-4 border-primary bg-primary/5 shadow-[0_0_15px_rgba(18,241,226,0.1)]"
                      : "hover:bg-white/5",
                  ].join(" ")}
                >
                  <div className="relative shrink-0">
                    <img alt={c.name} className="w-12 h-12 rounded-xl object-cover" src={c.avatar} />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-background-dark rounded-full flex items-center justify-center">
                      <span className={["material-symbols-outlined text-[14px]", c.channelColor].join(" ")}>
                        {c.channelIcon}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold truncate">{c.name}</h4>
                      <span className="text-[10px] text-white/40">{c.lastSeen}</span>
                    </div>
                    <p className="text-xs text-white/40 truncate">{c.handle}</p>

                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {(c.tags || []).map((t) => (
                        <span
                          key={t}
                          className={[
                            "px-2 py-0.5 text-[10px] font-bold rounded uppercase",
                            t === "VIP" ? "bg-primary/10 text-primary" : "bg-white/5 text-white/40",
                          ].join(" ")}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={["text-xs font-bold", isActive ? "text-primary" : "text-white/40"].join(" ")}>
                      {c.count}
                    </span>
                    <span className="material-symbols-outlined text-white/30 text-sm">chat</span>
                  </div>
                </div>
              );
            })}

            {contacts.length === 0 && (
              <div className="p-10 text-center text-white/30 text-sm">No contacts match your filters.</div>
            )}

            <div className="p-10 text-center text-white/20 text-xs italic">More contacts loading...</div>
          </div>
        </section>

        {/* Right: Detail (Desktop) */}
        <section className="hidden lg:flex w-[65%] glass-panel rounded-2xl overflow-hidden border border-glass-border min-h-0">
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <ContactDetail contact={selected} />
          </div>
        </section>

        {/* Mobile Drawer */}
        <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
          <ContactDetail contact={selected} />
        </Drawer>
      </div>
    </AppShell>
  );
}
