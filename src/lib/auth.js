// src/lib/auth.js
const KEY = "dr_online_token";
const EVT = "auth:changed";

function emitAuthChanged() {
  window.dispatchEvent(new Event(EVT));
}

export function setToken(token) {
  localStorage.setItem(KEY, token);
  emitAuthChanged();
}

export function getToken() {
  return localStorage.getItem(KEY) || "";
}

export function clearToken() {
  localStorage.removeItem(KEY);
  emitAuthChanged();
}

export function decodeJwt(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

export function getAuth() {
  const t = getToken();
  const p = t ? decodeJwt(t) : null;
  return {
    token: t,
    role: p?.role || "",
    full_name: p?.full_name || "",
    email: p?.email || "",
    user_id: p?.user_id || null,
  };
}

export function isAdminToken(token) {
  const p = decodeJwt(token);
  return p?.role === "ADMIN";
}

export function onAuthChanged(handler) {
  window.addEventListener(EVT, handler);
  return () => window.removeEventListener(EVT, handler);
}
