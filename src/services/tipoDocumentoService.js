import { api } from './api';

export const tipoDocumentoService = {
  listar: async () => {
    const response = await api.get('/tipodocumentos');
    return response.data;
  },

  crear: async (td) => {
    const response = await api.post('/tipodocumentos', td);
    return response.data;
  },

  actualizar: async (id, td) => {
    const response = await api.put(`/tipodocumentos/${id}`, td);
    return response.data;
  },

  eliminar: async (id) => {
    await api.delete(`/tipodocumentos/${id}`);
  },
};