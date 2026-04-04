import { api } from './api';

export const estudianteCursoService = {
  listarPorCurso: async (cursoId) => {
    const response = await api.get(`/estudiante-curso/curso/${cursoId}`);
    return response.data;
  },
  listarPorCursoYPeriodo: async (cursoId, periodoId) => {
    const response = await api.get(`/estudiante-curso/curso/${cursoId}/periodo/${periodoId}`);
    return response.data;
  },
  listarPorEstudiante: async (estudianteId) => {
    const response = await api.get(`/estudiante-curso/estudiante/${estudianteId}`);
    return response.data;
  },
  matricular: async (dto) => {
    const response = await api.post('/estudiante-curso', dto);
    return response.data;
  },
  eliminar: async (id) => {
    await api.delete(`/estudiante-curso/${id}`);
  },
};