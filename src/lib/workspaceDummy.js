export const dummyWorkspace = {
  id: "mahimedia",
  name: "Mahimedia Solutions",
};

export const dummyKpis = [
  { label: "Connected Channels", value: 12, icon: "share_reviews", delta: "+2.4%" },
  { label: "Scheduled Posts", value: 48, icon: "calendar_month", delta: "+15.8%" },
  { label: "Unread Messages", value: 5, icon: "mark_chat_unread", highlight: true },
  { label: "Active Members", value: 8, icon: "groups", tag: "Stable" },
];

export const dummyActivity = [
  {
    icon: "edit_square",
    iconColor: "text-primary",
    title: "Sarah K.",
    text: "scheduled a post to",
    target: "LinkedIn",
    meta: "2 minutes ago • Mahimedia Solutions",
    primary: true,
  },
  {
    icon: "sync",
    iconColor: "text-slate-400",
    title: "System",
    text: "refreshed API connection for",
    target: "Instagram Business",
    meta: "45 minutes ago • Automation",
  },
  {
    icon: "person_add",
    iconColor: "text-slate-400",
    title: "Alex Chen",
    text: "joined the workspace as",
    pill: "Editor",
    meta: "2 hours ago • HR Team",
  },
];

export const dummyMembers = [
  { initials: "MK", name: "Marco Kholov", email: "marco@mahimedia.com", role: "Admin", online: true, roleStyle: "primary" },
  { initials: "SK", name: "Sarah King", email: "sarah.k@mahimedia.com", role: "Editor", online: true, roleStyle: "neutral" },
  { initials: "AC", name: "Alex Chen", email: "a.chen@mahimedia.com", role: "Editor", online: false, roleStyle: "neutral" },
  { initials: "JL", name: "Jessica Liu", email: "jess@mahimedia.com", role: "Analyst", online: true, roleStyle: "neutral" },
];