import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, TextInput, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../../../components/common/Card';
import EmptyState from '../../../components/common/EmptyState';
import { colors, spacing, fontSize, borderRadius } from '../../../constants/theme';
import { certificadoService } from '../../../services/certificadoService';

const TIPOS_CERTIFICADO = [
  { value: 'ESTUDIO', label: 'Certificado de Estudios', descripcion: 'Certifica que el estudiante está matriculado' },
  { value: 'NOTAS', label: 'Certificado de Notas', descripcion: 'Incluye las calificaciones del período' },
  { value: 'CONSTANCIA', label: 'Constancia', descripcion: 'Certifica que es estudiante activo' },
];

const VARIABLES_DISPONIBLES = [
  '{institucion}', '{nit}', '{direccion}', '{estudiante}',
  '{tipoDocumento}', '{numeroDocumento}', '{grado}', '{periodo}',
  '{fecha}', '{año}'
];

const ConfigCertificadosScreen = () => {
  const [plantillas, setPlantillas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [plantillaActual, setPlantillaActual] = useState(null);
  const [formulario, setFormulario] = useState({
    tipo: '',
    titulo: '',
    contenido: '',
  });

  const cargarPlantillas = async () => {
    setLoading(true);
    try {
      const data = await certificadoService.listarPlantillas();
      setPlantillas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error cargando plantillas:', error);
      setPlantillas([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { cargarPlantillas(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarPlantillas();
    setRefreshing(false);
  };

  const abrirModalNueva = () => {
    setPlantillaActual(null);
    setFormulario({ tipo: '', titulo: '', contenido: '' });
    setModalVisible(true);
  };

  const abrirModalEditar = (plantilla) => {
    setPlantillaActual(plantilla);
    setFormulario({
      tipo: plantilla.tipo,
      titulo: plantilla.titulo || '',
      contenido: plantilla.contenido || '',
    });
    setModalVisible(true);
  };

  const guardarPlantilla = async () => {
    if (!formulario.tipo || !formulario.titulo || !formulario.contenido) {
      alert('Complete todos los campos');
      return;
    }

    try {
      if (plantillaActual) {
        await certificadoService.actualizarPlantilla(plantillaActual.id, formulario);
        alert('Plantilla actualizada correctamente');
      } else {
        await certificadoService.crearPlantilla(formulario);
        alert('Plantilla creada correctamente');
      }
      setModalVisible(false);
      cargarPlantillas();
    } catch (error) {
      console.error('Error guardando plantilla:', error);
      alert('Error al guardar la plantilla');
    }
  };

  const insertarVariable = (variable) => {
    setFormulario(prev => ({
      ...prev,
      contenido: prev.contenido + ' ' + variable,
    }));
  };

  const obtenerInfoTipo = (tipo) => {
    return TIPOS_CERTIFICADO.find(t => t.value === tipo) || { label: tipo, descripcion: '' };
  };

  if (loading && plantillas.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerText}>Certificados</Text>
          <Text style={styles.headerSubtext}>
            {plantillas.length} plantilla{plantillas.length !== 1 ? 's' : ''} configurada{plantillas.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={abrirModalNueva}>
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
            Las plantillas de certificados definen el contenido y formato de los documentos
            que los estudiantes pueden generar automáticamente.
          </Text>
        </View>

        {plantillas.length === 0 ? (
          <EmptyState
            icon="document-text-outline"
            title="Sin plantillas"
            message="Crea la primera plantilla de certificado"
          />
        ) : (
          plantillas.map(plantilla => {
            const tipoInfo = obtenerInfoTipo(plantilla.tipo);
            return (
              <Card key={plantilla.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleWrap}>
                    <View style={[styles.tipoBadge, plantilla.activo ? styles.tipoBadgeActive : null]}>
                      <Text style={[styles.tipoBadgeText, plantilla.activo ? styles.tipoBadgeTextActive : null]}>
                        {tipoInfo.label}
                      </Text>
                    </View>
                    {plantilla.activo && (
                      <View style={styles.activeBadge}>
                        <Ionicons name="checkmark-circle" size={14} color={colors.success[600]} />
                        <Text style={styles.activeBadgeText}>Activa</Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity style={styles.editButton} onPress={() => abrirModalEditar(plantilla)}>
                    <Ionicons name="pencil" size={18} color={colors.primary[600]} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.cardTitulo}>{plantilla.titulo}</Text>
                <Text style={styles.cardContenido} numberOfLines={3}>
                  {plantilla.contenido}
                </Text>
                <Text style={styles.version}>Versión {plantilla.version}</Text>
              </Card>
            );
          })
        )}

        <View style={{ height: spacing.xl }} />
      </ScrollView>

      {/* Modal de edición */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {plantillaActual ? 'Editar Plantilla' : 'Nueva Plantilla'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.gray[600]} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Tipo */}
              {!plantillaActual && (
                <View style={styles.field}>
                  <Text style={styles.label}>Tipo de Certificado</Text>
                  <View style={styles.tipoOptions}>
                    {TIPOS_CERTIFICADO.map(tipo => (
                      <TouchableOpacity
                        key={tipo.value}
                        style={[
                          styles.tipoOption,
                          formulario.tipo === tipo.value && styles.tipoOptionSelected,
                        ]}
                        onPress={() => setFormulario(prev => ({ ...prev, tipo: tipo.value }))}
                      >
                        <Text style={[
                          styles.tipoOptionText,
                          formulario.tipo === tipo.value && styles.tipoOptionTextSelected,
                        ]}>
                          {tipo.label}
                        </Text>
                        <Text style={styles.tipoOptionDesc}>{tipo.descripcion}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Título */}
              <View style={styles.field}>
                <Text style={styles.label}>Título del Certificado</Text>
                <TextInput
                  style={styles.input}
                  value={formulario.titulo}
                  onChangeText={(text) => setFormulario(prev => ({ ...prev, titulo: text }))}
                  placeholder="Ej: CERTIFICADO DE ESTUDIOS"
                  placeholderTextColor={colors.gray[400]}
                />
              </View>

              {/* Contenido */}
              <View style={styles.field}>
                <Text style={styles.label}>Contenido</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formulario.contenido}
                  onChangeText={(text) => setFormulario(prev => ({ ...prev, contenido: text }))}
                  placeholder="Escribe el contenido del certificado..."
                  placeholderTextColor={colors.gray[400]}
                  multiline
                  numberOfLines={6}
                />
              </View>

              {/* Variables */}
              <View style={styles.field}>
                <Text style={styles.label}>Variables disponibles</Text>
                <Text style={styles.hint}>Toca para insertar:</Text>
                <View style={styles.variablesGrid}>
                  {VARIABLES_DISPONIBLES.map((variable) => (
                    <TouchableOpacity
                      key={variable}
                      style={styles.variableChip}
                      onPress={() => insertarVariable(variable)}
                    >
                      <Text style={styles.variableText}>{variable}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={guardarPlantilla}>
                <Text style={styles.saveButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: spacing.md, color: colors.gray[600] },

  header: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerInfo: { flex: 1 },
  headerText: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.gray[900] },
  headerSubtext: { fontSize: fontSize.sm, color: colors.gray[500], marginTop: 2 },
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
    gap: spacing.sm,
    margin: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.md,
  },
  infoText: { flex: 1, fontSize: fontSize.sm, color: colors.gray[700], lineHeight: 20 },

  card: { marginHorizontal: spacing.lg, marginBottom: spacing.md, padding: spacing.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  cardTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  tipoBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.gray[100],
  },
  tipoBadgeActive: { backgroundColor: colors.primary[50] },
  tipoBadgeText: { fontSize: fontSize.xs, fontWeight: '600', color: colors.gray[600] },
  tipoBadgeTextActive: { color: colors.primary[700] },
  activeBadge: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  activeBadgeText: { fontSize: fontSize.xs, color: colors.success[600], fontWeight: '500' },
  editButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[100],
  },
  cardTitulo: { fontSize: fontSize.base, fontWeight: '700', color: colors.gray[900], marginBottom: spacing.xs },
  cardContenido: { fontSize: fontSize.sm, color: colors.gray[600], lineHeight: 20 },
  version: { fontSize: fontSize.xs, color: colors.gray[400], marginTop: spacing.sm },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  modalTitle: { fontSize: fontSize.lg, fontWeight: 'bold', color: colors.gray[900] },
  modalBody: { padding: spacing.lg, maxHeight: 400 },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },

  field: { marginBottom: spacing.lg },
  label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.gray[700], marginBottom: spacing.xs },
  hint: { fontSize: fontSize.xs, color: colors.gray[400], marginBottom: spacing.xs },

  input: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.base,
    color: colors.gray[900],
  },
  textArea: { height: 120, textAlignVertical: 'top' },

  tipoOptions: { gap: spacing.sm },
  tipoOption: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray[300],
  },
  tipoOptionSelected: { borderColor: colors.primary[600], backgroundColor: colors.primary[50] },
  tipoOptionText: { fontSize: fontSize.base, fontWeight: '600', color: colors.gray[700] },
  tipoOptionTextSelected: { color: colors.primary[700] },
  tipoOptionDesc: { fontSize: fontSize.xs, color: colors.gray[500], marginTop: 2 },

  variablesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  variableChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.sm,
  },
  variableText: { fontSize: fontSize.xs, color: colors.primary[600], fontFamily: 'monospace' },

  cancelButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray[300],
    alignItems: 'center',
  },
  cancelButtonText: { fontSize: fontSize.base, color: colors.gray[700], fontWeight: '600' },
  saveButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
  },
  saveButtonText: { fontSize: fontSize.base, color: colors.white, fontWeight: '600' },
});

export default ConfigCertificadosScreen;