import api from './api';

export const policyService = {
  getPolicies: async () => {
    const response = await api.get('/policies');
    return response.data;
  },

  getPolicyById: async (id) => {
    const response = await api.get(`/policies/${id}`);
    return response.data;
  },

  createPolicy: async (policyData) => {
    const response = await api.post('/policies', policyData);
    return response.data;
  }
};

