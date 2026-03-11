import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';
import { matriculaService } from '../../services/matriculaService';
import { usuarioService } from '../../services/usuarioService';
import { nivelService } from '../../services/nivelService';
import { periodoAcademicoService } from '../../services/periodoAcademicoService';

const ESTADOS = ['Prematriculado', 'Matriculado', 'Retirado', 'Cancelado'];

const ESTADO_COLORS = {
  Prematriculado: { bg: '#fef9c3', text: '#854d0e' },
  Matriculado:    { bg: '#dcfce7', text: '#166534' },
  Retirado:       { bg: '#fee2e2', text: '#991b1b' },
  Cancelado:      { bg: '#f3f4f6', text: '#6b7280' },
};

const MatriculasScreen = () => {
  const navigation = useNavigation();

  const [matriculas, setMatriculas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Catálogos
  const [estudiantes, setEstudiantes] = useState([]);
  const [niveles, setNiveles] = useState([]);
  const [periodos, setPeriodos] = useState([]);

  // Modal crear
  const [crearVisible, setCrearVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState(null);
  const [gradoSeleccionado, setGradoSeleccionado] = useState(null);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState(null);
  const [crearErrors, setCrearErrors] = useState({});

  // Modal editar
  const [editarVisible, setEditarVisible] = useState(false);
  const [editingMatricula, setEditingMatricula] = useState(null);
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [nuevaActiva, setNuevaActiva] = useState(true);

  // Filtro
  const [filtroEstado, setFiltroEstado] = useState(null);

  // ─── Cargar ──────────────────────────────────────────────────────────────────
  const loadAll = async () => {
    setLoading(true);
    try {
      const [matData, estData, nivData, perData] = await Promise.all([
        matriculaService.listar(),
        usuarioService.listarEstudiantes(),
        nivelService.listar(),
        periodoAcademicoService.listar(),
      ]);
      setMatriculas(matData);
      setEstudiantes(estData);
      setNiveles(nivData);
      setPeriodos(perData);
    } catch (error) {
      console.error('Error cargando matrículas:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos.');
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

  // ─── Grados aplanados ────────────────────────────────────────────────────────
  const gradosFlat = niveles.flatMap(n =>
    (n.grados || []).map(g => ({ ...g, nivelNombre: n.nombre }))
  );

  // ─── Estudiantes filtrados por búsqueda ──────────────────────────────────────
  const estudiantesFiltrados = busqueda.trim().length >= 2
    ? estudiantes.filter(e => {
        const full = `${e.nombre} ${e.apellido} ${e.numeroDocumento}`.toLowerCase();
        return full.includes(busqueda.toLowerCase());
      })
    : [];

  // ─── Matrículas filtradas ────────────────────────────────────────────────────
  const matriculasFiltradas = filtroEstado
    ? matriculas.filter(m => m.estado === filtroEstado)
    : matriculas;

  // ─── Crear modal ─────────────────────────────────────────────────────────────
  const openCrear = () => {
    setBusqueda('');
    setEstudianteSeleccionado(null);
    setGradoSeleccionado(null);
    setPeriodoSeleccionado(null);
    setCrearErrors({});
    setCrearVisible(true);
  };

  const validateCrear = () => {
    const e = {};
    if (!estudianteSeleccionado) e.estudiante = 'Selecciona un estudiante';
    if (!gradoSeleccionado) e.grado = 'Selecciona un grado';
    if (!periodoSeleccionado) e.periodo = 'Selecciona un período';
    setCrearErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCrear = async () => {
    if (!validateCrear()) return;
    setSaving(true);
    try {
      await matriculaService.crear(
        estudianteSeleccionado.id,
        gradoSeleccionado.id,
        periodoSeleccionado.id
      );
      setCrearVisible(false);
      await loadAll();
    } catch (error) {
      const msg = error.response?.data?.message || 'No se pudo crear la matrícula.';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  // ─── Editar modal ─────────────────────────────────────────────────────────────
  const openEditar = (matricula) => {
    setEditingMatricula(matricula);
    setNuevoEstado(matricula.estado);
    setNuevaActiva(matricula.activa);
    setEditarVisible(true);
  };

  const handleActualizar = async () => {
    setSaving(true);
    try {
      await matriculaService.actualizar(editingMatricula.id, {
        estado: nuevoEstado,
        activa: nuevaActiva,
      });
      setEditarVisible(false);
      await loadAll();
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar la matrícula.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Eliminar ─────────────────────────────────────────────────────────────────
  const handleEliminar = (matricula) => {
    Alert.alert(
      'Eliminar matrícula',
      `¿Eliminar la matrícula de ${matricula.estudiante?.nombre} ${matricula.estudiante?.apellido}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await matriculaService.eliminar(matricula.id);
              await loadAll();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar la matrícula.');
            }
          },
        },
      ]
    );
  };

  // ─── Render tarjeta matrícula ─────────────────────────────────────────────────
  const renderCard = (m) => {
    const estadoColor = ESTADO_COLORS[m.estado] || ESTADO_COLORS.Cancelado;
    return (
      <Card key={m.id} style={styles.card}>
        <View style={styles.cardRow}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {m.estudiante?.nombre?.[0]}{m.estudiante?.apellido?.[0]}
            </Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardNombre}>
              {m.estudiante?.nombre} {m.estudiante?.apellido}
            </Text>
            <Text style={styles.cardDoc}>
              {m.estudiante?.tipoDocumento} {m.estudiante?.numeroDocumento}
            </Text>
            <View style={styles.cardMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="school-outline" size={12} color={colors.gray[500]} />
                <Text style={styles.metaText}>{m.grado?.nombre}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={12} color={colors.gray[500]} />
                <Text style={styles.metaText}>{m.periodoAcademico?.nombre}</Text>
              </View>
            </View>
          </View>
          <View style={styles.cardRight}>
            <View style={[styles.estadoBadge, { backgroundColor: estadoColor.bg }]}>
              <Text style={[styles.estadoText, { color: estadoColor.text }]}>{m.estado}</Text>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.iconButton} onPress={() => openEditar(m)}>
                <Ionicons name="pencil" size={16} color={colors.primary[600]} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={() => handleEliminar(m)}>
                <Ionicons name="trash-outline" size={16} color={colors.red[500]} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.fechaText}>
            Fecha matrícula: {m.fechaMatricula || '—'}
          </Text>
          {!m.activa && (
            <View style={styles.inactivaBadge}>
              <Text style={styles.inactivaText}>Inactiva</Text>
            </View>
          )}
        </View>
      </Card>
    );
  };

  // ─── Modal crear ──────────────────────────────────────────────────────────────
  const renderCrearModal = () => (
    <Modal visible={crearVisible} transparent animationType="fade" onRequestClose={() => setCrearVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { maxHeight: '92%' }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nueva Matrícula</Text>
            <TouchableOpacity onPress={() => setCrearVisible(false)}>
              <Ionicons name="close" size={24} color={colors.gray[600]} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">

            {/* Buscador estudiante */}
            <Text style={styles.fieldLabel}>Estudiante *</Text>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color={colors.gray[400]} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar por nombre o documento..."
                value={busqueda}
                onChangeText={setBusqueda}
              />
              {busqueda.length > 0 && (
                <TouchableOpacity onPress={() => { setBusqueda(''); setEstudianteSeleccionado(null); }}>
                  <Ionicons name="close-circle" size={18} color={colors.gray[400]} />
                </TouchableOpacity>
              )}
            </View>

            {/* Resultados búsqueda */}
            {estudianteSeleccionado ? (
              <View style={styles.estudianteSeleccionado}>
                <View style={styles.avatarSmall}>
                  <Text style={styles.avatarSmallText}>
                    {estudianteSeleccionado.nombre?.[0]}{estudianteSeleccionado.apellido?.[0]}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.estNombre}>
                    {estudianteSeleccionado.nombre} {estudianteSeleccionado.apellido}
                  </Text>
                  <Text style={styles.estDoc}>
                    {estudianteSeleccionado.tipoDocumento} {estudianteSeleccionado.numeroDocumento}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => { setEstudianteSeleccionado(null); setBusqueda(''); }}>
                  <Ionicons name="close-circle" size={20} color={colors.gray[400]} />
                </TouchableOpacity>
              </View>
            ) : busqueda.trim().length >= 2 ? (
              <View style={styles.resultadosList}>
                {estudiantesFiltrados.length === 0 ? (
                  <Text style={styles.sinResultados}>Sin resultados</Text>
                ) : (
                  estudiantesFiltrados.map(e => (
                    <TouchableOpacity
                      key={e.id}
                      style={styles.resultadoItem}
                      onPress={() => { setEstudianteSeleccionado(e); setBusqueda(''); }}
                    >
                      <View style={styles.avatarSmall}>
                        <Text style={styles.avatarSmallText}>{e.nombre?.[0]}{e.apellido?.[0]}</Text>
                      </View>
                      <View>
                        <Text style={styles.estNombre}>{e.nombre} {e.apellido}</Text>
                        <Text style={styles.estDoc}>{e.tipoDocumento} {e.numeroDocumento}</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            ) : busqueda.trim().length > 0 ? (
              <Text style={styles.searchHint}>Escribe al menos 2 caracteres</Text>
            ) : null}
            {crearErrors.estudiante && <Text style={styles.errorText}>{crearErrors.estudiante}</Text>}

            {/* Selector período */}
            <Text style={styles.fieldLabel}>Período Académico *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {periodos.map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.chip, periodoSeleccionado?.id === p.id && styles.chipSelected]}
                  onPress={() => setPeriodoSeleccionado(p)}
                >
                  <Text style={[styles.chipText, periodoSeleccionado?.id === p.id && styles.chipTextSelected]}>
                    {p.nombre}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {crearErrors.periodo && <Text style={styles.errorText}>{crearErrors.periodo}</Text>}

            {/* Selector grado */}
            <Text style={styles.fieldLabel}>Grado *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {gradosFlat.map(g => (
                <TouchableOpacity
                  key={g.id}
                  style={[styles.chip, gradoSeleccionado?.id === g.id && styles.chipSelected]}
                  onPress={() => setGradoSeleccionado(g)}
                >
                  <Text style={[styles.chipText, gradoSeleccionado?.id === g.id && styles.chipTextSelected]}>
                    {g.nombre}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {crearErrors.grado && <Text style={styles.errorText}>{crearErrors.grado}</Text>}

            <View style={{ height: spacing.md }} />
          </ScrollView>

          <View style={styles.modalFooter}>
            <Button title="Cancelar" onPress={() => setCrearVisible(false)} variant="outline" style={{ flex: 1 }} />
            <Button title={saving ? 'Guardando...' : 'Matricular'} onPress={handleCrear} disabled={saving} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  );

  // ─── Modal editar ─────────────────────────────────────────────────────────────
  const renderEditarModal = () => (
    <Modal visible={editarVisible} transparent animationType="fade" onRequestClose={() => setEditarVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Actualizar Matrícula</Text>
            <TouchableOpacity onPress={() => setEditarVisible(false)}>
              <Ionicons name="close" size={24} color={colors.gray[600]} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            {editingMatricula && (
              <View style={styles.estudianteSeleccionado}>
                <View style={styles.avatarSmall}>
                  <Text style={styles.avatarSmallText}>
                    {editingMatricula.estudiante?.nombre?.[0]}{editingMatricula.estudiante?.apellido?.[0]}
                  </Text>
                </View>
                <View>
                  <Text style={styles.estNombre}>
                    {editingMatricula.estudiante?.nombre} {editingMatricula.estudiante?.apellido}
                  </Text>
                  <Text style={styles.estDoc}>
                    {editingMatricula.grado?.nombre} · {editingMatricula.periodoAcademico?.nombre}
                  </Text>
                </View>
              </View>
            )}

            <Text style={styles.fieldLabel}>Estado</Text>
            <View style={styles.estadosGrid}>
              {ESTADOS.map(estado => {
                const color = ESTADO_COLORS[estado];
                const selected = nuevoEstado === estado;
                return (
                  <TouchableOpacity
                    key={estado}
                    style={[
                      styles.estadoOption,
                      selected && { backgroundColor: color.bg, borderColor: color.text },
                    ]}
                    onPress={() => setNuevoEstado(estado)}
                  >
                    <Text style={[styles.estadoOptionText, selected && { color: color.text, fontWeight: '700' }]}>
                      {estado}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.fieldLabel}>Matrícula activa</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleOption, nuevaActiva && styles.toggleSelected]}
                onPress={() => setNuevaActiva(true)}
              >
                <Ionicons name="checkmark-circle" size={18} color={nuevaActiva ? colors.primary[600] : colors.gray[400]} />
                <Text style={[styles.toggleText, nuevaActiva && styles.toggleTextSelected]}>Activa</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleOption, !nuevaActiva && styles.toggleSelectedRed]}
                onPress={() => setNuevaActiva(false)}
              >
                <Ionicons name="close-circle" size={18} color={!nuevaActiva ? colors.red[500] : colors.gray[400]} />
                <Text style={[styles.toggleText, !nuevaActiva && styles.toggleTextRed]}>Inactiva</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.modalFooter}>
            <Button title="Cancelar" onPress={() => setEditarVisible(false)} variant="outline" style={{ flex: 1 }} />
            <Button title={saving ? 'Guardando...' : 'Actualizar'} onPress={handleActualizar} disabled={saving} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading && matriculas.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={styles.loadingText}>Cargando matrículas...</Text>
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
          <Text style={styles.headerText}>Matrículas</Text>
          <Text style={styles.headerSubtext}>{matriculas.length} registros</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={openCrear}>
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Filtros por estado */}
      <View style={styles.filtroContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filtroChip, !filtroEstado && styles.filtroChipActive]}
            onPress={() => setFiltroEstado(null)}
          >
            <Text style={[styles.filtroText, !filtroEstado && styles.filtroTextActive]}>
              Todos ({matriculas.length})
            </Text>
          </TouchableOpacity>
          {ESTADOS.map(e => {
            const count = matriculas.filter(m => m.estado === e).length;
            return (
              <TouchableOpacity
                key={e}
                style={[styles.filtroChip, filtroEstado === e && styles.filtroChipActive]}
                onPress={() => setFiltroEstado(filtroEstado === e ? null : e)}
              >
                <Text style={[styles.filtroText, filtroEstado === e && styles.filtroTextActive]}>
                  {e} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {matriculasFiltradas.length === 0 ? (
          <EmptyState
            icon="person-add-outline"
            title="No hay matrículas"
            message={filtroEstado ? `No hay matrículas con estado "${filtroEstado}"` : 'Registra la primera matrícula'}
          />
        ) : (
          <View style={styles.list}>
            {matriculasFiltradas.map(renderCard)}
          </View>
        )}
        <View style={{ height: spacing.xl }} />
      </ScrollView>

      {renderCrearModal()}
      {renderEditarModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: spacing.md, fontSize: fontSize.base, color: colors.gray[600] },
  header: {
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  backButton: { marginRight: spacing.md },
  headerTitle: { flex: 1 },
  headerText: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.gray[900] },
  headerSubtext: { fontSize: fontSize.sm, color: colors.gray[600], marginTop: 2 },
  addButton: {
    width: 40, height: 40,
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.full,
    justifyContent: 'center', alignItems: 'center',
  },
  filtroContainer: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  filtroChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.gray[200],
    marginRight: spacing.sm,
    backgroundColor: colors.white,
  },
  filtroChipActive: { backgroundColor: colors.primary[600], borderColor: colors.primary[600] },
  filtroText: { fontSize: fontSize.xs, color: colors.gray[600], fontWeight: '500' },
  filtroTextActive: { color: colors.white },
  content: { flex: 1 },
  list: { padding: spacing.lg, gap: spacing.sm },
  card: { marginBottom: spacing.sm },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  avatarContainer: {
    width: 44, height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[100],
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: fontSize.base, fontWeight: '700', color: colors.primary[700] },
  cardInfo: { flex: 1 },
  cardNombre: { fontSize: fontSize.base, fontWeight: '600', color: colors.gray[900] },
  cardDoc: { fontSize: fontSize.xs, color: colors.gray[500], marginTop: 2 },
  cardMeta: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: fontSize.xs, color: colors.gray[500] },
  cardRight: { alignItems: 'flex-end', gap: spacing.xs },
  estadoBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  estadoText: { fontSize: fontSize.xs, fontWeight: '600' },
  cardActions: { flexDirection: 'row', gap: spacing.xs },
  iconButton: {
    width: 30, height: 30,
    justifyContent: 'center', alignItems: 'center',
    borderRadius: borderRadius.sm,
    backgroundColor: colors.gray[100],
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  fechaText: { fontSize: fontSize.xs, color: colors.gray[400] },
  inactivaBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.gray[200],
  },
  inactivaText: { fontSize: fontSize.xs, color: colors.gray[500] },
  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
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
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: colors.gray[300],
    borderRadius: borderRadius.lg, paddingHorizontal: spacing.md,
    backgroundColor: colors.white, gap: spacing.sm, marginBottom: spacing.sm,
  },
  searchInput: { flex: 1, height: 42, fontSize: fontSize.sm, color: colors.gray[900] },
  searchHint: { fontSize: fontSize.xs, color: colors.gray[400], marginBottom: spacing.sm },
  resultadosList: {
    borderWidth: 1, borderColor: colors.gray[200],
    borderRadius: borderRadius.lg, overflow: 'hidden', marginBottom: spacing.sm,
  },
  resultadoItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.gray[100],
  },
  estudianteSeleccionado: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.primary[50], padding: spacing.md,
    borderRadius: borderRadius.lg, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.primary[200],
  },
  avatarSmall: {
    width: 36, height: 36, borderRadius: borderRadius.full,
    backgroundColor: colors.primary[200], justifyContent: 'center', alignItems: 'center',
  },
  avatarSmallText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.primary[700] },
  estNombre: { fontSize: fontSize.sm, fontWeight: '600', color: colors.gray[900] },
  estDoc: { fontSize: fontSize.xs, color: colors.gray[500] },
  sinResultados: { padding: spacing.md, textAlign: 'center', color: colors.gray[500], fontSize: fontSize.sm },
  chipScroll: { marginBottom: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.gray[300],
    backgroundColor: colors.white, marginRight: spacing.sm,
  },
  chipSelected: { backgroundColor: colors.primary[600], borderColor: colors.primary[600] },
  chipText: { fontSize: fontSize.sm, color: colors.gray[700], fontWeight: '500' },
  chipTextSelected: { color: colors.white },
  errorText: { fontSize: fontSize.xs, color: colors.red[500], marginBottom: spacing.sm },
  estadosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  estadoOption: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.gray[200],
    backgroundColor: colors.white,
  },
  estadoOptionText: { fontSize: fontSize.sm, color: colors.gray[600], fontWeight: '500' },
  toggleRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  toggleOption: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, padding: spacing.md, borderRadius: borderRadius.lg,
    borderWidth: 1, borderColor: colors.gray[200], backgroundColor: colors.white,
  },
  toggleSelected: { backgroundColor: colors.primary[50], borderColor: colors.primary[300] },
  toggleSelectedRed: { backgroundColor: '#fee2e2', borderColor: '#fca5a5' },
  toggleText: { fontSize: fontSize.sm, color: colors.gray[600], fontWeight: '500' },
  toggleTextSelected: { color: colors.primary[700] },
  toggleTextRed: { color: colors.red[600] },
});

export default MatriculasScreen;