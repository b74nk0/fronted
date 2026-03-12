// Festivos oficiales de Colombia 2025 y 2026
// Fuente: Ley 51 de 1983 y Ley 270 de 1996

export const FESTIVOS_COLOMBIA = [
  // 2025
  { fecha: '2025-01-01', nombre: 'Año Nuevo' },
  { fecha: '2025-01-06', nombre: 'Reyes Magos' },
  { fecha: '2025-03-24', nombre: 'San José' },
  { fecha: '2025-04-17', nombre: 'Jueves Santo' },
  { fecha: '2025-04-18', nombre: 'Viernes Santo' },
  { fecha: '2025-05-01', nombre: 'Día del Trabajo' },
  { fecha: '2025-06-02', nombre: 'Ascensión del Señor' },
  { fecha: '2025-06-23', nombre: 'Corpus Christi' },
  { fecha: '2025-06-30', nombre: 'Sagrado Corazón' },
  { fecha: '2025-06-30', nombre: 'San Pedro y San Pablo' },
  { fecha: '2025-07-20', nombre: 'Día de la Independencia' },
  { fecha: '2025-08-07', nombre: 'Batalla de Boyacá' },
  { fecha: '2025-08-18', nombre: 'Asunción de la Virgen' },
  { fecha: '2025-10-13', nombre: 'Día de la Raza' },
  { fecha: '2025-11-03', nombre: 'Todos los Santos' },
  { fecha: '2025-11-17', nombre: 'Independencia de Cartagena' },
  { fecha: '2025-12-08', nombre: 'Inmaculada Concepción' },
  { fecha: '2025-12-25', nombre: 'Navidad' },
  // 2026
  { fecha: '2026-01-01', nombre: 'Año Nuevo' },
  { fecha: '2026-01-12', nombre: 'Reyes Magos' },
  { fecha: '2026-03-23', nombre: 'San José' },
  { fecha: '2026-04-02', nombre: 'Jueves Santo' },
  { fecha: '2026-04-03', nombre: 'Viernes Santo' },
  { fecha: '2026-05-01', nombre: 'Día del Trabajo' },
  { fecha: '2026-05-18', nombre: 'Ascensión del Señor' },
  { fecha: '2026-06-08', nombre: 'Corpus Christi' },
  { fecha: '2026-06-15', nombre: 'Sagrado Corazón' },
  { fecha: '2026-06-29', nombre: 'San Pedro y San Pablo' },
  { fecha: '2026-07-20', nombre: 'Día de la Independencia' },
  { fecha: '2026-08-07', nombre: 'Batalla de Boyacá' },
  { fecha: '2026-08-17', nombre: 'Asunción de la Virgen' },
  { fecha: '2026-10-12', nombre: 'Día de la Raza' },
  { fecha: '2026-11-02', nombre: 'Todos los Santos' },
  { fecha: '2026-11-16', nombre: 'Independencia de Cartagena' },
  { fecha: '2026-12-08', nombre: 'Inmaculada Concepción' },
  { fecha: '2026-12-25', nombre: 'Navidad' },
];

export const esFestivo = (fecha) => {
  const iso = typeof fecha === 'string' ? fecha : fecha.toISOString().split('T')[0];
  return FESTIVOS_COLOMBIA.find(f => f.fecha === iso) || null;
};