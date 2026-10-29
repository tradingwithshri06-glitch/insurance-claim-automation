import api from './api';

export const authService = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('insur_token', response.data.token);
      localStorage.setItem('insur_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.token) {
      localStorage.setItem('insur_token', response.data.token);
      localStorage.setItem('insur_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    if (response.data.user) {
      localStorage.setItem('insur_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('insur_token');
    localStorage.removeItem('insur_user');
  },

  getCurrentUser: () => {
    const stored = localStorage.getItem('insur_user');
    return stored ? JSON.parse(stored) : null;
  },

  getToken: () => {
    return localStorage.getItem('insur_token');
  }
};

