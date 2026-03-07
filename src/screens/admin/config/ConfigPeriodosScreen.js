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
import { useNavigation } from '@react-navigation/native';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import EmptyState from '../../../components/common/EmptyState';
import { colors, spacing, fontSize, borderRadius } from '../../../constants/theme';
import { periodoAcademicoService } from '../../../services/periodoAcademicoService';
import DatePickerField from '../../../components/common/DatePickerField';

const FORM_INITIAL = {
  nombre: '',
  fechaInicio: '',
  fechaFin: '',
  activo: true,
};

const ConfigPeriodosScreen = () => {
  const navigation = useNavigation();
  const [periodosAcademicos, setPeriodosAcademicos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPeriodo, setEditingPeriodo] = useState(null);
  const [formData, setFormData] = useState(FORM_INITIAL);

  // ─── Cargar ─────────────────────────────────────────────────────────────────
  const loadPeriodos = async () => {
    setLoading(true);
    try {
      const data = await periodoAcademicoService.listar();
      setPeriodosAcademicos(data);
    } catch (error) {
      console.error('Error cargando períodos:', error);
      Alert.alert('Error', 'No se pudieron cargar los períodos académicos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPeriodos();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPeriodos();
    setRefreshing(false);
  }, []);

  // ─── Modal ──────────────────────────────────────────────────────────────────
  const openModal = (periodo = null) => {
    if (periodo) {
      setEditingPeriodo(periodo);
      setFormData({
        nombre: periodo.nombre,
        fechaInicio: periodo.fechaInicio,
        fechaFin: periodo.fechaFin,
        activo: periodo.activo,
      });
    } else {
      setEditingPeriodo(null);
      setFormData(FORM_INITIAL);
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingPeriodo(null);
    setFormData(FORM_INITIAL);
  };

  // ─── Guardar ────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!formData.nombre || !formData.fechaInicio || !formData.fechaFin) {
      Alert.alert('Campos requeridos', 'Por favor completa todos los campos.');
      return;
    }
    setSaving(true);
    try {
      if (editingPeriodo) {
        await periodoAcademicoService.actualizar(editingPeriodo.id, {
          ...editingPeriodo,
          ...formData,
        });
      } else {
        await periodoAcademicoService.crear(formData);
      }
      closeModal();
      await loadPeriodos();
    } catch (error) {
      console.error('Error guardando período:', error);
      Alert.alert('Error', 'No se pudo guardar el período académico.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Eliminar ────────────────────────────────────────────────────────────────
  const handleDelete = (periodoId) => {
    Alert.alert(
      'Eliminar período',
      '¿Estás seguro de que deseas eliminar este período académico?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await periodoAcademicoService.eliminar(periodoId);
              await loadPeriodos();
            } catch (error) {
              console.error('Error eliminando período:', error);
              Alert.alert('Error', 'No se pudo eliminar el período académico.');
            }
          },
        },
      ]
    );
  };

  // ─── Toggle activo ───────────────────────────────────────────────────────────
  const toggleActivo = async (periodo) => {
    try {
      await periodoAcademicoService.actualizar(periodo.id, {
        ...periodo,
        activo: !periodo.activo,
      });
      await loadPeriodos();
    } catch (error) {
      console.error('Error actualizando estado:', error);
      Alert.alert('Error', 'No se pudo actualizar el estado del período.');
    }
  };

  // ─── Render card ─────────────────────────────────────────────────────────────
  const renderPeriodoCard = (periodo) => (
    <Card key={periodo.id} style={styles.periodoCard}>
      <View style={styles.periodoHeader}>
        <View style={styles.periodoTitleContainer}>
          <Text style={styles.periodoNombre}>{periodo.nombre}</Text>
          <TouchableOpacity onPress={() => toggleActivo(periodo)}>
            <View style={periodo.activo ? styles.activeBadge : styles.inactiveBadge}>
              <Text style={periodo.activo ? styles.activeBadgeText : styles.inactiveBadgeText}>
                {periodo.activo ? 'Activo' : 'Inactivo'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.periodoActions}>
          <TouchableOpacity style={styles.iconButton} onPress={() => openModal(periodo)}>
            <Ionicons name="pencil" size={20} color={colors.primary[600]} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => handleDelete(periodo.id)}>
            <Ionicons name="trash" size={20} color={colors.red[500]} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.periodoInfo}>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color={colors.gray[600]} />
          <Text style={styles.infoText}>
            {periodo.fechaInicio} - {periodo.fechaFin}
          </Text>
        </View>
        {periodo.periodos && periodo.periodos.length > 0 && (
          <View style={styles.infoRow}>
            <Ionicons name="list-outline" size={16} color={colors.gray[600]} />
            <Text style={styles.infoText}>
              {periodo.periodos.length} períodos configurados
            </Text>
          </View>
        )}
      </View>

      {periodo.periodos && periodo.periodos.length > 0 && (
        <View style={styles.subPeriodos}>
          <Text style={styles.subPeriodosTitle}>Períodos:</Text>
          {periodo.periodos.map((sub) => (
            <View key={sub.id} style={styles.subPeriodoItem}>
              <View style={styles.subPeriodoDot} />
              <View style={styles.subPeriodoInfo}>
                <Text style={styles.subPeriodoNombre}>{sub.nombre}</Text>
                <Text style={styles.subPeriodoFechas}>
                  {sub.inicio} - {sub.fin}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={styles.configButton}
        onPress={() => navigation.navigate('ConfigSubPeriodos', { periodoId: periodo.id })}
      >
        <Ionicons name="settings-outline" size={16} color={colors.primary[600]} />
        <Text style={styles.configButtonText}>Configurar períodos</Text>
      </TouchableOpacity>
    </Card>
  );

  // ─── Modal ───────────────────────────────────────────────────────────────────
  const renderModal = () => (
    <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeModal}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingPeriodo ? 'Editar Año Lectivo' : 'Nuevo Año Lectivo'}
            </Text>
            <TouchableOpacity onPress={closeModal}>
              <Ionicons name="close" size={24} color={colors.gray[600]} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <Input
              label="Nombre del año lectivo"
              placeholder="Ej: 2025"
              value={formData.nombre}
              onChangeText={(text) => setFormData({ ...formData, nombre: text })}
            />
            <DatePickerField
              label="Fecha de inicio"
              value={formData.fechaInicio}
              onChange={(date) => setFormData({ ...formData, fechaInicio: date })}
            />
            <DatePickerField
              label="Fecha de fin"
              value={formData.fechaFin}
              onChange={(date) => setFormData({ ...formData, fechaFin: date })}
            />
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Año lectivo activo</Text>
              <TouchableOpacity
                style={[styles.switch, formData.activo && styles.switchActive]}
                onPress={() => setFormData({ ...formData, activo: !formData.activo })}
              >
                <View style={[styles.switchThumb, formData.activo && styles.switchThumbActive]} />
              </TouchableOpacity>
            </View>
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

  if (loading && periodosAcademicos.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={styles.loadingText}>Cargando períodos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[700]} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.headerText}>Períodos Académicos</Text>
          <Text style={styles.headerSubtext}>{periodosAcademicos.length} años lectivos</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {periodosAcademicos.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="No hay períodos académicos"
            message="Crea el primer año lectivo para comenzar"
          />
        ) : (
          <View style={styles.list}>{periodosAcademicos.map(renderPeriodoCard)}</View>
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
  periodoCard: { marginBottom: spacing.lg },
  periodoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  periodoTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  periodoNombre: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.gray[900] },
  activeBadge: {
    backgroundColor: colors.primary[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  activeBadgeText: { fontSize: fontSize.xs, fontWeight: '600', color: colors.primary[700] },
  inactiveBadge: {
    backgroundColor: colors.gray[200],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  inactiveBadgeText: { fontSize: fontSize.xs, fontWeight: '600', color: colors.gray[500] },
  periodoActions: { flexDirection: 'row', gap: spacing.sm },
  iconButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[100],
  },
  periodoInfo: { gap: spacing.sm, marginBottom: spacing.md },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  infoText: { fontSize: fontSize.sm, color: colors.gray[600] },
  subPeriodos: {
    backgroundColor: colors.gray[50],
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  subPeriodosTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: spacing.sm,
  },
  subPeriodoItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs },
  subPeriodoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary[600],
    marginRight: spacing.sm,
  },
  subPeriodoInfo: { flex: 1 },
  subPeriodoNombre: { fontSize: fontSize.sm, fontWeight: '500', color: colors.gray[800] },
  subPeriodoFechas: { fontSize: fontSize.xs, color: colors.gray[600] },
  configButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary[600],
    gap: spacing.xs,
  },
  configButtonText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.primary[600] },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  switchLabel: { fontSize: fontSize.base, color: colors.gray[700] },
  switch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.gray[300],
    padding: 2,
    justifyContent: 'center',
  },
  switchActive: { backgroundColor: colors.primary[600] },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignSelf: 'flex-start',
  },
  switchThumbActive: { alignSelf: 'flex-end' },
  modalFooter: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
});

export default ConfigPeriodosScreen;