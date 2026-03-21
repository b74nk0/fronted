import { api } from './api';

export const periodoAcademicoService = {
  listar: async () => {
    const response = await api.get('/periodos-academicos');
    return response.data;
  },
  obtener: async (id) => {
    const response = await api.get(`/periodos-academicos/${id}`);
    return response.data;
  },
  obtenerActivo: async () => {
    try {
      const response = await api.get('/periodos-academicos/activo');
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) return null;
      throw error;
    }
  },
  crear: async (dto) => {
    const response = await api.post('/periodos-academicos', dto);
    return response.data;
  },
  actualizar: async (id, dto) => {
    const response = await api.put(`/periodos-academicos/${id}`, dto);
    return response.data;
  },
  eliminar: async (id) => {
    await api.delete(`/periodos-academicos/${id}`);
  },
};