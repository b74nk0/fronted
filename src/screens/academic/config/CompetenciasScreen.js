import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import EmptyState from '../../../components/common/EmptyState';
import ConfirmModal from '../../../components/common/ConfirmModal';
import { colors, spacing, fontSize, borderRadius } from '../../../constants/theme';
import { competenciaService } from '../../../services/competenciaService';
import { materiaService } from '../../../services/materiaService';
import { nivelService } from '../../../services/nivelService';
import { planEstudioService } from '../../../services/planEstudioService';

const FORM_INITIAL = {
  nombre: '', descripcion: '', porcentaje: '',
  materia: null, grado: null,
};

// ─── Dropdown selector reutilizable (inline, sin posición absoluta) ───────────
const DropdownSelector = ({ label, placeholder, value, options, onSelect, error, disabled }) => {
  const [open, setOpen] = useState(false);
  return (
    <View style={ddStyles.container}>
      {label && <Text style={ddStyles.label}>{label}</Text>}
      <TouchableOpacity
        style={[ddStyles.trigger,
          open && ddStyles.triggerOpen,
          error && ddStyles.triggerError,
          disabled && ddStyles.triggerDisabled]}
        onPress={() => !disabled && setOpen(!open)}
        activeOpacity={disabled ? 1 : 0.7}
      >
        <Text style={[ddStyles.triggerText, !value && ddStyles.placeholder]}>
          {value ? value.nombre : placeholder}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18}
          color={disabled ? colors.gray[300] : colors.gray[500]} />
      </TouchableOpacity>
      {error && <Text style={ddStyles.errorText}>{error}</Text>}
      {/* Lista inline — empuja el contenido hacia abajo, no flota encima */}
      {open && (
        <View style={ddStyles.dropdown}>
          {options.length === 0 ? (
            <Text style={ddStyles.emptyText}>Sin opciones disponibles</Text>
          ) : (
            options.map(opt => (
              <TouchableOpacity key={opt.id}
                style={[ddStyles.option, value?.id === opt.id && ddStyles.optionSelected]}
                onPress={() => { onSelect(opt); setOpen(false); }}>
                <Text style={[ddStyles.optionText, value?.id === opt.id && ddStyles.optionTextSelected]}>
                  {opt.nombre}{opt.nivelNombre ? ` (${opt.nivelNombre})` : ''}
                </Text>
                {value?.id === opt.id && (
                  <Ionicons name="checkmark" size={16} color={colors.primary[600]} />
                )}
              </TouchableOpacity>
            ))
          )}
        </View>
      )}
    </View>
  );
};

const ddStyles = StyleSheet.create({
  container:       { marginBottom: spacing.md },
  label:           { fontSize: fontSize.sm, fontWeight: '600', color: colors.gray[700], marginBottom: spacing.xs },
  trigger: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: colors.gray[300], borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2,
    backgroundColor: colors.white, minHeight: 44,
  },
  triggerOpen:     { borderColor: colors.primary[400], borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  triggerError:    { borderColor: colors.red[500] },
  triggerDisabled: { backgroundColor: colors.gray[50], borderColor: colors.gray[100] },
  triggerText:     { fontSize: fontSize.base, color: colors.gray[900], flex: 1 },
  placeholder:     { color: colors.gray[400] },
  errorText:       { fontSize: fontSize.xs, color: colors.red[500], marginTop: spacing.xs },
  dropdown: {
    borderWidth: 1, borderTopWidth: 0, borderColor: colors.primary[200],
    borderBottomLeftRadius: borderRadius.md, borderBottomRightRadius: borderRadius.md,
    backgroundColor: colors.white, marginBottom: spacing.xs,
    maxHeight: 220, overflow: 'hidden',
  },
  option: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1, borderBottomColor: colors.gray[50],
  },
  optionSelected:     { backgroundColor: colors.primary[50] },
  optionText:         { fontSize: fontSize.sm, color: colors.gray[800] },
  optionTextSelected: { color: colors.primary[700], fontWeight: '600' },
  emptyText:          { padding: spacing.md, color: colors.gray[400], fontSize: fontSize.sm, textAlign: 'center' },
});

// ─── Screen ───────────────────────────────────────────────────────────────────
const CompetenciasScreen = () => {
  const navigation = useNavigation();

  const [competencias,    setCompetencias]    = useState([]);
  const [materias,        setMaterias]        = useState([]);
  const [niveles,         setNiveles]         = useState([]);
  const [materiasGrado,   setMateriasGrado]   = useState([]); // materias filtradas por grado
  const [loading,         setLoading]         = useState(false);
  const [refreshing,      setRefreshing]      = useState(false);
  const [saving,          setSaving]          = useState(false);
  const [loadingMaterias, setLoadingMaterias] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingComp,  setEditingComp]  = useState(null);
  const [formData,     setFormData]     = useState(FORM_INITIAL);
  const [errors,       setErrors]       = useState({});
  const [filtroMateria, setFiltroMateria] = useState(null);

  // Confirm desactivar
  const [confirmVisible,  setConfirmVisible]  = useState(false);
  const [compADesactivar, setCompADesactivar] = useState(null);
  const [desactivando,    setDesactivando]    = useState(false);

  // ─── Cargar ──────────────────────────────────────────────────────────────────
  const loadAll = async () => {
    setLoading(true);
    try {
      const [compData, matData, nivData] = await Promise.all([
        competenciaService.listar(),
        materiaService.listar(),
        nivelService.listar(),
      ]);
      setCompetencias(compData);
      setMaterias(matData);
      setNiveles(nivData);
    } catch (error) {
      console.error('Error cargando competencias:', error);
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

  // ─── Al seleccionar grado: cargar materias del plan ───────────────────────────
  const handleGradoSelect = async (grado) => {
    setFormData(f => ({ ...f, grado, materia: null }));
    setMateriasGrado([]);
    if (!grado) return;
    setLoadingMaterias(true);
    try {
      const plan = await planEstudioService.obtenerPorGrado(grado.id);
      if (plan && plan.detalles?.length > 0) {
        setMateriasGrado(plan.detalles.map(d => d.materia || { id: d.materiaId, nombre: d.materiaNombre }));
      } else {
        // Si no hay plan, mostrar todas las materias
        setMateriasGrado(materias);
      }
    } catch {
      setMateriasGrado(materias);
    } finally {
      setLoadingMaterias(false);
    }
  };

  // ─── Grados aplanados ────────────────────────────────────────────────────────
  const gradosFlat = niveles.flatMap(n =>
    (n.grados || []).map(g => ({ ...g, nivelNombre: n.nombre }))
  );

  // ─── Agrupadas por materia ───────────────────────────────────────────────────
  const competenciasFiltradas = filtroMateria
    ? competencias.filter(c => c.materia?.id === filtroMateria.id)
    : competencias;

  const agrupadasPorMateria = competenciasFiltradas.reduce((acc, c) => {
    const key   = c.materia?.id || 'sin-materia';
    const label = c.materia?.nombre || 'Sin materia';
    if (!acc[key]) acc[key] = { label, items: [] };
    acc[key].items.push(c);
    return acc;
  }, {});

  // ─── Modal ────────────────────────────────────────────────────────────────────
  const openModal = async (comp = null) => {
    setEditingComp(comp);
    setErrors({});
    setMateriasGrado([]);
    if (comp) {
      setFormData({
        nombre:      comp.nombre       || '',
        descripcion: comp.descripcion  || '',
        porcentaje:  comp.porcentaje?.toString() || '',
        materia:     comp.materia      || null,
        grado:       comp.grado        || null,
      });
      // Cargar materias del grado al editar
      if (comp.grado?.id) {
        setLoadingMaterias(true);
        try {
          const plan = await planEstudioService.obtenerPorGrado(comp.grado.id);
          if (plan?.detalles?.length > 0) {
            setMateriasGrado(plan.detalles.map(d => d.materia || { id: d.materiaId, nombre: d.materiaNombre }));
          } else {
            setMateriasGrado(materias);
          }
        } catch {
          setMateriasGrado(materias);
        } finally {
          setLoadingMaterias(false);
        }
      }
    } else {
      setFormData(FORM_INITIAL);
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingComp(null);
    setFormData(FORM_INITIAL);
    setMateriasGrado([]);
    setErrors({});
  };

  // ─── Validar ─────────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!formData.nombre.trim()) e.nombre = 'Requerido';
    if (!formData.grado)         e.grado   = 'Selecciona un grado';
    if (!formData.materia)       e.materia = 'Selecciona una materia';
    if (!formData.porcentaje) {
      e.porcentaje = 'Requerido';
    } else {
      const val = parseFloat(formData.porcentaje);
      if (isNaN(val) || val <= 0 || val > 100) e.porcentaje = 'Debe ser entre 1 y 100';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ─── Guardar ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        nombre:      formData.nombre,
        descripcion: formData.descripcion,
        porcentaje:  parseFloat(formData.porcentaje),
        materia:     { id: formData.materia.id },
        grado:       { id: formData.grado.id },
      };
      if (editingComp) await competenciaService.actualizar(editingComp.id, payload);
      else             await competenciaService.crear(payload);
      closeModal();
      await loadAll();
    } catch (error) {
      console.error('Error guardando competencia:', error);
    } finally {
      setSaving(false);
    }
  };

  // ─── Desactivar ───────────────────────────────────────────────────────────────
  const confirmarDesactivar = async () => {
    if (!compADesactivar) return;
    setDesactivando(true);
    try {
      await competenciaService.desactivar(compADesactivar.id);
      setConfirmVisible(false);
      setCompADesactivar(null);
      await loadAll();
    } catch (error) {
      console.error('Error desactivando:', error);
    } finally {
      setDesactivando(false);
    }
  };

  // ─── Render grupo ─────────────────────────────────────────────────────────────
  const renderGrupo = (materiaId, grupo) => (
    <Card key={materiaId} style={styles.grupoCard}>
      <View style={styles.grupoHeader}>
        <View style={styles.grupoIconContainer}>
          <Ionicons name="book" size={18} color={colors.primary[600]} />
        </View>
        <Text style={styles.grupoTitle}>{grupo.label}</Text>
        <Text style={styles.grupoCount}>{grupo.items.length} competencias</Text>
      </View>
      {grupo.items.map((comp, index) => (
        <View key={comp.id}
          style={[styles.compRow, index < grupo.items.length - 1 && styles.compBorder]}>
          <View style={styles.compInfo}>
            <View style={styles.compTitleRow}>
              <Text style={styles.compNombre}>{comp.nombre}</Text>
              <View style={styles.porcentajeBadge}>
                <Text style={styles.porcentajeText}>{comp.porcentaje}%</Text>
              </View>
            </View>
            {comp.descripcion ? (
              <Text style={styles.compDesc} numberOfLines={2}>{comp.descripcion}</Text>
            ) : null}
            <Text style={styles.compGrado}>Grado: {comp.grado?.nombre || '—'}</Text>
          </View>
          <View style={styles.compActions}>
            <TouchableOpacity style={styles.iconButton} onPress={() => openModal(comp)}>
              <Ionicons name="pencil" size={16} color={colors.primary[600]} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}
              onPress={() => { setCompADesactivar(comp); setConfirmVisible(true); }}>
              <Ionicons name="eye-off" size={16} color={colors.red[500]} />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </Card>
  );

  // ─── Modal ────────────────────────────────────────────────────────────────────
  const renderModal = () => (
    <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeModal}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { maxHeight: '92%' }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingComp ? 'Editar Competencia' : 'Nueva Competencia'}
            </Text>
            <TouchableOpacity onPress={closeModal}>
              <Ionicons name="close" size={24} color={colors.gray[600]} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled"
            nestedScrollEnabled>
            <Input label="Nombre *" placeholder="Ej: Comprensión lectora"
              value={formData.nombre}
              onChangeText={t => setFormData(f => ({ ...f, nombre: t }))}
              error={errors.nombre} />

            <Input label="Descripción" placeholder="Descripción del logro o competencia"
              value={formData.descripcion}
              onChangeText={t => setFormData(f => ({ ...f, descripcion: t }))}
              multiline numberOfLines={3} />

            <Input label="Porcentaje (%) *" placeholder="Ej: 25"
              value={formData.porcentaje}
              onChangeText={t => setFormData(f => ({ ...f, porcentaje: t }))}
              keyboardType="numeric" error={errors.porcentaje} />

            {/* 1. Grado primero */}
            <DropdownSelector
              label="Grado *"
              placeholder="Selecciona el grado"
              value={formData.grado}
              options={gradosFlat}
              onSelect={handleGradoSelect}
              error={errors.grado}
            />

            {/* 2. Materia filtrada por grado */}
            {formData.grado && loadingMaterias ? (
              <View style={styles.loadingMaterias}>
                <ActivityIndicator size="small" color={colors.primary[600]} />
                <Text style={styles.loadingMateriasText}>Cargando materias del grado...</Text>
              </View>
            ) : (
              <DropdownSelector
                label="Materia *"
                placeholder={formData.grado ? 'Selecciona la materia' : 'Primero selecciona un grado'}
                value={formData.materia}
                options={materiasGrado}
                onSelect={m => setFormData(f => ({ ...f, materia: m }))}
                error={errors.materia}
                disabled={!formData.grado}
              />
            )}

            {formData.grado && materiasGrado.length === 0 && !loadingMaterias && (
              <View style={styles.sinPlanBanner}>
                <Ionicons name="alert-circle-outline" size={15} color="#854d0e" />
                <Text style={styles.sinPlanText}>
                  Este grado no tiene plan de estudio configurado. Se muestran todas las materias.
                </Text>
              </View>
            )}

            <View style={{ height: spacing.md }} />
          </ScrollView>

          <View style={styles.modalFooter}>
            <Button title="Cancelar" onPress={closeModal} variant="outline" style={{ flex: 1 }} />
            <Button title={saving ? 'Guardando...' : 'Guardar'}
              onPress={handleSave} disabled={saving} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading && competencias.length === 0) return (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color={colors.primary[600]} />
      <Text style={styles.loadingText}>Cargando competencias...</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[700]} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.headerText}>Competencias y Logros</Text>
          <Text style={styles.headerSubtext}>{competencias.length} competencias activas</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Filtro por materia */}
      {materias.length > 0 && (
        <View style={styles.filtroContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.filtroChip, !filtroMateria && styles.filtroChipActive]}
              onPress={() => setFiltroMateria(null)}>
              <Text style={[styles.filtroChipText, !filtroMateria && styles.filtroChipTextActive]}>
                Todas
              </Text>
            </TouchableOpacity>
            {materias.map(m => (
              <TouchableOpacity key={m.id}
                style={[styles.filtroChip, filtroMateria?.id === m.id && styles.filtroChipActive]}
                onPress={() => setFiltroMateria(filtroMateria?.id === m.id ? null : m)}>
                <Text style={[styles.filtroChipText, filtroMateria?.id === m.id && styles.filtroChipTextActive]}>
                  {m.nombre}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={colors.primary[600]} />
          <Text style={styles.infoText}>
            Define los criterios de evaluación por materia y grado. El porcentaje indica el peso de cada competencia en la nota final.
          </Text>
        </View>

        {Object.keys(agrupadasPorMateria).length === 0 ? (
          <EmptyState icon="ribbon-outline" title="No hay competencias"
            message="Crea las competencias que los docentes calificarán por materia y grado" />
        ) : (
          <View style={styles.list}>
            {Object.entries(agrupadasPorMateria).map(([id, grupo]) => renderGrupo(id, grupo))}
          </View>
        )}
        <View style={{ height: spacing.xl }} />
      </ScrollView>

      {renderModal()}

      <ConfirmModal
        visible={confirmVisible}
        title="Desactivar competencia"
        message={`¿Desactivar "${compADesactivar?.nombre}"?`}
        confirmText="Desactivar"
        confirmColor="danger"
        loading={desactivando}
        onConfirm={confirmarDesactivar}
        onCancel={() => { setConfirmVisible(false); setCompADesactivar(null); }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: colors.gray[50] },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText:     { marginTop: spacing.md, fontSize: fontSize.base, color: colors.gray[600] },

  header: {
    backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center',
    padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.gray[200],
  },
  backButton:    { marginRight: spacing.md },
  headerTitle:   { flex: 1 },
  headerText:    { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.gray[900] },
  headerSubtext: { fontSize: fontSize.sm, color: colors.gray[600], marginTop: spacing.xs },
  addButton: {
    width: 40, height: 40, backgroundColor: colors.primary[600],
    borderRadius: borderRadius.full, justifyContent: 'center', alignItems: 'center',
  },

  filtroContainer: {
    backgroundColor: colors.white, paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.gray[100],
  },
  filtroChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.gray[200],
    backgroundColor: colors.white, marginRight: spacing.sm,
  },
  filtroChipActive:     { backgroundColor: colors.primary[600], borderColor: colors.primary[600] },
  filtroChipText:       { fontSize: fontSize.sm, color: colors.gray[600], fontWeight: '500' },
  filtroChipTextActive: { color: colors.white },

  content: { flex: 1 },
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: colors.primary[50], padding: spacing.md,
    margin: spacing.lg, borderRadius: borderRadius.lg, gap: spacing.sm,
  },
  infoText: { flex: 1, fontSize: fontSize.sm, color: colors.primary[700], lineHeight: 20 },
  list:     { paddingHorizontal: spacing.lg },

  grupoCard:   { marginBottom: spacing.md },
  grupoHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginBottom: spacing.md, paddingBottom: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.gray[100],
  },
  grupoIconContainer: {
    width: 32, height: 32, borderRadius: borderRadius.md,
    backgroundColor: colors.primary[50], justifyContent: 'center', alignItems: 'center',
  },
  grupoTitle: { flex: 1, fontSize: fontSize.base, fontWeight: '700', color: colors.gray[900] },
  grupoCount: { fontSize: fontSize.xs, color: colors.gray[500] },

  compRow:    { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: spacing.md, gap: spacing.sm },
  compBorder: { borderBottomWidth: 1, borderBottomColor: colors.gray[100] },
  compInfo:   { flex: 1 },
  compTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 2 },
  compNombre: { flex: 1, fontSize: fontSize.sm, fontWeight: '600', color: colors.gray[800] },
  porcentajeBadge: {
    backgroundColor: colors.primary[100], paddingHorizontal: spacing.sm,
    paddingVertical: 2, borderRadius: borderRadius.sm,
  },
  porcentajeText: { fontSize: fontSize.xs, fontWeight: '700', color: colors.primary[700] },
  compDesc:  { fontSize: fontSize.xs, color: colors.gray[500], lineHeight: 16, marginBottom: 2 },
  compGrado: { fontSize: fontSize.xs, color: colors.gray[400] },
  compActions: { flexDirection: 'row', gap: spacing.xs },
  iconButton: {
    width: 30, height: 30, justifyContent: 'center', alignItems: 'center',
    borderRadius: borderRadius.sm, backgroundColor: colors.gray[100],
  },

  loadingMaterias: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.sm, marginBottom: spacing.md,
  },
  loadingMateriasText: { fontSize: fontSize.sm, color: colors.gray[500] },

  sinPlanBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: '#fef9c3', padding: spacing.sm,
    borderRadius: borderRadius.md, marginBottom: spacing.sm,
  },
  sinPlanText: { fontSize: fontSize.xs, color: '#854d0e', flex: 1 },

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
  modalTitle:  { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.gray[900] },
  modalBody:   { padding: spacing.lg },
  modalFooter: {
    flexDirection: 'row', gap: spacing.md,
    padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.gray[200],
  },
});

export default CompetenciasScreen;