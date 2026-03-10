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
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import EmptyState from '../../../components/common/EmptyState';
import { colors, spacing, fontSize, borderRadius } from '../../../constants/theme';
import { planEstudioService } from '../../../services/planEstudioService';
import { nivelService } from '../../../services/nivelService';
import { periodoAcademicoService } from '../../../services/periodoAcademicoService';
import { materiaService } from '../../../services/materiaService';

const FORM_INITIAL = {
  nombre: '',
  grado: null,       // { id, nombre }
  periodoAcademico: null,  // { id, nombre }
  detalles: [],      // [{ materia: { id, nombre }, horasSemanales }]
};

const PlanesEstudioScreen = () => {
  const navigation = useNavigation();

  // ─── Estado principal ────────────────────────────────────────────────────────
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ─── Catálogos ───────────────────────────────────────────────────────────────
  const [niveles, setNiveles] = useState([]);       // para el selector de grado
  const [periodos, setPeriodos] = useState([]);
  const [materias, setMaterias] = useState([]);

  // ─── Modal ───────────────────────────────────────────────────────────────────
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState(FORM_INITIAL);
  const [errors, setErrors] = useState({});

  // ─── Sub-modal selector de materia ──────────────────────────────────────────
  const [materiaModalVisible, setMateriaModalVisible] = useState(false);

  // ─── Cargar todo ─────────────────────────────────────────────────────────────
  const loadAll = async () => {
    setLoading(true);
    try {
      const [planesData, nivelesData, periodosData, materiasData] = await Promise.all([
        planEstudioService.listar(),
        nivelService.listar(),
        periodoAcademicoService.listar(),
        materiaService.listar(),
      ]);
      setPlanes(planesData);
      setNiveles(nivelesData);
      setPeriodos(periodosData);
      setMaterias(materiasData);
    } catch (error) {
      console.error('Error cargando datos:', error);
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

  // ─── Modal plan ──────────────────────────────────────────────────────────────
  const openModal = (plan = null) => {
    setEditingPlan(plan);
    setErrors({});
    if (plan) {
      setFormData({
        nombre: plan.nombre || '',
        grado: plan.grado || null,
        periodoAcademico: plan.periodoAcademico || null,
        detalles: (plan.detalles || []).map(d => ({
          materia: d.materia,
          horasSemanales: d.horasSemanales?.toString() || '',
        })),
      });
    } else {
      setFormData(FORM_INITIAL);
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingPlan(null);
    setFormData(FORM_INITIAL);
    setErrors({});
  };

  // ─── Selección de grado ──────────────────────────────────────────────────────
  const selectGrado = (grado) => {
    setFormData(f => ({ ...f, grado }));
    if (errors.grado) setErrors(e => ({ ...e, grado: null }));
  };

  // ─── Selección de periodo ────────────────────────────────────────────────────
  const selectPeriodo = (periodo) => {
    setFormData(f => ({ ...f, periodoAcademico: periodo }));
    if (errors.periodoAcademico) setErrors(e => ({ ...e, periodoAcademico: null }));
  };

  // ─── Gestión de detalles ─────────────────────────────────────────────────────
  const addMateria = (materia) => {
    const yaExiste = formData.detalles.some(d => d.materia?.id === materia.id);
    if (yaExiste) {
      Alert.alert('Ya agregada', 'Esta materia ya está en el plan.');
      return;
    }
    setFormData(f => ({
      ...f,
      detalles: [...f.detalles, { materia, horasSemanales: '' }],
    }));
    setMateriaModalVisible(false);
  };

  const updateHoras = (index, valor) => {
    const nuevos = formData.detalles.map((d, i) =>
      i === index ? { ...d, horasSemanales: valor } : d
    );
    setFormData(f => ({ ...f, detalles: nuevos }));
  };

  const removeDetalle = (index) => {
    setFormData(f => ({
      ...f,
      detalles: f.detalles.filter((_, i) => i !== index),
    }));
  };

  // ─── Validar ────────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!formData.nombre.trim()) e.nombre = 'Requerido';
    if (!formData.grado) e.grado = 'Selecciona un grado';
    if (!formData.periodoAcademico) e.periodoAcademico = 'Selecciona un período';
    if (formData.detalles.length === 0) e.detalles = 'Agrega al menos una materia';
    formData.detalles.forEach((d, i) => {
      if (!d.horasSemanales || isNaN(parseInt(d.horasSemanales))) {
        e[`horas_${i}`] = 'Ingresa las horas';
      }
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ─── Guardar ────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        nombre: formData.nombre,
        grado: { id: formData.grado.id },
        periodoAcademico: { id: formData.periodoAcademico.id },
        detalles: formData.detalles.filter(d => d.materia?.id).map(d => ({
          materia: { id: d.materia.id },
          horasSemanales: parseInt(d.horasSemanales),
        })),
      };

      if (editingPlan) {
        await planEstudioService.actualizar(editingPlan.id, payload);
      } else {
        await planEstudioService.crear(payload);
      }
      closeModal();
      await loadAll();
    } catch (error) {
      console.error('Error guardando plan:', error);
      Alert.alert('Error', 'No se pudo guardar el plan de estudio.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Desactivar ─────────────────────────────────────────────────────────────
  const handleDesactivar = (plan) => {
    Alert.alert(
      'Desactivar plan',
      `¿Deseas desactivar "${plan.nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desactivar',
          style: 'destructive',
          onPress: async () => {
            try {
              await planEstudioService.desactivar(plan.id);
              await loadAll();
            } catch (error) {
              Alert.alert('Error', 'No se pudo desactivar el plan.');
            }
          },
        },
      ]
    );
  };

  // ─── Todos los grados aplanados de todos los niveles ─────────────────────────
  const gradosFlat = niveles.flatMap(n =>
    (n.grados || []).map(g => ({ ...g, nivelNombre: n.nombre }))
  );

  // ─── Render card plan ────────────────────────────────────────────────────────
  const renderPlanCard = (plan) => (
    <Card key={plan.id} style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardIconContainer}>
          <Ionicons name="document-text" size={22} color={colors.primary[600]} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardNombre}>{plan.nombre}</Text>
          <Text style={styles.cardMeta}>
            {plan.grado?.nombre} · {plan.periodoAcademico?.nombre}
          </Text>
          <View style={[styles.activoBadge, !plan.activo && styles.inactivoBadge]}>
            <Text style={[styles.activoText, !plan.activo && styles.inactivoText]}>
              {plan.activo ? 'Activo' : 'Inactivo'}
            </Text>
          </View>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.iconButton} onPress={() => openModal(plan)}>
            <Ionicons name="pencil" size={18} color={colors.primary[600]} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => handleDesactivar(plan)}>
            <Ionicons name="eye-off" size={18} color={colors.red[500]} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Detalles */}
      {plan.detalles && plan.detalles.length > 0 && (
        <View style={styles.detallesContainer}>
          <Text style={styles.detallesTitle}>Materias asignadas</Text>
          {plan.detalles.map((d, i) => (
            <View
              key={d.id || i}
              style={[styles.detalleRow, i < plan.detalles.length - 1 && styles.detalleBorder]}
            >
              <Ionicons name="book-outline" size={14} color={colors.gray[500]} />
              <Text style={styles.detalleMateria}>{d.materia?.nombre}</Text>
              <View style={styles.horasBadge}>
                <Text style={styles.horasText}>{d.horasSemanales}h/sem</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </Card>
  );

  // ─── Modal selector de materia ───────────────────────────────────────────────
  const renderMateriaModal = () => {
    const materiasDisponibles = materias.filter(
      m => !formData.detalles.some(d => d.materia?.id === m.id)
    );
    return (
      <Modal
        visible={materiaModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMateriaModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '70%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Materia</Text>
              <TouchableOpacity onPress={() => setMateriaModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.gray[600]} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {materiasDisponibles.length === 0 ? (
                <Text style={styles.sinMateriasText}>
                  Todas las materias ya están agregadas
                </Text>
              ) : (
                materiasDisponibles.map(m => (
                  <TouchableOpacity
                    key={m.id}
                    style={styles.materiaOpcion}
                    onPress={() => addMateria(m)}
                  >
                    <Ionicons name="book-outline" size={18} color={colors.primary[600]} />
                    <Text style={styles.materiaOpcionText}>{m.nombre}</Text>
                    <Ionicons name="add-circle-outline" size={20} color={colors.primary[600]} />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  // ─── Modal principal ─────────────────────────────────────────────────────────
  const renderModal = () => (
    <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeModal}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { maxHeight: '92%' }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingPlan ? 'Editar Plan de Estudio' : 'Nuevo Plan de Estudio'}
            </Text>
            <TouchableOpacity onPress={closeModal}>
              <Ionicons name="close" size={24} color={colors.gray[600]} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            {/* Nombre */}
            <Input
              label="Nombre del plan *"
              placeholder="Ej: Plan Primaria 2025"
              value={formData.nombre}
              onChangeText={(t) => setFormData(f => ({ ...f, nombre: t }))}
              error={errors.nombre}
            />

            {/* Selector de Período */}
            <Text style={styles.fieldLabel}>Período Académico *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {periodos.map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.chip, formData.periodoAcademico?.id === p.id && styles.chipSelected]}
                  onPress={() => selectPeriodo(p)}
                >
                  <Text style={[styles.chipText, formData.periodoAcademico?.id === p.id && styles.chipTextSelected]}>
                    {p.nombre}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {errors.periodoAcademico && <Text style={styles.errorText}>{errors.periodoAcademico}</Text>}

            {/* Selector de Grado */}
            <Text style={styles.fieldLabel}>Grado *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {gradosFlat.map(g => (
                <TouchableOpacity
                  key={g.id}
                  style={[styles.chip, formData.grado?.id === g.id && styles.chipSelected]}
                  onPress={() => selectGrado(g)}
                >
                  <Text style={[styles.chipText, formData.grado?.id === g.id && styles.chipTextSelected]}>
                    {g.nombre}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {errors.grado && <Text style={styles.errorText}>{errors.grado}</Text>}

            {/* Materias y horas */}
            <View style={styles.materiasHeader}>
              <Text style={styles.fieldLabel}>Materias y Carga Horaria *</Text>
              <TouchableOpacity
                style={styles.addMateriaBtn}
                onPress={() => setMateriaModalVisible(true)}
              >
                <Ionicons name="add-circle-outline" size={20} color={colors.primary[600]} />
                <Text style={styles.addMateriaBtnText}>Agregar</Text>
              </TouchableOpacity>
            </View>

            {errors.detalles && <Text style={styles.errorText}>{errors.detalles}</Text>}

            {formData.detalles.length === 0 ? (
              <View style={styles.sinDetalles}>
                <Ionicons name="book-outline" size={32} color={colors.gray[300]} />
                <Text style={styles.sinDetallesText}>Sin materias asignadas</Text>
              </View>
            ) : (
              <View style={styles.detallesEdit}>
                {formData.detalles.map((d, index) => (
                  <View key={index} style={styles.detalleEditRow}>
                    <Text style={styles.detalleMateriaEdit} numberOfLines={1}>
                      {d.materia?.nombre || 'Materia no disponible'}
                    </Text>
                    <TextInput
                      style={[
                        styles.horasInput,
                        errors[`horas_${index}`] && styles.horasInputError,
                      ]}
                      placeholder="Hrs"
                      value={d.horasSemanales}
                      onChangeText={(t) => updateHoras(index, t)}
                      keyboardType="numeric"
                      maxLength={2}
                    />
                    <Text style={styles.horasLabel}>h/sem</Text>
                    <TouchableOpacity onPress={() => removeDetalle(index)}>
                      <Ionicons name="close-circle" size={22} color={colors.red[400]} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <View style={{ height: spacing.md }} />
          </ScrollView>

          <View style={styles.modalFooter}>
            <Button title="Cancelar" onPress={closeModal} variant="outline" style={{ flex: 1 }} />
            <Button
              title={saving ? 'Guardando...' : 'Guardar'}
              onPress={handleSave}
              disabled={saving}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading && planes.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={styles.loadingText}>Cargando planes de estudio...</Text>
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
          <Text style={styles.headerText}>Planes de Estudio</Text>
          <Text style={styles.headerSubtext}>{planes.length} planes registrados</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={colors.primary[600]} />
          <Text style={styles.infoText}>
            Define las materias y su carga horaria semanal para cada grado y período académico.
          </Text>
        </View>

        {planes.length === 0 ? (
          <EmptyState
            icon="document-text-outline"
            title="No hay planes de estudio"
            message="Crea el primer plan para asignar materias a los grados"
          />
        ) : (
          <View style={styles.list}>{planes.map(renderPlanCard)}</View>
        )}

        <View style={{ height: spacing.xl }} />
      </ScrollView>

      {renderModal()}
      {renderMateriaModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.gray[50] },
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
  headerSubtext: { fontSize: fontSize.sm, color: colors.gray[600], marginTop: spacing.xs },
  addButton: {
    width: 40, height: 40,
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.full,
    justifyContent: 'center', alignItems: 'center',
  },
  content: { flex: 1 },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primary[50],
    padding: spacing.md,
    margin: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  infoText: { flex: 1, fontSize: fontSize.sm, color: colors.primary[700], lineHeight: 20 },
  list: { paddingHorizontal: spacing.lg },
  card: { marginBottom: spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  cardIconContainer: {
    width: 44, height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[50],
    justifyContent: 'center', alignItems: 'center',
  },
  cardInfo: { flex: 1 },
  cardNombre: { fontSize: fontSize.base, fontWeight: '600', color: colors.gray[900] },
  cardMeta: { fontSize: fontSize.sm, color: colors.gray[500], marginTop: 2 },
  activoBadge: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    backgroundColor: '#dcfce7',
  },
  inactivoBadge: { backgroundColor: colors.gray[100] },
  activoText: { fontSize: fontSize.xs, fontWeight: '600', color: '#16a34a' },
  inactivoText: { color: colors.gray[500] },
  cardActions: { flexDirection: 'row', gap: spacing.xs },
  iconButton: {
    width: 34, height: 34,
    justifyContent: 'center', alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[100],
  },
  detallesContainer: {
    marginTop: spacing.md,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  detallesTitle: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.gray[500],
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detalleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
    gap: spacing.sm,
  },
  detalleBorder: { borderBottomWidth: 1, borderBottomColor: colors.gray[200] },
  detalleMateria: { flex: 1, fontSize: fontSize.sm, color: colors.gray[700] },
  horasBadge: {
    backgroundColor: colors.primary[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  horasText: { fontSize: fontSize.xs, fontWeight: '600', color: colors.primary[700] },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    width: '100%',
    maxWidth: 560,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  modalTitle: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.gray[900] },
  modalBody: { padding: spacing.lg },
  modalFooter: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  chipScroll: { marginBottom: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.gray[300],
    backgroundColor: colors.white,
    marginRight: spacing.sm,
  },
  chipSelected: { backgroundColor: colors.primary[600], borderColor: colors.primary[600] },
  chipText: { fontSize: fontSize.sm, color: colors.gray[700], fontWeight: '500' },
  chipTextSelected: { color: colors.white },
  errorText: { fontSize: fontSize.xs, color: colors.red[500], marginBottom: spacing.sm },
  materiasHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  addMateriaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  addMateriaBtnText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.primary[600] },
  sinDetalles: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  sinDetallesText: { fontSize: fontSize.sm, color: colors.gray[400] },
  detallesEdit: {
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  detalleEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    gap: spacing.sm,
  },
  detalleMateriaEdit: { flex: 1, fontSize: fontSize.sm, color: colors.gray[800] },
  horasInput: {
    width: 44,
    height: 36,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.sm,
    textAlign: 'center',
    fontSize: fontSize.sm,
    color: colors.gray[900],
    backgroundColor: colors.white,
  },
  horasInputError: { borderColor: colors.red[500] },
  horasLabel: { fontSize: fontSize.xs, color: colors.gray[500] },
  // Selector de materia
  materiaOpcion: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    gap: spacing.md,
  },
  materiaOpcionText: { flex: 1, fontSize: fontSize.base, color: colors.gray[800] },
  sinMateriasText: {
    textAlign: 'center',
    padding: spacing.xl,
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
});

export default PlanesEstudioScreen;