const ACCESS_KEY = "hs_access_token";
const REFRESH_KEY = "hs_refresh_token";
const USER_KEY = "hs_user";

export const tokenStore = {
  getAccess: () => localStorage.getItem(ACCESS_KEY) || "",
  setAccess: (t) => (t ? localStorage.setItem(ACCESS_KEY, t) : localStorage.removeItem(ACCESS_KEY)),

  getRefresh: () => localStorage.getItem(REFRESH_KEY) || "",
  setRefresh: (t) => (t ? localStorage.setItem(REFRESH_KEY, t) : localStorage.removeItem(REFRESH_KEY)),

  getUser: () => {
    const raw = localStorage.getItem(USER_KEY);
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  setUser: (u) => (u ? localStorage.setItem(USER_KEY, JSON.stringify(u)) : localStorage.removeItem(USER_KEY)),

  clear: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  },
};