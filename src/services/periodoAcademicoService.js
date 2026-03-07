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

  crear: async (datos) => {
    const response = await api.post('/periodos-academicos', datos);
    return response.data;
  },

  actualizar: async (id, datos) => {
    const response = await api.put(`/periodos-academicos/${id}`, datos);
    return response.data;
  },

  eliminar: async (id) => {
    await api.delete(`/periodos-academicos/${id}`);
  },
};