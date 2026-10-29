import api from './api';

export const documentService = {
  uploadDocument: async (formData) => {
    const response = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  getClaimDocuments: async (claimId) => {
    const response = await api.get(`/documents/claim/${claimId}`);
    return response.data;
  },

  downloadDocument: async (documentId, fileName) => {
    const response = await api.get(`/documents/${documentId}/download`, {
      responseType: 'blob'
    });
    // Create temporary blob URL and trigger download in browser
    const blob = new Blob([response.data], { type: response.headers['content-type'] });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName || 'claim-document');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  verifyDocument: async (documentId, verifyData) => {
    const response = await api.patch(`/documents/${documentId}/verify`, verifyData);
    return response.data;
  }
};

