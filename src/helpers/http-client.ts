import axios, { type AxiosInstance } from "axios";
import { AUTH_STORAGE_KEYS } from "@/helpers/constants";

const baseURL =
  import.meta.env.VITE_API_BASE_URL?.trim() || "/api";

const instance: AxiosInstance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

instance.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(AUTH_STORAGE_KEYS.TOKEN);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem(AUTH_STORAGE_KEYS.USER);
      sessionStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
      const path = encodeURIComponent(window.location.pathname + window.location.search);
      const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "") || "";
      window.location.href = `${window.location.origin}${base}/auth/sign-in?redirectedFrom=${path}`;
    }
    return Promise.reject(error);
  }
);

export default instance;
