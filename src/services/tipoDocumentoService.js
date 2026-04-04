import { api } from './api';

export const tipoDocumentoService = {
  listar: async () => {
    const response = await api.get('/tipos-documentos');
    return response.data;
  },

  crear: async (td) => {
    const response = await api.post('/tipos-documentos', td);
    return response.data;
  },

  actualizar: async (id, td) => {
    const response = await api.put(`/tipos-documentos/${id}`, td);
    return response.data;
  },

  eliminar: async (id) => {
    await api.delete(`/tipos-documentos/${id}`);
  },
};