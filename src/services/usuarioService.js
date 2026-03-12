import { api } from './api';

export const usuarioService = {
  listar: async () => {
    const response = await api.get('/usuarios');
    return response.data;
  },

  listarEstudiantes: async () => {
    const response = await api.get('/usuarios/estudiantes');
    return response.data;
  },

  me: async () => {
    const response = await api.get('/usuarios/me');
    return response.data;
  },

  crear: async (dto) => {
    const response = await api.post('/usuarios', dto);
    return response.data;
  },

  actualizar: async (id, dto) => {
    const response = await api.put(`/usuarios/${id}`, dto);
    return response.data;
  },

  eliminar: async (id) => {
    await api.delete(`/usuarios/${id}`);
  },
};