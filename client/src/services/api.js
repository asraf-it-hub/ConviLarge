import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 600000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("convilarge_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  let sessionId = localStorage.getItem("convilarge_session");
  if (!sessionId) {
    sessionId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem("convilarge_session", sessionId);
  }
  config.headers["X-ConviLarge-Session"] = sessionId;
  return config;
});

export function downloadUrl(path) {
  return `${API_URL}${path}`;
}
