import { api } from './api';

export const pensionService = {
  listar: async () => {
    const response = await api.get('/pensiones');
    return response.data;
  },

  crear: async (pension) => {
    const response = await api.post('/pensiones', pension);
    return response.data;
  },

  pagar: async (id) => {
    const response = await api.put(`/pensiones/${id}/pagar`);
    return response.data;
  },
};