import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 120000, // 2 min for large doc processing
});

export const uploadDocument = (file, onProgress) => {
  const formData = new FormData();
  formData.append('document', file);
  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded * 100) / e.total));
      }
    },
  });
};

export const sendMessage = (message) =>
  api.post('/chat', { message });

export const fetchDocuments = () =>
  api.get('/documents');

export const deleteDocument = (fileName) =>
  api.delete(`/documents/${encodeURIComponent(fileName)}`);

export const checkHealth = () =>
  api.get('/health');
