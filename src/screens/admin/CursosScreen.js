import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import EmptyState from '../../components/common/EmptyState';
import ConfirmModal from '../../components/common/ConfirmModal';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';
import { cursoService } from '../../services/cursoService';
import { nivelService } from '../../services/nivelService';
import { usuarioService } from '../../services/usuarioService';

const CursoCard = ({ curso, onEdit, onDelete, onAsignar }) => (
  <TouchableOpacity style={styles.card} onPress={() => onAsignar(curso)} activeOpacity={0.75}>
    <View style={styles.cardLeft}>
      <View style={styles.cardIcon}>
        <Ionicons name="people" size={22} color={colors.primary[600]} />
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardNombre}>{curso.nombre}</Text>
        <Text style={styles.cardSub}>
          {curso.nivelNombre ? `${curso.nivelNombre} · ` : ''}{curso.gradoNombre}
        </Text>
        {curso.directorGrupoNombre ? (
          <View style={styles.directorRow}>
            <Ionicons name="person-outline" size={12} color={colors.gray[400]} />
            <Text style={styles.directorText}>{curso.directorGrupoNombre}</Text>
          </View>
        ) : (
          <Text style={styles.sinDirector}>Sin director de grupo</Text>
        )}
      </View>
    </View>
    <View style={styles.cardRight}>
      <View style={styles.statsCol}>
        <View style={styles.statBadge}>
          <Text style={styles.statNum}>{curso.totalAsignaciones ?? 0}</Text>
          <Text style={styles.statLabel}>docentes</Text>
        </View>
        <View style={[styles.statBadge, { backgroundColor: '#f0fdf4' }]}>
          <Text style={[styles.statNum, { color: '#16a34a' }]}>{curso.totalEstudiantes ?? 0}</Text>
          <Text style={styles.statLabel}>estudiantes</Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => onEdit(curso)}>
          <Ionicons name="pencil-outline" size={17} color={colors.primary[600]} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={() => onDelete(curso)}>
          <Ionicons name="trash-outline" size={17} color={colors.red[500]} />
        </TouchableOpacity>
      </View>
    </View>
  </TouchableOpacity>
);

const CursosScreen = () => {
  const navigation = useNavigation();

  const [cursos,   setCursos]   = useState([]);
  const [niveles,  setNiveles]  = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [busqueda, setBusqueda] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [editando,     setEditando]     = useState(null);
  const [saving,       setSaving]       = useState(false);
  const [errors,       setErrors]       = useState({});

  const [formNombre,    setFormNombre]    = useState('');
  const [nivelSel,      setNivelSel]      = useState(null);
  const [gradoSel,      setGradoSel]      = useState(null);
  const [directorSel,   setDirectorSel]   = useState(null);

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [cursoAEliminar, setCursoAEliminar] = useState(null);
  const [eliminando,     setEliminando]     = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cursosData, nivelesData, usuariosData] = await Promise.all([
        cursoService.listar(),
        nivelService.listar(),
        usuarioService.listar(),
      ]);
      setCursos(cursosData);
      setNiveles(nivelesData);
      setDocentes(usuariosData.filter(u =>
        u.roles?.some(r => (typeof r === 'string' ? r : r.nombre)?.toLowerCase() === 'docente')
      ));
    } catch (e) {
      console.error('Error cargando cursos:', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const filtrados = cursos.filter(c => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return c.nombre?.toLowerCase().includes(q) ||
      c.gradoNombre?.toLowerCase().includes(q) ||
      c.nivelNombre?.toLowerCase().includes(q);
  });

  const gradosDelNivel = nivelSel
    ? (niveles.find(n => n.id === nivelSel)?.grados || [])
    : [];

  const openCrear = () => {
    setEditando(null);
    setFormNombre('');
    setNivelSel(null);
    setGradoSel(null);
    setDirectorSel(null);
    setErrors({});
    setModalVisible(true);
  };

  const openEditar = (curso) => {
    setEditando(curso);
    setFormNombre(curso.nombre);
    setNivelSel(curso.nivelId || null);
    setGradoSel(curso.gradoId || null);
    setDirectorSel(curso.directorGrupoId || null);
    setErrors({});
    setModalVisible(true);
  };

  const validate = () => {
    const e = {};
    if (!formNombre.trim()) e.nombre = 'Requerido';
    if (!gradoSel)           e.grado  = 'Selecciona un grado';
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
        directorGrupoId: directorSel || null,
        activo: true,
      };
      if (editando) await cursoService.actualizar(editando.id, payload);
      else          await cursoService.crear(payload);
      setModalVisible(false);
      await loadData();
    } catch (e) {
      console.error('Error guardando curso:', e);
    } finally {
      setSaving(false);
    }
  };

  const confirmarEliminar = async () => {
    if (!cursoAEliminar) return;
    setEliminando(true);
    try {
      await cursoService.eliminar(cursoAEliminar.id);
      setConfirmVisible(false);
      setCursoAEliminar(null);
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
            <Text style={styles.modalTitle}>{editando ? 'Editar Curso' : 'Nuevo Curso'}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.gray[600]} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Input label="Nombre del grupo *" value={formNombre}
              onChangeText={setFormNombre} error={errors.nombre}
              placeholder="Ej: 5° A, Séptimo B" />

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
                  {gradosDelNivel.map(g => (
                    <TouchableOpacity key={g.id}
                      style={[styles.chip, gradoSel === g.id && styles.chipSelected]}
                      onPress={() => setGradoSel(g.id)}>
                      <Text style={[styles.chipText, gradoSel === g.id && styles.chipTextSel]}>
                        {g.nombre}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {errors.grado && <Text style={styles.errorText}>{errors.grado}</Text>}
              </>
            )}

            <Text style={styles.fieldLabel}>Director de grupo (opcional)</Text>
            <TouchableOpacity
              style={[styles.docenteRow, directorSel === null && styles.docenteRowSelected]}
              onPress={() => setDirectorSel(null)}>
              <View style={[styles.docenteAvatar, { backgroundColor: colors.gray[300] }]}>
                <Ionicons name="close" size={16} color={colors.white} />
              </View>
              <Text style={styles.docenteNombre}>Sin director</Text>
              {directorSel === null && (
                <Ionicons name="checkmark-circle" size={20} color={colors.primary[600]} />
              )}
            </TouchableOpacity>
            {docentes.map(d => (
              <TouchableOpacity key={d.id}
                style={[styles.docenteRow, directorSel === d.id && styles.docenteRowSelected]}
                onPress={() => setDirectorSel(d.id)}>
                <View style={styles.docenteAvatar}>
                  <Text style={styles.docenteAvatarText}>
                    {`${d.nombre?.[0] || ''}${d.apellido?.[0] || ''}`.toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.docenteNombre}>{d.nombre} {d.apellido}</Text>
                  <Text style={styles.docenteEmail}>{d.email}</Text>
                </View>
                {directorSel === d.id && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary[600]} />
                )}
              </TouchableOpacity>
            ))}
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[700]} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.headerText}>Cursos y Grupos</Text>
          <Text style={styles.headerSub}>{cursos.length} grupos registrados</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openCrear}>
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.hint}>
        <Ionicons name="information-circle-outline" size={15} color={colors.primary[600]} />
        <Text style={styles.hintText}>Toca un curso para asignar docentes a sus materias</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color={colors.gray[400]} />
        <TextInput style={styles.searchInput} placeholder="Buscar curso..."
          placeholderTextColor={colors.gray[400]} value={busqueda} onChangeText={setBusqueda} />
        {busqueda.length > 0 && (
          <TouchableOpacity onPress={() => setBusqueda('')}>
            <Ionicons name="close-circle" size={18} color={colors.gray[400]} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {filtrados.length === 0 ? (
          <EmptyState icon="school-outline" title="Sin cursos"
            message="Crea grupos como '5° A' y asígnalos a un grado" />
        ) : (
          <View style={styles.list}>
            {filtrados.map(c => (
              <CursoCard key={c.id} curso={c}
                onEdit={openEditar}
                onDelete={c => { setCursoAEliminar(c); setConfirmVisible(true); }}
                onAsignar={c => navigation.navigate('AsignacionDocente', { curso: c })}
              />
            ))}
          </View>
        )}
        <View style={{ height: spacing.xl }} />
      </ScrollView>

      {renderModal()}
      <ConfirmModal
        visible={confirmVisible}
        title="Eliminar curso"
        message={`¿Eliminar el curso "${cursoAEliminar?.nombre}"? Se eliminarán también las asignaciones de docentes y estudiantes.`}
        confirmText="Eliminar" confirmColor="danger"
        loading={eliminando}
        onConfirm={confirmarEliminar}
        onCancel={() => { setConfirmVisible(false); setCursoAEliminar(null); }}
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
  headerText: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.gray[900] },
  headerSub:  { fontSize: fontSize.xs, color: colors.gray[500], marginTop: 2 },
  addBtn: {
    width: 40, height: 40, backgroundColor: colors.primary[600],
    borderRadius: borderRadius.full, justifyContent: 'center', alignItems: 'center',
  },
  hint: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    marginHorizontal: spacing.lg, marginTop: spacing.md,
    backgroundColor: colors.primary[50], padding: spacing.sm, borderRadius: borderRadius.md,
  },
  hintText: { fontSize: fontSize.xs, color: colors.primary[700] },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white,
    marginHorizontal: spacing.lg, marginTop: spacing.sm, marginBottom: spacing.xs,
    paddingHorizontal: spacing.md, borderRadius: borderRadius.lg,
    borderWidth: 1, borderColor: colors.gray[200], gap: spacing.sm, height: 44,
  },
  searchInput: { flex: 1, fontSize: fontSize.base, color: colors.gray[900] },
  content: { flex: 1 },
  list:    { padding: spacing.lg },
  card: {
    backgroundColor: colors.white, borderRadius: borderRadius.lg,
    padding: spacing.md, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 3, elevation: 2,
  },
  cardLeft:  { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  cardRight: { alignItems: 'flex-end', gap: spacing.sm },
  cardIcon: {
    width: 48, height: 48, borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[50], justifyContent: 'center', alignItems: 'center',
  },
  cardInfo:    { flex: 1 },
  cardNombre:  { fontSize: fontSize.base, fontWeight: '700', color: colors.gray[900] },
  cardSub:     { fontSize: fontSize.xs, color: colors.gray[500], marginTop: 2 },
  directorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  directorText: { fontSize: fontSize.xs, color: colors.gray[500] },
  sinDirector:  { fontSize: fontSize.xs, color: colors.gray[300], marginTop: 3, fontStyle: 'italic' },
  statsCol:  { gap: 4 },
  statBadge: {
    alignItems: 'center', backgroundColor: colors.primary[50],
    paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm,
  },
  statNum:   { fontSize: fontSize.base, fontWeight: '800', color: colors.primary[700] },
  statLabel: { fontSize: 9, color: colors.primary[400] },
  cardActions: { flexDirection: 'row', gap: spacing.xs },
  iconBtn:     { padding: 6 },
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
  fieldLabel: { fontSize: fontSize.sm, fontWeight: '600', color: colors.gray[700], marginBottom: spacing.xs },
  chipGroup:  { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full, borderWidth: 1,
    borderColor: colors.gray[300], backgroundColor: colors.white,
  },
  chipSelected:  { backgroundColor: colors.primary[600], borderColor: colors.primary[600] },
  chipText:      { fontSize: fontSize.sm, color: colors.gray[700], fontWeight: '500' },
  chipTextSel:   { color: colors.white },
  errorText:     { fontSize: fontSize.xs, color: colors.red[500], marginBottom: spacing.sm },
  docenteRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.sm, borderRadius: borderRadius.md, marginBottom: spacing.xs,
    borderWidth: 1, borderColor: colors.gray[100],
  },
  docenteRowSelected: { borderColor: colors.primary[300], backgroundColor: colors.primary[50] },
  docenteAvatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.primary[600], justifyContent: 'center', alignItems: 'center',
  },
  docenteAvatarText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.white },
  docenteNombre:     { fontSize: fontSize.sm, fontWeight: '600', color: colors.gray[900] },
  docenteEmail:      { fontSize: fontSize.xs, color: colors.gray[500] },
});

export default CursosScreen;