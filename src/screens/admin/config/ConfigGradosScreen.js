import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import EmptyState from '../../../components/common/EmptyState';
import ConfirmModal from '../../../components/common/ConfirmModal';
import { colors, spacing, fontSize, borderRadius } from '../../../constants/theme';
import { nivelService } from '../../../services/nivelService';

const FORM_INITIAL = { nombre: '', orden: '' };

const ConfigGradosScreen = () => {
  const navigation = useNavigation();
  const [niveles, setNiveles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Modal crear/editar
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('nivel');
  const [selectedNivel, setSelectedNivel] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [formData, setFormData] = useState(FORM_INITIAL);

  // ConfirmModal — eliminar grado
  const [confirmGradoVisible, setConfirmGradoVisible] = useState(false);
  const [gradoAEliminar, setGradoAEliminar] = useState(null); // { nivel, gradoIndex }
  const [eliminandoGrado, setEliminandoGrado] = useState(false);

  // ConfirmModal — eliminar nivel
  const [confirmNivelVisible, setConfirmNivelVisible] = useState(false);
  const [nivelAEliminar, setNivelAEliminar] = useState(null);
  const [eliminandoNivel, setEliminandoNivel] = useState(false);

  // ─── Cargar ──────────────────────────────────────────────────────────────────
  const loadNiveles = async () => {
    setLoading(true);
    try {
      const data = await nivelService.listar();
      setNiveles(data);
    } catch (error) {
      console.error('Error cargando niveles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadNiveles(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNiveles();
    setRefreshing(false);
  }, []);

  // ─── Modal nivel ─────────────────────────────────────────────────────────────
  const openNivelModal = (nivel = null) => {
    setModalType('nivel');
    setSelectedNivel(null);
    setEditingItem(nivel);
    setEditingIndex(null);
    setFormData({
      nombre: nivel?.nombre || '',
      orden: nivel?.orden?.toString() || '',
    });
    setModalVisible(true);
  };

  // ─── Modal grado ─────────────────────────────────────────────────────────────
  const openGradoModal = (nivel, grado = null, index = null) => {
    setModalType('grado');
    setSelectedNivel(nivel);
    setEditingItem(grado);
    setEditingIndex(index);
    setFormData({
      nombre: grado?.nombre || '',
      orden: grado?.orden?.toString() || '',
    });
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setModalType('nivel');
    setSelectedNivel(null);
    setEditingItem(null);
    setEditingIndex(null);
    setFormData(FORM_INITIAL);
  };

  // ─── Guardar nivel ────────────────────────────────────────────────────────────
  const handleSaveNivel = async () => {
    if (!formData.nombre || !formData.orden) return;
    setSaving(true);
    try {
      const dto = {
        nombre: formData.nombre,
        orden: parseInt(formData.orden),
        grados: editingItem?.grados || [],
      };
      if (editingItem) {
        await nivelService.actualizar(editingItem.id, dto);
      } else {
        await nivelService.guardar(dto);
      }
      closeModal();
      await loadNiveles();
    } catch (error) {
      console.error('Error guardando nivel:', error);
    } finally {
      setSaving(false);
    }
  };

  // ─── Guardar grado ────────────────────────────────────────────────────────────
  const handleSaveGrado = async () => {
    if (!formData.nombre || !formData.orden) return;
    setSaving(true);
    try {
      const gradosActuales = selectedNivel.grados || [];
      let nuevosGrados;
      if (editingItem && editingIndex !== null) {
        nuevosGrados = gradosActuales.map((g, i) =>
          i === editingIndex
            ? { ...g, nombre: formData.nombre, orden: parseInt(formData.orden) }
            : g
        );
      } else {
        nuevosGrados = [
          ...gradosActuales,
          { nombre: formData.nombre, orden: parseInt(formData.orden) },
        ];
      }
      await nivelService.actualizar(selectedNivel.id, {
        ...selectedNivel,
        grados: nuevosGrados,
      });
      closeModal();
      await loadNiveles();
    } catch (error) {
      console.error('Error guardando grado:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    if (modalType === 'nivel') handleSaveNivel();
    else handleSaveGrado();
  };

  // ─── Eliminar nivel ───────────────────────────────────────────────────────────
  const handleDeleteNivel = (nivel) => {
    setNivelAEliminar(nivel);
    setConfirmNivelVisible(true);
  };

  const confirmarEliminarNivel = async () => {
    if (!nivelAEliminar) return;
    setEliminandoNivel(true);
    try {
      await nivelService.eliminar(nivelAEliminar.id);
      setConfirmNivelVisible(false);
      setNivelAEliminar(null);
      await loadNiveles();
    } catch (error) {
      console.error('Error eliminando nivel:', error);
    } finally {
      setEliminandoNivel(false);
    }
  };

  // ─── Eliminar grado ───────────────────────────────────────────────────────────
  const handleDeleteGrado = (nivel, gradoIndex) => {
    setGradoAEliminar({ nivel, gradoIndex });
    setConfirmGradoVisible(true);
  };

  const confirmarEliminarGrado = async () => {
    if (!gradoAEliminar) return;
    setEliminandoGrado(true);
    try {
      const { nivel, gradoIndex } = gradoAEliminar;
      const nuevosGrados = nivel.grados.filter((_, i) => i !== gradoIndex);
      await nivelService.actualizar(nivel.id, { ...nivel, grados: nuevosGrados });
      setConfirmGradoVisible(false);
      setGradoAEliminar(null);
      await loadNiveles();
    } catch (error) {
      console.error('Error eliminando grado:', error);
    } finally {
      setEliminandoGrado(false);
    }
  };

  // ─── Render card nivel ────────────────────────────────────────────────────────
  const renderNivelCard = (nivel) => (
    <Card key={nivel.id} style={styles.nivelCard}>
      <View style={styles.nivelHeader}>
        <View style={styles.nivelTitleContainer}>
          <View style={styles.nivelIconContainer}>
            <Ionicons name="layers" size={24} color={colors.primary[600]} />
          </View>
          <View>
            <Text style={styles.nivelNombre}>{nivel.nombre}</Text>
            <Text style={styles.nivelInfo}>
              {nivel.grados?.length || 0} grados · Orden {nivel.orden}
            </Text>
          </View>
        </View>
        <View style={styles.nivelActions}>
          <TouchableOpacity style={styles.iconButton} onPress={() => openNivelModal(nivel)}>
            <Ionicons name="pencil" size={20} color={colors.primary[600]} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => handleDeleteNivel(nivel)}>
            <Ionicons name="trash" size={20} color={colors.red[500]} />
          </TouchableOpacity>
        </View>
      </View>

      {nivel.grados && nivel.grados.length > 0 && (
        <View style={styles.gradosContainer}>
          {nivel.grados.map((grado, index) => (
            <View
              key={grado.id || index}
              style={[
                styles.gradoItem,
                index < nivel.grados.length - 1 && styles.gradoItemBorder,
              ]}
            >
              <View style={styles.gradoInfo}>
                <View style={styles.gradoNumberBadge}>
                  <Text style={styles.gradoNumber}>{grado.orden}</Text>
                </View>
                <Text style={styles.gradoNombre}>{grado.nombre}</Text>
              </View>
              <View style={styles.gradoActions}>
                <TouchableOpacity
                  style={styles.smallIconButton}
                  onPress={() => openGradoModal(nivel, grado, index)}
                >
                  <Ionicons name="pencil" size={16} color={colors.gray[600]} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.smallIconButton}
                  onPress={() => handleDeleteGrado(nivel, index)}
                >
                  <Ionicons name="trash" size={16} color={colors.red[500]} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.addGradoButton} onPress={() => openGradoModal(nivel)}>
        <Ionicons name="add-circle-outline" size={20} color={colors.primary[600]} />
        <Text style={styles.addGradoText}>Agregar grado</Text>
      </TouchableOpacity>
    </Card>
  );

  if (loading && niveles.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={styles.loadingText}>Cargando niveles...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Configuracion')}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[700]} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.headerText}>Grados y Niveles</Text>
          <Text style={styles.headerSubtext}>{niveles.length} niveles configurados</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => openNivelModal()}>
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Lista */}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={colors.primary[600]} />
          <Text style={styles.infoText}>
            Configure los niveles educativos (Preescolar, Primaria, Bachillerato) y sus respectivos grados
          </Text>
        </View>

        {niveles.length === 0 ? (
          <EmptyState
            icon="school-outline"
            title="No hay niveles configurados"
            message="Crea el primer nivel educativo para comenzar"
          />
        ) : (
          <View style={styles.list}>{niveles.map(renderNivelCard)}</View>
        )}
        <View style={{ height: spacing.xl }} />
      </ScrollView>

      {/* Modal crear/editar nivel o grado */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingItem
                  ? `Editar ${modalType === 'nivel' ? 'Nivel' : 'Grado'}`
                  : `Nuevo ${modalType === 'nivel' ? 'Nivel' : 'Grado'}`}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color={colors.gray[600]} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {modalType === 'grado' && selectedNivel && (
                <View style={styles.nivelInfoBox}>
                  <Ionicons name="layers" size={18} color={colors.primary[600]} />
                  <Text style={styles.nivelInfoText}>Nivel: {selectedNivel.nombre}</Text>
                </View>
              )}
              <Input
                label="Nombre"
                placeholder={`Ej: ${modalType === 'nivel' ? 'Primaria' : 'Primero'}`}
                value={formData.nombre}
                onChangeText={(text) => setFormData({ ...formData, nombre: text })}
              />
              <Input
                label="Orden"
                placeholder="Número de orden"
                value={formData.orden}
                onChangeText={(text) => setFormData({ ...formData, orden: text })}
                keyboardType="numeric"
              />
            </View>

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

      {/* ConfirmModal — eliminar grado */}
      <ConfirmModal
        visible={confirmGradoVisible}
        title="Eliminar grado"
        message="¿Estás seguro de que deseas eliminar este grado? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        confirmColor="danger"
        loading={eliminandoGrado}
        onConfirm={confirmarEliminarGrado}
        onCancel={() => { setConfirmGradoVisible(false); setGradoAEliminar(null); }}
      />

      {/* ConfirmModal — eliminar nivel */}
      <ConfirmModal
        visible={confirmNivelVisible}
        title="Eliminar nivel"
        message={`¿Eliminar "${nivelAEliminar?.nombre}"? También se eliminarán todos los grados asociados.`}
        confirmText="Eliminar"
        confirmColor="danger"
        loading={eliminandoNivel}
        onConfirm={confirmarEliminarNivel}
        onCancel={() => { setConfirmNivelVisible(false); setNivelAEliminar(null); }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.gray[50] },
  loadingText: { marginTop: spacing.md, fontSize: fontSize.base, color: colors.gray[600] },
  header: {
    backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center',
    padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.gray[200],
  },
  backButton: { marginRight: spacing.md },
  headerTitle: { flex: 1 },
  headerText: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.gray[900] },
  headerSubtext: { fontSize: fontSize.sm, color: colors.gray[600], marginTop: spacing.xs },
  addButton: {
    width: 40, height: 40, backgroundColor: colors.primary[600],
    borderRadius: borderRadius.full, justifyContent: 'center', alignItems: 'center',
  },
  content: { flex: 1 },
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.primary[50],
    padding: spacing.md, margin: spacing.lg, borderRadius: borderRadius.lg, gap: spacing.sm,
  },
  infoText: { flex: 1, fontSize: fontSize.sm, color: colors.primary[700], lineHeight: 20 },
  list: { padding: spacing.lg },
  nivelCard: { marginBottom: spacing.lg },
  nivelHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: spacing.md,
  },
  nivelTitleContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  nivelIconContainer: {
    width: 48, height: 48, borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[50], justifyContent: 'center', alignItems: 'center',
  },
  nivelNombre: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.gray[900] },
  nivelInfo: { fontSize: fontSize.sm, color: colors.gray[600], marginTop: spacing.xs },
  nivelActions: { flexDirection: 'row', gap: spacing.sm },
  iconButton: {
    width: 36, height: 36, justifyContent: 'center', alignItems: 'center',
    borderRadius: borderRadius.md, backgroundColor: colors.gray[100],
  },
  gradosContainer: {
    backgroundColor: colors.gray[50], borderRadius: borderRadius.lg,
    padding: spacing.sm, marginBottom: spacing.md,
  },
  gradoItem: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.sm,
  },
  gradoItemBorder: { borderBottomWidth: 1, borderBottomColor: colors.gray[200] },
  gradoInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  gradoNumberBadge: {
    width: 32, height: 32, borderRadius: borderRadius.full,
    backgroundColor: colors.primary[100], justifyContent: 'center', alignItems: 'center',
  },
  gradoNumber: { fontSize: fontSize.sm, fontWeight: 'bold', color: colors.primary[700] },
  gradoNombre: { fontSize: fontSize.base, fontWeight: '500', color: colors.gray[800] },
  gradoActions: { flexDirection: 'row', gap: spacing.sm },
  smallIconButton: {
    width: 28, height: 28, justifyContent: 'center', alignItems: 'center',
    borderRadius: borderRadius.sm, backgroundColor: colors.white,
  },
  addGradoButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: spacing.md, borderRadius: borderRadius.lg,
    borderWidth: 2, borderStyle: 'dashed', borderColor: colors.primary[300], gap: spacing.sm,
  },
  addGradoText: { fontSize: fontSize.base, fontWeight: '600', color: colors.primary[600] },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.white, borderRadius: borderRadius.xl, width: '100%', maxWidth: 500,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.gray[200],
  },
  modalTitle: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.gray[900] },
  modalBody: { padding: spacing.lg },
  nivelInfoBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary[50],
    padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.md, gap: spacing.sm,
  },
  nivelInfoText: { flex: 1, fontSize: fontSize.sm, color: colors.primary[700] },
  modalFooter: {
    flexDirection: 'row', gap: spacing.md,
    padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.gray[200],
  },
});

export default ConfigGradosScreen;