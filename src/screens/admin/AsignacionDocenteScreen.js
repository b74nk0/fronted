import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import ConfirmModal from '../../components/common/ConfirmModal';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';
import { asignacionDocenteService } from '../../services/asignacionDocenteService';
import { planEstudioService } from '../../services/planEstudioService';
import { usuarioService } from '../../services/usuarioService';

// ─── Fila de materia ──────────────────────────────────────────────────────────
const MateriaRow = ({ detalle, asignacion, onAsignar, onRemover }) => {
  const tiene = !!asignacion;
  return (
    <View style={styles.materiaRow}>
      <View style={styles.materiaInfo}>
        <View style={[styles.materiaIcon, tiene && styles.materiaIconActivo]}>
          <Ionicons name="book-outline" size={17}
            color={tiene ? colors.primary[600] : colors.gray[300]} />
        </View>
        <View style={styles.materiaTextos}>
          <Text style={styles.materiaNombre}>{detalle.materiaNombre}</Text>
          {detalle.horasSemanales
            ? <Text style={styles.materiaHoras}>{detalle.horasSemanales} h/sem</Text>
            : null}
          {tiene ? (
            <View style={styles.docenteAsigRow}>
              <Ionicons name="person-circle-outline" size={13} color={colors.primary[600]} />
              <Text style={styles.docenteAsigNombre}>
                {asignacion.docenteNombre} {asignacion.docenteApellido}
              </Text>
            </View>
          ) : (
            <Text style={styles.sinDocente}>Sin docente asignado</Text>
          )}
        </View>
      </View>
      <View style={styles.materiaAcciones}>
        <TouchableOpacity style={[styles.asigBtn, tiene && styles.asigBtnActivo]}
          onPress={() => onAsignar(detalle, asignacion)}>
          <Ionicons
            name={tiene ? 'swap-horizontal-outline' : 'person-add-outline'}
            size={15} color={tiene ? colors.primary[600] : colors.gray[500]} />
          <Text style={[styles.asigBtnText, tiene && styles.asigBtnTextActivo]}>
            {tiene ? 'Cambiar' : 'Asignar'}
          </Text>
        </TouchableOpacity>
        {tiene && (
          <TouchableOpacity onPress={() => onRemover(asignacion)} style={{ padding: 4 }}>
            <Ionicons name="close-circle-outline" size={20} color={colors.red[400]} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────
const AsignacionDocenteScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { curso } = route.params || {};

  const [asignaciones, setAsignaciones] = useState([]);
  const [detallesPlan, setDetallesPlan] = useState([]);
  const [docentes,     setDocentes]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [sinPlan,      setSinPlan]      = useState(false);

  // Modal asignar
  const [modalVisible,    setModalVisible]    = useState(false);
  const [materiaActual,   setMateriaActual]   = useState(null);
  const [docenteSel,      setDocenteSel]      = useState(null);
  const [saving,          setSaving]          = useState(false);

  // Modal remover
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [asigARemover,   setAsigARemover]   = useState(null);
  const [removiendo,     setRemoviendo]     = useState(false);

  if (!curso) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.gray[300]} />
        <Text style={styles.errorMsg}>Selecciona un curso desde la lista.</Text>
      </View>
    );
  }

  const loadData = async () => {
    setLoading(true);
    setSinPlan(false);
    try {
      const [asigData, planData, usuariosData] = await Promise.all([
        asignacionDocenteService.listarPorCurso(curso.id),
        planEstudioService.obtenerPorGrado(curso.gradoId),
        usuarioService.listar(),
      ]);

      setAsignaciones(asigData);

      if (!planData || !planData.detalles?.length) {
        setSinPlan(true);
        setDetallesPlan([]);
      } else {
        setDetallesPlan(
          [...planData.detalles].sort((a, b) =>
            a.materiaNombre.localeCompare(b.materiaNombre))
        );
      }

      setDocentes(usuariosData.filter(u =>
        u.roles?.some(r => (typeof r === 'string' ? r : r.nombre)?.toLowerCase() === 'docente')
      ));
    } catch (e) {
      console.error('Error cargando asignaciones:', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, [curso.id]));

  const getAsignacion = (materiaId) =>
    asignaciones.find(a => a.materiaId === materiaId) || null;

  const openAsignar = (detalle, asignacionActual) => {
    setMateriaActual(detalle);
    setDocenteSel(asignacionActual?.docenteId || null);
    setModalVisible(true);
  };

  const handleAsignar = async () => {
    if (!docenteSel || !materiaActual) return;
    setSaving(true);
    try {
      await asignacionDocenteService.asignar({
        cursoId:   curso.id,
        materiaId: materiaActual.materiaId,
        docenteId: docenteSel,
      });
      setModalVisible(false);
      await loadData();
    } catch (e) {
      console.error('Error asignando:', e);
    } finally {
      setSaving(false);
    }
  };

  const confirmarRemover = async () => {
    if (!asigARemover) return;
    setRemoviendo(true);
    try {
      await asignacionDocenteService.eliminar(asigARemover.id);
      setConfirmVisible(false);
      setAsigARemover(null);
      await loadData();
    } catch (e) {
      console.error('Error removiendo:', e);
    } finally {
      setRemoviendo(false);
    }
  };

  const totalMaterias  = detallesPlan.length;
  const totalAsignadas = detallesPlan.filter(d => getAsignacion(d.materiaId)).length;
  const porcentaje     = totalMaterias > 0 ? Math.round((totalAsignadas / totalMaterias) * 100) : 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[700]} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.headerText}>{curso.nombre}</Text>
          <Text style={styles.headerSub}>
            {curso.nivelNombre ? `${curso.nivelNombre} · ` : ''}{curso.gradoNombre}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">

          {/* Resumen */}
          <Card style={styles.resumenCard}>
            <View style={styles.resumenRow}>
              {[
                { num: totalMaterias,  label: 'Materias',   color: colors.gray[900] },
                { num: totalAsignadas, label: 'Asignadas',  color: colors.primary[600] },
                { num: `${porcentaje}%`, label: 'Completado',
                  color: porcentaje === 100 ? '#16a34a' : porcentaje > 50 ? '#f59e0b' : colors.red[500] },
              ].map((s, i) => (
                <View key={i} style={styles.resumenItem}>
                  <Text style={[styles.resumenNum, { color: s.color }]}>{s.num}</Text>
                  <Text style={styles.resumenLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${porcentaje}%`,
                backgroundColor: porcentaje === 100 ? '#16a34a' : colors.primary[600] }]} />
            </View>
            {curso.directorGrupoNombre && (
              <View style={styles.directorBanner}>
                <Ionicons name="person-circle-outline" size={15} color={colors.primary[600]} />
                <Text style={styles.directorBannerText}>
                  Director de grupo: {curso.directorGrupoNombre}
                </Text>
              </View>
            )}
          </Card>

          {/* Materias */}
          <Card style={styles.materiasCard}>
            <View style={styles.materiasHeader}>
              <Ionicons name="book-outline" size={18} color={colors.primary[600]} />
              <Text style={styles.materiasTitle}>Materias del Plan de Estudio</Text>
            </View>

            {sinPlan ? (
              <View style={styles.emptyWrap}>
                <Ionicons name="alert-circle-outline" size={36} color={colors.gray[300]} />
                <Text style={styles.emptyTitle}>Sin plan de estudio</Text>
                <Text style={styles.emptyMsg}>
                  El grado "{curso.gradoNombre}" aún no tiene un plan de estudio configurado.
                  Ve a Planes de Estudio y configúralo primero.
                </Text>
              </View>
            ) : detallesPlan.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyMsg}>El plan no tiene materias asignadas.</Text>
              </View>
            ) : (
              detallesPlan.map(d => (
                <MateriaRow
                  key={d.materiaId}
                  detalle={d}
                  asignacion={getAsignacion(d.materiaId)}
                  onAsignar={openAsignar}
                  onRemover={a => { setAsigARemover(a); setConfirmVisible(true); }}
                />
              ))
            )}
          </Card>

          <View style={{ height: spacing.xl }} />
        </ScrollView>
      )}

      {/* Modal seleccionar docente */}
      <Modal visible={modalVisible} transparent animationType="fade"
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Asignar Docente</Text>
                <Text style={styles.modalSub}>{materiaActual?.materiaNombre}</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.gray[600]} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              {docentes.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <Text style={styles.emptyMsg}>No hay docentes registrados en el sistema.</Text>
                </View>
              ) : (
                docentes.map(d => (
                  <TouchableOpacity key={d.id}
                    style={[styles.docenteRow, docenteSel === d.id && styles.docenteRowSel]}
                    onPress={() => setDocenteSel(d.id)}>
                    <View style={styles.docenteAvatar}>
                      <Text style={styles.docenteAvatarText}>
                        {`${d.nombre?.[0] || ''}${d.apellido?.[0] || ''}`.toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.docenteNombre}>{d.nombre} {d.apellido}</Text>
                      <Text style={styles.docenteEmail}>{d.email}</Text>
                    </View>
                    {docenteSel === d.id && (
                      <Ionicons name="checkmark-circle" size={22} color={colors.primary[600]} />
                    )}
                  </TouchableOpacity>
                ))
              )}
              <View style={{ height: spacing.md }} />
            </ScrollView>
            <View style={styles.modalFooter}>
              <Button title="Cancelar" onPress={() => setModalVisible(false)}
                variant="outline" style={{ flex: 1 }} />
              <Button
                title={saving ? 'Guardando...' : 'Asignar'}
                onPress={handleAsignar}
                disabled={saving || !docenteSel}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      <ConfirmModal
        visible={confirmVisible}
        title="Remover docente"
        message={`¿Remover a ${asigARemover?.docenteNombre} de la materia ${asigARemover?.materiaNombre}?`}
        confirmText="Remover" confirmColor="danger"
        loading={removiendo}
        onConfirm={confirmarRemover}
        onCancel={() => { setConfirmVisible(false); setAsigARemover(null); }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: colors.gray[50] },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  loadingText:     { fontSize: fontSize.base, color: colors.gray[600] },
  errorMsg:        { fontSize: fontSize.base, color: colors.gray[500], textAlign: 'center' },

  header: {
    backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center',
    padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.gray[200],
  },
  backBtn:    { marginRight: spacing.md },
  headerTitle: { flex: 1 },
  headerText:  { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.gray[900] },
  headerSub:   { fontSize: fontSize.sm, color: colors.gray[500], marginTop: 2 },

  content: { flex: 1 },

  resumenCard: { margin: spacing.lg, marginBottom: spacing.sm },
  resumenRow:  { flexDirection: 'row', justifyContent: 'space-around', marginBottom: spacing.md },
  resumenItem: { alignItems: 'center' },
  resumenNum:  { fontSize: 26, fontWeight: '800', color: colors.gray[900] },
  resumenLabel: { fontSize: fontSize.xs, color: colors.gray[500], marginTop: 2 },
  progressBar:  { height: 6, backgroundColor: colors.gray[100], borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  directorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    marginTop: spacing.md, backgroundColor: colors.primary[50],
    padding: spacing.sm, borderRadius: borderRadius.md,
  },
  directorBannerText: { fontSize: fontSize.xs, color: colors.primary[700] },

  materiasCard:   { marginHorizontal: spacing.lg },
  materiasHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginBottom: spacing.md, paddingBottom: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.gray[100],
  },
  materiasTitle: { fontSize: fontSize.base, fontWeight: '700', color: colors.gray[900] },

  materiaRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.gray[50],
  },
  materiaInfo:    { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  materiaIcon: {
    width: 36, height: 36, borderRadius: borderRadius.md,
    backgroundColor: colors.gray[50], justifyContent: 'center', alignItems: 'center',
  },
  materiaIconActivo: { backgroundColor: colors.primary[50] },
  materiaTextos:    { flex: 1 },
  materiaNombre:    { fontSize: fontSize.sm, fontWeight: '600', color: colors.gray[900] },
  materiaHoras:     { fontSize: fontSize.xs, color: colors.gray[400], marginTop: 1 },
  docenteAsigRow:   { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  docenteAsigNombre: { fontSize: fontSize.xs, color: colors.primary[600], fontWeight: '500' },
  sinDocente:       { fontSize: fontSize.xs, color: colors.gray[300], fontStyle: 'italic', marginTop: 2 },

  materiaAcciones: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  asigBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.gray[200],
  },
  asigBtnActivo:     { borderColor: colors.primary[200], backgroundColor: colors.primary[50] },
  asigBtnText:       { fontSize: fontSize.xs, color: colors.gray[500] },
  asigBtnTextActivo: { color: colors.primary[600], fontWeight: '600' },

  emptyWrap:  { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  emptyTitle: { fontSize: fontSize.base, fontWeight: '600', color: colors.gray[600] },
  emptyMsg:   { fontSize: fontSize.sm, color: colors.gray[400], textAlign: 'center', paddingHorizontal: spacing.md },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.white, borderRadius: borderRadius.xl,
    width: '100%', maxWidth: 480, maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.gray[200],
  },
  modalTitle:  { fontSize: fontSize.lg, fontWeight: '700', color: colors.gray[900] },
  modalSub:    { fontSize: fontSize.sm, color: colors.primary[600], marginTop: 2 },
  modalBody:   { padding: spacing.lg },
  modalFooter: {
    flexDirection: 'row', gap: spacing.md,
    padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.gray[200],
  },

  docenteRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.sm, borderRadius: borderRadius.md, marginBottom: spacing.xs,
    borderWidth: 1, borderColor: colors.gray[100],
  },
  docenteRowSel:     { borderColor: colors.primary[300], backgroundColor: colors.primary[50] },
  docenteAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primary[600], justifyContent: 'center', alignItems: 'center',
  },
  docenteAvatarText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.white },
  docenteNombre:     { fontSize: fontSize.sm, fontWeight: '600', color: colors.gray[900] },
  docenteEmail:      { fontSize: fontSize.xs, color: colors.gray[500] },
});

export default AsignacionDocenteScreen;