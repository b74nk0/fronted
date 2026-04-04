import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import EmptyState from '../../../components/common/EmptyState';
import ConfirmModal from '../../../components/common/ConfirmModal';
import { colors, spacing, fontSize, borderRadius } from '../../../constants/theme';
import { planEstudioService } from '../../../services/planEstudioService';
import { nivelService } from '../../../services/nivelService';
import { materiaService } from '../../../services/materiaService';

const PlanCard = ({ plan, onEdit, onDelete }) => (
  <Card style={styles.card}>
    <View style={styles.cardHeader}>
      <View style={styles.cardHeaderLeft}>
        <View style={styles.cardIcon}>
          <Ionicons name="document-text-outline" size={20} color={colors.primary[600]} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardNombre}>{plan.nombre}</Text>
          <Text style={styles.cardSub}>
            {plan.nivelNombre ? `${plan.nivelNombre} · ` : ''}{plan.gradoNombre}
          </Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => onEdit(plan)}>
          <Ionicons name="pencil-outline" size={17} color={colors.primary[600]} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={() => onDelete(plan)}>
          <Ionicons name="trash-outline" size={17} color={colors.red[500]} />
        </TouchableOpacity>
      </View>
    </View>
    {plan.detalles?.length > 0 ? (
      <View style={styles.materiasWrap}>
        {plan.detalles.map((d, i) => (
          <View key={d.id ?? i} style={styles.materiaChip}>
            <Text style={styles.materiaChipText}>{d.materiaNombre}</Text>
            {d.horasSemanales ? (
              <Text style={styles.materiaChipHoras}> · {d.horasSemanales}h</Text>
            ) : null}
          </View>
        ))}
      </View>
    ) : (
      <Text style={styles.sinMaterias}>Sin materias asignadas</Text>
    )}
  </Card>
);

const PlanesEstudioScreen = () => {
  const navigation = useNavigation();

  const [planes,   setPlanes]   = useState([]);
  const [niveles,  setNiveles]  = useState([]);
  const [materias, setMaterias] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [busqueda, setBusqueda] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [editando,     setEditando]     = useState(null);
  const [saving,       setSaving]       = useState(false);
  const [errors,       setErrors]       = useState({});

  const [formNombre,            setFormNombre]            = useState('');
  const [nivelSel,              setNivelSel]              = useState(null);
  const [gradoSel,              setGradoSel]              = useState(null);
  const [materiasSeleccionadas, setMateriasSeleccionadas] = useState([]);

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [planAEliminar,  setPlanAEliminar]  = useState(null);
  const [eliminando,     setEliminando]     = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [planesData, nivelesData, materiasData] = await Promise.all([
        planEstudioService.listar(),
        nivelService.listar(),
        materiaService.listar(),
      ]);
      setPlanes(planesData);
      setNiveles(nivelesData);
      setMaterias(materiasData.filter(m => m.activo !== false));
    } catch (e) {
      console.error('Error:', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const filtrados = planes.filter(p => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return p.nombre?.toLowerCase().includes(q) ||
      p.gradoNombre?.toLowerCase().includes(q) ||
      p.nivelNombre?.toLowerCase().includes(q);
  });

  const gradosDelNivel = nivelSel
    ? (niveles.find(n => n.id === nivelSel)?.grados || [])
    : [];

  const gradosConPlan = new Set(planes.map(p => p.gradoId));

  const openCrear = () => {
    setEditando(null);
    setFormNombre('');
    setNivelSel(null);
    setGradoSel(null);
    setMateriasSeleccionadas([]);
    setErrors({});
    setModalVisible(true);
  };

  const openEditar = (plan) => {
    setEditando(plan);
    setFormNombre(plan.nombre);
    let nivelId = null;
    for (const n of niveles) {
      if (n.grados?.find(g => g.id === plan.gradoId)) { nivelId = n.id; break; }
    }
    setNivelSel(nivelId);
    setGradoSel(plan.gradoId);
    setMateriasSeleccionadas(
      (plan.detalles || []).map(d => ({
        materiaId: d.materiaId,
        horas: d.horasSemanales ? String(d.horasSemanales) : '',
      }))
    );
    setErrors({});
    setModalVisible(true);
  };

  const toggleMateria = (materiaId) => {
    setMateriasSeleccionadas(prev => {
      if (prev.find(m => m.materiaId === materiaId))
        return prev.filter(m => m.materiaId !== materiaId);
      return [...prev, { materiaId, horas: '' }];
    });
  };

  const updateHoras = (materiaId, horas) => {
    setMateriasSeleccionadas(prev =>
      prev.map(m => m.materiaId === materiaId ? { ...m, horas } : m)
    );
  };

  const validate = () => {
    const e = {};
    if (!formNombre.trim()) e.nombre = 'Requerido';
    if (!gradoSel)           e.grado = 'Selecciona un grado';
    if (materiasSeleccionadas.length === 0) e.materias = 'Agrega al menos una materia';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        nombre: formNombre,
        gradoId: gradoSel,
        activo: true,
        detalles: materiasSeleccionadas.map(m => ({
          materiaId: m.materiaId,
          horasSemanales: m.horas ? parseInt(m.horas) : null,
        })),
      };
      if (editando) await planEstudioService.actualizar(editando.id, payload);
      else          await planEstudioService.crear(payload);
      setModalVisible(false);
      await loadData();
    } catch (e) {
      console.error('Error guardando:', e);
    } finally {
      setSaving(false);
    }
  };

  const confirmarEliminar = async () => {
    if (!planAEliminar) return;
    setEliminando(true);
    try {
      await planEstudioService.eliminar(planAEliminar.id);
      setConfirmVisible(false);
      setPlanAEliminar(null);
      await loadData();
    } catch (e) {
      console.error('Error eliminando:', e);
    } finally {
      setEliminando(false);
    }
  };

  const renderModal = () => (
    <Modal visible={modalVisible} transparent animationType="fade"
      onRequestClose={() => setModalVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editando ? 'Editar Plan' : 'Nuevo Plan de Estudio'}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.gray[600]} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Input label="Nombre del plan *" value={formNombre}
              onChangeText={setFormNombre} error={errors.nombre}
              placeholder="Ej: Plan Quinto Grado" />

            {/* Solo al crear se elige grado */}
            {!editando && (
              <>
                <Text style={styles.fieldLabel}>Nivel educativo *</Text>
                <View style={styles.chipGroup}>
                  {niveles.map(n => (
                    <TouchableOpacity key={n.id}
                      style={[styles.chip, nivelSel === n.id && styles.chipSelected]}
                      onPress={() => { setNivelSel(n.id); setGradoSel(null); }}>
                      <Text style={[styles.chipText, nivelSel === n.id && styles.chipTextSel]}>
                        {n.nombre}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {nivelSel && (
                  <>
                    <Text style={styles.fieldLabel}>Grado *</Text>
                    <View style={styles.chipGroup}>
                      {gradosDelNivel.map(g => {
                        const ocupado = gradosConPlan.has(g.id);
                        return (
                          <TouchableOpacity key={g.id}
                            style={[styles.chip,
                              gradoSel === g.id && styles.chipSelected,
                              ocupado && styles.chipDisabled,
                            ]}
                            onPress={() => !ocupado && setGradoSel(g.id)}>
                            <Text style={[styles.chipText,
                              gradoSel === g.id && styles.chipTextSel,
                              ocupado && styles.chipTextDisabled,
                            ]}>
                              {g.nombre}{ocupado ? ' ✓' : ''}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    {errors.grado && <Text style={styles.errorText}>{errors.grado}</Text>}
                  </>
                )}
              </>
            )}

            {editando && (
              <View style={styles.infoRow}>
                <Ionicons name="information-circle-outline" size={15} color={colors.primary[600]} />
                <Text style={styles.infoText}>
                  Grado: {editando.gradoNombre} — no se puede cambiar al editar
                </Text>
              </View>
            )}

            <Text style={styles.fieldLabel}>Materias *</Text>
            <Text style={styles.fieldHint}>Selecciona materias y define las horas semanales</Text>
            {errors.materias && <Text style={styles.errorText}>{errors.materias}</Text>}

            {materias.map(m => {
              const sel = materiasSeleccionadas.find(s => s.materiaId === m.id);
              return (
                <View key={m.id} style={[styles.materiaRow, sel && styles.materiaRowSel]}>
                  <TouchableOpacity style={styles.materiaCheck} onPress={() => toggleMateria(m.id)}>
                    <View style={[styles.checkbox, sel && styles.checkboxChecked]}>
                      {sel && <Ionicons name="checkmark" size={13} color={colors.white} />}
                    </View>
                    <Text style={[styles.materiaNombreText, sel && { color: colors.primary[700], fontWeight: '600' }]}>
                      {m.nombre}
                    </Text>
                  </TouchableOpacity>
                  {sel && (
                    <View style={styles.horasWrap}>
                      <TextInput style={styles.horasInput}
                        value={sel.horas} onChangeText={t => updateHoras(m.id, t)}
                        keyboardType="numeric" placeholder="Hrs" maxLength={2} />
                      <Text style={styles.horasLabel}>h/sem</Text>
                    </View>
                  )}
                </View>
              );
            })}
            <View style={{ height: spacing.md }} />
          </ScrollView>
          <View style={styles.modalFooter}>
            <Button title="Cancelar" onPress={() => setModalVisible(false)}
              variant="outline" style={{ flex: 1 }} />
            <Button title={saving ? 'Guardando...' : (editando ? 'Actualizar' : 'Crear')}
              onPress={handleSave} disabled={saving} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) return (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color={colors.primary[600]} />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('GestionAcademica')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[700]} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.headerText}>Planes de Estudio</Text>
          <Text style={styles.headerSub}>Un plan por grado · {planes.length} configurados</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openCrear}>
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color={colors.gray[400]} />
        <TextInput style={styles.searchInput} placeholder="Buscar plan o grado..."
          placeholderTextColor={colors.gray[400]} value={busqueda} onChangeText={setBusqueda} />
        {busqueda.length > 0 && (
          <TouchableOpacity onPress={() => setBusqueda('')}>
            <Ionicons name="close-circle" size={18} color={colors.gray[400]} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {filtrados.length === 0 ? (
          <EmptyState icon="document-text-outline" title="Sin planes de estudio"
            message="Crea el plan de materias para cada grado" />
        ) : (
          <View style={styles.list}>
            {filtrados.map(p => (
              <PlanCard key={p.id} plan={p}
                onEdit={openEditar}
                onDelete={p => { setPlanAEliminar(p); setConfirmVisible(true); }} />
            ))}
          </View>
        )}
        <View style={{ height: spacing.xl }} />
      </ScrollView>

      {renderModal()}
      <ConfirmModal
        visible={confirmVisible}
        title="Eliminar plan"
        message={`¿Eliminar el plan "${planAEliminar?.nombre}"?`}
        confirmText="Eliminar" confirmColor="danger"
        loading={eliminando}
        onConfirm={confirmarEliminar}
        onCancel={() => { setConfirmVisible(false); setPlanAEliminar(null); }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: colors.gray[50] },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center',
    padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.gray[200],
  },
  backBtn: { marginRight: spacing.md },
  headerTitle: { flex: 1 },
  headerText:  { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.gray[900] },
  headerSub:   { fontSize: fontSize.xs, color: colors.gray[500], marginTop: 2 },
  addBtn: {
    width: 40, height: 40, backgroundColor: colors.primary[600],
    borderRadius: borderRadius.full, justifyContent: 'center', alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white,
    marginHorizontal: spacing.lg, marginVertical: spacing.md,
    paddingHorizontal: spacing.md, borderRadius: borderRadius.lg,
    borderWidth: 1, borderColor: colors.gray[200], gap: spacing.sm, height: 44,
  },
  searchInput: { flex: 1, fontSize: fontSize.base, color: colors.gray[900] },
  content: { flex: 1 },
  list:    { padding: spacing.lg },
  card:    { marginBottom: spacing.md },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: spacing.sm,
  },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  cardIcon: {
    width: 44, height: 44, borderRadius: borderRadius.md,
    backgroundColor: colors.primary[50], justifyContent: 'center', alignItems: 'center',
  },
  cardNombre: { fontSize: fontSize.base, fontWeight: '700', color: colors.gray[900] },
  cardSub:    { fontSize: fontSize.xs, color: colors.gray[500], marginTop: 2 },
  cardActions: { flexDirection: 'row', gap: spacing.xs },
  iconBtn:     { padding: 6 },
  materiasWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  materiaChip: {
    flexDirection: 'row', backgroundColor: colors.primary[50],
    paddingHorizontal: spacing.sm, paddingVertical: 3,
    borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.primary[100],
  },
  materiaChipText:  { fontSize: 11, color: colors.primary[700], fontWeight: '500' },
  materiaChipHoras: { fontSize: 10, color: colors.primary[400] },
  sinMaterias: { fontSize: fontSize.xs, color: colors.gray[300], fontStyle: 'italic', marginTop: spacing.xs },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.white, borderRadius: borderRadius.xl,
    width: '100%', maxWidth: 560, maxHeight: '92%',
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
  fieldLabel: { fontSize: fontSize.sm, fontWeight: '600', color: colors.gray[700], marginBottom: spacing.xs },
  fieldHint:  { fontSize: fontSize.xs, color: colors.gray[400], marginBottom: spacing.sm },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.primary[50], padding: spacing.sm,
    borderRadius: borderRadius.md, marginBottom: spacing.md,
  },
  infoText: { fontSize: fontSize.xs, color: colors.primary[700] },
  chipGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full, borderWidth: 1,
    borderColor: colors.gray[300], backgroundColor: colors.white,
  },
  chipSelected:     { backgroundColor: colors.primary[600], borderColor: colors.primary[600] },
  chipDisabled:     { backgroundColor: colors.gray[50], borderColor: colors.gray[100] },
  chipText:         { fontSize: fontSize.sm, color: colors.gray[700], fontWeight: '500' },
  chipTextSel:      { color: colors.white },
  chipTextDisabled: { color: colors.gray[300] },
  errorText: { fontSize: fontSize.xs, color: colors.red[500], marginBottom: spacing.sm },
  materiaRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: spacing.sm, paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md, marginBottom: spacing.xs,
    borderWidth: 1, borderColor: colors.gray[100],
  },
  materiaRowSel:    { borderColor: colors.primary[200], backgroundColor: colors.primary[50] },
  materiaCheck:     { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  checkbox: {
    width: 22, height: 22, borderRadius: borderRadius.sm,
    borderWidth: 2, borderColor: colors.gray[300],
    justifyContent: 'center', alignItems: 'center',
  },
  checkboxChecked:   { backgroundColor: colors.primary[600], borderColor: colors.primary[600] },
  materiaNombreText: { fontSize: fontSize.sm, color: colors.gray[700] },
  horasWrap:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  horasInput: {
    width: 46, height: 32, borderWidth: 1, borderColor: colors.primary[300],
    borderRadius: borderRadius.md, textAlign: 'center',
    fontSize: fontSize.sm, color: colors.gray[900], backgroundColor: colors.white,
  },
  horasLabel: { fontSize: fontSize.xs, color: colors.gray[500] },
});

export default PlanesEstudioScreen;