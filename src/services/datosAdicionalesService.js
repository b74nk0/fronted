import { api } from './api';

export const datosAdicionalesService = {
  obtenerPorUsuario: async (usuarioId) => {
    const response = await api.get(`/datos-usuario/usuario/${usuarioId}`);
    return response.data;
  },
  crear: async (usuarioId, datos) => {
    const response = await api.post(`/datos-usuario/${usuarioId}`, datos);
    return response.data;
  },
  actualizar: async (id, datos) => {
    const response = await api.put(`/datos-usuario/${id}`, datos);
    return response.data;
  },
};