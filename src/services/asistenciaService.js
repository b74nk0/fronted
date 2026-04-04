import { api } from './api';

export const asistenciaService = {
  /**
   * Registrar asistencia individual
   */
  registrar: async (asistencia) => {
    const response = await api.post('/asistencias', asistencia);
    return response.data;
  },

  /**
   * Registrar lista masiva de asistencias
   */
  registrarLista: async (listaAsistencias) => {
    const response = await api.post('/asistencias/lista', listaAsistencias);
    return response.data;
  },

  /**
   * Actualizar asistencia
   */
  actualizar: async (id, asistencia) => {
    const response = await api.put(`/asistencias/${id}`, asistencia);
    return response.data;
  },

  /**
   * Obtener asistencias por curso y fecha
   */
  obtenerPorCursoYFecha: async (cursoId, fecha) => {
    const response = await api.get(`/asistencias/curso/${cursoId}?fecha=${fecha}`);
    return response.data;
  },

  /**
   * Obtener asistencias por asignación docente y fecha
   */
  obtenerPorAsignacionYFecha: async (asignacionId, fecha) => {
    const response = await api.get(`/asistencias/asignacion/${asignacionId}?fecha=${fecha}`);
    return response.data;
  },

  /**
   * Obtener resumen estadístico de asistencias
   */
  obtenerResumenPorCursoYFecha: async (cursoId, fecha) => {
    const response = await api.get(`/asistencias/curso/${cursoId}/resumen?fecha=${fecha}`);
    return response.data;
  },

  /**
   * Obtener asistencias por estudiante
   */
  obtenerPorEstudiante: async (estudianteId, desde, hasta) => {
    const response = await api.get(`/asistencias/estudiante/${estudianteId}?desde=${desde}&hasta=${hasta}`);
    return response.data;
  },

  /**
   * Eliminar asistencia
   */
  eliminar: async (id) => {
    await api.delete(`/asistencias/${id}`);
  },
};
