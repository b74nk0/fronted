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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import EmptyState from '../../../components/common/EmptyState';
import { colors, spacing, fontSize, borderRadius } from '../../../constants/theme';
import { materiaService } from '../../../services/materiaService';

const FORM_INITIAL = { nombre: '', descripcion: '' };

const MateriasScreen = () => {
  const navigation = useNavigation();
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMateria, setEditingMateria] = useState(null);
  const [formData, setFormData] = useState(FORM_INITIAL);
  const [errors, setErrors] = useState({});

  // ─── Cargar ─────────────────────────────────────────────────────────────────
  const loadMaterias = async () => {
    setLoading(true);
    try {
      const data = await materiaService.listar();
      setMaterias(data);
    } catch (error) {
      console.error('Error cargando materias:', error);
      Alert.alert('Error', 'No se pudieron cargar las materias.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadMaterias();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMaterias();
    setRefreshing(false);
  }, []);

  // ─── Modal ──────────────────────────────────────────────────────────────────
  const openModal = (materia = null) => {
    setEditingMateria(materia);
    setFormData({
      nombre: materia?.nombre || '',
      descripcion: materia?.descripcion || '',
    });
    setErrors({});
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingMateria(null);
    setFormData(FORM_INITIAL);
    setErrors({});
  };

  // ─── Validar ────────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!formData.nombre.trim()) e.nombre = 'Requerido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ─── Guardar ────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editingMateria) {
        await materiaService.actualizar(editingMateria.id, formData);
      } else {
        await materiaService.crear(formData);
      }
      closeModal();
      await loadMaterias();
    } catch (error) {
      console.error('Error guardando materia:', error);
      const msg = error.response?.data?.message || 'No se pudo guardar la materia.';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  // ─── Desactivar ─────────────────────────────────────────────────────────────
  const handleDesactivar = (materia) => {
    Alert.alert(
      'Desactivar materia',
      `¿Estás seguro de que deseas desactivar "${materia.nombre}"? Dejará de aparecer en los planes de estudio.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desactivar',
          style: 'destructive',
          onPress: async () => {
            try {
              await materiaService.desactivar(materia.id);
              await loadMaterias();
            } catch (error) {
              console.error('Error desactivando materia:', error);
              Alert.alert('Error', 'No se pudo desactivar la materia.');
            }
          },
        },
      ]
    );
  };

  // ─── Render card ─────────────────────────────────────────────────────────────
  const renderMateriaCard = (materia) => (
    <Card key={materia.id} style={styles.card}>
      <View style={styles.cardRow}>
        <View style={styles.iconContainer}>
          <Ionicons name="book" size={22} color={colors.primary[600]} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardNombre}>{materia.nombre}</Text>
          {materia.descripcion ? (
            <Text style={styles.cardDescripcion} numberOfLines={2}>
              {materia.descripcion}
            </Text>
          ) : (
            <Text style={styles.cardSinDesc}>Sin descripción</Text>
          )}
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => openModal(materia)}
          >
            <Ionicons name="pencil" size={18} color={colors.primary[600]} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => handleDesactivar(materia)}
          >
            <Ionicons name="eye-off" size={18} color={colors.red[500]} />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );

  // ─── Modal ───────────────────────────────────────────────────────────────────
  const renderModal = () => (
    <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeModal}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingMateria ? 'Editar Materia' : 'Nueva Materia'}
            </Text>
            <TouchableOpacity onPress={closeModal}>
              <Ionicons name="close" size={24} color={colors.gray[600]} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <Input
              label="Nombre *"
              placeholder="Ej: Matemáticas, Lenguaje..."
              value={formData.nombre}
              onChangeText={(t) => setFormData({ ...formData, nombre: t })}
              error={errors.nombre}
            />
            <Input
              label="Descripción"
              placeholder="Descripción opcional de la materia"
              value={formData.descripcion}
              onChangeText={(t) => setFormData({ ...formData, descripcion: t })}
              multiline
              numberOfLines={3}
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
  );

  if (loading && materias.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={styles.loadingText}>Cargando materias...</Text>
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
          <Text style={styles.headerText}>Materias</Text>
          <Text style={styles.headerSubtext}>{materias.length} materias activas</Text>
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
            Las materias desactivadas no se eliminan — dejan de aparecer en los planes de estudio pero conservan su historial.
          </Text>
        </View>

        {materias.length === 0 ? (
          <EmptyState
            icon="book-outline"
            title="No hay materias activas"
            message="Crea la primera materia para comenzar a construir el plan de estudios"
          />
        ) : (
          <View style={styles.list}>{materias.map(renderMateriaCard)}</View>
        )}

        <View style={{ height: spacing.xl }} />
      </ScrollView>

      {renderModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
  },
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
    width: 40,
    height: 40,
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
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
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: { flex: 1 },
  cardNombre: { fontSize: fontSize.base, fontWeight: '600', color: colors.gray[900] },
  cardDescripcion: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginTop: 2,
    lineHeight: 18,
  },
  cardSinDesc: { fontSize: fontSize.sm, color: colors.gray[400], marginTop: 2, fontStyle: 'italic' },
  cardActions: { flexDirection: 'row', gap: spacing.xs },
  iconButton: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[100],
  },
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
    maxWidth: 500,
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
});

export default MateriasScreen;