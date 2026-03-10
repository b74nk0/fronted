import { api } from './api';

export const competenciaService = {
  listar: async () => {
    const response = await api.get('/competencias');
    return response.data;
  },

  crear: async (competencia) => {
    const response = await api.post('/competencias', competencia);
    return response.data;
  },

  actualizar: async (id, competencia) => {
    const response = await api.put(`/competencias/${id}`, competencia);
    return response.data;
  },

  desactivar: async (id) => {
    await api.delete(`/competencias/${id}`);
  },
};