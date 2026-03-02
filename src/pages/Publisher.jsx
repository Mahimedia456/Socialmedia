import React, { useMemo, useState } from "react";
import AppShell from "../components/AppShell.jsx";

const CHANNELS = [
  { key: "facebook", label: "Facebook", icon: "social_leaderboard", wrap: "bg-blue-600/20 border-blue-600/40 text-blue-400" },
  { key: "instagram", label: "Instagram", icon: "photo_camera", wrap: "bg-pink-600/20 border-pink-600/40 text-pink-400" },
  { key: "reddit", label: "Reddit", icon: "forum", wrap: "bg-orange-600/20 border-orange-600/40 text-orange-400" },
];

export default function Publisher({ theme, setTheme }) {
  const [activeTab, setActiveTab] = useState("text");
  const [selected, setSelected] = useState(() => new Set(["facebook", "instagram", "reddit"]));
  const [text, setText] = useState("");

  const count = useMemo(() => (text || "").length, [text]);
  const limit = 280;

  const toggleChannel = (key) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <AppShell theme={theme} setTheme={setTheme} active="publisher" topTitle={null}>
      <main className="flex-1 overflow-y-auto custom-scrollbar p-8">
        {/* Page Title & Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight">Publisher</h2>
            <p className="text-slate-400 mt-1 font-medium">
              Create and schedule posts across your connected channels
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="px-5 py-2.5 border border-primary/40 text-primary text-sm font-bold rounded-lg hover:bg-primary/5 transition-all">
              View calendar
            </button>

            <button className="px-5 py-2.5 cyan-gradient text-background-dark text-sm font-bold rounded-lg shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">add</span>
              New post
            </button>
          </div>
        </div>

        {/* Composer Section */}
        <section className="mb-10">
          <div className="glass-card rounded-xl p-8 shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Form Side */}
              <div className="lg:col-span-7 space-y-6">
                {/* Channel Selection */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-3">
                    Select Channels
                  </label>

                  <div className="flex flex-wrap gap-2">
                    {CHANNELS.map((c) => {
                      const on = selected.has(c.key);
                      return (
                        <button
                          key={c.key}
                          type="button"
                          onClick={() => toggleChannel(c.key)}
                          className={[
                            "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold transition-all",
                            on
                              ? c.wrap
                              : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10",
                          ].join(" ")}
                        >
                          <span className="material-symbols-outlined text-lg">{c.icon}</span>
                          {c.label}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 text-xs font-bold hover:bg-white/10 transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">add_circle</span>
                      Add Channel
                    </button>
                  </div>
                </div>

                {/* Post Content Tabs */}
                <div>
                  <div className="flex border-b border-border-glass mb-4">
                    <button
                      type="button"
                      onClick={() => setActiveTab("text")}
                      className={[
                        "px-6 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all",
                        activeTab === "text"
                          ? "border-primary text-primary"
                          : "border-transparent text-slate-500 hover:text-slate-300",
                      ].join(" ")}
                    >
                      Text
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("image")}
                      className={[
                        "px-6 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all",
                        activeTab === "image"
                          ? "border-primary text-primary"
                          : "border-transparent text-slate-500 hover:text-slate-300",
                      ].join(" ")}
                    >
                      Image
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("link")}
                      className={[
                        "px-6 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all",
                        activeTab === "link"
                          ? "border-primary text-primary"
                          : "border-transparent text-slate-500 hover:text-slate-300",
                      ].join(" ")}
                    >
                      Link
                    </button>
                  </div>

                  <div className="relative group">
                    <textarea
                      className="w-full bg-background-dark/40 border border-border-glass rounded-xl p-4 text-sm text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                      placeholder="What would you like to share?"
                      rows={6}
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      maxLength={limit}
                    />
                    <div className="absolute bottom-4 right-4 text-[10px] font-bold text-slate-500">
                      {count} / {limit}
                    </div>
                  </div>
                </div>

                {/* Media Upload */}
                <div className="border-2 border-dashed border-border-glass rounded-xl p-6 flex flex-col items-center justify-center bg-primary/5 hover:bg-primary/10 transition-all cursor-pointer group">
                  <span className="material-symbols-outlined text-4xl text-primary/30 group-hover:text-primary transition-colors mb-2">
                    cloud_upload
                  </span>
                  <p className="text-xs font-bold text-slate-400 mb-4">
                    Drag and drop assets or browse files
                  </p>
                  <button
                    type="button"
                    className="px-4 py-2 bg-primary/20 text-primary border border-primary/30 rounded-lg text-[11px] font-bold uppercase hover:bg-primary/30 transition-all"
                  >
                    Upload image
                  </button>
                </div>
              </div>

              {/* Sidebar Actions for Composer */}
              <div className="lg:col-span-5 border-l border-border-glass pl-0 lg:pl-10 space-y-8">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-4">
                    Schedule Settings
                  </label>

                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-border-glass mb-4">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary">timer</span>
                      <span className="text-xs font-bold text-slate-200">Post Now</span>
                    </div>

                    {/* static switch 1:1 */}
                    <div className="w-10 h-5 bg-border-glass rounded-full relative cursor-pointer">
                      <div className="absolute left-1 top-1 size-3 bg-slate-500 rounded-full" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">
                      Set Date &amp; Time
                    </label>

                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary text-lg">
                          calendar_today
                        </span>
                        <input
                          className="w-full bg-background-dark/40 border border-border-glass rounded-lg pl-10 pr-4 py-2 text-xs text-white focus:ring-1 focus:ring-primary outline-none"
                          type="date"
                        />
                      </div>

                      <div className="relative flex-1">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary text-lg">
                          schedule
                        </span>
                        <input
                          className="w-full bg-background-dark/40 border border-border-glass rounded-lg pl-10 pr-4 py-2 text-xs text-white focus:ring-1 focus:ring-primary outline-none"
                          type="time"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-3">
                    Audience Settings
                  </label>

                  <select className="w-full bg-background-dark/40 border border-border-glass rounded-lg px-4 py-2 text-xs text-white focus:ring-1 focus:ring-primary outline-none">
                    <option>Public</option>
                    <option>Followers only</option>
                    <option>Close Friends</option>
                  </select>
                </div>

                <div className="pt-6 border-t border-border-glass flex flex-col gap-3">
                  <button className="w-full py-3 cyan-gradient text-background-dark text-xs font-black uppercase tracking-widest rounded-lg shadow-lg shadow-primary/10 hover:opacity-90 transition-all">
                    Schedule post
                  </button>

                  <button className="w-full py-3 bg-white/5 text-slate-300 border border-border-glass text-xs font-black uppercase tracking-widest rounded-lg hover:bg-white/10 transition-all">
                    Save draft
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Grid Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Drafts Panel */}
          <div className="glass-card rounded-xl flex flex-col h-96">
            <div className="p-5 border-b border-border-glass flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">drafts</span>
                <h3 className="text-sm font-bold text-white">Drafts</h3>
              </div>
              <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-black rounded">
                3 TOTAL
              </span>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  <tr>
                    <th className="px-5 py-3 border-b border-border-glass">Post Title</th>
                    <th className="px-5 py-3 border-b border-border-glass">Channels</th>
                    <th className="px-5 py-3 border-b border-border-glass text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="text-xs">
                  <tr className="border-b border-border-glass/50 hover:bg-white/5 transition-colors">
                    <td className="px-5 py-4 font-medium text-slate-300 truncate max-w-[150px]">
                      Product Launch Announcement 2.0
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-1">
                        <div className="size-5 rounded bg-blue-600/20 border border-blue-600/40 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[10px] text-blue-400">
                            social_leaderboard
                          </span>
                        </div>
                        <div className="size-5 rounded bg-pink-600/20 border border-pink-600/40 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[10px] text-pink-400">
                            photo_camera
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="size-7 rounded bg-white/5 flex items-center justify-center hover:bg-primary/20 text-slate-400 hover:text-primary transition-all">
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button className="size-7 rounded bg-white/5 flex items-center justify-center hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all">
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>

                  <tr className="border-b border-border-glass/50 hover:bg-white/5 transition-colors">
                    <td className="px-5 py-4 font-medium text-slate-300">Holiday Special Discount</td>
                    <td className="px-5 py-4">
                      <div className="flex gap-1">
                        <div className="size-5 rounded bg-orange-600/20 border border-orange-600/40 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[10px] text-orange-400">
                            forum
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="size-7 rounded bg-white/5 flex items-center justify-center hover:bg-primary/20 text-slate-400 hover:text-primary transition-all">
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button className="size-7 rounded bg-white/5 flex items-center justify-center hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all">
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>

                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-4 font-medium text-slate-300">New Feature Showcase</td>
                    <td className="px-5 py-4">
                      <div className="flex gap-1">
                        <div className="size-5 rounded bg-pink-600/20 border border-pink-600/40 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[10px] text-pink-400">
                            photo_camera
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="size-7 rounded bg-white/5 flex items-center justify-center hover:bg-primary/20 text-slate-400 hover:text-primary transition-all">
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button className="size-7 rounded bg-white/5 flex items-center justify-center hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all">
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Scheduled Posts Panel */}
          <div className="glass-card rounded-xl flex flex-col h-96">
            <div className="p-5 border-b border-border-glass flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">event_available</span>
                <h3 className="text-sm font-bold text-white">Scheduled</h3>
              </div>
              <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-black rounded">
                UPCOMING
              </span>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
              <div className="flex gap-4 p-3 bg-white/5 border border-border-glass rounded-lg hover:border-primary/30 transition-all cursor-pointer">
                <div
                  className="size-14 rounded-lg bg-cover bg-center border border-white/10 shrink-0"
                  style={{
                    backgroundImage:
                      "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBVWS56iuAaGS-zSE6DXU9sV6sJjuUMDmSvRWmF5AiaOYTlqLt4NPiHOncOZkCeNWQ4wMfGRREhmQ2VFw8n2vly7-1HkdtM5KYCInrvyut57hOVXQFzaAjmxnS5P95TDayAlyvRRabt2RWltWNe8VoHFMMtlSQqyTfGZGbDmXcqIeh6Tccav3Kp2uaEqNiKyDxDsNXgCMtWxO1dBECW31RhAF8KRCQLEKmcNhbl5MTlMaambykTCpzvrSleaJcMvEU5uBimYvdn-AM')",
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-xs font-bold text-white truncate">Weekend Community Update</p>
                    <span className="text-[10px] font-bold text-primary shrink-0">In 2 hours</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <span className="material-symbols-outlined text-[14px] text-blue-400">
                        social_leaderboard
                      </span>
                      <span className="material-symbols-outlined text-[14px] text-pink-400">
                        photo_camera
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">Scheduled: Oct 12, 14:00</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 p-3 bg-white/5 border border-border-glass rounded-lg hover:border-primary/30 transition-all cursor-pointer">
                <div
                  className="size-14 rounded-lg bg-cover bg-center border border-white/10 shrink-0"
                  style={{
                    backgroundImage:
                      "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDX4q9bbyumzzVmnMk2AG96AYTnzN81ovhKgX0rYQIyjARmJUFXMzCf5s7MDijPCBHE4PkFo1Mlhh9w9e6X-_EqGsDsVnE6wUZvxnRdcGCyGdAAC_q0uGLI7E3e9skXSDmEMpsyDIT44-bR3936QRgxnCcM7FDzSdORRIqYI82Ftd6NSkk-wYfR6_yi67cB66ApCm1Gzl5ZIC3KQeMy4OnGjQIRPf_r1KOhtV7r4KHSE-m0wSo2Q4WRp43qfW9j4jt1j1WFhqVsbSo')",
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-xs font-bold text-white truncate">Monday Morning Motivation</p>
                    <span className="text-[10px] font-bold text-slate-500 shrink-0">In 2 days</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <span className="material-symbols-outlined text-[14px] text-pink-400">
                        photo_camera
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">Scheduled: Oct 14, 09:00</span>
                  </div>
                </div>
              </div>

              {/* empty state kept (hidden) for 1:1 parity */}
              <div className="hidden flex flex-col items-center justify-center h-full opacity-30">
                <span className="material-symbols-outlined text-5xl mb-2">event_busy</span>
                <p className="text-xs font-bold uppercase tracking-widest">No scheduled posts</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
