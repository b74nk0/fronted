import { api } from './api';

export const asignacionDocenteService = {
  listarPorCurso: async (cursoId) => {
    const response = await api.get(`/asignacion-docente/curso/${cursoId}`);
    return response.data;
  },
  misCursos: async () => {
    const response = await api.get('/asignacion-docente/mis-cursos');
    return response.data;
  },
  asignar: async (dto) => {
    const response = await api.post('/asignacion-docente', dto);
    return response.data;
  },
  eliminar: async (id) => {
    await api.delete(`/asignacion-docente/${id}`);
  },
};