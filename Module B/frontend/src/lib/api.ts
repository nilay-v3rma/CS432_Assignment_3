import axios from "axios";

// Configure base instance pointing to our backend
const api = axios.create({
  baseURL: "http://localhost:3000",
  withCredentials: true,
});

// Automatically inject JWT Token from our cookie store onto the Authorization header
api.interceptors.request.use((config) => {
  if (typeof document !== "undefined") {
    const tokenCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="));

    if (tokenCookie) {
      const token = tokenCookie.split("=")[1];
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;