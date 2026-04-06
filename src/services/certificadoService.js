import { api } from './api';

export const certificadoService = {
  // Plantillas
  listarPlantillas: async () => {
    const response = await api.get('/certificados/plantillas');
    return response.data;
  },

  obtenerPlantilla: async (id) => {
    const response = await api.get(`/certificados/plantillas/${id}`);
    return response.data;
  },

  crearPlantilla: async (dto) => {
    const response = await api.post('/certificados/plantillas', dto);
    return response.data;
  },

  actualizarPlantilla: async (id, dto) => {
    const response = await api.put(`/certificados/plantillas/${id}`, dto);
    return response.data;
  },

  // Generación de certificados
  generarCertificadoEstudio: async (periodoId = null) => {
    const params = periodoId ? `?periodoId=${periodoId}` : '';
    const response = await api.get(`/certificados/estudio${params}`, {
      responseType: 'arraybuffer',
    });
    return response.data;
  },

  generarCertificadoNotas: async (periodoId = null) => {
    const params = periodoId ? `?periodoId=${periodoId}` : '';
    const response = await api.get(`/certificados/notas${params}`, {
      responseType: 'arraybuffer',
    });
    return response.data;
  },

  generarConstancia: async () => {
    const response = await api.get('/certificados/constancia', {
      responseType: 'arraybuffer',
    });
    return response.data;
  },

  // Admin: generar certificado de cualquier estudiante
  adminGenerarCertificadoEstudio: async (estudianteId, periodoId = null) => {
    const params = periodoId ? `?periodoId=${periodoId}` : '';
    const response = await api.get(`/certificados/admin/estudio/${estudianteId}${params}`, {
      responseType: 'arraybuffer',
    });
    return response.data;
  },

  // Helper para descargar PDF
  descargarPDF: (data, filename) => {
    const blob = new Blob([data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};