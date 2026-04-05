import { api } from './api';

export const usuarioService = {
  listar: async (pagina = 0, tamaño = 100) => {
    const response = await api.get(`/usuarios?pagina=${pagina}&tamaño=${tamaño}`);
    // El backend retorna un Page<UsuarioDto>, extraemos el contenido
    const data = response.data;
    if (data && Array.isArray(data.content)) {
      return data.content;
    }
    return Array.isArray(data) ? data : [];
  },

  listarTodos: async () => {
    // Obtener todos los usuarios con un tamaño grande
    return usuarioService.listar(0, 1000);
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