import api from './api';

export const claimService = {
  getClaims: async (params = {}) => {
    const response = await api.get('/claims', { params });
    return response.data;
  },

  getClaimById: async (id) => {
    const response = await api.get(`/claims/${id}`);
    return response.data;
  },

  createClaim: async (claimData) => {
    const response = await api.post('/claims', claimData);
    return response.data;
  },

  updateStatus: async (id, statusData) => {
    const response = await api.patch(`/claims/${id}/status`, statusData);
    return response.data;
  },

  requestMissingInfo: async (id, infoData) => {
    const response = await api.post(`/claims/${id}/request-info`, infoData);
    return response.data;
  },

  flagFraudRisk: async (id, flagData) => {
    const response = await api.post(`/claims/${id}/flag`, flagData);
    return response.data;
  },

  submitInvestigationFindings: async (id, findingsData) => {
    const response = await api.post(`/claims/${id}/findings`, findingsData);
    return response.data;
  },

  decideClaim: async (id, decisionData) => {
    const response = await api.post(`/claims/${id}/decision`, decisionData);
    return response.data;
  },

  updateSettlement: async (id, settlementData) => {
    const response = await api.patch(`/claims/${id}/settlement`, settlementData);
    return response.data;
  },

  getDashboardStats: async (params = {}) => {
    const response = await api.get('/dashboard/stats', { params });
    return response.data;
  }
};

