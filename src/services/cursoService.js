import { api } from './api';

export const cursoService = {
  listar: async () => {
    const response = await api.get('/cursos');
    // El backend retorna un Page<CursoDto>, extraemos el contenido
    const data = response.data;
    if (data && Array.isArray(data.content)) {
      return data.content;
    }
    return Array.isArray(data) ? data : [];
  },
  listarPorGrado: async (gradoId) => {
    const response = await api.get(`/cursos/grado/${gradoId}`);
    // El backend puede retornar un Page<CursoDto> o un List<CursoDto>
    const data = response.data;
    if (data && Array.isArray(data.content)) {
      return data.content;
    }
    return Array.isArray(data) ? data : [];
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