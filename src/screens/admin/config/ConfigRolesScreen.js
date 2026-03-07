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
import { rolService } from '../../../services/rolService';

// Roles predefinidos del sistema — no se pueden eliminar
const ROLES_SISTEMA = ['Administrador', 'Administrativo', 'Docente', 'Estudiante', 'PadreAcudiente'];

// Color por rol
const getRolColor = (nombre) => {
  const colores = {
    Administrador: '#dc2626',
    Administrativo: colors.primary[600],
    Docente: '#9333ea',
    Estudiante: '#16a34a',
    Padre: '#f59e0b',
  };
  return colores[nombre] || '#64748b';
};

const FORM_INITIAL = { nombre: '' };

const ConfigRolesScreen = () => {
  const navigation = useNavigation();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRol, setEditingRol] = useState(null);
  const [formData, setFormData] = useState(FORM_INITIAL);

  // ─── Cargar ─────────────────────────────────────────────────────────────────
  const loadRoles = async () => {
    setLoading(true);
    try {
      const data = await rolService.listar();
      setRoles(data);
    } catch (error) {
      console.error('Error cargando roles:', error);
      Alert.alert('Error', 'No se pudieron cargar los roles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRoles();
    setRefreshing(false);
  }, []);

  const esSistema = (nombre) => ROLES_SISTEMA.includes(nombre);

  // ─── Modal ──────────────────────────────────────────────────────────────────
  const openModal = (rol = null) => {
    setEditingRol(rol);
    setFormData({ nombre: rol?.nombre || '' });
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingRol(null);
    setFormData(FORM_INITIAL);
  };

  // ─── Guardar ────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!formData.nombre.trim()) {
      Alert.alert('Campo requerido', 'El nombre del rol es obligatorio.');
      return;
    }
    setSaving(true);
    try {
      if (editingRol) {
        await rolService.actualizar(editingRol.id, { nombre: formData.nombre });
      } else {
        await rolService.crear({ nombre: formData.nombre });
      }
      closeModal();
      await loadRoles();
    } catch (error) {
      console.error('Error guardando rol:', error);
      Alert.alert('Error', 'No se pudo guardar el rol.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Eliminar ────────────────────────────────────────────────────────────────
  const handleDelete = (rol) => {
    if (esSistema(rol.nombre)) {
      Alert.alert('No permitido', 'Los roles predeterminados del sistema no se pueden eliminar.');
      return;
    }
    Alert.alert(
      'Eliminar rol',
      `¿Estás seguro de que deseas eliminar el rol "${rol.nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await rolService.eliminar(rol.id);
              await loadRoles();
            } catch (error) {
              console.error('Error eliminando rol:', error);
              Alert.alert('Error', 'No se pudo eliminar el rol.');
            }
          },
        },
      ]
    );
  };

  // ─── Render card ─────────────────────────────────────────────────────────────
  const renderRolCard = (rol) => {
    const esPredefinido = esSistema(rol.nombre);
    const color = getRolColor(rol.nombre);

    return (
      <Card key={rol.id} style={styles.rolCard}>
        <View style={styles.rolHeader}>
          <View style={styles.rolInfo}>
            <View style={[styles.rolIcon, { backgroundColor: color }]}>
              <Ionicons name="shield-checkmark" size={24} color={colors.white} />
            </View>
            <View style={styles.rolTexts}>
              <View style={styles.rolTitleRow}>
                <Text style={styles.rolNombre}>{rol.nombre}</Text>
                {esPredefinido && (
                  <View style={styles.sistemaBadge}>
                    <Text style={styles.sistemaBadgeText}>Sistema</Text>
                  </View>
                )}
              </View>
              <Text style={styles.rolSubtext}>
                {esPredefinido ? 'Rol predefinido del sistema' : 'Rol personalizado'}
              </Text>
            </View>
          </View>

          <View style={styles.rolActions}>
            {!esPredefinido && (
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => openModal(rol)}
              >
                <Ionicons name="pencil" size={20} color={colors.primary[600]} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => handleDelete(rol)}
            >
              <Ionicons
                name="trash"
                size={20}
                color={esPredefinido ? colors.gray[300] : colors.red[500]}
              />
            </TouchableOpacity>
          </View>
        </View>
      </Card>
    );
  };

  // ─── Modal ───────────────────────────────────────────────────────────────────
  const renderModal = () => (
    <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeModal}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingRol ? 'Editar Rol' : 'Nuevo Rol'}
            </Text>
            <TouchableOpacity onPress={closeModal}>
              <Ionicons name="close" size={24} color={colors.gray[600]} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <Input
              label="Nombre del rol"
              placeholder="Ej: Coordinador"
              value={formData.nombre}
              onChangeText={(text) => setFormData({ nombre: text })}
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

  if (loading && roles.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={styles.loadingText}>Cargando roles...</Text>
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
          <Text style={styles.headerText}>Roles del Sistema</Text>
          <Text style={styles.headerSubtext}>{roles.length} roles configurados</Text>
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
            Los roles predeterminados del sistema no se pueden eliminar. Puedes agregar roles personalizados según la estructura de tu institución.
          </Text>
        </View>

        {roles.length === 0 ? (
          <EmptyState
            icon="shield-checkmark-outline"
            title="No hay roles configurados"
            message="Crea el primer rol para comenzar"
          />
        ) : (
          <View style={styles.list}>{roles.map(renderRolCard)}</View>
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
  list: { padding: spacing.lg },
  rolCard: { marginBottom: spacing.md },
  rolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rolInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rolIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rolTexts: { flex: 1 },
  rolTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  rolNombre: { fontSize: fontSize.lg, fontWeight: 'bold', color: colors.gray[900] },
  sistemaBadge: {
    backgroundColor: colors.gray[200],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  sistemaBadgeText: { fontSize: fontSize.xs, fontWeight: '600', color: colors.gray[700] },
  rolSubtext: { fontSize: fontSize.sm, color: colors.gray[500] },
  rolActions: { flexDirection: 'row', gap: spacing.sm },
  iconButton: {
    width: 36,
    height: 36,
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

export default ConfigRolesScreen;