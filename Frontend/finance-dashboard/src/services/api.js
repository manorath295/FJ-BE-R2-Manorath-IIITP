import axios from "axios";

const API_BASE_URL = "http://localhost:3000/api";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for cookie-based auth
  headers: {
    "Content-Type": "application/json",
  },
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
};

// Budgets API
export const budgetsAPI = {
  getAll: () => api.get("/budgets"),
  getById: (id) => api.get(`/budgets/${id}`),
  create: (data) => api.post("/budgets", data),
  update: (id, data) => api.put(`/budgets/${id}`, data),
  delete: (id) => api.delete(`/budgets/${id}`),
};

export default api;
