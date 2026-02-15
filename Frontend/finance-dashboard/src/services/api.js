import axios from "axios";

// Use environment variable for API URL, fallback to localhost:3000 for development
// For production (EC2), use the current origin
const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:3000/api"
    : "https://backend.manorath.me/api";  

// Create axios instance with default config

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for cookie-based auth
  // headers: { "Content-Type": "application/json" } // REMOVE THIS: Axios sets it automatically correctly
});

// Auth API
export const authAPI = {
  register: (data) => api.post("/auth/sign-up/email", data),
  login: (data) => api.post("/auth/sign-in/email", data),
  logout: () => api.post("/auth/sign-out"),
  getSession: () => api.get("/auth/get-session"),
};

// Categories API
export const categoriesAPI = {
  getAll: () => api.get("/categories"),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post("/categories", data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

// Transactions API
export const transactionsAPI = {
  getAll: () => api.get("/transactions"),
  getById: (id) => api.get(`/transactions/${id}`),
  create: (data) => api.post("/transactions", data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`),
  analyze: (formData) =>
    api.post("/transactions/analyze", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

// Budgets API
export const budgetsAPI = {
  getAll: () => api.get("/budgets"),
  getById: (id) => api.get(`/budgets/${id}`),
  create: (data) => api.post("/budgets", data),
  update: (id, data) => api.put(`/budgets/${id}`, data),
  delete: (id) => api.delete(`/budgets/${id}`),
};

// Import API
export const importAPI = {
  preview: (file) => {
    const formData = new FormData();
    formData.append("statement", file);
    return api.post("/import/preview", formData);
  },
  confirm: (transactions) => api.post("/import/confirm", { transactions }),
};

// Settings API
export const settingsAPI = {
  get: () => api.get("/settings"),
  updateEmail: (email) => api.patch("/settings/notification-email", { email }),
  sendTestEmail: (email) => api.post("/settings/test-email", { email }),
};

export default api;
