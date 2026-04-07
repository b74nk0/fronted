import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  TouchableOpacity, RefreshControl, Modal, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';
import { cursoService } from '../../services/cursoService';
import { notaService } from '../../services/notaService';
import { periodoService } from '../../services/periodoService';
import { estudianteCursoService } from '../../services/estudianteCursoService';
import { certificadoService } from '../../services/certificadoService';

const ReporteNotasAdminScreen = () => {
  const [cursos, setCursos] = useState([]);
  const [cursoSeleccionado, setCursoSeleccionado] = useState(null);
  const [periodos, setPeriodos] = useState([]);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState(null);
  const [estudiantes, setEstudiantes] = useState([]);
  const [notasPorEstudiante, setNotasPorEstudiante] = useState({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalBoletin, setModalBoletin] = useState(false);
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadCursos();
      loadPeriodos();
    }, [])
  );

  const loadCursos = async () => {
    setLoading(true);
    try {
      const data = await cursoService.listar();
      setCursos(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error cargando cursos:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadPeriodos = async () => {
    try {
      const data = await periodoService.listarActivos();
      setPeriodos(data);
      if (data.length > 0 && !periodoSeleccionado) {
        setPeriodoSeleccionado(data[0]);
      }
    } catch (e) {
      console.error('Error cargando períodos:', e);
    }
  };

  const cargarEstudiantesYNotas = async () => {
    if (!cursoSeleccionado || !periodoSeleccionado) return;

    console.log('📚 Cargando estudiantes y notas...');
    console.log('  - Curso:', cursoSeleccionado.id, cursoSeleccionado.nombre);
    console.log('  - Período:', periodoSeleccionado.id, periodoSeleccionado.nombre);

    setLoading(true);
    try {
      // Cargar estudiantes del curso
      console.log('📋 Llamando a listarPorCursoYPeriodo...');
      const estudiantesData = await estudianteCursoService.listarPorCursoYPeriodo(
        cursoSeleccionado.id,
        periodoSeleccionado.id
      );
      console.log('✅ Estudiantes recibidos:', estudiantesData);
      const estudiantesArray = Array.isArray(estudiantesData) ? estudiantesData : [];
      setEstudiantes(estudiantesArray);

      // Cargar notas de cada estudiante
      const notasMap = {};
      for (const est of estudiantesArray) {
        try {
          console.log('📝 Obteniendo notas para estudiante:', est.estudiante?.id, est.estudiante?.nombre);
          const notasEst = await notaService.obtenerPorEstudianteYPeriodo(
            est.estudiante?.id,
            periodoSeleccionado.id
          );
          console.log('  Notas recibidas:', notasEst);
          notasMap[est.estudiante?.id] = Array.isArray(notasEst) ? notasEst : [];
        } catch (e) {
          console.error('  Error obteniendo notas:', e);
          notasMap[est.estudiante?.id] = [];
        }
      }
      setNotasPorEstudiante(notasMap);
      console.log('📊 Total estudiantes:', estudiantesArray.length);
      console.log('📊 Total notas cargadas:', Object.keys(notasMap).length);
    } catch (e) {
      console.error('❌ Error cargando datos:', e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (cursoSeleccionado && periodoSeleccionado) {
      cargarEstudiantesYNotas();
    }
  }, [cursoSeleccionado, periodoSeleccionado]);

  const onRefresh = () => {
    setRefreshing(true);
    loadCursos().finally(() => setRefreshing(false));
  };

  // Calcular promedio de un estudiante
  const calcularPromedioEstudiante = (estudianteId) => {
    const notas = notasPorEstudiante[estudianteId] || [];
    if (notas.length === 0) return null;
    const suma = notas.reduce((acc, n) => acc + (n.valor || 0), 0);
    return suma / notas.length;
  };

  // Agrupar notas por materia para un estudiante
  const agruparNotasPorMateria = (estudianteId) => {
    const notas = notasPorEstudiante[estudianteId] || [];
    const materias = {};
    notas.forEach(nota => {
      const materiaId = nota.asignacion?.materia?.id;
      if (!materias[materiaId]) {
        materias[materiaId] = {
          nombre: nota.asignacion?.materia?.nombre || 'Sin materia',
          notas: [],
        };
      }
      materias[materiaId].notas.push(nota);
    });
    return Object.values(materias);
  };

  // Contar aprobados y reprobados
  const getResumenCurso = () => {
    let aprobados = 0;
    let reprobados = 0;
    let sumaPromedios = 0;
    let conNotas = 0;

    estudiantes.forEach(est => {
      const prom = calcularPromedioEstudiante(est.estudiante?.id);
      if (prom !== null) {
        conNotas++;
        sumaPromedios += prom;
        if (prom >= 3) aprobados++;
        else reprobados++;
      }
    });

    return {
      aprobados,
      reprobados,
      promedioGeneral: conNotas > 0 ? sumaPromedios / conNotas : 0,
    };
  };

  const generarBoletin = (estudiante) => {
    setEstudianteSeleccionado(estudiante);
    setModalBoletin(true);
  };

  if (loading && cursos.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={styles.loadingText}>Cargando cursos...</Text>
      </View>
    );
  }

  if (!cursoSeleccionado) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="stats-chart" size={26} color={colors.primary[600]} />
          <Text style={styles.headerText}>Reporte de Notas</Text>
        </View>
        <ScrollView style={styles.content}>
          {cursos.length === 0 ? (
            <EmptyState
              icon="school-outline"
              title="Sin cursos"
              message="No hay cursos registrados"
            />
          ) : (
            <View style={styles.cursosList}>
              <Text style={styles.sectionTitle}>Selecciona un Curso</Text>
              {cursos.map(curso => (
                <TouchableOpacity
                  key={curso.id}
                  style={styles.cursoCard}
                  onPress={() => setCursoSeleccionado(curso)}
                >
                  <View style={styles.cursoIcon}>
                    <Ionicons name="people" size={24} color={colors.primary[600]} />
                  </View>
                  <View style={styles.cursoInfo}>
                    <Text style={styles.cursoNombre}>{curso.nombre}</Text>
                    <Text style={styles.cursoGrado}>{curso.grado?.nombre}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  const resumen = getResumenCurso();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCursoSeleccionado(null)}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[700]} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.headerText}>{cursoSeleccionado.nombre}</Text>
          <Text style={styles.headerSubtext}>{cursoSeleccionado.grado?.nombre}</Text>
        </View>
        <TouchableOpacity onPress={cargarEstudiantesYNotas}>
          <Ionicons name="refresh" size={24} color={colors.primary[600]} />
        </TouchableOpacity>
      </View>

      {/* Selector de Período */}
      <View style={styles.periodoSelector}>
        <Text style={styles.selectorLabel}>Período:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {periodos.map(periodo => (
            <TouchableOpacity
              key={periodo.id}
              style={[
                styles.periodoButton,
                periodoSeleccionado?.id === periodo.id && styles.periodoButtonActive
              ]}
              onPress={() => setPeriodoSeleccionado(periodo)}
            >
              <Text style={[
                styles.periodoButtonText,
                periodoSeleccionado?.id === periodo.id && styles.periodoButtonTextActive
              ]}>
                {periodo.nombre}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {!periodoSeleccionado ? (
          <EmptyState icon="calendar-outline" title="Sin período" message="Selecciona un período académico" />
        ) : (
          <View style={styles.reporteContainer}>
            {/* Resumen del curso */}
            <Card style={styles.resumenCard}>
              <View style={styles.resumenHeader}>
                <Ionicons name="analytics" size={24} color={colors.primary[600]} />
                <Text style={styles.resumenTitle}>Resumen del Período</Text>
              </View>
              <View style={styles.resumenGrid}>
                <View style={styles.resumenItem}>
                  <Text style={styles.resumenNumero}>{resumen.promedioGeneral.toFixed(2)}</Text>
                  <Text style={styles.resumenLabel}>Promedio</Text>
                </View>
                <View style={[styles.resumenItem, { backgroundColor: colors.success[50] }]}>
                  <Text style={[styles.resumenNumero, { color: colors.success[700] }]}>{resumen.aprobados}</Text>
                  <Text style={[styles.resumenLabel, { color: colors.success[700] }]}>Aprobados</Text>
                </View>
                <View style={[styles.resumenItem, { backgroundColor: colors.danger[50] }]}>
                  <Text style={[styles.resumenNumero, { color: colors.danger[700] }]}>{resumen.reprobados}</Text>
                  <Text style={[styles.resumenLabel, { color: colors.danger[700] }]}>Reprobados</Text>
                </View>
              </View>
            </Card>

            {/* Lista de estudiantes */}
            <Text style={styles.sectionTitle}>Estudiantes ({estudiantes.length})</Text>

            {estudiantes.length === 0 ? (
              <EmptyState icon="people-outline" title="Sin estudiantes" message="No hay estudiantes en este curso" />
            ) : (
              estudiantes.map((est, index) => {
                const promedio = calcularPromedioEstudiante(est.estudiante?.id);
                const materias = agruparNotasPorMateria(est.estudiante?.id);
                const totalNotas = materias.reduce((acc, m) => acc + m.notas.length, 0);

                return (
                  <Card key={est.id} style={styles.estudianteCard}>
                    <View style={styles.estudianteHeader}>
                      <View style={styles.estudianteInfo}>
                        <Text style={styles.estudianteNombre}>
                          {est.estudiante?.nombre} {est.estudiante?.apellido}
                        </Text>
                        <Text style={styles.estudianteDetalle}>
                          {materias.length} materias · {totalNotas} notas
                        </Text>
                      </View>
                      <View style={[
                        styles.promedioBadge,
                        { backgroundColor: promedio >= 3 ? colors.success[100] : promedio !== null ? colors.danger[100] : colors.gray[100] }
                      ]}>
                        <Text style={[
                          styles.promedioText,
                          { color: promedio >= 3 ? colors.success[700] : promedio !== null ? colors.danger[700] : colors.gray[600] }
                        ]}>
                          {promedio !== null ? promedio.toFixed(2) : 'N/A'}
                        </Text>
                      </View>
                    </View>

                    {/* Notas por materia */}
                    {materias.length > 0 && (
                      <View style={styles.materiasContainer}>
                        {materias.map((materia, idx) => {
                          const promMateria = materia.notas.reduce((acc, n) => acc + n.valor, 0) / materia.notas.length;
                          return (
                            <View key={idx} style={styles.materiaRow}>
                              <Text style={styles.materiaNombre} numberOfLines={1}>{materia.nombre}</Text>
                              <View style={styles.notasPreview}>
                                {materia.notas.slice(0, 4).map((n, i) => (
                                  <View key={i} style={[
                                    styles.notaMini,
                                    { backgroundColor: n.valor >= 3 ? colors.success[100] : colors.danger[100] }
                                  ]}>
                                    <Text style={[
                                      styles.notaMiniText,
                                      { color: n.valor >= 3 ? colors.success[700] : colors.danger[700] }
                                    ]}>
                                      {n.valor.toFixed(1)}
                                    </Text>
                                  </View>
                                ))}
                                {materia.notas.length > 4 && (
                                  <Text style={styles.masNotas}>+{materia.notas.length - 4}</Text>
                                )}
                              </View>
                              <Text style={[
                                styles.promedioMateria,
                                { color: promMateria >= 3 ? colors.success[700] : colors.danger[700] }
                              ]}>
                                {promMateria.toFixed(1)}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    )}

                    {/* Botón generar boletín */}
                    <TouchableOpacity
                      style={styles.boletinButton}
                      onPress={() => generarBoletin(est.estudiante)}
                    >
                      <Ionicons name="document-text" size={16} color={colors.primary[600]} />
                      <Text style={styles.boletinButtonText}>Generar Boletín</Text>
                    </TouchableOpacity>
                  </Card>
                );
              })
            )}

            <View style={{ height: spacing.xl }} />
          </View>
        )}
      </ScrollView>

      {/* Modal Boletín */}
      <Modal
        visible={modalBoletin}
        animationType="slide"
        transparent
        onRequestClose={() => setModalBoletin(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Boletín de Calificaciones</Text>
              <TouchableOpacity onPress={() => setModalBoletin(false)}>
                <Ionicons name="close" size={24} color={colors.gray[600]} />
              </TouchableOpacity>
            </View>

            {estudianteSeleccionado && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.boletinHeader}>
                  <Text style={styles.boletinEstudiante}>
                    {estudianteSeleccionado.nombre} {estudianteSeleccionado.apellido}
                  </Text>
                  <Text style={styles.boletinCurso}>
                    {cursoSeleccionado.nombre} - {cursoSeleccionado.grado?.nombre}
                  </Text>
                  <Text style={styles.boletinPeriodo}>
                    Período: {periodoSeleccionado?.nombre}
                  </Text>
                </View>

                {/* Tabla de materias */}
                <View style={styles.boletinTable}>
                  <View style={styles.boletinTableHeader}>
                    <Text style={[styles.boletinCell, { flex: 2 }]}>Materia</Text>
                    <Text style={[styles.boletinCell, { flex: 1 }]}>Notas</Text>
                    <Text style={[styles.boletinCell, { flex: 1 }]}>Promedio</Text>
                  </View>

                  {agruparNotasPorMateria(estudianteSeleccionado.id).map((materia, idx) => {
                    const promMateria = materia.notas.reduce((acc, n) => acc + n.valor, 0) / materia.notas.length;
                    return (
                      <View key={idx} style={styles.boletinTableRow}>
                        <Text style={[styles.boletinCell, { flex: 2 }]} numberOfLines={1}>
                          {materia.nombre}
                        </Text>
                        <Text style={[styles.boletinCell, { flex: 1 }]}>
                          {materia.notas.length}
                        </Text>
                        <Text style={[
                          styles.boletinCell,
                          { flex: 1, fontWeight: '700', color: promMateria >= 3 ? colors.success[700] : colors.danger[700] }
                        ]}>
                          {promMateria.toFixed(2)}
                        </Text>
                      </View>
                    );
                  })}

                  <View style={[styles.boletinTableRow, { backgroundColor: colors.primary[50] }]}>
                    <Text style={[styles.boletinCell, { flex: 2, fontWeight: '700' }]}>PROMEDIO GENERAL</Text>
                    <Text style={[styles.boletinCell, { flex: 1 }]}></Text>
                    <Text style={[
                      styles.boletinCell,
                      { flex: 1, fontWeight: '800', color: calcularPromedioEstudiante(estudianteSeleccionado.id) >= 3 ? colors.success[700] : colors.danger[700] }
                    ]}>
                      {calcularPromedioEstudiante(estudianteSeleccionado.id)?.toFixed(2) || 'N/A'}
                    </Text>
                  </View>
                </View>
              </ScrollView>
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.exportButton}
                onPress={async () => {
                  try {
                    const pdfData = await certificadoService.adminGenerarCertificadoNotas(
                      estudianteSeleccionado.id,
                      periodoSeleccionado?.id
                    );
                    certificadoService.descargarPDF(pdfData, 'boletin_notas.pdf');
                  } catch (error) {
                    console.error('Error generando boletín:', error);
                    // Intentar obtener mensaje de error del response
                    let errorMsg = 'No se pudo generar el boletín. Intenta nuevamente.';
                    if (error.response) {
                      const errorData = new TextDecoder().decode(error.response.data);
                      console.error('Error del servidor:', errorData);
                      errorMsg = `Error del servidor: ${error.status || error.response.status} - ${errorData}`;
                    }
                    Alert.alert('Error', errorMsg);
                  }
                }}
              >
                <Ionicons name="download" size={20} color={colors.white} />
                <Text style={styles.exportButtonText}>Exportar PDF</Text>
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
    backgroundColor: colors.white, padding: spacing.lg,
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.gray[200],
  },
  headerTitle: { flex: 1 },
  headerText: { fontSize: fontSize.lg, fontWeight: 'bold', color: colors.gray[900] },
  headerSubtext: { fontSize: fontSize.sm, color: colors.gray[600] },

  periodoSelector: {
    backgroundColor: colors.white, padding: spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
  },
  selectorLabel: { fontSize: fontSize.sm, fontWeight: '600', color: colors.gray[700] },
  periodoButton: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.gray[300],
    marginRight: spacing.sm,
  },
  periodoButtonActive: { backgroundColor: colors.primary[600], borderColor: colors.primary[600] },
  periodoButtonText: { fontSize: fontSize.sm, color: colors.gray[700] },
  periodoButtonTextActive: { color: colors.white, fontWeight: '600' },

  content: { flex: 1, padding: spacing.lg },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.gray[900], marginBottom: spacing.md },

  cursosList: { padding: spacing.sm },
  cursoCard: {
    backgroundColor: colors.white, borderRadius: borderRadius.lg,
    padding: spacing.md, flexDirection: 'row', alignItems: 'center',
    marginBottom: spacing.sm, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 3, elevation: 2,
  },
  cursoIcon: {
    width: 48, height: 48, borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[50], justifyContent: 'center', alignItems: 'center',
  },
  cursoInfo: { flex: 1, marginLeft: spacing.md },
  cursoNombre: { fontSize: fontSize.base, fontWeight: '700', color: colors.gray[900] },
  cursoGrado: { fontSize: fontSize.sm, color: colors.gray[500] },

  reporteContainer: { padding: spacing.sm },

  resumenCard: { marginBottom: spacing.lg, padding: spacing.md },
  resumenHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginBottom: spacing.md,
  },
  resumenTitle: { fontSize: fontSize.base, fontWeight: '700', color: colors.gray[900] },
  resumenGrid: { flexDirection: 'row', gap: spacing.md },
  resumenItem: {
    flex: 1, backgroundColor: colors.gray[50], padding: spacing.md,
    borderRadius: borderRadius.md, alignItems: 'center',
  },
  resumenNumero: { fontSize: fontSize.xl, fontWeight: '800', color: colors.gray[900] },
  resumenLabel: { fontSize: fontSize.xs, color: colors.gray[600], marginTop: 2 },

  estudianteCard: { marginBottom: spacing.md, padding: spacing.md },
  estudianteHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.sm,
  },
  estudianteInfo: { flex: 1 },
  estudianteNombre: { fontSize: fontSize.base, fontWeight: '700', color: colors.gray[900] },
  estudianteDetalle: { fontSize: fontSize.xs, color: colors.gray[500], marginTop: 2 },
  promedioBadge: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  promedioText: { fontSize: fontSize.base, fontWeight: '700' },

  materiasContainer: { marginTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.gray[100], paddingTop: spacing.sm },
  materiaRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: spacing.xs, gap: spacing.sm,
  },
  materiaNombre: { flex: 1, fontSize: fontSize.xs, color: colors.gray[700] },
  notasPreview: { flexDirection: 'row', gap: 2 },
  notaMini: {
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  notaMiniText: { fontSize: 10, fontWeight: '600' },
  masNotas: { fontSize: 10, color: colors.gray[500], marginLeft: 4 },
  promedioMateria: { fontSize: fontSize.sm, fontWeight: '700', width: 40, textAlign: 'right' },

  boletinButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: spacing.md, paddingVertical: spacing.sm,
    backgroundColor: colors.primary[50], borderRadius: borderRadius.md, gap: spacing.xs,
  },
  boletinButtonText: { fontSize: fontSize.sm, color: colors.primary[600], fontWeight: '600' },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.white, borderRadius: borderRadius.lg,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.gray[200],
  },
  modalTitle: { fontSize: fontSize.lg, fontWeight: 'bold', color: colors.gray[900] },
  modalBody: { padding: spacing.lg, maxHeight: 400 },
  modalFooter: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.gray[200] },

  boletinHeader: { alignItems: 'center', marginBottom: spacing.lg },
  boletinEstudiante: { fontSize: fontSize.lg, fontWeight: '700', color: colors.gray[900] },
  boletinCurso: { fontSize: fontSize.sm, color: colors.gray[600], marginTop: 4 },
  boletinPeriodo: { fontSize: fontSize.xs, color: colors.primary[600], marginTop: 4 },

  boletinTable: { borderWidth: 1, borderColor: colors.gray[200], borderRadius: borderRadius.md, overflow: 'hidden' },
  boletinTableHeader: { flexDirection: 'row', backgroundColor: colors.primary[600], padding: spacing.sm },
  boletinTableRow: { flexDirection: 'row', padding: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.gray[100] },
  boletinCell: { fontSize: fontSize.sm, color: colors.gray[700] },

  exportButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary[600], padding: spacing.md,
    borderRadius: borderRadius.md, gap: spacing.sm,
  },
  exportButtonText: { fontSize: fontSize.base, color: colors.white, fontWeight: '600' },
});

export default ReporteNotasAdminScreen;