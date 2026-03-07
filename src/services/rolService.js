import { api } from './api';

export const rolService = {
  listar: async () => {
    const response = await api.get('/roles');
    return response.data;
  },

  obtener: async (id) => {
    const response = await api.get(`/roles/${id}`);
    return response.data;
  },

  crear: async (rol) => {
    const response = await api.post('/roles', rol);
    return response.data;
  },

  actualizar: async (id, rol) => {
    const response = await api.put(`/roles/${id}`, rol);
    return response.data;
  },

  eliminar: async (id) => {
    await api.delete(`/roles/${id}`);
  },
};