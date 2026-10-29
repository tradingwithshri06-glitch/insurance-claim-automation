import api from './api';

export const adminService = {
  getUsers: async (params = {}) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  createUser: async (userData) => {
    const response = await api.post('/admin/users', userData);
    return response.data;
  },

  updateUserRole: async (id, data) => {
    const response = await api.patch(`/admin/users/${id}/role`, data);
    return response.data;
  },

  getSystemSettings: async () => {
    const response = await api.get('/admin/settings');
    return response.data;
  },

  getAuditLogs: async (params = {}) => {
    const response = await api.get('/audit', { params });
    return response.data;
  }
};

