import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Modal, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';
import { asignacionDocenteService } from '../../services/asignacionDocenteService';
import { estudianteCursoService } from '../../services/estudianteCursoService';
import { notaService } from '../../services/notaService';
import { periodoAcademicoService } from '../../services/periodoAcademicoService';

const TIPOS_EVALUACION = [
  { value: 'PARCIAL', label: 'Parcial', icon: 'document-text' },
  { value: 'FINAL', label: 'Final', icon: 'trophy' },
  { value: 'TALLER', label: 'Taller', icon: 'construct' },
  { value: 'EXPOSICION', label: 'Exposición', icon: 'people' },
  { value: 'PRACTICA', label: 'Práctica', icon: 'flask' },
  { value: 'PARTICIPACION', label: 'Participación', icon: 'chatbubbles' },
  { value: 'TAREA', label: 'Tarea', icon: 'book' },
  { value: 'PROYECTO', label: 'Proyecto', icon: 'layers' },
  { value: 'QUIZ', label: 'Quiz', icon: 'help-circle' },
];

const NotasDocenteScreen = () => {
  const [asignaciones, setAsignaciones] = useState([]);
  const [asignacionSeleccionada, setAsignacionSeleccionada] = useState(null);
  const [periodos, setPeriodos] = useState([]);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState(null);
  const [estudiantes, setEstudiantes] = useState([]);
  const [notas, setNotas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [evaluacionActual, setEvaluacionActual] = useState(null);
  const [nombreEvaluacion, setNombreEvaluacion] = useState('');
  const [tipoEvaluacion, setTipoEvaluacion] = useState('PARCIAL');
  const [peso, setPeso] = useState('100');
  const [valorMaximo, setValorMaximo] = useState('5');

  useFocusEffect(
    useCallback(() => {
      loadAsignaciones();
      loadPeriodos();
    }, [])
  );

  const loadAsignaciones = async () => {
    setLoading(true);
    try {
      const data = await asignacionDocenteService.misCursos();
      const asignacionesData = Array.isArray(data) ? data : [];

      // Agrupar por curso
      const asignacionesPorCurso = {};
      asignacionesData.forEach(asig => {
        const cursoId = asig.cursoId;
        if (!asignacionesPorCurso[cursoId]) {
          asignacionesPorCurso[cursoId] = {
            curso: {
              id: cursoId,
              nombre: asig.cursoNombre,
              gradoNombre: asig.gradoNombre,
            },
            asignaciones: [],
          };
        }
        asignacionesPorCurso[cursoId].asignaciones.push({
          id: asig.id,
          materia: { id: asig.materiaId, nombre: asig.materiaNombre },
          cursoId,
          periodoId: asig.periodoId,
        });
      });

      setAsignaciones(Object.values(asignacionesPorCurso));
    } catch (e) {
      console.error('Error cargando asignaciones:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadPeriodos = async () => {
    try {
      const data = await periodoAcademicoService.listar();
      const periodosActivos = Array.isArray(data) ? data.filter(p => p.activo) : [];
      setPeriodos(periodosActivos);
      if (periodosActivos.length > 0 && !periodoSeleccionado) {
        setPeriodoSeleccionado(periodosActivos[0]);
      }
    } catch (e) {
      console.error('Error cargando períodos:', e);
    }
  };

  const cargarEstudiantesYNotas = async () => {
    if (!asignacionSeleccionada || !periodoSeleccionado) return;

    setLoading(true);
    try {
      // Cargar estudiantes
      const estudiantesData = await estudianteCursoService.listarPorCursoYPeriodo(
        asignacionSeleccionada.curso.id,
        periodoSeleccionado.id
      );
      const estudiantesArray = Array.isArray(estudiantesData) ? estudiantesData : [];
      setEstudiantes(estudiantesArray);

      // Cargar notas existentes
      const notasData = await notaService.obtenerPorAsignacionYPeriodo(
        asignacionSeleccionada.asignacion.id,
        periodoSeleccionado.id
      );
      setNotas(Array.isArray(notasData) ? notasData : []);
    } catch (e) {
      console.error('Error cargando datos:', e);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarNotas = async () => {
    if (!evaluacionActual || !nombreEvaluacion.trim()) {
      Alert.alert('Error', 'Debe ingresar un nombre para la evaluación');
      return;
    }

    setGuardando(true);
    try {
      const notasAEnviar = estudiantes.map(est => {
        const notaExistente = evaluacionActual.notas?.[est.id];
        return {
          estudianteCursoId: est.id,
          valor: notaExistente ? parseFloat(notaExistente) : 0,
          observaciones: '',
        };
      });

      await notaService.registrarLista({
        asignacionDocenteId: asignacionSeleccionada.asignacion.id,
        periodoId: periodoSeleccionado.id,
        nombreEvaluacion: nombreEvaluacion.trim(),
        tipoEvaluacion: tipoEvaluacion,
        peso: parseFloat(peso) || 100,
        valorMaximo: parseFloat(valorMaximo) || 5,
        notas: notasAEnviar,
      });

      Alert.alert('Éxito', 'Notas registradas correctamente');
      setModalVisible(false);
      setNombreEvaluacion('');
      cargarEstudiantesYNotas();
    } catch (e) {
      console.error('Error guardando notas:', e);
      Alert.alert('Error', e.response?.data?.message || 'No se pudieron guardar las notas');
    } finally {
      setGuardando(false);
    }
  };

  const handleActualizarNota = async (estudianteCursoId, nuevaNota) => {
    const notaExistente = notas.find(n => n.estudianteCursoId === estudianteCursoId && n.nombreEvaluacion === nombreEvaluacion);
    if (!notaExistente) return;

    try {
      await notaService.actualizar(notaExistente.id, {
        valor: parseFloat(nuevaNota),
        tipoEvaluacion: notaExistente.tipoEvaluacion,
        peso: notaExistente.peso,
        valorMaximo: notaExistente.valorMaximo,
      });
      cargarEstudiantesYNotas();
    } catch (e) {
      Alert.alert('Error', 'No se pudo actualizar la nota');
    }
  };

  const abrirModalNuevaEvaluacion = () => {
    setEvaluacionActual(null);
    setNombreEvaluacion('');
    setTipoEvaluacion('PARCIAL');
    setPeso('100');
    setValorMaximo('5');
    setModalVisible(true);
  };

  const getNotaEstudiante = (estudianteCursoId, nombreEval) => {
    const nota = notas.find(n => n.estudianteCursoId === estudianteCursoId && n.nombreEvaluacion === nombreEval);
    return nota ? nota.valor : null;
  };

  const getEvaluacionesUnicas = () => {
    const nombres = new Set(notas.map(n => n.nombreEvaluacion));
    return Array.from(nombres);
  };

  if (loading && asignaciones.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={styles.loadingText}>Cargando cursos...</Text>
      </View>
    );
  }

  if (!asignacionSeleccionada) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="school" size={26} color={colors.primary[600]} />
          <Text style={styles.headerText}>Gestión de Notas</Text>
        </View>
        <ScrollView style={styles.content}>
          {asignaciones.length === 0 ? (
            <EmptyState
              icon="book-outline"
              title="Sin asignaciones"
              message="No tienes cursos/materias asignadas"
            />
          ) : (
            <View style={styles.cursosList}>
              <Text style={styles.sectionTitle}>Mis Cursos y Materias</Text>
              {asignaciones.map(({ curso, asignaciones: asignaturas }) => (
                <View key={curso.id} style={styles.cursoGrupo}>
                  <Text style={styles.cursoGrupoTitulo}>{curso.nombre} - {curso.gradoNombre}</Text>
                  {asignaturas.map(asig => (
                    <TouchableOpacity
                      key={asig.id}
                      style={styles.asignaturaCard}
                      onPress={() => setAsignacionSeleccionada({ curso, asignacion: asig })}
                    >
                      <View style={styles.asignaturaIcon}>
                        <Ionicons name="book-outline" size={24} color={colors.primary[600]} />
                      </View>
                      <View style={styles.asignaturaInfo}>
                        <Text style={styles.asignaturaNombre}>{asig.materia.nombre}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setAsignacionSeleccionada(null)}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[700]} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.headerText}>{asignacionSeleccionada.curso.nombre}</Text>
          <Text style={styles.headerSubtext}>{asignacionSeleccionada.asignacion.materia.nombre}</Text>
        </View>
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
              onPress={() => {
                setPeriodoSeleccionado(periodo);
                setTimeout(cargarEstudiantesYNotas, 100);
              }}
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

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {!periodoSeleccionado ? (
          <EmptyState icon="calendar-outline" title="Sin período" message="Selecciona un período académico" />
        ) : estudiantes.length === 0 ? (
          <EmptyState icon="people-outline" title="Sin estudiantes" message="No hay estudiantes en este curso" />
        ) : (
          <>
            {/* Evaluaciones existentes */}
            {getEvaluacionesUnicas().map(nombreEval => (
              <Card key={nombreEval} style={styles.evaluacionCard}>
                <View style={styles.evaluacionHeader}>
                  <View>
                    <Text style={styles.evaluacionNombre}>{nombreEval}</Text>
                    <Text style={styles.evaluacionInfo}>
                      {notas.filter(n => n.nombreEvaluacion === nombreEval).length} estudiantes
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setNombreEvaluacion(nombreEval);
                      setEvaluacionActual({ notas: {} });
                    }}
                  >
                    <Ionicons name="create-outline" size={24} color={colors.primary[600]} />
                  </TouchableOpacity>
                </View>
                <View style={styles.notasGrid}>
                  {estudiantes.map(est => {
                    const nota = getNotaEstudiante(est.id, nombreEval);
                    return (
                      <View key={est.id} style={styles.notaItem}>
                        <Text style={styles.estudianteNombre} numberOfLines={1}>
                          {est.estudiante?.nombre?.[0]}. {est.estudiante?.apellido}
                        </Text>
                        <View style={[
                          styles.notaBadge,
                          { backgroundColor: nota >= 3 ? colors.success[100] : colors.danger[100] }
                        ]}>
                          <Text style={[
                            styles.notaText,
                            { color: nota >= 3 ? colors.success[700] : colors.danger[700] }
                          ]}>
                            {nota !== null ? nota.toFixed(1) : '-'}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </Card>
            ))}

            {/* Botón nueva evaluación */}
            <Button
              title="Nueva Evaluación"
              onPress={abrirModalNuevaEvaluacion}
              icon="add-circle"
              variant="outline"
            />

            <View style={{ height: spacing.xl }} />
          </>
        )}
      </ScrollView>

      {/* Modal Nueva Evaluación */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nueva Evaluación</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color={colors.gray[600]} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nombre de la evaluación *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Primer Parcial"
                  value={nombreEvaluacion}
                  onChangeText={setNombreEvaluacion}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Tipo de evaluación</Text>
                <View style={styles.tiposGrid}>
                  {TIPOS_EVALUACION.map(tipo => (
                    <TouchableOpacity
                      key={tipo.value}
                      style={[
                        styles.tipoButton,
                        tipoEvaluacion === tipo.value && styles.tipoButtonActive
                      ]}
                      onPress={() => setTipoEvaluacion(tipo.value)}
                    >
                      <Ionicons
                        name={tipo.icon}
                        size={20}
                        color={tipoEvaluacion === tipo.value ? colors.white : colors.gray[600]}
                      />
                      <Text style={[
                        styles.tipoButtonText,
                        tipoEvaluacion === tipo.value && styles.tipoButtonTextActive
                      ]}>
                        {tipo.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: spacing.md }]}>
                  <Text style={styles.inputLabel}>Peso (%)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="100"
                    value={peso}
                    onChangeText={setPeso}
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Valor Máximo</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="5"
                    value={valorMaximo}
                    onChangeText={setValorMaximo}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.estudiantesPreview}>
                <Text style={styles.previewTitle}>
                  {estudiantes.length} estudiantes a calificar
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Cancelar"
                onPress={() => setModalVisible(false)}
                variant="outline"
                style={{ flex: 1, marginRight: spacing.md }}
              />
              <Button
                title={guardando ? 'Guardando...' : 'Guardar'}
                onPress={handleGuardarNotas}
                loading={guardando}
                style={{ flex: 1 }}
              />
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

  cursosList: {},
  cursoGrupo: { marginBottom: spacing.lg },
  cursoGrupoTitulo: {
    fontSize: fontSize.base, fontWeight: '700', color: colors.gray[800],
    marginBottom: spacing.sm,
  },
  asignaturaCard: {
    backgroundColor: colors.white, borderRadius: borderRadius.lg,
    padding: spacing.md, flexDirection: 'row', alignItems: 'center',
    marginBottom: spacing.sm, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 3, elevation: 2,
  },
  asignaturaIcon: {
    width: 48, height: 48, borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[50], justifyContent: 'center', alignItems: 'center',
  },
  asignaturaInfo: { flex: 1, marginLeft: spacing.md },
  asignaturaNombre: { fontSize: fontSize.base, fontWeight: '600', color: colors.gray[900] },

  evaluacionCard: { marginBottom: spacing.lg, padding: spacing.md },
  evaluacionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.md,
  },
  evaluacionNombre: { fontSize: fontSize.base, fontWeight: '700', color: colors.gray[900] },
  evaluacionInfo: { fontSize: fontSize.xs, color: colors.gray[500] },

  notasGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  notaItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.sm, backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md, minWidth: 140,
  },
  estudianteNombre: { fontSize: fontSize.xs, color: colors.gray[700], flex: 1 },
  notaBadge: {
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  notaText: { fontSize: fontSize.sm, fontWeight: '700' },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.gray[200],
  },
  modalTitle: { fontSize: fontSize.lg, fontWeight: 'bold', color: colors.gray[900] },
  modalBody: { padding: spacing.lg },

  inputGroup: { marginBottom: spacing.lg },
  inputLabel: { fontSize: fontSize.sm, fontWeight: '600', color: colors.gray[700], marginBottom: spacing.sm },
  input: {
    borderWidth: 1, borderColor: colors.gray[300], borderRadius: borderRadius.md,
    padding: spacing.md, fontSize: fontSize.base,
  },

  tiposGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tipoButton: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.gray[300],
  },
  tipoButtonActive: { backgroundColor: colors.primary[600], borderColor: colors.primary[600] },
  tipoButtonText: { fontSize: fontSize.xs, color: colors.gray[700] },
  tipoButtonTextActive: { color: colors.white, fontWeight: '600' },

  row: { flexDirection: 'row' },
  estudiantesPreview: {
    backgroundColor: colors.primary[50], padding: spacing.md,
    borderRadius: borderRadius.md, alignItems: 'center',
  },
  previewTitle: { fontSize: fontSize.sm, color: colors.primary[700], fontWeight: '600' },

  modalFooter: {
    flexDirection: 'row', padding: spacing.lg,
    borderTopWidth: 1, borderTopColor: colors.gray[200],
  },
});

export default NotasDocenteScreen;
