import React from "react";
import AppShell from "../components/AppShell.jsx";

export default function ConversationDetail({ theme, setTheme }) {
  return (
    <AppShell theme={theme} setTheme={setTheme} active="conversations" topTitle="Conversation Detail">
      {/* 3-Column Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Compact Conversation List */}
        <section className="w-1/4 border-r border-glass-border flex flex-col shrink-0 bg-background-dark/20">
          <div className="p-4 border-b border-glass-border flex items-center justify-between">
            <div className="flex gap-4">
              <button className="text-xs font-bold text-primary border-b-2 border-primary pb-1">
                All
              </button>
              <button className="text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors pb-1">
                Unassigned
              </button>
              <button className="text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors pb-1">
                Priority
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {/* Sarah Jenkins (Active) */}
            <div className="p-4 bg-primary/5 border-l-4 border-primary cursor-pointer">
              <div className="flex gap-3">
                <div className="relative">
                  <img
                    className="w-12 h-12 rounded-full border border-primary/20"
                    alt="Sarah Jenkins"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuB_PMDCCtnVNyY5M57ihFx1F4RoSZj-UHirgM2p_HltXM79ogQNAs5VuNhRWYzCV655FCx0WY9RYBi-v2LabIAQhpeN_280VYbRJSfOlkP8Nq_6ZlaXvTDFpqHJ_e3N3jCoJ6HZOoTvHUhuh4opGJgcO4hftPkuESMG4JC-V7VKSJkfnZoIvPxSLtRwDYojs2QaaYLo_8uhZ8s5llKA0pO-nbqldWW2Fha-CZWHQifkS7SvsKJw0jw6QaawLWAW1LpvDFujawBcVjw"
                  />
                  <span className="absolute bottom-0 right-0 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center text-[10px] text-white font-bold border-2 border-[#102221]">
                    f
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-sm font-bold text-white truncate">Sarah Jenkins</h4>
                    <span className="text-[10px] text-slate-500">2m</span>
                  </div>
                  <p className="text-xs text-primary font-medium truncate">
                    Can you help with the bulk automation...
                  </p>
                </div>
              </div>
            </div>

            {/* Michael Chen */}
            <div className="p-4 hover:bg-slate-800/30 cursor-pointer transition-colors border-b border-glass-border/40">
              <div className="flex gap-3">
                <div className="relative">
                  <img
                    className="w-12 h-12 rounded-full opacity-70"
                    alt="Michael Chen"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuC6Jm1_2DgaQSW8XtlFHwjB3eIYqU3KCP3U2geK-wjnzC0T8zNih0Ir6udBBL0eZMjPg415Zc4aEzfz1KVtTuHc-IdzvuG_iLdaDvNh3To-OlI3z4rD7z5jBoC0ncUaPHwX9ScO0NXO9YND_bOkR45KFav7zZ9DATjj3q81mpoFDUw2BR8WJ_YUaj8ozvrf0o0NcLv0QPIegCLafUJ-JNZFKuDAROOAtvQ24s0KcgWrFOiJTqVlTWG0qZfznr5aUXDEbUdb3py8bJo"
                  />
                  <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-600 rounded-full flex items-center justify-center text-[10px] text-white font-bold border-2 border-[#102221]">
                    w
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-sm font-bold text-slate-300 truncate">Michael Chen</h4>
                    <span className="text-[10px] text-slate-500">15m</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">The logistics update looks great.</p>
                </div>
              </div>
            </div>

            {/* Elena Rodriguez */}
            <div className="p-4 hover:bg-slate-800/30 cursor-pointer transition-colors border-b border-glass-border/40">
              <div className="flex gap-3">
                <div className="relative">
                  <img
                    className="w-12 h-12 rounded-full opacity-70"
                    alt="Elena Rodriguez"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuC9_57ZRHoJeB27qCOCGR6G3IqyIJilafROrWx8oBcrVvGMXrAwgTe8Axja0a0JiKPGYgMN1VYjTct7eqzcGSHVTdXcwGI2X46pAi_hoWAn1FXjub7vKwnc6ADf5EY9N4dcNp9GNeWS0ZcwVQRxjN_w9CmEBZyAJYpp-HRSDl6BIhKU6F3VPiblLkVf4SgL_Q9eUEsg6XSTEZg6CW3cP815T4zdi3xSjjcs2syv7qt-vUteWvhzcbqIsnQgV5vOcPcvV5bjHgknegk"
                  />
                  <span className="absolute bottom-0 right-0 w-4 h-4 bg-gradient-to-tr from-yellow-400 to-pink-600 rounded-full flex items-center justify-center text-[10px] text-white font-bold border-2 border-[#102221]">
                    i
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-sm font-bold text-slate-300 truncate">Elena Rodriguez</h4>
                    <span className="text-[10px] text-slate-500">1h</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">Wait, I missed the tracking number.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Center Column: Main Message Thread */}
        <section className="flex-1 flex flex-col bg-background-dark/10 relative">
          {/* Thread Header */}
          <div className="h-16 border-b border-glass-border px-6 flex items-center justify-between shrink-0 bg-background-dark/40">
            <div className="flex items-center gap-4">
              <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-800/50 hover:text-white transition-all">
                <span className="material-symbols-outlined text-lg">arrow_back</span>
              </button>

              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">Sarah Jenkins</h3>
                  <span className="bg-blue-600/20 text-blue-400 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border border-blue-600/30">
                    Facebook
                  </span>
                  <span className="bg-primary/20 text-primary text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border border-primary/30">
                    Open
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-800/50 rounded-xl px-3 py-1.5 border border-glass-border">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Assignee:</span>
                <button className="flex items-center gap-1 text-[11px] font-bold text-white">
                  <img
                    className="w-4 h-4 rounded-full"
                    alt="Me"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBF_rklBwEAA6mRu39KTm0b4rpV0ftHiQ39G-td8pTwlTwO-SCmpQi1c-tPt6kfP64yaNxn5grXs78gFaguVJVN0UR0UIJuqjhuFJRN6vSXWddUD2ZmhnrKhHLr5uuCqQ4R8z6ITZ8xqQuqblFx0VywofXEDrBB51aKXQN3FkT82mlwSeV-Hw74uEdc871VBlGHNkO78Rl8jSkQx0cqgyCUjHTDu5hZ1w-Q5ODJF-vMWizOjsk-Dpt7xa-f_YFndPXFhxg18CvUpoE"
                  />
                  Me
                  <span className="material-symbols-outlined text-sm">expand_more</span>
                </button>
              </div>

              <button className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-800/50 border border-glass-border">
                <span className="material-symbols-outlined">more_vert</span>
              </button>
            </div>
          </div>

          {/* Messages History */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
            <div className="flex justify-center">
              <span className="text-[10px] font-bold text-slate-600 bg-slate-800/40 px-3 py-1 rounded-full uppercase tracking-widest">
                Today
              </span>
            </div>

            {/* Inbound Message */}
            <div className="flex gap-3 max-w-[80%]">
              <img
                className="w-8 h-8 rounded-full shrink-0"
                alt="Sarah"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC1ycStHrjw75OFLZIBk8a1MwSJMVx_lG0zSHqEQI4ZQPl0XPVXXGBOJn82njPLI0AlOdAU5h3Az7qa-9G9sgsXu5yp-wmbohiwHQviDW6U7GMiJMZEE9NiaOUg_vCzexOXNWaDPaJNBXyTXHIUhY7g2tlmVLBscaCMr_LeVzU3wSiizo4MYyocdd1VH-wV7Aq0PEDO9_Rb_lg8ntypeK3jwtBdLgUvBjzyOSi6Sum_58WIcGrBXZI3DwKhqlAkTsFajj7SNHEkKFw"
              />
              <div className="space-y-1">
                <div className="message-inbound p-4 rounded-2xl rounded-tl-none text-sm leading-relaxed text-slate-200">
                  Hi, I am looking to automate my bulk outreach for the logistics project. Can you help
                  with the bulk automation features info? We have about 5,000 leads to process.
                </div>
                <div className="text-[10px] text-slate-500 font-medium ml-1 uppercase">10:42 AM</div>
              </div>
            </div>

            {/* Outbound Message */}
            <div className="flex flex-row-reverse gap-3 max-w-[80%] ml-auto">
              <img
                className="w-8 h-8 rounded-full shrink-0"
                alt="Operator"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAJi-7qV9MKICeauzW_m6oUjz6PQMH_lsm4kuiQ2Xq-iB3wsTBEOv_ORW-hpFmMuvGVhgyT1uBoGA96IRYseM8jqtOE0rwM39v06HukH5THiExKEtN5OeUTxfuMy1WjvEksCD0s76CzPkpjytXMkzmxsscVC0GroNf_hGYv1J1PsBoDUHSn5OTVzVuk3Zy7xLAnFlPErZPimCDPUQVGqtB8aGdeyLKKwFFJhTgo0gquIxRD1Oac73AmwppZ9JhkHA0CCeYL22Wezdk"
              />
              <div className="space-y-1 text-right">
                <div className="message-outbound p-4 rounded-2xl rounded-tr-none text-sm leading-relaxed text-slate-100 shadow-[0_0_15px_rgba(19,241,226,0.05)]">
                  Hello Sarah! Absolutely. Our Enterprise tier includes the Bulk Sequence Automator which
                  is perfect for logistics scale. I&apos;ve attached our feature comparison sheet below.
                </div>
                <div className="flex items-center justify-end gap-1 text-[10px] text-slate-500 font-medium mr-1 uppercase">
                  10:45 AM • <span className="text-primary font-bold tracking-tight">Delivered</span>
                </div>
              </div>
            </div>

            {/* Outbound Message 2 */}
            <div className="flex flex-row-reverse gap-3 max-w-[80%] ml-auto">
              <div className="w-8 h-8 shrink-0 opacity-0" />
              <div className="space-y-1 text-right">
                <div className="message-outbound p-4 rounded-2xl text-sm leading-relaxed text-slate-100 shadow-[0_0_15px_rgba(19,241,226,0.05)]">
                  Would you like to schedule a 15-minute walkthrough of the automation dashboard later today?
                </div>
                <div className="flex items-center justify-end gap-1 text-[10px] text-slate-500 font-medium mr-1 uppercase">
                  10:46 AM • <span className="text-primary font-bold tracking-tight">Sent</span>
                </div>
              </div>
            </div>

            {/* Inbound Message 2 */}
            <div className="flex gap-3 max-w-[80%]">
              <img
                className="w-8 h-8 rounded-full shrink-0"
                alt="Sarah"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCmSQWSx4nJppkHKs9UGxisulA7nN3alu_Qyyd_IvaVOVCr-gs9gdilVEa11KPi1xMd9pifYlKJleGfcJRKdK9lbTFhcpF-OSv_hYSI65ZaeYkjn_4iyEuydH2b9NRT2kG3brwoJE0i_zE9qRKh1AxlS__z4fXjidTmKACIIIXl_r9K7z7_oH90K6WxFv5bZWrT3wwnXk4Z42DbnbbBqi07NdvouKOQ2pn7EztYobrf_lLGhDfMVbGJQtG1mavgNZw8pjIVv1-OlKY"
              />
              <div className="space-y-1">
                <div className="message-inbound p-4 rounded-2xl rounded-tl-none text-sm leading-relaxed text-slate-200">
                  That would be great. I&apos;m available after 2 PM.
                </div>
                <div className="text-[10px] text-slate-500 font-medium ml-1 uppercase">10:50 AM</div>
              </div>
            </div>
          </div>

          {/* Composer */}
          <div className="p-6 pt-0">
            <div className="glass-panel rounded-2xl p-2 border border-glass-border shadow-xl">
              <textarea
                className="w-full bg-transparent border-none focus:ring-0 text-sm text-white resize-none placeholder:text-slate-600 custom-scrollbar"
                placeholder="Type your message to Sarah..."
                rows={3}
              />
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-glass-border/30">
                <div className="flex items-center gap-1">
                  <button className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-primary hover:bg-primary/5 transition-all">
                    <span className="material-symbols-outlined text-xl">attach_file</span>
                  </button>
                  <button className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-primary hover:bg-primary/5 transition-all">
                    <span className="material-symbols-outlined text-xl">temp_preferences_custom</span>
                  </button>
                  <button className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-primary hover:bg-primary/5 transition-all">
                    <span className="material-symbols-outlined text-xl">image</span>
                  </button>
                  <div className="h-5 w-px bg-glass-border/50 mx-1" />
                  <button className="px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-500 border border-glass-border/50 hover:border-primary/30 hover:text-primary transition-all">
                    Use Template
                  </button>
                </div>

                <button className="bg-gradient-to-r from-primary/80 to-primary text-background-dark font-bold px-6 py-2 rounded-xl text-sm flex items-center gap-2 hover:shadow-[0_0_20px_rgba(19,241,226,0.3)] transition-all">
                  Send
                  <span className="material-symbols-outlined text-lg">send</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Contact Profile Panel */}
        <section className="w-1/4 border-l border-glass-border flex flex-col shrink-0 bg-background-dark/20 overflow-y-auto custom-scrollbar">
          {/* Profile Header */}
          <div className="p-8 flex flex-col items-center text-center border-b border-glass-border/40">
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-full border-2 border-primary/20 p-1 bg-background-dark">
                <img
                  className="w-full h-full rounded-full object-cover"
                  alt="Sarah profile"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuA-WXmLeAXxQ16a0KV5MPZiWbsxAOsrCX70FdMWzTSXS7Lq7_dd8bJQrLzI091s7nYuMF2evHESHWhQq_XmJzRP0OLx72aZghDwMCIwQLyMZXr0y_I3oGl4R_g49oUwoIX0m2ClbdWVR5uC2rvFPKg15QagVHf0jsg7Mze5lK9AgZdVTAJ4g898XHbQmJhnhv6o6slWEKCHNYsoZ_-fY4BG-GxNnel-7mmpzOqXGqAZ4hgU9EL9h97EEw6a5phzeFrupehQdKMhv9s"
                />
              </div>
              <div className="absolute bottom-1 right-1 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white border-4 border-background-dark">
                <span className="material-symbols-outlined text-[14px]">social_leaderboard</span>
              </div>
            </div>

            <h3 className="text-lg font-bold text-white leading-tight">Sarah Jenkins</h3>
            <p className="text-sm text-slate-500 font-medium">@sjenkins</p>

            <div className="mt-4 flex gap-2">
              <button className="w-10 h-10 rounded-xl bg-slate-800/60 flex items-center justify-center text-slate-300 hover:text-primary border border-glass-border transition-all">
                <span className="material-symbols-outlined">call</span>
              </button>
              <button className="w-10 h-10 rounded-xl bg-slate-800/60 flex items-center justify-center text-slate-300 hover:text-primary border border-glass-border transition-all">
                <span className="material-symbols-outlined">mail</span>
              </button>
              <button className="w-10 h-10 rounded-xl bg-slate-800/60 flex items-center justify-center text-slate-300 hover:text-primary border border-glass-border transition-all">
                <span className="material-symbols-outlined">block</span>
              </button>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* Tags Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tags</h4>
                <button className="text-[10px] text-primary hover:underline font-bold">Manage</button>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold uppercase tracking-tight shadow-sm">
                  Priority
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-800/60 border border-glass-border text-slate-300 text-[11px] font-bold uppercase tracking-tight">
                  Enterprise
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-800/60 border border-glass-border text-slate-300 text-[11px] font-bold uppercase tracking-tight">
                  Logistics
                </span>
                <button className="w-7 h-7 rounded-full border border-dashed border-slate-600 flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary transition-all">
                  <span className="material-symbols-outlined text-sm">add</span>
                </button>
              </div>
            </div>

            {/* Internal Notes */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Internal Notes
                </h4>
                <span className="material-symbols-outlined text-sm text-slate-600">edit</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/40 border border-glass-border/40">
                <p className="text-xs text-slate-400 leading-relaxed italic">
                  Requested bulk automation features info. Likely prospect for enterprise upgrade next quarter.
                </p>
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Activity Timeline
              </h4>

              <div className="space-y-6 relative ml-2">
                <div className="absolute left-0 top-1 bottom-1 w-px bg-glass-border/50" />

                <div className="relative pl-6">
                  <div className="absolute left-[-4px] top-1 w-2 h-2 rounded-full bg-primary ring-4 ring-background-dark" />
                  <p className="text-[11px] text-white font-bold leading-tight">Assigned to Me</p>
                  <p className="text-[10px] text-slate-500 font-medium mt-1">2 hours ago</p>
                </div>

                <div className="relative pl-6">
                  <div className="absolute left-[-4px] top-1 w-2 h-2 rounded-full bg-slate-700 ring-4 ring-background-dark" />
                  <p className="text-[11px] text-slate-300 font-bold leading-tight">Status changed to Open</p>
                  <p className="text-[10px] text-slate-500 font-medium mt-1">3 hours ago</p>
                </div>

                <div className="relative pl-6">
                  <div className="absolute left-[-4px] top-1 w-2 h-2 rounded-full bg-slate-700 ring-4 ring-background-dark" />
                  <p className="text-[11px] text-slate-300 font-bold leading-tight">
                    New message via Facebook Messenger
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium mt-1">Today, 10:42 AM</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
