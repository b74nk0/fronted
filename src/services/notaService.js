import { api } from './api';

export const notaService = {
  /**
   * Registrar una nota individual
   */
  registrar: async (nota) => {
    const response = await api.post('/notas', nota);
    return response.data;
  },

  /**
   * Registrar múltiples notas masivamente
   */
  registrarLista: async (listaNotas) => {
    const response = await api.post('/notas/lista', listaNotas);
    return response.data;
  },

  /**
   * Actualizar una nota existente
   */
  actualizar: async (id, nota) => {
    const response = await api.put(`/notas/${id}`, nota);
    return response.data;
  },

  /**
   * Obtener notas por asignación docente y período
   */
  obtenerPorAsignacionYPeriodo: async (asignacionId, periodoId) => {
    const response = await api.get(`/notas/asignacion/${asignacionId}?periodoId=${periodoId}`);
    return response.data;
  },

  /**
   * Obtener notas de una evaluación específica
   */
  obtenerPorEvaluacion: async (asignacionId, periodoId, nombreEvaluacion) => {
    const response = await api.get(
      `/notas/evaluacion?asignacionId=${asignacionId}&periodoId=${periodoId}&nombreEvaluacion=${encodeURIComponent(nombreEvaluacion)}`
    );
    return response.data;
  },

  /**
   * Obtener notas de un estudiante por período
   */
  obtenerPorEstudianteYPeriodo: async (estudianteId, periodoId) => {
    const response = await api.get(`/notas/estudiante/${estudianteId}?periodoId=${periodoId}`);
    return response.data;
  },

  /**
   * Obtener promedio de notas por asignación y período
   */
  obtenerPromedio: async (asignacionId, periodoId) => {
    const response = await api.get(`/notas/promedio?asignacionId=${asignacionId}&periodoId=${periodoId}`);
    return response.data;
  },

  /**
   * Eliminar una nota
   */
  eliminar: async (id) => {
    await api.delete(`/notas/${id}`);
  },
};
