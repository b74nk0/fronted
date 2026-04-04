import { api } from './api';

export const pensionService = {
  listar: async () => {
    const response = await api.get('/pensiones');
    return response.data;
  },

  crear: async (pension) => {
    const response = await api.post('/pensiones', pension);
    return response.data;
  },

  pagar: async (id) => {
    const response = await api.put(`/pensiones/${id}/pagar`);
    return response.data;
  },

  obtenerReporte: async (filtros) => {
    const response = await api.post('/pensiones/reporte', filtros);
    return response.data;
  },

  obtenerResumen: async (gradoId, mes, anio) => {
    const params = {};
    if (gradoId) params.gradoId = gradoId;
    if (mes) params.mes = mes;
    if (anio) params.anio = anio;
    const response = await api.get('/pensiones/reporte/resumen', { params });
    return response.data;
  },
};