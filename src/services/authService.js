import { api } from './api';

export const authService = {
  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};