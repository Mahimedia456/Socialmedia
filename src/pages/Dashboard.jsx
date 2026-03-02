import React from "react";
import AppShell from "../components/AppShell.jsx";

function StatCard({ icon, title, value, delta, deltaColor = "text-primary", footer }) {
  return (
    <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
        <span className="material-symbols-outlined text-6xl text-primary">{icon}</span>
      </div>

      <p className="text-sm font-medium text-slate-400">{title}</p>
      <div className="flex items-end gap-2 mt-2">
        <h3 className="text-2xl font-bold text-white">{value}</h3>
        <span className={`text-xs font-bold ${deltaColor} mb-1`}>{delta}</span>
      </div>

      <div className="mt-4 flex items-center gap-1">
        <div className="size-1 rounded-full bg-primary" />
        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
          {footer}
        </span>
      </div>
    </div>
  );
}

function LiveItem({ bg, icon, iconColor, titleBold, text, time }) {
  return (
    <div className="flex gap-4">
      <div className={`size-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
        <span className={`material-symbols-outlined ${iconColor}`}>{icon}</span>
      </div>
      <div>
        <p className="text-sm text-slate-300 font-medium">
          <span className="text-white">{titleBold}</span> {text}
        </p>
        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1 inline-block">
          {time}
        </span>
      </div>
    </div>
  );
}

export default function Dashboard({ theme, setTheme }) {
  return (
    <AppShell theme={theme} setTheme={setTheme} active="dashboard">
      {/* Page Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Dashboard Overview</h2>
          <p className="text-slate-400 mt-1">Monitor real-time engagement across your portfolio.</p>
        </div>

        <div className="flex gap-3">
          <button className="px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-white text-sm font-semibold transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">download</span>
            Export
          </button>
          <button className="px-5 py-2.5 rounded-xl bg-primary text-background-dark text-sm font-bold active-glow hover:brightness-110 transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">add_circle</span>
            New Post
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard icon="groups" title="Total Audience" value="842,501" delta="+12.4%" footer="Growth per month" />
        <StatCard icon="touch_app" title="Engagement Rate" value="4.21%" delta="+0.8%" footer="Industry standard 2.4%" />
        <StatCard icon="forum" title="Active Conversations" value="1,894" delta="-2.1%" deltaColor="text-red-400" footer="Average response: 4m" />
        <StatCard icon="visibility" title="Total Impressions" value="2.4M" delta="+24.5%" footer="Campaign: Spring Launch" />
      </div>

      {/* Main Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance */}
        <div className="lg:col-span-2 glass-card rounded-3xl p-8 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h4 className="text-lg font-bold text-white">Performance Analytics</h4>
              <p className="text-sm text-slate-500">Weekly engagement trends across platforms</p>
            </div>
            <div className="flex bg-white/5 rounded-xl p-1">
              <button className="px-4 py-1.5 text-xs font-bold rounded-lg bg-primary/20 text-primary">
                Line
              </button>
              <button className="px-4 py-1.5 text-xs font-bold rounded-lg text-slate-500 hover:text-white">
                Bar
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-[300px] w-full flex items-center justify-center relative bg-white/5 rounded-2xl overflow-hidden border border-white/5">
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: "radial-gradient(#13f1e2 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            />
            <div className="relative z-10 flex flex-col items-center">
              <div className="flex items-end gap-4 h-48 mb-4">
                <div className="w-8 bg-primary/20 h-24 rounded-t-lg border-t-2 border-primary active-glow" />
                <div className="w-8 bg-primary/20 h-32 rounded-t-lg border-t-2 border-primary active-glow" />
                <div className="w-8 bg-primary/20 h-20 rounded-t-lg border-t-2 border-primary active-glow" />
                <div className="w-8 bg-primary/20 h-40 rounded-t-lg border-t-2 border-primary active-glow" />
                <div className="w-8 bg-primary/20 h-28 rounded-t-lg border-t-2 border-primary active-glow" />
                <div className="w-8 bg-primary/20 h-36 rounded-t-lg border-t-2 border-primary active-glow" />
                <div className="w-8 bg-primary h-44 rounded-t-lg active-glow" />
              </div>
              <span className="text-xs text-slate-500 font-medium">Real-time data stream active</span>
            </div>
          </div>
        </div>

        {/* Live Feed */}
        <div className="glass-card rounded-3xl p-8">
          <h4 className="text-lg font-bold text-white mb-6">Live Feed</h4>
          <div className="space-y-6">
            <LiveItem
              bg="bg-blue-500/20"
              icon="thumb_up"
              iconColor="text-blue-400"
              titleBold="New Like"
              text='on "Sustainable Futures" campaign post.'
              time="2 minutes ago"
            />
            <LiveItem
              bg="bg-primary/20"
              icon="chat"
              iconColor="text-primary"
              titleBold="Comment"
              text="received from Sarah J. on Instagram."
              time="14 minutes ago"
            />
            <LiveItem
              bg="bg-purple-500/20"
              icon="share"
              iconColor="text-purple-400"
              titleBold="Shared"
              text="content reached 15k organic impressions."
              time="1 hour ago"
            />
            <LiveItem
              bg="bg-white/10"
              icon="schedule"
              iconColor="text-white"
              titleBold="Post Scheduled"
              text='for "Tech News Weekly" at 5:00 PM.'
              time="3 hours ago"
            />
          </div>

          <button className="w-full mt-8 py-3 rounded-xl border border-white/10 text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all">
            View All Activity
          </button>
        </div>
      </div>

      {/* Upcoming Schedule */}
      <div className="mt-8 glass-card rounded-3xl p-8 border border-primary/10">
        <div className="flex items-center gap-3 mb-6">
          <span className="material-symbols-outlined text-primary">event_upcoming</span>
          <h4 className="text-lg font-bold text-white">Upcoming Schedule</h4>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px] p-4 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[10px] text-primary font-bold uppercase tracking-widest">
              Tomorrow 09:00
            </span>
            <p className="text-white font-semibold mt-1">Product Keynote Teaser</p>
            <div className="flex items-center gap-2 mt-3">
              <div className="size-5 rounded bg-blue-500 flex items-center justify-center">
                <span className="material-symbols-outlined text-xs text-white">social_leaderboard</span>
              </div>
              <span className="text-xs text-slate-500">Facebook Page</span>
            </div>
          </div>

          <div className="flex-1 min-w-[200px] p-4 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[10px] text-primary font-bold uppercase tracking-widest">
              Wed 14:30
            </span>
            <p className="text-white font-semibold mt-1">Hiring: Creative Lead</p>
            <div className="flex items-center gap-2 mt-3">
              <div className="size-5 rounded bg-sky-500 flex items-center justify-center">
                <span className="material-symbols-outlined text-xs text-white">alt_route</span>
              </div>
              <span className="text-xs text-slate-500">LinkedIn &amp; X</span>
            </div>
          </div>

          <div className="flex-1 min-w-[200px] p-4 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[10px] text-primary font-bold uppercase tracking-widest">
              Fri 11:00
            </span>
            <p className="text-white font-semibold mt-1">Weekly Wrap-up Video</p>
            <div className="flex items-center gap-2 mt-3">
              <div className="size-5 rounded bg-pink-500 flex items-center justify-center">
                <span className="material-symbols-outlined text-xs text-white">play_circle</span>
              </div>
              <span className="text-xs text-slate-500">TikTok &amp; IG Reels</span>
            </div>
          </div>

          <div className="w-full lg:w-48 flex items-center justify-center p-4 rounded-2xl border-2 border-dashed border-white/10 hover:border-primary/40 hover:bg-primary/5 cursor-pointer transition-all group">
            <div className="flex flex-col items-center">
              <span className="material-symbols-outlined text-slate-500 group-hover:text-primary mb-1">
                add_circle
              </span>
              <span className="text-xs font-bold text-slate-500 group-hover:text-primary">
                Plan more
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
