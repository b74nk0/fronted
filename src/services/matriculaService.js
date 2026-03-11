import { api } from './api';

export const matriculaService = {
  listar: async () => {
    const response = await api.get('/matriculas');
    return response.data;
  },

  crear: async (estudianteId, gradoId, periodoId) => {
    const response = await api.post('/matriculas', null, {
      params: { estudianteId, gradoId, periodoId },
    });
    return response.data;
  },

  actualizar: async (id, datos) => {
    const response = await api.put(`/matriculas/${id}`, datos);
    return response.data;
  },

  eliminar: async (id) => {
    await api.delete(`/matriculas/${id}`);
  },
};