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
import { tipoDocumentoService } from '../../../services/tipoDocumentoService';

// Tipos predefinidos que vienen del seed del backend
const TIPOS_SISTEMA = ['CC', 'TI'];

const FORM_INITIAL = { nombre: '' };

const ConfigTiposDocumentoScreen = () => {
  const navigation = useNavigation();
  const [tipos, setTipos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTipo, setEditingTipo] = useState(null);
  const [formData, setFormData] = useState(FORM_INITIAL);

  // ─── Cargar ─────────────────────────────────────────────────────────────────
  const loadTipos = async () => {
    setLoading(true);
    try {
      const data = await tipoDocumentoService.listar();
      setTipos(data);
    } catch (error) {
      console.error('Error cargando tipos de documento:', error);
      Alert.alert('Error', 'No se pudieron cargar los tipos de documento.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTipos();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTipos();
    setRefreshing(false);
  }, []);

  const esSistema = (nombre) => TIPOS_SISTEMA.includes(nombre);

  // ─── Modal ──────────────────────────────────────────────────────────────────
  const openModal = (tipo = null) => {
    setEditingTipo(tipo);
    setFormData({ nombre: tipo?.nombre || '' });
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingTipo(null);
    setFormData(FORM_INITIAL);
  };

  // ─── Guardar ────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!formData.nombre.trim()) {
      Alert.alert('Campo requerido', 'El nombre del tipo de documento es obligatorio.');
      return;
    }
    setSaving(true);
    try {
      if (editingTipo) {
        await tipoDocumentoService.actualizar(editingTipo.id, {
          ...editingTipo,
          nombre: formData.nombre,
        });
      } else {
        await tipoDocumentoService.crear({ nombre: formData.nombre });
      }
      closeModal();
      await loadTipos();
    } catch (error) {
      console.error('Error guardando tipo de documento:', error);
      Alert.alert('Error', 'No se pudo guardar el tipo de documento.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Eliminar ────────────────────────────────────────────────────────────────
  const handleDelete = (tipo) => {
    if (esSistema(tipo.nombre)) {
      Alert.alert('No permitido', 'Los tipos de documento predeterminados no se pueden eliminar.');
      return;
    }
    Alert.alert(
      'Eliminar tipo de documento',
      `¿Estás seguro de que deseas eliminar "${tipo.nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await tipoDocumentoService.eliminar(tipo.id);
              await loadTipos();
            } catch (error) {
              console.error('Error eliminando tipo:', error);
              Alert.alert('Error', 'No se pudo eliminar el tipo de documento.');
            }
          },
        },
      ]
    );
  };

  // ─── Render card ─────────────────────────────────────────────────────────────
  const renderTipoCard = (tipo) => {
    const predefinido = esSistema(tipo.nombre);

    return (
      <Card key={tipo.id} style={styles.tipoCard}>
        <View style={styles.tipoRow}>
          <View style={styles.tipoIconContainer}>
            <Ionicons name="document-text" size={22} color={colors.primary[600]} />
          </View>
          <View style={styles.tipoTexts}>
            <View style={styles.tipoTitleRow}>
              <Text style={styles.tipoNombre}>{tipo.nombre}</Text>
              {predefinido && (
                <View style={styles.sistemaBadge}>
                  <Text style={styles.sistemaBadgeText}>Sistema</Text>
                </View>
              )}
            </View>
            <Text style={styles.tipoSubtext}>
              {predefinido ? 'Tipo predefinido' : 'Tipo personalizado'}
            </Text>
          </View>
          <View style={styles.tipoActions}>
            {!predefinido && (
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => openModal(tipo)}
              >
                <Ionicons name="pencil" size={18} color={colors.primary[600]} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => handleDelete(tipo)}
            >
              <Ionicons
                name="trash"
                size={18}
                color={predefinido ? colors.gray[300] : colors.red[500]}
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
              {editingTipo ? 'Editar Tipo de Documento' : 'Nuevo Tipo de Documento'}
            </Text>
            <TouchableOpacity onPress={closeModal}>
              <Ionicons name="close" size={24} color={colors.gray[600]} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <Input
              label="Nombre"
              placeholder="Ej: NIT, PEP, DIE..."
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

  if (loading && tipos.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={styles.loadingText}>Cargando tipos de documento...</Text>
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
          <Text style={styles.headerText}>Tipos de Documento</Text>
          <Text style={styles.headerSubtext}>{tipos.length} tipos configurados</Text>
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
            Los tipos predeterminados (CC, TI) no se pueden eliminar. Puedes agregar tipos adicionales según las necesidades de tu institución.
          </Text>
        </View>

        {tipos.length === 0 ? (
          <EmptyState
            icon="document-text-outline"
            title="No hay tipos de documento"
            message="Agrega los tipos de documento que maneja tu institución"
          />
        ) : (
          <View style={styles.list}>{tipos.map(renderTipoCard)}</View>
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
  tipoCard: { marginBottom: spacing.sm },
  tipoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  tipoIconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipoTexts: { flex: 1 },
  tipoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 2,
  },
  tipoNombre: { fontSize: fontSize.base, fontWeight: '600', color: colors.gray[900] },
  sistemaBadge: {
    backgroundColor: colors.gray[200],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  sistemaBadgeText: { fontSize: fontSize.xs, fontWeight: '600', color: colors.gray[700] },
  tipoSubtext: { fontSize: fontSize.xs, color: colors.gray[500] },
  tipoActions: { flexDirection: 'row', gap: spacing.sm },
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

export default ConfigTiposDocumentoScreen;