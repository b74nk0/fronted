import { api } from './api';

export const materiaService = {
  listar: async () => {
    const response = await api.get('/materias');
    return response.data;
  },

  crear: async (materia) => {
    const response = await api.post('/materias', materia);
    return response.data;
  },

  actualizar: async (id, materia) => {
    const response = await api.put(`/materias/${id}`, materia);
    return response.data;
  },

  // Soft delete — solo desactiva
  desactivar: async (id) => {
    await api.delete(`/materias/${id}`);
  },
};