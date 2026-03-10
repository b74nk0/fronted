import { api } from './api';

export const planEstudioService = {
  listar: async () => {
    const response = await api.get('/planes-estudio');
    return response.data;
  },

  crear: async (plan) => {
    const response = await api.post('/planes-estudio', plan);
    return response.data;
  },

  actualizar: async (id, plan) => {
    const response = await api.put(`/planes-estudio/${id}`, plan);
    return response.data;
  },

  desactivar: async (id) => {
    await api.delete(`/planes-estudio/${id}`);
  },
};