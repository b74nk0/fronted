import { api } from './api';

export const cursoService = {
  listar: async () => {
    const response = await api.get('/cursos');
    return response.data;
  },
  listarPorGrado: async (gradoId) => {
    const response = await api.get(`/cursos/grado/${gradoId}`);
    return response.data;
  },
  obtener: async (id) => {
    const response = await api.get(`/cursos/${id}`);
    return response.data;
  },
  crear: async (dto) => {
    const response = await api.post('/cursos', dto);
    return response.data;
  },
  actualizar: async (id, dto) => {
    const response = await api.put(`/cursos/${id}`, dto);
    return response.data;
  },
  eliminar: async (id) => {
    await api.delete(`/cursos/${id}`);
  },
};