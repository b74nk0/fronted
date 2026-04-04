import { api } from './api';

export const usuarioService = {
  listar: async () => {
    const response = await api.get('/usuarios');
    // El backend retorna un Page<UsuarioDto>, extraemos el contenido
    const data = response.data;
    if (data && Array.isArray(data.content)) {
      return data.content;
    }
    return Array.isArray(data) ? data : [];
  },

  listarEstudiantes: async () => {
    const response = await api.get('/usuarios/estudiantes');
    // Este endpoint retorna un array directo (List<UsuarioDto>)
    return response.data || [];
  },

  me: async () => {
    const response = await api.get('/usuarios/me');
    return response.data;
  },

  crear: async (dto) => {
    // Mapear password a passwordHash para el backend
    const payload = {
      ...dto,
      passwordHash: dto.password,
    };
    delete payload.password;
    const response = await api.post('/usuarios', payload);
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