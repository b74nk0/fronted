import { api } from './api';

export const planEstudioService = {
  listar: async () => {
    const response = await api.get('/planes-estudio');
    return response.data;
  },
  obtenerPorGrado: async (gradoId) => {
    try {
      const response = await api.get(`/planes-estudio/grado/${gradoId}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) return null;
      throw error;
    }
  },
  crear: async (dto) => {
    const response = await api.post('/planes-estudio', dto);
    return response.data;
  },
  actualizar: async (id, dto) => {
    const response = await api.put(`/planes-estudio/${id}`, dto);
    return response.data;
  },
  eliminar: async (id) => {
    await api.delete(`/planes-estudio/${id}`);
  },
};