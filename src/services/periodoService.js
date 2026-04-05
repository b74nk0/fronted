import { api } from './api';

export const periodoService = {
  listar: async () => {
    const response = await api.get('/periodos');
    return Array.isArray(response.data) ? response.data : [];
  },

  listarActivos: async () => {
    const response = await api.get('/periodos/activos');
    return Array.isArray(response.data) ? response.data : [];
  },

  listarPorPeriodoAcademico: async (periodoAcademicoId) => {
    const response = await api.get(`/periodos/periodo-academico/${periodoAcademicoId}`);
    return Array.isArray(response.data) ? response.data : [];
  },
};