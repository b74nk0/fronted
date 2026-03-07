import { api } from './api';

export const nivelService = {
  listar: async () => {
    const response = await api.get('/niveles');
    return response.data;
  },

  guardar: async (dto) => {
    const response = await api.post('/niveles', dto);
    return response.data;
  },

  actualizar: async (id, dto) => {
    const response = await api.put(`/niveles/${id}`, dto);
    return response.data;
  },

  eliminar: async (id) => {
    await api.delete(`/niveles/${id}`);
  },
};