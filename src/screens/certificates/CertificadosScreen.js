import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../../components/common/Card';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';
import { certificadoService } from '../../services/certificadoService';
import { periodoService } from '../../services/periodoService';
import { authService } from '../../services/authService';

const TIPOS_CERTIFICADO = [
  {
    id: 'estudio',
    titulo: 'Certificado de Estudios',
    descripcion: 'Certifica que estás matriculado en la institución',
    icono: 'school-outline',
    color: colors.primary[600],
  },
  {
    id: 'notas',
    titulo: 'Certificado de Notas',
    descripcion: 'Incluye tus calificaciones del período seleccionado',
    icono: 'document-text-outline',
    color: colors.success[600],
  },
  {
    id: 'constancia',
    titulo: 'Constancia de Matrícula',
    descripcion: 'Certifica tu condición de estudiante activo',
    icono: 'checkmark-circle-outline',
    color: colors.warning[600],
  },
];

const CertificadosScreen = () => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [generando, setGenerando] = useState(null);
  const [periodos, setPeriodos] = useState([]);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState(null);
  const [showPeriodoModal, setShowPeriodoModal] = useState(false);
  const [certificadoPendiente, setCertificadoPendiente] = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadPeriodos();
    }, [])
  );

  const loadPeriodos = async () => {
    try {
      const data = await periodoService.listarActivos();
      setPeriodos(Array.isArray(data) ? data : []);
      if (data.length > 0 && !periodoSeleccionado) {
        setPeriodoSeleccionado(data[0]);
      }
    } catch (error) {
      console.error('Error cargando períodos:', error);
    }
  };

  const generarCertificado = async (tipo) => {
    // Para notas, necesitamos seleccionar período
    if (tipo === 'notas' && !periodoSeleccionado) {
      Alert.alert('Selecciona un período', 'Debes seleccionar un período académico para el certificado de notas.');
      return;
    }

    setGenerando(tipo);

    try {
      let pdfData;
      let filename;

      switch (tipo) {
        case 'estudio':
          pdfData = await certificadoService.generarCertificadoEstudio();
          filename = 'certificado_estudios.pdf';
          break;
        case 'notas':
          pdfData = await certificadoService.generarCertificadoNotas(periodoSeleccionado?.id);
          filename = 'certificado_notas.pdf';
          break;
        case 'constancia':
          pdfData = await certificadoService.generarConstancia();
          filename = 'constancia.pdf';
          break;
      }

      // Descargar PDF
      certificadoService.descargarPDF(pdfData, filename);

    } catch (error) {
      console.error('Error generando certificado:', error);
      Alert.alert('Error', 'No se pudo generar el certificado. Intenta nuevamente.');
    } finally {
      setGenerando(null);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPeriodos();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIconWrap}>
          <Ionicons name="ribbon" size={26} color={colors.primary[600]} />
        </View>
        <View>
          <Text style={styles.headerText}>Certificados</Text>
          <Text style={styles.headerSubtext}>Genera tus certificados automáticamente</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Info box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={colors.primary[600]} />
          <Text style={styles.infoText}>
            Los certificados se generan automáticamente con la información actual de tu matrícula
            y los datos de la institución. La fecha de expedición será el día de hoy.
          </Text>
        </View>

        {/* Selector de período */}
        <View style={styles.periodoSection}>
          <Text style={styles.periodoLabel}>Período Académico:</Text>
          <TouchableOpacity
            style={styles.periodoButton}
            onPress={() => setShowPeriodoModal(true)}
          >
            <Text style={styles.periodoButtonText}>
              {periodoSeleccionado?.nombre || 'Seleccionar período'}
            </Text>
            <Ionicons name="chevron-down" size={18} color={colors.gray[600]} />
          </TouchableOpacity>
        </View>

        {/* Certificados disponibles */}
        <Text style={styles.sectionTitle}>Certificados Disponibles</Text>

        {TIPOS_CERTIFICADO.map((cert) => (
          <Card key={cert.id} style={styles.certCard}>
            <View style={styles.certHeader}>
              <View style={[styles.certIcon, { backgroundColor: cert.color + '20' }]}>
                <Ionicons name={cert.icono} size={24} color={cert.color} />
              </View>
              <View style={styles.certInfo}>
                <Text style={styles.certTitulo}>{cert.titulo}</Text>
                <Text style={styles.certDesc}>{cert.descripcion}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.generarButton, generando === cert.id && styles.generarButtonDisabled]}
              onPress={() => generarCertificado(cert.id)}
              disabled={generando !== null}
            >
              {generando === cert.id ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Ionicons name="download-outline" size={18} color={colors.white} />
                  <Text style={styles.generarButtonText}>Generar PDF</Text>
                </>
              )}
            </TouchableOpacity>
          </Card>
        ))}

        <View style={{ height: spacing.xl }} />
      </ScrollView>

      {/* Modal selector de período */}
      {showPeriodoModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Período</Text>
              <TouchableOpacity onPress={() => setShowPeriodoModal(false)}>
                <Ionicons name="close" size={24} color={colors.gray[600]} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {periodos.map((periodo) => (
                <TouchableOpacity
                  key={periodo.id}
                  style={[
                    styles.periodoOption,
                    periodoSeleccionado?.id === periodo.id && styles.periodoOptionSelected,
                  ]}
                  onPress={() => {
                    setPeriodoSeleccionado(periodo);
                    setShowPeriodoModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.periodoOptionText,
                      periodoSeleccionado?.id === periodo.id && styles.periodoOptionTextSelected,
                    ]}
                  >
                    {periodo.nombre}
                  </Text>
                  {periodoSeleccionado?.id === periodo.id && (
                    <Ionicons name="checkmark" size={20} color={colors.primary[600]} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },

  header: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerIconWrap: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.gray[900] },
  headerSubtext: { fontSize: fontSize.sm, color: colors.gray[500], marginTop: 2 },

  content: { flex: 1, padding: spacing.lg },

  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  infoText: { flex: 1, fontSize: fontSize.sm, color: colors.gray[700], lineHeight: 20 },

  periodoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  periodoLabel: { fontSize: fontSize.base, fontWeight: '600', color: colors.gray[700] },
  periodoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray[300],
    backgroundColor: colors.white,
  },
  periodoButtonText: { fontSize: fontSize.sm, color: colors.gray[700] },

  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: spacing.md,
  },

  certCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  certHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  certIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  certInfo: { flex: 1 },
  certTitulo: { fontSize: fontSize.base, fontWeight: '700', color: colors.gray[900] },
  certDesc: { fontSize: fontSize.sm, color: colors.gray[500], marginTop: 2 },

  generarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary[600],
  },
  generarButtonDisabled: { backgroundColor: colors.gray[400] },
  generarButtonText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.white },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '60%',
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

  periodoOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  periodoOptionSelected: { backgroundColor: colors.primary[50] },
  periodoOptionText: { fontSize: fontSize.base, color: colors.gray[700] },
  periodoOptionTextSelected: { color: colors.primary[700], fontWeight: '600' },
});

export default CertificadosScreen;