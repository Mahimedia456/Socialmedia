const THEME_KEY = "mahi_theme"; // "dark" | "light"

export function getInitialTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return "dark";
}

export function applyTheme(theme) {
  const root = document.documentElement;
  // Tailwind dark mode
  root.classList.toggle("dark", theme === "dark");
  // optional helper class for your CSS blocks
  root.classList.toggle("light", theme === "light");

  localStorage.setItem(THEME_KEY, theme);
}

export function toggleTheme(current) {
  return current === "dark" ? "light" : "dark";
}
