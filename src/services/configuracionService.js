import { api } from './api';

export const configuracionService = {
  // Obtener configuración del sistema
  obtener: async () => {
    const response = await api.get('/configuracion-sistema');
    return response.data;
  },

  // Crear configuración inicial
  crear: async (datos) => {
    const response = await api.post('/configuracion-sistema', datos);
    return response.data;
  },

  // Actualizar configuración
  actualizar: async (id, datos) => {
    const response = await api.put(`/configuracion-sistema/${id}`, datos);
    return response.data;
  },
};