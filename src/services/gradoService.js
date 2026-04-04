import { api } from './api';

export const gradoService = {
  listar: async () => {
    const response = await api.get('/grados');
    return Array.isArray(response.data) ? response.data : [];
  },
};