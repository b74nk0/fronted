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
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import EmptyState from '../../../components/common/EmptyState';
import { colors, spacing, fontSize, borderRadius } from '../../../constants/theme';
import { periodoAcademicoService } from '../../../services/periodoAcademicoService';
import DatePickerField from '../../../components/common/DatePickerField';

const FORM_INITIAL = {
  nombre: '',
  inicio: '',
  fin: '',
};

const ConfigSubPeriodosScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { periodoId } = route.params;

  const [periodoAcademico, setPeriodoAcademico] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [formData, setFormData] = useState(FORM_INITIAL);

  // ─── Cargar año lectivo con sus períodos ────────────────────────────────────
  const loadPeriodo = async () => {
    setLoading(true);
    try {
      const data = await periodoAcademicoService.obtener(periodoId);
      setPeriodoAcademico(data);
    } catch (error) {
      console.error('Error cargando período:', error);
      Alert.alert('Error', 'No se pudo cargar el período académico.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPeriodo();
  }, [periodoId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPeriodo();
    setRefreshing(false);
  }, [periodoId]);

  // ─── Modal ──────────────────────────────────────────────────────────────────
  const openModal = (periodo = null, index = null) => {
    if (periodo) {
      setEditingIndex(index);
      setFormData({
        nombre: periodo.nombre,
        inicio: periodo.inicio,
        fin: periodo.fin,
      });
    } else {
      setEditingIndex(null);
      setFormData(FORM_INITIAL);
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingIndex(null);
    setFormData(FORM_INITIAL);
  };

  // ─── Guardar lista actualizada via PUT del año lectivo ──────────────────────
  const guardarPeriodos = async (nuevosPeriodos) => {
    setSaving(true);
    try {
      await periodoAcademicoService.actualizar(periodoId, {
        ...periodoAcademico,
        periodos: nuevosPeriodos,
      });
      await loadPeriodo();
    } catch (error) {
      console.error('Error guardando períodos:', error);
      Alert.alert('Error', 'No se pudieron guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!formData.nombre || !formData.inicio || !formData.fin) {
      Alert.alert('Campos requeridos', 'Por favor completa todos los campos.');
      return;
    }

    const periodosActuales = periodoAcademico?.periodos || [];
    let nuevos;

    if (editingIndex !== null) {
      // Editar existente
      nuevos = periodosActuales.map((p, i) =>
        i === editingIndex ? { ...p, ...formData } : p
      );
    } else {
      // Agregar nuevo
      nuevos = [...periodosActuales, formData];
    }

    closeModal();
    await guardarPeriodos(nuevos);
  };

  const handleDelete = (index) => {
    Alert.alert(
      'Eliminar período',
      '¿Estás seguro de que deseas eliminar este período?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const nuevos = (periodoAcademico?.periodos || []).filter(
              (_, i) => i !== index
            );
            await guardarPeriodos(nuevos);
          },
        },
      ]
    );
  };

  const renderSubPeriodoCard = (periodo, index) => (
    <Card key={index} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <View style={styles.numeroBadge}>
            <Text style={styles.numeroBadgeText}>{index + 1}</Text>
          </View>
          <Text style={styles.cardNombre}>{periodo.nombre}</Text>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => openModal(periodo, index)}
          >
            <Ionicons name="pencil" size={18} color={colors.primary[600]} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => handleDelete(index)}
          >
            <Ionicons name="trash" size={18} color={colors.red[500]} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="calendar-outline" size={15} color={colors.gray[500]} />
        <Text style={styles.infoText}>
          {periodo.inicio} — {periodo.fin}
        </Text>
      </View>
    </Card>
  );

  const renderModal = () => (
    <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeModal}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingIndex !== null ? 'Editar Período' : 'Nuevo Período'}
            </Text>
            <TouchableOpacity onPress={closeModal}>
              <Ionicons name="close" size={24} color={colors.gray[600]} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <Input
              label="Nombre del período"
              placeholder="Ej: Primer Período"
              value={formData.nombre}
              onChangeText={(text) => setFormData({ ...formData, nombre: text })}
            />
            <DatePickerField
              label="Fecha de inicio"
              value={formData.inicio}
              onChange={(date) => setFormData({ ...formData, inicio: date })}
            />
            <DatePickerField
              label="Fecha de fin"
              value={formData.fin}
              onChange={(date) => setFormData({ ...formData, fin: date })}
            />
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

  if (loading && !periodoAcademico) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={styles.loadingText}>Cargando períodos...</Text>
      </View>
    );
  }

  const periodos = periodoAcademico?.periodos || [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[700]} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.headerText}>
            {periodoAcademico?.nombre || 'Períodos'}
          </Text>
          <Text style={styles.headerSubtext}>
            {periodos.length} períodos configurados
          </Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {periodos.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="Sin períodos configurados"
            message="Agrega los períodos del año lectivo"
          />
        ) : (
          <View style={styles.list}>
            {periodos.map((p, i) => renderSubPeriodoCard(p, i))}
          </View>
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
  list: { padding: spacing.lg },
  card: { marginBottom: spacing.md },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  numeroBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
  },
  numeroBadgeText: { fontSize: fontSize.xs, fontWeight: 'bold', color: colors.white },
  cardNombre: { fontSize: fontSize.base, fontWeight: '600', color: colors.gray[900] },
  cardActions: { flexDirection: 'row', gap: spacing.sm },
  iconButton: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[100],
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  infoText: { fontSize: fontSize.sm, color: colors.gray[600] },
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
    maxHeight: '80%',
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

export default ConfigSubPeriodosScreen;