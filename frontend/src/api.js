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
  register: (email, password, name, mobile) => 
    api.post('/auth/register', { email, password, name, mobile }),
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
  pdf: (startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    return api.get(`/export/pdf?${params.toString()}`, { responseType: 'blob' });
  },
  excel: (startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    return api.get(`/export/excel?${params.toString()}`, { responseType: 'blob' });
  },
  ticketsPdf: (startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    return api.get(`/export/tickets/pdf?${params.toString()}`, { responseType: 'blob' });
  },
  ticketsExcel: (startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    return api.get(`/export/tickets/excel?${params.toString()}`, { responseType: 'blob' });
  }
};

export const tickets = {
  getAll: () => api.get('/tickets'),
  getOne: (id) => api.get(`/tickets/${id}`),
  getClients: () => api.get('/tickets/clients'),
  create: (ticket) => api.post('/tickets', ticket),
  update: (id, ticket) => api.put(`/tickets/${id}`, ticket),
  delete: (id) => api.delete(`/tickets/${id}`)
};

export const ticketComments = {
  getAll: (ticketId) => api.get(`/tickets/${ticketId}/comments`),
  create: (ticketId, text) => api.post(`/tickets/${ticketId}/comments`, { text })
};

export const timeTracking = {
  start: (todoId) => api.post(`/todos/${todoId}/time`, { action: 'start' }),
  stop: (todoId) => api.post(`/todos/${todoId}/time`, { action: 'stop' })
};

export const activities = {
  getAll: (limit = 50) => api.get(`/activities?limit=${limit}`)
};

export const analytics = {
  getStats: () => api.get('/analytics/stats')
};

export const ai = {
  getSuggestions: (context) => api.post('/ai/suggestions', { context }),
  analyzeTask: (taskText) => api.post('/ai/analyze', { task_text: taskText }),
  planDay: (availableHours, energyLevel, focusAreas) => api.post('/ai/plan-day', { 
    available_hours: availableHours, 
    energy_level: energyLevel, 
    focus_areas: focusAreas 
  }),
  optimizeWorkflow: () => api.post('/ai/optimize-workflow'),
  getSmartSuggestions: (contextType, mood, availableTime) => api.post('/ai/smart-suggestions', {
    context_type: contextType,
    mood: mood,
    available_time: availableTime
  })
};

export const userProfile = {
  get: () => api.get('/user/profile'),
  update: (profileData) => api.put('/user/profile', profileData),
  changePassword: (passwordData) => api.post('/user/change-password', passwordData)
};

export default api;
