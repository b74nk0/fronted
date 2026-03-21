import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Modal, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import EmptyState from '../../components/common/EmptyState';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';
import { pensionService } from '../../services/pensionService';
import { matriculaService } from '../../services/matriculaService';
import DatePickerField from '../../components/common/DatePickerField';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const ESTADO_COLORS = {
  Pendiente: { bg: '#fef9c3', text: '#854d0e', icon: 'time-outline' },
  Pagado: { bg: '#dcfce7', text: '#166534', icon: 'checkmark-circle-outline' },
  Vencido: { bg: '#fee2e2', text: '#991b1b', icon: 'alert-circle-outline' },
};

const FORM_INITIAL = {
  matricula: null,
  mes: null,
  anio: new Date().getFullYear().toString(),
  valor: '',
  fechaLimite: '',
};

// ─── Modal de confirmación genérico ──────────────────────────────────────────
const ConfirmModal = ({ visible, title, message, onConfirm, onCancel, confirmText = 'Confirmar', loading = false }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
    <View style={styles.modalOverlay}>
      <View style={[styles.modalContent, { maxWidth: 380 }]}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
        </View>
        <View style={{ padding: spacing.lg }}>
          <Text style={{ fontSize: fontSize.base, color: colors.gray[700], lineHeight: 22 }}>{message}</Text>
        </View>
        <View style={styles.modalFooter}>
          <Button title="Cancelar" onPress={onCancel} variant="outline" style={{ flex: 1 }} />
          <Button title={loading ? 'Procesando...' : confirmText} onPress={onConfirm} disabled={loading} style={{ flex: 1 }} />
        </View>
      </View>
    </View>
  </Modal>
);

// ─── Tarjeta pensión ──────────────────────────────────────────────────────────
const PensionCard = ({ pension: p, onPagar }) => {
  const est = p.matricula?.estudiante;
  const color = ESTADO_COLORS[p.estado] || ESTADO_COLORS.Pendiente;
  const esPagable = p.estado !== 'Pagado';

  return (
    <Card style={styles.card}>
      <View style={styles.cardRow}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{est?.nombre?.[0]}{est?.apellido?.[0]}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardNombre}>{est?.nombre} {est?.apellido}</Text>
          <Text style={styles.cardDoc}>{est?.tipoDocumento} {est?.numeroDocumento}</Text>
          <View style={styles.cardMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="school-outline" size={12} color={colors.gray[500]} />
              <Text style={styles.metaText}>{p.matricula?.grado?.nombre}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={12} color={colors.gray[500]} />
              <Text style={styles.metaText}>{p.matricula?.periodoAcademico?.nombre}</Text>
            </View>
          </View>
        </View>
        <View style={[styles.estadoBadge, { backgroundColor: color.bg }]}>
          <Ionicons name={color.icon} size={12} color={color.text} />
          <Text style={[styles.estadoText, { color: color.text }]}>{p.estado}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.pensionDetail}>
          <Text style={styles.mesPill}>{MESES[(p.mes || 1) - 1]} {p.anio}</Text>
          <Text style={styles.valorText}>${p.valor?.toLocaleString('es-CO')}</Text>
        </View>
        <View style={styles.footerRight}>
          <Text style={styles.fechaText}>Límite: {p.fechaLimite || '—'}</Text>
          {esPagable && (
            <TouchableOpacity style={styles.pagarBtn} onPress={() => onPagar(p)} activeOpacity={0.7}>
              <Ionicons name="card-outline" size={14} color={colors.white} />
              <Text style={styles.pagarBtnText}>Pagar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Card>
  );
};

// ─── Screen principal ─────────────────────────────────────────────────────────
const PensionesScreen = () => {
  const navigation = useNavigation();

  const [pensiones, setPensiones] = useState([]);
  const [matriculas, setMatriculas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [busqueda, setBusqueda] = useState('');
  const [filtroGrado, setFiltroGrado] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState(null);

  const [crearVisible, setCrearVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(FORM_INITIAL);
  const [formErrors, setFormErrors] = useState({});
  const [busquedaMatricula, setBusquedaMatricula] = useState('');

  // Modal confirmación pago
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pensionAPagar, setPensionAPagar] = useState(null);
  const [pagando, setPagando] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [pensData, matData] = await Promise.all([
        pensionService.listar(),
        matriculaService.listar(),
      ]);
      setPensiones(pensData);
      setMatriculas(matData);
    } catch (error) {
      console.error('Error cargando pensiones:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { loadAll(); }, []));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }, []);

  const gradosUnicos = Array.from(
    new Map(matriculas.filter(m => m.grado).map(m => [m.grado.id, m.grado])).values()
  );

  const pensionesFiltradas = pensiones.filter(p => {
    const est = p.matricula?.estudiante;
    const matchBusqueda = busqueda.trim().length < 2 || (
      `${est?.nombre} ${est?.apellido} ${est?.numeroDocumento}`.toLowerCase().includes(busqueda.toLowerCase())
    );
    const matchGrado = !filtroGrado || p.matricula?.grado?.id === filtroGrado.id;
    const matchEstado = !filtroEstado || p.estado === filtroEstado;
    return matchBusqueda && matchGrado && matchEstado;
  });

  const stats = {
    pendiente: pensiones.filter(p => p.estado === 'Pendiente').length,
    pagado: pensiones.filter(p => p.estado === 'Pagado').length,
    vencido: pensiones.filter(p => p.estado === 'Vencido').length,
  };

  const matriculasFiltradas = busquedaMatricula.trim().length >= 2
    ? matriculas.filter(m => {
      const est = m.estudiante;
      return `${est?.nombre} ${est?.apellido} ${est?.numeroDocumento}`
        .toLowerCase().includes(busquedaMatricula.toLowerCase());
    })
    : [];

  // ─── Pagar ────────────────────────────────────────────────────────────────
  const handlePagar = useCallback((pension) => {
    setPensionAPagar(pension);
    setConfirmVisible(true);
  }, []);

  const confirmarPago = async () => {
    if (!pensionAPagar) return;
    setPagando(true);
    try {
      await pensionService.pagar(pensionAPagar.id);
      setConfirmVisible(false);
      setPensionAPagar(null);
      await loadAll();
    } catch (error) {
      console.error('Error al pagar:', error);
    } finally {
      setPagando(false);
    }
  };

  // ─── Crear ────────────────────────────────────────────────────────────────
  const openCrear = () => {
    setFormData(FORM_INITIAL);
    setFormErrors({});
    setBusquedaMatricula('');
    setCrearVisible(true);
  };

  const validateCrear = () => {
    const e = {};
    if (!formData.matricula) e.matricula = 'Selecciona un estudiante';
    if (formData.mes === null) e.mes = 'Selecciona el mes';
    if (!formData.anio || isNaN(parseInt(formData.anio))) e.anio = 'Año inválido';
    if (!formData.valor || isNaN(parseFloat(formData.valor))) e.valor = 'Valor inválido';
    if (!formData.fechaLimite) e.fechaLimite = 'Fecha límite requerida';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCrear = async () => {
    if (!validateCrear()) return;
    setSaving(true);
    try {
      await pensionService.crear({
        matricula: { id: formData.matricula.id },
        mes: formData.mes + 1,
        anio: parseInt(formData.anio),
        valor: parseFloat(formData.valor),
        fechaLimite: formData.fechaLimite,
      });
      setCrearVisible(false);
      await loadAll();
    } catch (error) {
      console.error('Error creando pensión:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading && pensiones.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={styles.loadingText}>Cargando pensiones...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[700]} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.headerText}>Pensiones</Text>
          <Text style={styles.headerSubtext}>{pensiones.length} registros</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={openCrear}>
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { label: 'Pendientes', value: stats.pendiente, color: '#854d0e', bg: '#fef9c3' },
          { label: 'Pagados', value: stats.pagado, color: '#166534', bg: '#dcfce7' },
          { label: 'Vencidos', value: stats.vencido, color: '#991b1b', bg: '#fee2e2' },
        ].map(s => (
          <View key={s.label} style={[styles.statCard, { backgroundColor: s.bg }]}>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: s.color }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Buscador */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.gray[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar estudiante..."
            value={busqueda}
            onChangeText={setBusqueda}
          />
          {busqueda.length > 0 && (
            <TouchableOpacity onPress={() => setBusqueda('')}>
              <Ionicons name="close-circle" size={18} color={colors.gray[400]} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filtros */}
      <View style={styles.filtrosContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filtroChip, !filtroGrado && styles.filtroChipActive]}
            onPress={() => setFiltroGrado(null)}
          >
            <Text style={[styles.filtroText, !filtroGrado && styles.filtroTextActive]}>Todos los grados</Text>
          </TouchableOpacity>
          {gradosUnicos.map(g => (
            <TouchableOpacity
              key={g.id}
              style={[styles.filtroChip, filtroGrado?.id === g.id && styles.filtroChipActive]}
              onPress={() => setFiltroGrado(filtroGrado?.id === g.id ? null : g)}
            >
              <Text style={[styles.filtroText, filtroGrado?.id === g.id && styles.filtroTextActive]}>{g.nombre}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={{ height: 4 }} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['Pendiente', 'Pagado', 'Vencido'].map(e => (
            <TouchableOpacity
              key={e}
              style={[styles.filtroChip, filtroEstado === e && styles.filtroChipActive]}
              onPress={() => setFiltroEstado(filtroEstado === e ? null : e)}
            >
              <Text style={[styles.filtroText, filtroEstado === e && styles.filtroTextActive]}>{e}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Lista */}
      <ScrollView
        style={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {pensionesFiltradas.length === 0 ? (
          <EmptyState icon="cash-outline" title="Sin pensiones" message="No hay pensiones que coincidan con los filtros" />
        ) : (
          <View style={styles.list}>
            {pensionesFiltradas.map(p => (
              <PensionCard key={p.id} pension={p} onPagar={handlePagar} />
            ))}
          </View>
        )}
        <View style={{ height: spacing.xl }} />
      </ScrollView>

      {/* Modal confirmación pago */}
      <ConfirmModal
        visible={confirmVisible}
        title="Registrar Pago"
        message={pensionAPagar
          ? `¿Confirmar pago de ${MESES[(pensionAPagar.mes || 1) - 1]} ${pensionAPagar.anio} para ${pensionAPagar.matricula?.estudiante?.nombre} ${pensionAPagar.matricula?.estudiante?.apellido}?\n\nValor: $${pensionAPagar.valor?.toLocaleString('es-CO')}`
          : ''}
        confirmText="Confirmar pago"
        loading={pagando}
        onConfirm={confirmarPago}
        onCancel={() => { setConfirmVisible(false); setPensionAPagar(null); }}
      />

      {/* Modal crear pensión */}
      <Modal visible={crearVisible} transparent animationType="fade" onRequestClose={() => setCrearVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '94%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nueva Pensión</Text>
              <TouchableOpacity onPress={() => setCrearVisible(false)}>
                <Ionicons name="close" size={24} color={colors.gray[600]} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <Text style={styles.fieldLabel}>Estudiante (Matrícula) *</Text>
              {formData.matricula ? (
                <View style={styles.seleccionado}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.selNombre}>
                      {formData.matricula.estudiante?.nombre} {formData.matricula.estudiante?.apellido}
                    </Text>
                    <Text style={styles.selMeta}>
                      {formData.matricula.grado?.nombre} · {formData.matricula.periodoAcademico?.nombre}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => { setFormData(f => ({ ...f, matricula: null })); setBusquedaMatricula(''); }}>
                    <Ionicons name="close-circle" size={20} color={colors.gray[400]} />
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <View style={styles.searchBox}>
                    <Ionicons name="search" size={18} color={colors.gray[400]} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Buscar por nombre o documento..."
                      value={busquedaMatricula}
                      onChangeText={setBusquedaMatricula}
                    />
                  </View>
                  {busquedaMatricula.trim().length >= 2 && (
                    <View style={styles.resultadosList}>
                      {matriculasFiltradas.length === 0 ? (
                        <Text style={styles.sinResultados}>Sin resultados</Text>
                      ) : (
                        matriculasFiltradas.map(m => (
                          <TouchableOpacity
                            key={m.id}
                            style={styles.resultadoItem}
                            onPress={() => { setFormData(f => ({ ...f, matricula: m })); setBusquedaMatricula(''); }}
                          >
                            <Text style={styles.selNombre}>{m.estudiante?.nombre} {m.estudiante?.apellido}</Text>
                            <Text style={styles.selMeta}>{m.grado?.nombre} · {m.periodoAcademico?.nombre}</Text>
                          </TouchableOpacity>
                        ))
                      )}
                    </View>
                  )}
                </>
              )}
              {formErrors.matricula && <Text style={styles.errorText}>{formErrors.matricula}</Text>}

              <Text style={styles.fieldLabel}>Mes *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {MESES.map((m, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.chip, formData.mes === i && styles.chipSelected]}
                    onPress={() => setFormData(f => ({ ...f, mes: i }))}
                  >
                    <Text style={[styles.chipText, formData.mes === i && styles.chipTextSelected]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {formErrors.mes && <Text style={styles.errorText}>{formErrors.mes}</Text>}

              <View style={styles.rowInputs}>
                <View style={{ flex: 1 }}>
                  <Input label="Año *" placeholder="2025" value={formData.anio}
                    onChangeText={(t) => setFormData(f => ({ ...f, anio: t }))}
                    keyboardType="numeric" error={formErrors.anio} />
                </View>
                <View style={{ flex: 2 }}>
                  <Input label="Valor ($) *" placeholder="500000" value={formData.valor}
                    onChangeText={(t) => setFormData(f => ({ ...f, valor: t }))}
                    keyboardType="numeric" error={formErrors.valor} />
                </View>
              </View>

              <DatePickerField
                label="Fecha límite *"
                value={formData.fechaLimite}
                onChange={(val) => setFormData(f => ({ ...f, fechaLimite: val }))}
                error={formErrors.fechaLimite}
              />
              <View style={{ height: spacing.md }} />
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button title="Cancelar" onPress={() => setCrearVisible(false)} variant="outline" style={{ flex: 1 }} />
              <Button title={saving ? 'Guardando...' : 'Crear Pensión'} onPress={handleCrear} disabled={saving} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: spacing.md, fontSize: fontSize.base, color: colors.gray[600] },
  header: {
    backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center',
    padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.gray[200],
  },
  backButton: { marginRight: spacing.md },
  headerTitle: { flex: 1 },
  headerText: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.gray[900] },
  headerSubtext: { fontSize: fontSize.sm, color: colors.gray[600], marginTop: 2 },
  addButton: {
    width: 40, height: 40, backgroundColor: colors.primary[600],
    borderRadius: borderRadius.full, justifyContent: 'center', alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row', gap: spacing.sm, padding: spacing.md,
    backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray[100],
  },
  statCard: { flex: 1, padding: spacing.sm, borderRadius: borderRadius.lg, alignItems: 'center' },
  statValue: { fontSize: fontSize.xl, fontWeight: '800' },
  statLabel: { fontSize: fontSize.xs, fontWeight: '500', marginTop: 2 },
  searchContainer: { backgroundColor: colors.white, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1,
    borderColor: colors.gray[200], borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md, backgroundColor: colors.gray[50], gap: spacing.sm,
  },
  searchInput: { flex: 1, height: 40, fontSize: fontSize.sm, color: colors.gray[900] },
  filtrosContainer: {
    backgroundColor: colors.white, paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.gray[100],
  },
  filtroChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 1,
    borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.gray[200],
    marginRight: spacing.sm, marginTop: spacing.xs, backgroundColor: colors.white,
  },
  filtroChipActive: { backgroundColor: colors.primary[600], borderColor: colors.primary[600] },
  filtroText: { fontSize: fontSize.xs, color: colors.gray[600], fontWeight: '500' },
  filtroTextActive: { color: colors.white },
  content: { flex: 1 },
  list: { padding: spacing.lg, gap: spacing.sm },
  card: { marginBottom: spacing.sm },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  avatarContainer: {
    width: 42, height: 42, borderRadius: borderRadius.full,
    backgroundColor: colors.primary[100], justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: fontSize.base, fontWeight: '700', color: colors.primary[700] },
  cardInfo: { flex: 1 },
  cardNombre: { fontSize: fontSize.sm, fontWeight: '600', color: colors.gray[900] },
  cardDoc: { fontSize: fontSize.xs, color: colors.gray[500], marginTop: 1 },
  cardMeta: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: fontSize.xs, color: colors.gray[500] },
  estadoBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.sm,
  },
  estadoText: { fontSize: fontSize.xs, fontWeight: '600' },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: spacing.sm, paddingTop: spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.gray[100],
  },
  pensionDetail: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  mesPill: {
    backgroundColor: colors.primary[50], paddingHorizontal: spacing.sm,
    paddingVertical: 3, borderRadius: borderRadius.sm,
    fontSize: fontSize.sm, color: colors.primary[700], fontWeight: '600',
  },
  valorText: { fontSize: fontSize.base, fontWeight: '700', color: colors.gray[900] },
  footerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  fechaText: { fontSize: fontSize.xs, color: colors.gray[400] },
  pagarBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.primary[600], paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2, borderRadius: borderRadius.md,
  },
  pagarBtnText: { fontSize: fontSize.xs, color: colors.white, fontWeight: '600' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.white, borderRadius: borderRadius.xl,
    width: '100%', maxWidth: 540,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.gray[200],
  },
  modalTitle: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.gray[900] },
  modalBody: { padding: spacing.lg },
  modalFooter: {
    flexDirection: 'row', gap: spacing.md,
    padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.gray[200],
  },
  fieldLabel: {
    fontSize: fontSize.sm, fontWeight: '600', color: colors.gray[700],
    marginBottom: spacing.sm, marginTop: spacing.sm,
  },
  seleccionado: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.primary[50], padding: spacing.md,
    borderRadius: borderRadius.lg, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.primary[200],
  },
  selNombre: { fontSize: fontSize.sm, fontWeight: '600', color: colors.gray[900] },
  selMeta: { fontSize: fontSize.xs, color: colors.gray[500], marginTop: 2 },
  resultadosList: {
    borderWidth: 1, borderColor: colors.gray[200],
    borderRadius: borderRadius.lg, overflow: 'hidden', marginBottom: spacing.sm,
  },
  resultadoItem: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.gray[100] },
  sinResultados: { padding: spacing.md, textAlign: 'center', color: colors.gray[500], fontSize: fontSize.sm },
  rowInputs: { flexDirection: 'row', gap: spacing.md },
  chipScroll: { marginBottom: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full, borderWidth: 1,
    borderColor: colors.gray[300], backgroundColor: colors.white, marginRight: spacing.sm,
  },
  chipSelected: { backgroundColor: colors.primary[600], borderColor: colors.primary[600] },
  chipText: { fontSize: fontSize.sm, color: colors.gray[700], fontWeight: '500' },
  chipTextSelected: { color: colors.white },
  errorText: { fontSize: fontSize.xs, color: colors.red[500], marginBottom: spacing.sm },
});

export default PensionesScreen;