import { api } from './api';

export const calendarioService = {
  listar: async () => {
    const response = await api.get('/calendario');
    return response.data;
  },
  obtener: async (id) => {
    const response = await api.get(`/calendario/${id}`);
    return response.data;
  },
  crear: async (evento) => {
    const response = await api.post('/calendario', evento);
    return response.data;
  },
  actualizar: async (id, evento) => {
    const response = await api.put(`/calendario/${id}`, evento);
    return response.data;
  },
  eliminar: async (id) => {
    await api.delete(`/calendario/${id}`);
  },
};