import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, ActivityIndicator, useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import ConfirmModal from '../../components/common/ConfirmModal';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { calendarioService } from '../../services/calendarioService';
import { FESTIVOS_COLOMBIA, esFestivo } from '../../constants/festivosColombia';

// ─── Constantes ───────────────────────────────────────────────────────────────
const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const CATEGORIAS = [
  { label: 'Académico',     color: '#3B82F6' },
  { label: 'Cultural',      color: '#8B5CF6' },
  { label: 'Deportivo',     color: '#10B981' },
  { label: 'Institucional', color: '#F59E0B' },
  { label: 'Reunión',       color: '#EC4899' },
  { label: 'Otro',          color: '#6B7280' },
];
const COLORES = [
  '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B',
  '#EC4899', '#EF4444', '#06B6D4', '#6B7280',
];
const TIPO_EVENTO = ['Presencial', 'Virtual'];
const FORM_INICIAL = {
  titulo: '', descripcion: '', fechaInicio: '', fechaFin: '',
  categoria: '', color: '#3B82F6', tipoEvento: 'Presencial',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const toISO = (dt) => (dt ? dt.split('T')[0] : '');
const formatFecha = (isoString) => {
  if (!isoString) return '';
  const [y, m, d] = isoString.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
};
const toLocalDateTimeString = (dateStr, time = '00:00') =>
  dateStr ? `${dateStr}T${time}:00` : '';

// ─── Badge ────────────────────────────────────────────────────────────────────
const CategoriaBadge = ({ categoria, color }) => (
  <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color }]}>
    <Text style={[styles.badgeText, { color }]}>{categoria}</Text>
  </View>
);

// ─── Tarjeta de evento ────────────────────────────────────────────────────────
const EventoCard = ({ evento, onEdit, onDelete, canEdit }) => {
  const color = evento.color || '#6B7280';
  return (
    <View style={[styles.eventoCard, { borderLeftColor: color }]}>
      <View style={styles.eventoCardContent}>
        <View style={styles.eventoCardTop}>
          <Text style={styles.eventoTitulo} numberOfLines={1}>{evento.titulo}</Text>
          {canEdit && (
            <View style={styles.eventoActions}>
              <TouchableOpacity onPress={() => onEdit(evento)} style={styles.iconBtn}>
                <Ionicons name="pencil-outline" size={17} color={colors.primary[600]} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onDelete(evento)} style={styles.iconBtn}>
                <Ionicons name="trash-outline" size={17} color={colors.red[500]} />
              </TouchableOpacity>
            </View>
          )}
        </View>
        {evento.descripcion ? (
          <Text style={styles.eventoDesc} numberOfLines={2}>{evento.descripcion}</Text>
        ) : null}
        <View style={styles.eventoMeta}>
          <CategoriaBadge categoria={evento.categoria} color={color} />
          <View style={styles.eventoMetaRight}>
            <Ionicons
              name={evento.tipoEvento === 'Virtual' ? 'videocam-outline' : 'location-outline'}
              size={13} color={colors.gray[400]} />
            <Text style={styles.eventoMetaText}>{evento.tipoEvento}</Text>
            <Ionicons name="calendar-outline" size={13} color={colors.gray[400]} />
            <Text style={styles.eventoMetaText}>
              {formatFecha(evento.fechaInicio)}
              {toISO(evento.fechaInicio) !== toISO(evento.fechaFin)
                ? ` → ${formatFecha(evento.fechaFin)}` : ''}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// ─── Screen principal ─────────────────────────────────────────────────────────
const CalendarioScreen = () => {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const today = new Date();

  // ── Estado — siempre inicializa con hoy ──────────────────────────────────
  const [currentYear,  setCurrentYear]  = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDay,  setSelectedDay]  = useState(today.getDate());
  const [eventos,      setEventos]      = useState([]);
  const [loading,      setLoading]      = useState(true);

  // Modal crear/editar
  const [modalVisible, setModalVisible] = useState(false);
  const [editando,     setEditando]     = useState(null);
  const [form,         setForm]         = useState(FORM_INICIAL);
  const [saving,       setSaving]       = useState(false);
  const [errors,       setErrors]       = useState({});

  // Modal eliminar
  const [confirmVisible,   setConfirmVisible]   = useState(false);
  const [eventoAEliminar,  setEventoAEliminar]  = useState(null);
  const [eliminando,       setEliminando]       = useState(false);

  // Permisos
  const hasRole = (r) => (user?.roles || []).some(rol => {
    const s = typeof rol === 'string' ? rol : rol.nombre;
    return s?.toLowerCase() === r.toLowerCase();
  });
  const canEdit = hasRole('ADMINISTRADOR') || hasRole('ADMINISTRATIVO');

  // ── Al entrar al screen: resetear a hoy + recargar ───────────────────────
  useFocusEffect(useCallback(() => {
    const t = new Date();
    setCurrentYear(t.getFullYear());
    setCurrentMonth(t.getMonth());
    setSelectedDay(t.getDate());
    loadEventos();
  }, []));

  const loadEventos = async () => {
    setLoading(true);
    try {
      const data = await calendarioService.listar();
      setEventos(data);
    } catch (e) {
      console.error('Error cargando eventos:', e);
    } finally {
      setLoading(false);
    }
  };

  // ── Navegación de mes ────────────────────────────────────────────────────
  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
    setSelectedDay(1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
    setSelectedDay(1);
  };

  // ── Helpers de grilla ────────────────────────────────────────────────────
  const getDiasDelMes = () => {
    const firstDay  = new Date(currentYear, currentMonth, 1).getDay();
    const totalDias = new Date(currentYear, currentMonth + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= totalDias; d++) cells.push(d);
    return cells;
  };

  const getEventosDelDia = (day) => {
    if (!day) return [];
    const iso = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return eventos.filter(ev => {
      const inicio = toISO(ev.fechaInicio);
      const fin    = toISO(ev.fechaFin);
      return iso >= inicio && iso <= fin;
    });
  };

  const getFestivoDelDia = (day) => {
    if (!day) return null;
    const iso = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return esFestivo(iso);
  };

  const selectedISO = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
  const eventosDiaSeleccionado = eventos.filter(ev => {
    const inicio = toISO(ev.fechaInicio);
    const fin    = toISO(ev.fechaFin);
    return selectedISO >= inicio && selectedISO <= fin;
  });
  const festivoDiaSeleccionado = esFestivo(selectedISO);

  // ── Modales ──────────────────────────────────────────────────────────────
  const openCrear = () => {
    setEditando(null);
    setForm({ ...FORM_INICIAL, fechaInicio: selectedISO, fechaFin: selectedISO });
    setErrors({});
    setModalVisible(true);
  };
  const openEditar = (evento) => {
    setEditando(evento);
    setForm({
      titulo:        evento.titulo       || '',
      descripcion:   evento.descripcion  || '',
      fechaInicio:   toISO(evento.fechaInicio),
      fechaFin:      toISO(evento.fechaFin),
      categoria:     evento.categoria    || '',
      color:         evento.color        || '#3B82F6',
      tipoEvento:    evento.tipoEvento   || 'Presencial',
    });
    setErrors({});
    setModalVisible(true);
  };
  const openEliminar = (evento) => {
    setEventoAEliminar(evento);
    setConfirmVisible(true);
  };

  // ── Validar / Guardar ────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.titulo.trim()) e.titulo = 'Requerido';
    if (!form.fechaInicio)   e.fechaInicio = 'Requerido';
    if (!form.fechaFin)      e.fechaFin = 'Requerido';
    if (form.fechaInicio && form.fechaFin && form.fechaFin < form.fechaInicio)
      e.fechaFin = 'Debe ser igual o posterior a la fecha inicio';
    if (!form.categoria) e.categoria = 'Selecciona una categoría';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        titulo:      form.titulo,
        descripcion: form.descripcion,
        fechaInicio: toLocalDateTimeString(form.fechaInicio, '08:00'),
        fechaFin:    toLocalDateTimeString(form.fechaFin,    '18:00'),
        categoria:   form.categoria,
        color:       form.color,
        tipoEvento:  form.tipoEvento,
      };
      if (editando) await calendarioService.actualizar(editando.id, payload);
      else          await calendarioService.crear(payload);
      setModalVisible(false);
      await loadEventos();
    } catch (e) {
      console.error('Error guardando evento:', e);
    } finally {
      setSaving(false);
    }
  };

  const confirmarEliminar = async () => {
    if (!eventoAEliminar) return;
    setEliminando(true);
    try {
      await calendarioService.eliminar(eventoAEliminar.id);
      setConfirmVisible(false);
      setEventoAEliminar(null);
      await loadEventos();
    } catch (e) {
      console.error('Error eliminando evento:', e);
    } finally {
      setEliminando(false);
    }
  };

  const updateForm = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }));
  };

  // ── Bloque izquierdo: el calendario ──────────────────────────────────────
  const diasCells = getDiasDelMes();
  const isToday   = (d) =>
    d === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

  const renderCalendario = () => (
    <View style={[styles.calendarBlock, isWide && styles.calendarBlockWide]}>
      {/* Navegación mes */}
      <View style={styles.calHeader}>
        <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.gray[700]} />
        </TouchableOpacity>
        <View style={styles.calHeaderCenter}>
          <Text style={styles.calMonthText}>{MESES[currentMonth]}</Text>
          <Text style={styles.calYearText}>{currentYear}</Text>
        </View>
        <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
          <Ionicons name="chevron-forward" size={22} color={colors.gray[700]} />
        </TouchableOpacity>
      </View>

      {/* Días de semana */}
      <View style={styles.diasSemana}>
        {DIAS.map(d => (
          <Text key={d} style={[styles.diaSemanaText, d === 'Dom' && { color: colors.red[500] }]}>
            {d}
          </Text>
        ))}
      </View>

      {/* Grid */}
      <View style={styles.gridContainer}>
        {diasCells.map((day, idx) => {
          if (!day) return <View key={`e-${idx}`} style={styles.dayCell} />;
          const evsDia    = getEventosDelDia(day);
          const festivo   = getFestivoDelDia(day);
          const isSelected = day === selectedDay;
          const isTodayDay = isToday(day);
          const isDom      = new Date(currentYear, currentMonth, day).getDay() === 0;
          return (
            <TouchableOpacity key={day}
              style={[
                styles.dayCell,
                isSelected   && styles.dayCellSelected,
                isTodayDay && !isSelected && styles.dayCellToday,
              ]}
              onPress={() => setSelectedDay(day)}>
              <Text style={[
                styles.dayNumber,
                isSelected   && styles.dayNumberSelected,
                festivo      && !isSelected && { color: colors.red[500] },
                isDom        && !isSelected && { color: colors.red[400] },
              ]}>
                {day}
              </Text>
              <View style={styles.dotsRow}>
                {festivo && <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />}
                {evsDia.slice(0, 2).map((ev, i) => (
                  <View key={i} style={[styles.dot, { backgroundColor: ev.color || '#6B7280' }]} />
                ))}
                {evsDia.length > 2 && <View style={[styles.dot, { backgroundColor: colors.gray[400] }]} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Leyenda */}
      <View style={styles.leyenda}>
        <View style={styles.leyendaItem}>
          <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
          <Text style={styles.leyendaText}>Festivo</Text>
        </View>
        {CATEGORIAS.slice(0, 3).map(c => (
          <View key={c.label} style={styles.leyendaItem}>
            <View style={[styles.dot, { backgroundColor: c.color }]} />
            <Text style={styles.leyendaText}>{c.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  // ── Bloque derecho: detalle + lista del mes ───────────────────────────────
  const renderDetalle = () => (
    <View style={[styles.detalleBlock, isWide && styles.detalleBlockWide]}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Encabezado del día */}
        <View style={styles.selectedDayHeader}>
          <View>
            <Text style={styles.selectedDayTitle}>
              {selectedDay} de {MESES[currentMonth]} {currentYear}
            </Text>
            {festivoDiaSeleccionado && (
              <Text style={styles.festivoInline}>🎉 {festivoDiaSeleccionado.nombre}</Text>
            )}
          </View>
          {canEdit && (
            <TouchableOpacity style={styles.addEventBtn} onPress={openCrear}>
              <Ionicons name="add" size={18} color={colors.white} />
              <Text style={styles.addEventBtnText}>Nuevo evento</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Festivo card */}
        {festivoDiaSeleccionado && (
          <View style={styles.festivoCard}>
            <Ionicons name="flag-outline" size={16} color={colors.red[600]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.festivoNombre}>{festivoDiaSeleccionado.nombre}</Text>
              <Text style={styles.festivoSub}>Festivo oficial de Colombia</Text>
            </View>
          </View>
        )}

        {/* Eventos del día */}
        {loading ? (
          <ActivityIndicator color={colors.primary[600]} style={{ marginVertical: spacing.lg }} />
        ) : eventosDiaSeleccionado.length === 0 && !festivoDiaSeleccionado ? (
          <View style={styles.emptyDay}>
            <Ionicons name="calendar-outline" size={36} color={colors.gray[300]} />
            <Text style={styles.emptyDayText}>Sin eventos para este día</Text>
          </View>
        ) : (
          eventosDiaSeleccionado.map(ev => (
            <EventoCard key={ev.id} evento={ev} canEdit={canEdit}
              onEdit={openEditar} onDelete={openEliminar} />
          ))
        )}

        {/* Eventos del mes */}
        <Card style={styles.proximosSection}>
          <View style={styles.proximosHeader}>
            <Ionicons name="list-outline" size={18} color={colors.primary[600]} />
            <Text style={styles.proximosTitle}>Eventos de {MESES[currentMonth]}</Text>
          </View>

          {/* Festivos del mes */}
          {FESTIVOS_COLOMBIA
            .filter(f => f.fecha.startsWith(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`))
            .map((f, i) => (
              <View key={`fest-${i}`} style={[styles.eventoCard, { borderLeftColor: '#EF4444' }]}>
                <View style={styles.eventoCardContent}>
                  <View style={styles.eventoCardTop}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                      <Ionicons name="flag-outline" size={15} color="#EF4444" />
                      <Text style={styles.eventoTitulo}>{f.nombre}</Text>
                    </View>
                    <Text style={styles.eventoMetaText}>{formatFecha(f.fecha + 'T00:00')}</Text>
                  </View>
                  <CategoriaBadge categoria="Festivo" color="#EF4444" />
                </View>
              </View>
            ))
          }

          {/* Eventos institucionales del mes */}
          {eventos
            .filter(ev => {
              const inicio  = toISO(ev.fechaInicio);
              const fin     = toISO(ev.fechaFin);
              const mesISO  = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
              return inicio.startsWith(mesISO) || fin.startsWith(mesISO) ||
                (inicio < mesISO + '-01' && fin > mesISO + '-31');
            })
            .sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio))
            .map(ev => (
              <EventoCard key={ev.id} evento={ev} canEdit={canEdit}
                onEdit={openEditar} onDelete={openEliminar} />
            ))
          }

          {eventos.filter(ev => {
            const mesISO = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
            return toISO(ev.fechaInicio).startsWith(mesISO);
          }).length === 0 &&
            !FESTIVOS_COLOMBIA.some(f =>
              f.fecha.startsWith(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`)
            ) && (
              <View style={styles.emptyDay}>
                <Text style={styles.emptyDayText}>Sin eventos este mes</Text>
              </View>
            )
          }
        </Card>

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </View>
  );

  // ── Modal crear/editar ───────────────────────────────────────────────────
  const renderModal = () => (
    <Modal visible={modalVisible} transparent animationType="fade"
      onRequestClose={() => setModalVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editando ? 'Editar Evento' : 'Nuevo Evento'}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.gray[600]} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Input label="Título *" value={form.titulo}
              onChangeText={t => updateForm('titulo', t)} error={errors.titulo}
              placeholder="Nombre del evento" />
            <Input label="Descripción" value={form.descripcion}
              onChangeText={t => updateForm('descripcion', t)}
              placeholder="Descripción opcional" multiline numberOfLines={3} />
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Input label="Fecha inicio * (YYYY-MM-DD)" value={form.fechaInicio}
                  onChangeText={t => updateForm('fechaInicio', t)}
                  placeholder="2025-03-15" error={errors.fechaInicio} />
              </View>
              <View style={{ width: spacing.md }} />
              <View style={{ flex: 1 }}>
                <Input label="Fecha fin * (YYYY-MM-DD)" value={form.fechaFin}
                  onChangeText={t => updateForm('fechaFin', t)}
                  placeholder="2025-03-15" error={errors.fechaFin} />
              </View>
            </View>
            <Text style={styles.fieldLabel}>Categoría *</Text>
            <View style={styles.chipGroup}>
              {CATEGORIAS.map(cat => (
                <TouchableOpacity key={cat.label}
                  style={[styles.chip,
                    form.categoria === cat.label && { backgroundColor: cat.color, borderColor: cat.color }
                  ]}
                  onPress={() => { updateForm('categoria', cat.label); updateForm('color', cat.color); }}>
                  <Text style={[styles.chipText,
                    form.categoria === cat.label && { color: colors.white }]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.categoria && <Text style={styles.errorText}>{errors.categoria}</Text>}

            <Text style={styles.fieldLabel}>Color</Text>
            <View style={styles.colorGroup}>
              {COLORES.map(c => (
                <TouchableOpacity key={c}
                  style={[styles.colorDot, { backgroundColor: c },
                    form.color === c && styles.colorDotSelected]}
                  onPress={() => updateForm('color', c)} />
              ))}
            </View>

            <Text style={styles.fieldLabel}>Modalidad</Text>
            <View style={styles.chipGroup}>
              {TIPO_EVENTO.map(tipo => (
                <TouchableOpacity key={tipo}
                  style={[styles.chip, form.tipoEvento === tipo && styles.chipSelected]}
                  onPress={() => updateForm('tipoEvento', tipo)}>
                  <Ionicons
                    name={tipo === 'Virtual' ? 'videocam-outline' : 'location-outline'}
                    size={14}
                    color={form.tipoEvento === tipo ? colors.white : colors.gray[600]} />
                  <Text style={[styles.chipText, form.tipoEvento === tipo && styles.chipTextSelected]}>
                    {tipo}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ height: spacing.md }} />
          </ScrollView>
          <View style={styles.modalFooter}>
            <Button title="Cancelar" onPress={() => setModalVisible(false)}
              variant="outline" style={{ flex: 1 }} />
            <Button
              title={saving ? 'Guardando...' : (editando ? 'Actualizar' : 'Crear')}
              onPress={handleSave} disabled={saving} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  );

  // ── Layout responsivo ────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {isWide ? (
        // Pantalla ancha: dos columnas
        <View style={styles.wideLayout}>
          {renderCalendario()}
          {renderDetalle()}
        </View>
      ) : (
        // Pantalla estrecha: scroll vertical
        <ScrollView keyboardShouldPersistTaps="handled">
          {renderCalendario()}
          {renderDetalle()}
        </ScrollView>
      )}

      {renderModal()}

      <ConfirmModal
        visible={confirmVisible}
        title="Eliminar evento"
        message={`¿Eliminar "${eventoAEliminar?.titulo}"?`}
        confirmText="Eliminar"
        confirmColor="danger"
        loading={eliminando}
        onConfirm={confirmarEliminar}
        onCancel={() => { setConfirmVisible(false); setEventoAEliminar(null); }}
      />
    </View>
  );
};

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },

  // ── Layout wide ───────────────────────────────────────────────────────────
  wideLayout: {
    flex: 1, flexDirection: 'row', alignItems: 'flex-start',
  },
  calendarBlock: {
    backgroundColor: colors.white,
    borderBottomWidth: 1, borderBottomColor: colors.gray[100],
  },
  calendarBlockWide: {
    width: 380, borderBottomWidth: 0,
    borderRightWidth: 1, borderRightColor: colors.gray[200],
    alignSelf: 'stretch',
  },
  detalleBlock: { flex: 1 },
  detalleBlockWide: {
    flex: 1, alignSelf: 'stretch',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md,
  },

  // ── Cabecera del calendario ───────────────────────────────────────────────
  calHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.gray[100],
  },
  navBtn: { padding: spacing.sm },
  calHeaderCenter: { alignItems: 'center' },
  calMonthText: { fontSize: fontSize.xl, fontWeight: '800', color: colors.gray[900] },
  calYearText:  { fontSize: fontSize.sm,  color: colors.gray[500] },

  diasSemana: {
    flexDirection: 'row',
    paddingHorizontal: spacing.sm, paddingBottom: spacing.xs,
  },
  diaSemanaText: {
    flex: 1, textAlign: 'center',
    fontSize: fontSize.xs, fontWeight: '600', color: colors.gray[500],
  },

  gridContainer: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: spacing.sm, paddingBottom: spacing.sm,
  },
  dayCell: {
    width: `${100 / 7}%`, aspectRatio: 0.9,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: borderRadius.md, padding: 2,
  },
  dayCellSelected: { backgroundColor: colors.primary[600] },
  dayCellToday: {
    backgroundColor: colors.primary[50],
    borderWidth: 1, borderColor: colors.primary[300],
  },
  dayNumber: { fontSize: fontSize.sm, fontWeight: '500', color: colors.gray[800] },
  dayNumberSelected: { color: colors.white, fontWeight: '700' },
  dotsRow: { flexDirection: 'row', gap: 2, marginTop: 2, minHeight: 6 },
  dot: { width: 5, height: 5, borderRadius: 3 },

  leyenda: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.gray[100],
  },
  leyendaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  leyendaText: { fontSize: 10, color: colors.gray[500] },

  // ── Detalle del día ───────────────────────────────────────────────────────
  selectedDayHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.gray[100],
    marginBottom: spacing.md,
  },
  selectedDayTitle: { fontSize: fontSize.base, fontWeight: '700', color: colors.gray[800] },
  festivoInline: { fontSize: fontSize.xs, color: colors.red[500], marginTop: 2 },

  addEventBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.primary[600], paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2, borderRadius: borderRadius.full,
  },
  addEventBtnText: { color: colors.white, fontSize: fontSize.xs, fontWeight: '600' },

  festivoCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: '#FEF2F2', borderRadius: borderRadius.md,
    padding: spacing.md, marginBottom: spacing.sm,
    borderLeftWidth: 3, borderLeftColor: '#EF4444',
  },
  festivoNombre: { fontSize: fontSize.sm, fontWeight: '700', color: colors.red[600] },
  festivoSub:    { fontSize: fontSize.xs, color: colors.red[400] },

  emptyDay: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  emptyDayText: { fontSize: fontSize.sm, color: colors.gray[400] },

  eventoCard: {
    borderLeftWidth: 4, borderRadius: borderRadius.md,
    backgroundColor: colors.white, marginBottom: spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  eventoCardContent: { padding: spacing.md },
  eventoCardTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 4,
  },
  eventoTitulo: { fontSize: fontSize.sm, fontWeight: '700', color: colors.gray[900], flex: 1 },
  eventoDesc:   { fontSize: fontSize.xs, color: colors.gray[500], marginBottom: spacing.xs },
  eventoActions: { flexDirection: 'row', gap: spacing.xs },
  iconBtn: { padding: 4 },
  eventoMeta: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: spacing.xs,
  },
  eventoMetaRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  eventoMetaText:  { fontSize: fontSize.xs, color: colors.gray[500] },

  badge: {
    paddingHorizontal: spacing.sm, paddingVertical: 2,
    borderRadius: borderRadius.full, borderWidth: 1,
  },
  badgeText: { fontSize: 10, fontWeight: '600' },

  proximosSection: { marginTop: spacing.sm, marginBottom: spacing.md },
  proximosHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginBottom: spacing.md, paddingBottom: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.gray[100],
  },
  proximosTitle: { fontSize: fontSize.base, fontWeight: '700', color: colors.gray[900] },

  // ── Modal ─────────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.white, borderRadius: borderRadius.xl,
    width: '100%', maxWidth: 540, maxHeight: '92%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.gray[200],
  },
  modalTitle:  { fontSize: fontSize.lg, fontWeight: '700', color: colors.gray[900] },
  modalBody:   { padding: spacing.lg },
  modalFooter: {
    flexDirection: 'row', gap: spacing.md,
    padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.gray[200],
  },

  row: { flexDirection: 'row' },
  fieldLabel: {
    fontSize: fontSize.sm, fontWeight: '600',
    color: colors.gray[700], marginBottom: spacing.sm,
  },
  chipGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full, borderWidth: 1,
    borderColor: colors.gray[300], backgroundColor: colors.white,
  },
  chipSelected: { backgroundColor: colors.primary[600], borderColor: colors.primary[600] },
  chipText:         { fontSize: fontSize.xs, color: colors.gray[700], fontWeight: '500' },
  chipTextSelected: { color: colors.white },
  colorGroup:  { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md, flexWrap: 'wrap' },
  colorDot:    { width: 28, height: 28, borderRadius: 14 },
  colorDotSelected: { borderWidth: 3, borderColor: colors.gray[800] },
  errorText: {
    fontSize: fontSize.xs, color: colors.red[500],
    marginTop: -spacing.xs, marginBottom: spacing.xs,
  },
});

export default CalendarioScreen;