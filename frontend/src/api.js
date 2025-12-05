import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const auth = {
  register: (email, password) => 
    api.post('/auth/register', { email, password }),
  login: (email, password) => 
    api.post('/auth/login', { email, password })
};

export const todos = {
  getAll: () => api.get('/todos'),
  getOne: (id) => api.get(`/todos/${id}`),
  create: (todo) => api.post('/todos', todo),
  update: (id, todo) => api.put(`/todos/${id}`, todo),
  delete: (id) => api.delete(`/todos/${id}`)
};

export const comments = {
  getAll: (todoId) => api.get(`/todos/${todoId}/comments`),
  create: (todoId, text) => api.post(`/todos/${todoId}/comments`, { text }),
  delete: (todoId, commentId) => api.delete(`/todos/${todoId}/comments/${commentId}`)
};

export const exportData = {
  pdf: () => api.get('/export/pdf', { responseType: 'blob' }),
  excel: () => api.get('/export/excel', { responseType: 'blob' })
};

export const tickets = {
  getAll: () => api.get('/tickets'),
  getOne: (id) => api.get(`/tickets/${id}`),
  create: (ticket) => api.post('/tickets', ticket),
  update: (id, ticket) => api.put(`/tickets/${id}`, ticket),
  delete: (id) => api.delete(`/tickets/${id}`)
};

export const ticketComments = {
  getAll: (ticketId) => api.get(`/tickets/${ticketId}/comments`),
  create: (ticketId, text) => api.post(`/tickets/${ticketId}/comments`, { text })
};

export default api;
