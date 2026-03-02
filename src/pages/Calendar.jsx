// src/pages/Calendar.jsx
import React, { useMemo, useState } from "react";
import AppShell from "../components/AppShell.jsx";

const cx = (...c) => c.filter(Boolean).join(" ");

const DEFAULT_POSTS = [
  // Month events
  { id: "p1", day: 2, time: "10:00", title: "Launch Video...", platform: "fb" },
  { id: "p2", day: 2, time: "14:30", title: "BTS Reel", platform: "ig" },
  { id: "p3", day: 7, time: "12:00", title: "AMA Session", platform: "rd" },
  { id: "p4", day: 7, time: "18:15", title: "Sunset Story", platform: "ig" },
  { id: "p5", day: 7, time: "19:30", title: "Carousel teaser", platform: "fb" },
  { id: "p6", day: 7, time: "21:00", title: "Q&A follow-up", platform: "rd" },
  { id: "p7", day: 12, time: "09:00", title: "Weekly Recap", platform: "fb" },
  { id: "p8", day: 14, time: "13:00", title: "Product Drop", platform: "ig" },

  // Upcoming Today (Nov 07 in mock)
  {
    id: "u1",
    upcoming: true,
    channel: "Reddit",
    timeLabel: "12:00 PM",
    title: '"How we scaled our influencer outreach by 400% using Mahimedia automation..."',
    status: "Scheduled",
    platform: "rd",
  },
  {
    id: "u2",
    upcoming: true,
    channel: "Instagram",
    timeLabel: "06:15 PM",
    title: "Sunset aesthetic story",
    status: "Scheduled",
    platform: "ig",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCueeHCZ-gtaMkh1sX3TSWv7mBmXVytoMuBdV8OmYyAQlaqTLycd5bZ4t8N1_1ZXpr0rWYMhyPyCyR0xjSvTyTJBLzoGAcHaUPdK2Gqb4UdYT9Bl-H1wbz3eO9pH8aDa8ETQlZBvMmaj2yu1aiJlD2SiWAasALUIxsfAR_AY4uKT8u7s7zxVcbRVHnTKMswppxGQf-B8wlNCkPO8cxWM6hfsLfBxPwfMykAXt9onXB1TeTIfnySn3ftiU7NZAiM946zjvr_CfOo3fo",
  },
  {
    id: "u3",
    upcoming: true,
    channel: "Facebook",
    timeLabel: "08:00 AM",
    title: "Draft: Corporate social responsibility report 2024...",
    status: "Failed: API Error",
    platform: "fb",
    failed: true,
  },
];

function PlatformPill({ platform, children }) {
  const styles =
    platform === "fb"
      ? "bg-[rgba(24,119,242,0.2)] border-l-[3px] border-l-[#1877F2]"
      : platform === "ig"
      ? "bg-[rgba(193,53,132,0.2)] border-l-[3px] border-l-[#C13584]"
      : "bg-[rgba(255,69,0,0.2)] border-l-[3px] border-l-[#FF4500]";

  return (
    <div className={cx("px-2 py-1 rounded-md text-[10px] truncate flex items-center gap-1", styles)}>
      {children}
    </div>
  );
}

export default function Calendar({ theme, setTheme }) {
  const [view, setView] = useState("month"); // month | week | list (UI only)
  const [query, setQuery] = useState("");
  const [todayDay] = useState(7); // mock "Today"

  const posts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return DEFAULT_POSTS;
    return DEFAULT_POSTS.filter((p) => {
      const hay = [
        p.title,
        p.time,
        p.channel,
        p.timeLabel,
        p.status,
        p.platform,
        String(p.day ?? ""),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [query]);

  const monthGridDays = useMemo(() => {
    // Matches your stitch layout: [28,29,30] then 1..25
    return [
      { day: 28, muted: true },
      { day: 29, muted: true },
      { day: 30, muted: true },
      ...Array.from({ length: 25 }, (_, i) => ({ day: i + 1, muted: false })),
    ];
  }, []);

  const postsByDay = useMemo(() => {
    const map = new Map();
    posts
      .filter((p) => !p.upcoming && typeof p.day === "number")
      .forEach((p) => {
        const arr = map.get(p.day) || [];
        arr.push(p);
        map.set(p.day, arr);
      });

    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => (a.time || "").localeCompare(b.time || ""));
      map.set(k, arr);
    }
    return map;
  }, [posts]);

  const upcoming = useMemo(() => posts.filter((p) => p.upcoming), [posts]);

  return (
    <AppShell theme={theme} setTheme={setTheme} active="calendar" topTitle={null}>
      {/* Page-local styles to match stitch */}
      <style>{`
        :root { color-scheme: dark; }
        .glass-panel {
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(18, 241, 226, 0.18);
        }
        .calendar-cell { min-height: 120px; }
        .no-scrollbar::-webkit-scrollbar { display:none; }
        .no-scrollbar { -ms-overflow-style:none; scrollbar-width:none; }
      `}</style>

      <main className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Title + Controls */}
        <div className="px-8 py-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white">Calendar</h2>
            <p className="text-white/50 text-base mt-1">
              Manage and visualize your scheduled content across all channels
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative w-[360px] max-w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
                search
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-1 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder:text-white/30 text-white"
                placeholder="Search calendar, posts or campaigns..."
                type="text"
              />
            </div>

            {/* View toggle */}
            <div className="flex p-1 bg-white/5 border border-white/10 rounded-xl">
              <button
                onClick={() => setView("month")}
                className={cx(
                  "px-4 py-1.5 rounded-lg text-sm font-medium",
                  view === "month"
                    ? "bg-primary text-background-dark"
                    : "text-white/60 hover:text-white"
                )}
              >
                Month
              </button>
              <button
                onClick={() => setView("week")}
                className={cx(
                  "px-4 py-1.5 rounded-lg text-sm font-medium",
                  view === "week"
                    ? "bg-primary text-background-dark"
                    : "text-white/60 hover:text-white"
                )}
              >
                Week
              </button>
              <button
                onClick={() => setView("list")}
                className={cx(
                  "px-4 py-1.5 rounded-lg text-sm font-medium",
                  view === "list"
                    ? "bg-primary text-background-dark"
                    : "text-white/60 hover:text-white"
                )}
              >
                List
              </button>
            </div>

            <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-sm font-medium hover:bg-white/10 transition-all text-white/80">
              <span className="material-symbols-outlined text-sm">filter_list</span>
              <span>Filters</span>
            </button>

            <button className="bg-primary text-background-dark px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-all">
              <span className="material-symbols-outlined">add_circle</span>
              <span>New post</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex gap-6 px-8 pb-8">
          {/* Calendar Grid */}
          <div className="flex-1 glass-panel rounded-2xl flex flex-col overflow-hidden">
            {/* Weekdays */}
            <div className="grid grid-cols-7 border-b border-white/10">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, idx) => (
                <div
                  key={d}
                  className={cx(
                    "py-3 text-center font-bold text-xs uppercase tracking-widest text-white/40",
                    idx !== 6 && "border-r border-white/10"
                  )}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto no-scrollbar grid grid-cols-7">
              {monthGridDays.map(({ day, muted }, i) => {
                const dayPosts = postsByDay.get(day) || [];
                const isToday = !muted && day === todayDay;

                const limit = 2;
                const shown = dayPosts.slice(0, limit);
                const remaining = Math.max(0, dayPosts.length - shown.length);

                return (
                  <div
                    key={`${day}-${i}`}
                    className={cx(
                      "calendar-cell p-2 border-b border-white/10",
                      i % 7 !== 6 && "border-r border-white/10",
                      muted && "bg-white/[0.01]",
                      !muted && !isToday && "hover:bg-white/[0.02] cursor-pointer transition-colors group",
                      isToday && "border-primary/40 bg-primary/5 cursor-pointer"
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span
                        className={cx(
                          "text-xs font-medium",
                          muted ? "text-white/20" : isToday ? "text-primary font-bold" : "text-white/50"
                        )}
                      >
                        {isToday ? `${day} Today` : day}
                      </span>

                      {!muted && (
                        <span
                          className={cx(
                            "material-symbols-outlined text-primary text-sm",
                            isToday ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                          )}
                        >
                          add
                        </span>
                      )}
                    </div>

                    {shown.length > 0 && (
                      <div className="space-y-1">
                        {shown.map((p) => (
                          <PlatformPill key={p.id} platform={p.platform}>
                            <span className="font-bold">{p.time}</span> {p.title}
                          </PlatformPill>
                        ))}
                        {remaining > 0 && (
                          <div className="text-[10px] text-primary font-medium text-center hover:underline">
                            +{remaining} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right panel */}
          <div className="w-80 flex flex-col gap-6 shrink-0 hidden lg:flex">
            <div className="glass-panel rounded-2xl p-6 flex flex-col h-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">Upcoming Today</h3>
                <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-bold uppercase tracking-wide">
                  Nov 07
                </span>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
                {/* Reddit */}
                {upcoming
                  .filter((u) => u.id === "u1")
                  .map((u) => (
                    <div
                      key={u.id}
                      className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-3 hover:border-primary/50 transition-all cursor-pointer"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <div className="size-6 rounded flex items-center justify-center bg-[#FF4500]">
                            <span className="material-symbols-outlined text-[14px] text-white">forum</span>
                          </div>
                          <span className="text-xs font-bold text-white/50">{u.channel}</span>
                        </div>
                        <span className="text-xs font-medium text-primary">{u.timeLabel}</span>
                      </div>
                      <p className="text-sm font-medium line-clamp-2 text-white">{u.title}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] px-2 py-0.5 rounded border border-primary/20 bg-primary/5 text-primary">
                          {u.status}
                        </span>
                        <button className="text-white/50 hover:text-primary">
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                      </div>
                    </div>
                  ))}

                {/* Instagram */}
                {upcoming
                  .filter((u) => u.id === "u2")
                  .map((u) => (
                    <div
                      key={u.id}
                      className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-3 hover:border-primary/50 transition-all cursor-pointer"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <div className="size-6 rounded flex items-center justify-center bg-[#C13584]">
                            <span className="material-symbols-outlined text-[14px] text-white">photo_camera</span>
                          </div>
                          <span className="text-xs font-bold text-white/50">{u.channel}</span>
                        </div>
                        <span className="text-xs font-medium text-primary">{u.timeLabel}</span>
                      </div>

                      <div
                        className="h-24 w-full rounded-lg bg-cover bg-center"
                        style={{ backgroundImage: `url('${u.image}')` }}
                      />

                      <div className="flex items-center justify-between">
                        <span className="text-[10px] px-2 py-0.5 rounded border border-primary/20 bg-primary/5 text-primary">
                          {u.status}
                        </span>
                        <button className="text-white/50 hover:text-primary">
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                      </div>
                    </div>
                  ))}

                {/* Failed Facebook */}
                {upcoming
                  .filter((u) => u.id === "u3")
                  .map((u) => (
                    <div key={u.id} className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <div className="size-6 rounded flex items-center justify-center bg-[#1877F2]">
                            <span className="material-symbols-outlined text-[14px] text-white">thumb_up</span>
                          </div>
                          <span className="text-xs font-bold text-white/50">{u.channel}</span>
                        </div>
                        <span className="text-xs font-medium text-red-400">{u.timeLabel}</span>
                      </div>
                      <p className="text-sm font-medium line-clamp-2 opacity-50 text-white">{u.title}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] px-2 py-0.5 rounded border border-red-500/30 bg-red-500/10 text-red-400">
                          {u.status}
                        </span>
                        <button className="text-white/60 hover:text-white flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">refresh</span>
                          <span className="text-[10px]">Retry</span>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>

              <button className="mt-6 w-full py-3 rounded-xl bg-white/5 border border-white/10 text-xs font-bold tracking-wider uppercase hover:bg-white/10 transition-all text-white/70">
                View all for Nov 07
              </button>
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  );
}