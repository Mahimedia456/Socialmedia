import React from "react";
import AppShell from "../components/AppShell.jsx";


function KpiCard({ title, value, sub }) {
  return (
    <div className="glass-panel p-6 rounded-xl">
      <p className="text-white/40 text-xs font-bold uppercase tracking-wider">{title}</p>
      <h3 className="text-3xl font-black text-primary mt-2">{value}</h3>
      <p className="text-white/60 text-[11px] mt-1">{sub}</p>
    </div>
  );
}

export default function Analytics({ theme, setTheme }) {
  return (
    <AppShell theme={theme} setTheme={setTheme} active="analytics" topTitle={null}>
      <main className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
        {/* Page Header Actions */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight">Analytics</h2>
            <p className="text-white/60 text-sm mt-1">
              Performance insights across conversations and publishing.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center glass-panel px-3 py-2 rounded-xl gap-2 cursor-pointer hover:bg-white/5 transition-colors">
              <span className="material-symbols-outlined text-[20px] text-primary">
                calendar_month
              </span>
              <span className="text-sm font-medium">Last 30 days</span>
              <span className="material-symbols-outlined text-[18px] text-white/40">
                expand_more
              </span>
            </div>

            <button className="glass-panel px-4 py-2 rounded-xl text-sm font-bold text-white hover:bg-white/5 transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">ios_share</span>
              Export report
            </button>

            <button className="bg-primary px-4 py-2 rounded-xl text-sm font-bold text-background-dark hover:opacity-90 transition-opacity flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">download</span>
              Download CSV
            </button>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard title="Total inbound messages" value="1,284" sub="Across all channels" />
          <KpiCard title="First response time (avg)" value="14m" sub="Median 11m" />
          <KpiCard title="Resolution time (avg)" value="2h 12m" sub="Open to resolved" />
          <KpiCard title="Outbound replies" value="1,042" sub="Agent responses" />
        </div>

        {/* Message Volume Trend */}
        <div className="glass-panel p-6 rounded-xl">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-bold">Message Volume Trend</h4>
            <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-bold">
              Peak activity observed on Tuesday
            </span>
          </div>

          <div className="h-[250px] w-full relative">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 100">
              <defs>
                <linearGradient id="lineGradient" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="#13f1e2" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#13f1e2" stopOpacity="0" />
                </linearGradient>
              </defs>

              <path
                d="M0,80 Q100,20 200,60 T400,30 T600,70 T800,40 T1000,50 L1000,100 L0,100 Z"
                fill="url(#lineGradient)"
              />
              <path
                d="M0,80 Q100,20 200,60 T400,30 T600,70 T800,40 T1000,50"
                fill="none"
                stroke="#13f1e2"
                strokeWidth="2"
              />
            </svg>

            <div className="absolute bottom-0 w-full flex justify-between px-2 text-[10px] text-white/40 pt-4 border-t border-glass-border">
              <span>01 Oct</span>
              <span>05 Oct</span>
              <span>10 Oct</span>
              <span>15 Oct</span>
              <span>20 Oct</span>
              <span>25 Oct</span>
              <span>30 Oct</span>
            </div>
          </div>
        </div>

        {/* Channel Distribution + Table */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Donut */}
          <div className="lg:col-span-5 glass-panel p-6 rounded-xl flex flex-col items-center">
            <h4 className="text-lg font-bold w-full mb-8">Channel Distribution</h4>

            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="rgba(19, 241, 226, 0.05)"
                  strokeWidth="3"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="#13f1e2"
                  strokeWidth="3"
                  strokeDasharray="48 100"
                  strokeDashoffset="0"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="#13f1e2"
                  strokeWidth="3"
                  strokeDasharray="32 100"
                  strokeDashoffset="-48"
                  opacity="0.6"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="#13f1e2"
                  strokeWidth="3"
                  strokeDasharray="20 100"
                  strokeDashoffset="-80"
                  opacity="0.3"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-2xl font-black text-primary">1.2k</p>
                <p className="text-[10px] text-white/40 uppercase">Total</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-8 mt-8 w-full text-center">
              <div>
                <p className="text-primary text-xl font-bold">48%</p>
                <p className="text-[10px] text-white/40 uppercase mt-1">Facebook</p>
              </div>
              <div>
                <p className="text-primary/70 text-xl font-bold">32%</p>
                <p className="text-[10px] text-white/40 uppercase mt-1">Instagram</p>
              </div>
              <div>
                <p className="text-primary/40 text-xl font-bold">20%</p>
                <p className="text-[10px] text-white/40 uppercase mt-1">Reddit</p>
              </div>
            </div>
          </div>

          {/* Channel Performance Table */}
          <div className="lg:col-span-7 glass-panel rounded-xl overflow-hidden flex flex-col">
            <div className="p-6">
              <h4 className="text-lg font-bold">Channel Performance</h4>
            </div>

            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-[11px] uppercase text-white/40 font-bold">
                  <tr>
                    <th className="px-6 py-3">Channel</th>
                    <th className="px-6 py-3">Avg First Resp</th>
                    <th className="px-6 py-3">Handled</th>
                    <th className="px-6 py-3">SLA Met</th>
                  </tr>
                </thead>

                <tbody className="text-sm divide-y divide-glass-border">
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      Facebook
                    </td>
                    <td className="px-6 py-4">12m 45s</td>
                    <td className="px-6 py-4 font-bold">612</td>
                    <td className="px-6 py-4">
                      <div className="w-full bg-primary/10 h-1.5 rounded-full">
                        <div className="bg-primary h-1.5 rounded-full" style={{ width: "94%" }} />
                      </div>
                      <p className="text-[10px] mt-1 text-primary">94.2%</p>
                    </td>
                  </tr>

                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary/70" />
                      Instagram
                    </td>
                    <td className="px-6 py-4">15m 10s</td>
                    <td className="px-6 py-4 font-bold">408</td>
                    <td className="px-6 py-4">
                      <div className="w-full bg-primary/10 h-1.5 rounded-full">
                        <div className="bg-primary h-1.5 rounded-full" style={{ width: "88%" }} />
                      </div>
                      <p className="text-[10px] mt-1 text-primary">88.5%</p>
                    </td>
                  </tr>

                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary/40" />
                      Reddit
                    </td>
                    <td className="px-6 py-4">19m 20s</td>
                    <td className="px-6 py-4 font-bold">254</td>
                    <td className="px-6 py-4">
                      <div className="w-full bg-primary/10 h-1.5 rounded-full">
                        <div className="bg-primary h-1.5 rounded-full" style={{ width: "76%" }} />
                      </div>
                      <p className="text-[10px] mt-1 text-primary">76.0%</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Agent Performance Leaderboard */}
        <div className="glass-panel rounded-xl overflow-hidden">
          <div className="p-6 border-b border-glass-border">
            <h4 className="text-lg font-bold">Agent Performance Leaderboard</h4>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-[11px] uppercase text-white/40 font-bold">
                <tr>
                  <th className="px-6 py-4">Agent Name</th>
                  <th className="px-6 py-4 text-center">Handled</th>
                  <th className="px-6 py-4">Avg Response</th>
                  <th className="px-6 py-4 text-center">Resolved</th>
                  <th className="px-6 py-4">CSAT Score</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>

              <tbody className="text-sm divide-y divide-glass-border">
                {/* Row 1 */}
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        className="w-8 h-8 rounded-full object-cover"
                        alt="Sarah Chen"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuD33VQU4Mar-BUCYRLQxjmmkCYpjkSRLDwVc3y7yBnsNTiCp6xPqFKipD-f5i0GSe0o5METNUWYfW1sMWSJFtyzzs8HyHmJErXhaWh9Q6CwzvbR-2mQB92DI7BvY5LBDsRCX61sO4u8D_UNHeP4il2kymKJnJSdN3E4x4uwwmZT4XYeMA4jkJ1nfMvJ6_KhXIHYQqCWLDwRjmUCUk5NFgLXJj1H-dST8Otm086Vmz3ejaexythtcLKLdgA7F3wnao5qWpOUhJC--xA"
                      />
                      <span className="font-bold">Sarah Chen</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">312</td>
                  <td className="px-6 py-4">08m 12s</td>
                  <td className="px-6 py-4 text-center">298</td>
                  <td className="px-6 py-4">
                    <div className="flex text-primary items-center">
                      <span className="material-symbols-outlined text-[16px]">star</span>
                      <span className="material-symbols-outlined text-[16px]">star</span>
                      <span className="material-symbols-outlined text-[16px]">star</span>
                      <span className="material-symbols-outlined text-[16px]">star</span>
                      <span className="material-symbols-outlined text-[16px]">star_half</span>
                      <span className="ml-2 text-xs font-bold">4.8</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase">
                      High
                    </span>
                  </td>
                </tr>

                {/* Row 2 */}
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        className="w-8 h-8 rounded-full object-cover"
                        alt="Marcus Wright"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDedIVbfF19GPjUxJb-vql5nQmb7Cx92j60TRqG2JiCe0KUpXabjBtv1rjpBxwBUsPN1A9mBfMw6AtoN4xFnxXFTBNDsqqyGTCyBkNwPE3M4LAT5pYU69IsatpNK2JDxopLmteySak03sQy4P6wk5HxIT_JQKEV-rZ1MEsutzDzjyPHwUm9U74NtmzTxJzgreQ9fV4-Ya8G4cYxrohWNbcZE2vDodmSvrJHQ7hpmJYivufFNv_qm3QHg_qLWSO81pDOtbRrab-lNdA"
                      />
                      <span className="font-bold">Marcus Wright</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">284</td>
                  <td className="px-6 py-4">11m 45s</td>
                  <td className="px-6 py-4 text-center">271</td>
                  <td className="px-6 py-4">
                    <div className="flex text-primary items-center">
                      <span className="material-symbols-outlined text-[16px]">star</span>
                      <span className="material-symbols-outlined text-[16px]">star</span>
                      <span className="material-symbols-outlined text-[16px]">star</span>
                      <span className="material-symbols-outlined text-[16px]">star</span>
                      <span className="material-symbols-outlined text-[16px]">star</span>
                      <span className="ml-2 text-xs font-bold">4.9</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase">
                      High
                    </span>
                  </td>
                </tr>

                {/* Row 3 */}
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        className="w-8 h-8 rounded-full object-cover"
                        alt="David Kim"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuB3Wsi8uPTjekoMirzousQMBg9fPQ73en28GEBSTbgeX2euZyGm4g4fLpYSU6E_vP3ErVoGDDItwW1RVFLRx_saur5o8G9hGoH8DpVMPZ7eAEGrTYNseLsUD-x2PyFSsSc4SwvQ_b_j21m00iXAxzDORaDoS_wMJGRzH1bSQOstT6uYbVy1vdmPivF_axOIm9vJvEItvWtupNBvsDdoI0rzFrYqi7YcOQC5kFFllamge4lE-SCZrQh3pCPjoEt9wJedEOGgCzuTzqE"
                      />
                      <span className="font-bold">David Kim</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">245</td>
                  <td className="px-6 py-4">14m 30s</td>
                  <td className="px-6 py-4 text-center">230</td>
                  <td className="px-6 py-4">
                    <div className="flex text-primary items-center">
                      <span className="material-symbols-outlined text-[16px]">star</span>
                      <span className="material-symbols-outlined text-[16px]">star</span>
                      <span className="material-symbols-outlined text-[16px]">star</span>
                      <span className="material-symbols-outlined text-[16px]">star</span>
                      <span className="material-symbols-outlined text-[16px] text-white/20">star</span>
                      <span className="ml-2 text-xs font-bold">4.2</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-primary/10 text-primary/60 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                      Medium
                    </span>
                  </td>
                </tr>

                {/* Row 4 */}
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        className="w-8 h-8 rounded-full object-cover"
                        alt="Elena Rossi"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAJ9LjQb9PeklOdEseUcL0fwdXDIqQGIY3gufNpc68Y3-A7W1r29yLGB52uctpCpknD3lmIMr1mxJWLqr3ztm1nDFtHb9Kj40iHtR9xLhfYPvdYKxNPWGdKD-1cYjU3XdHW4FcyPzTocgZSULoIVTq6lYwbibGA4lxJbucXp-tJEAEpzajYE5nJh-dES3wA8m7VNIFt0MyJBZU5rP5gxnovHica6VRapm7ZvAZrAd0-lqr0kJH4jYLghWaT5l4tZjG25xXpnPcHbE0"
                      />
                      <span className="font-bold">Elena Rossi</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">198</td>
                  <td className="px-6 py-4">18m 55s</td>
                  <td className="px-6 py-4 text-center">184</td>
                  <td className="px-6 py-4">
                    <div className="flex text-primary items-center">
                      <span className="material-symbols-outlined text-[16px]">star</span>
                      <span className="material-symbols-outlined text-[16px]">star</span>
                      <span className="material-symbols-outlined text-[16px]">star</span>
                      <span className="material-symbols-outlined text-[16px] text-white/20">star</span>
                      <span className="material-symbols-outlined text-[16px] text-white/20">star</span>
                      <span className="ml-2 text-xs font-bold">3.8</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-primary/10 text-primary/60 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                      Medium
                    </span>
                  </td>
                </tr>

                {/* Row 5 */}
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        className="w-8 h-8 rounded-full object-cover"
                        alt="James T."
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuB58shUIUnNx3iGiyDXpkcf3Wc5Uln0ZCMVUEhbB_qydEm-AsuKbIWoXD3K5xamEAxzJi8w1RhjbMTRFeBlnClnc_pkkTsRojSV7FI7a9i5CAU5dqo7m7uSdb9vw4UI-WFta_2CYzr7zQN0prIhKhvNLPAD4zO049M16ynSA3jkQODnSns-XCksX0cG8RfJvnI2AOhQ7tohPFZV7kqR-be4rmx5E2Unm_WVML5HvjjE_8o0MJQJWz06pfHrbsKNut-1ERZOn0CCrOc"
                      />
                      <span className="font-bold">James T.</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">142</td>
                  <td className="px-6 py-4">26m 12s</td>
                  <td className="px-6 py-4 text-center">120</td>
                  <td className="px-6 py-4">
                    <div className="flex text-primary items-center">
                      <span className="material-symbols-outlined text-[16px]">star</span>
                      <span className="material-symbols-outlined text-[16px]">star</span>
                      <span className="material-symbols-outlined text-[16px] text-white/20">star</span>
                      <span className="material-symbols-outlined text-[16px] text-white/20">star</span>
                      <span className="material-symbols-outlined text-[16px] text-white/20">star</span>
                      <span className="ml-2 text-xs font-bold">2.9</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-white/5 text-white/40 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                      Low
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Publishing Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
          {/* Posts per Channel */}
          <div className="glass-panel p-6 rounded-xl">
            <h4 className="text-lg font-bold mb-6">Posts per Channel</h4>

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase text-white/40">
                  <span>Facebook</span>
                  <span className="text-primary">84 Posts</span>
                </div>
                <div className="w-full bg-white/5 h-6 rounded-lg overflow-hidden border border-glass-border">
                  <div className="bg-primary h-full rounded-r-lg" style={{ width: "70%" }} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase text-white/40">
                  <span>Instagram</span>
                  <span className="text-primary">112 Posts</span>
                </div>
                <div className="w-full bg-white/5 h-6 rounded-lg overflow-hidden border border-glass-border">
                  <div className="bg-primary h-full rounded-r-lg" style={{ width: "90%" }} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase text-white/40">
                  <span>Reddit</span>
                  <span className="text-primary">24 Posts</span>
                </div>
                <div className="w-full bg-white/5 h-6 rounded-lg overflow-hidden border border-glass-border">
                  <div className="bg-primary h-full rounded-r-lg" style={{ width: "35%" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Publishing Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-panel p-6 rounded-xl flex flex-col justify-center">
              <span className="material-symbols-outlined text-primary mb-2">article</span>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Total Posts</p>
              <h3 className="text-2xl font-black mt-1">220</h3>
            </div>

            <div className="glass-panel p-6 rounded-xl flex flex-col justify-center">
              <span className="material-symbols-outlined text-primary mb-2">favorite</span>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider">
                Engage Rate
              </p>
              <h3 className="text-2xl font-black mt-1">4.2%</h3>
            </div>

            <div className="glass-panel p-6 rounded-xl flex flex-col justify-center border-red-500/20">
              <span className="material-symbols-outlined text-red-400 mb-2">error</span>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider">
                Failed Posts
              </p>
              <h3 className="text-2xl font-black mt-1 text-red-400">3</h3>
            </div>

            <div className="glass-panel p-6 rounded-xl flex flex-col justify-center">
              <span className="material-symbols-outlined text-primary mb-2">schedule</span>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Upcoming</p>
              <h3 className="text-2xl font-black mt-1">12</h3>
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
