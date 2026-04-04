import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';
import { asistenciaService } from '../../services/asistenciaService';
import { asignacionDocenteService } from '../../services/asignacionDocenteService';
import { estudianteCursoService } from '../../services/estudianteCursoService';
import { useAuth } from '../../context/AuthContext';

// Estados de asistencia
const ESTADOS_ASISTENCIA = {
  PRESENTE: { label: 'Presente', color: '#16a34a', bgColor: '#dcfce7', icon: 'checkmark-circle' },
  AUSENTE: { label: 'Ausente', color: '#dc2626', bgColor: '#fee2e2', icon: 'close-circle' },
  TARDE: { label: 'Tarde', color: '#ca8a04', bgColor: '#fef9c3', icon: 'time' },
  EXCUSA: { label: 'Excusa', color: '#2563eb', bgColor: '#dbeafe', icon: 'document-text' },
};

const MiAsistenciaScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();

  const [asignaciones, setAsignaciones] = useState([]);
  const [asignacionSeleccionada, setAsignacionSeleccionada] = useState(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().toISOString().split('T')[0]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [asistencias, setAsistencias] = useState({});
  const [loadingAsignaciones, setLoadingAsignaciones] = useState(false);
  const [cargandoEstudiantes, setCargandoEstudiantes] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [periodoActivo, setPeriodoActivo] = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadAsignaciones();
    }, [])
  );

  const loadAsignaciones = async () => {
    setLoadingAsignaciones(true);
    try {
      // Cargar asignaciones del docente (cada una es curso + materia)
      const data = await asignacionDocenteService.misCursos();
      const asignacionesData = Array.isArray(data) ? data : [];

      console.log('Asignaciones recibidas:', asignacionesData);

      // Agrupar por curso para mostrar en la UI
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
          materia: {
            id: asig.materiaId,
            nombre: asig.materiaNombre,
          },
          cursoId,
          periodoId: asig.periodoId,
        });
      });

      const asignacionesLista = Object.values(asignacionesPorCurso);
      console.log('Asignaciones agrupadas:', asignacionesLista);
      setAsignaciones(asignacionesLista);

      // Si hay un solo curso con una asignación, seleccionarla automáticamente
      if (asignacionesLista.length === 1 && asignacionesLista[0].asignaciones.length === 1) {
        setAsignacionSeleccionada({
          curso: asignacionesLista[0].curso,
          asignacion: asignacionesLista[0].asignaciones[0],
        });
      }
    } catch (e) {
      console.error('Error cargando asignaciones del docente:', e);
    } finally {
      setLoadingAsignaciones(false);
    }
  };

  const cargarEstudiantes = async () => {
    if (!asignacionSeleccionada) return;

    setCargandoEstudiantes(true);
    try {
      const { curso, asignacion } = asignacionSeleccionada;

      // Cargar estudiantes del curso
      const estudiantesData = await estudianteCursoService.listarPorCursoYPeriodo(
        curso.id,
        asignacion.periodoId || 1 // fallback
      );
      const estudiantesArray = Array.isArray(estudiantesData) ? estudiantesData : [];
      setEstudiantes(estudiantesArray);

      // Cargar asistencias existentes para esa asignación y fecha
      const asistenciasData = await asistenciaService.obtenerPorAsignacionYFecha(
        asignacion.id,
        fechaSeleccionada
      );
      const asistenciasArray = Array.isArray(asistenciasData) ? asistenciasData : [];

      // Mapear asistencias existentes
      const asistenciasMap = {};
      asistenciasArray.forEach(asis => {
        asistenciasMap[asis.estudianteCursoId] = asis.estado;
      });
      setAsistencias(asistenciasMap);
    } catch (e) {
      console.error('Error cargando estudiantes:', e);
      Alert.alert('Error', 'No se pudieron cargar los estudiantes');
    } finally {
      setCargandoEstudiantes(false);
    }
  };

  const handleGuardarAsistencia = async () => {
    if (!cursoSeleccionado || estudiantes.length === 0) return;

    setGuardando(true);
    try {
      const listaAsistencias = estudiantes.map(est => ({
        estudianteCursoId: est.id,
        estado: asistencias[est.id] || 'PRESENTE',
        observaciones: '',
      }));

      await asistenciaService.registrarLista({
        cursoId: cursoSeleccionado.id,
        fecha: fechaSeleccionada,
        asistencias: listaAsistencias,
      });

      Alert.alert('Éxito', 'Asistencia registrada correctamente');
    } catch (e) {
      console.error('Error guardando asistencia:', e);
      Alert.alert('Error', 'No se pudo registrar la asistencia');
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstado = (estudianteCursoId, estado) => {
    setAsistencias(prev => ({ ...prev, [estudianteCursoId]: estado }));
  };

  const obtenerResumen = () => {
    const resumen = { PRESENTE: 0, AUSENTE: 0, TARDE: 0, EXCUSA: 0 };
    estudiantes.forEach(est => {
      const estado = asistencias[est.id] || 'PRESENTE';
      resumen[estado]++;
    });
    return resumen;
  };

  const resumen = obtenerResumen();

  // Si no hay curso seleccionado, mostrar selector de cursos
  if (!cursoSeleccionado) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.gray[700]} />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.headerText}>Mi Asistencia</Text>
            <Text style={styles.headerSubtext}>Selecciona un curso</Text>
          </View>
        </View>

        <ScrollView style={styles.content}>
          {loadingCursos ? (
            <ActivityIndicator size="large" color={colors.primary[600]} style={{ marginTop: spacing.xl }} />
          ) : cursos.length === 0 ? (
            <EmptyState
              icon="school-outline"
              title="Sin cursos asignados"
              message="No tienes cursos asignados para registrar asistencia"
            />
          ) : (
            <View style={styles.cursosList}>
              <Text style={styles.sectionTitle}>Mis cursos ({cursos.length})</Text>
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
                    <Text style={styles.cursoGrado}>{curso.gradoNombre}</Text>
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => setCursoSeleccionado(null)}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[700]} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.headerText}>{cursoSeleccionado.nombre}</Text>
          <Text style={styles.headerSubtext}>Registro de asistencia</Text>
        </View>
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* Selectores */}
        <Card style={styles.selectoresCard}>
          <View style={styles.fechaRow}>
            <Ionicons name="calendar" size={20} color={colors.primary[600]} />
            <Text style={styles.fechaLabel}>Fecha:</Text>
            <TouchableOpacity
              style={styles.fechaButton}
              onPress={() => {
                const nuevaFecha = prompt('Ingresa la fecha (YYYY-MM-DD):', fechaSeleccionada);
                if (nuevaFecha && /^\d{4}-\d{2}-\d{2}$/.test(nuevaFecha)) {
                  setFechaSeleccionada(nuevaFecha);
                  setAsistencias({});
                }
              }}
            >
              <Text style={styles.fechaText}>
                {new Date(fechaSeleccionada).toLocaleDateString('es-ES', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </Text>
            </TouchableOpacity>
          </View>

          <Button
            title="Cargar estudiantes"
            onPress={cargarEstudiantes}
            loading={cargandoEstudiantes}
            disabled={cargandoEstudiantes}
            variant="outline"
          />
        </Card>

        {/* Resumen estadístico */}
        {estudiantes.length > 0 && (
          <Card style={styles.resumenCard}>
            <Text style={styles.resumenTitle}>Resumen</Text>
            <View style={styles.resumenGrid}>
              {Object.entries(ESTADOS_ASISTENCIA).map(([key, config]) => (
                <View key={key} style={[styles.resumenItem, { backgroundColor: config.bgColor }]}>
                  <Text style={[styles.resumenNumero, { color: config.color }]}>{resumen[key]}</Text>
                  <Text style={[styles.resumenLabel, { color: config.color }]}>{config.label}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Lista de estudiantes */}
        {cargandoEstudiantes ? (
          <ActivityIndicator size="large" color={colors.primary[600]} style={{ marginTop: spacing.xl }} />
        ) : estudiantes.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title="Sin estudiantes"
            message="Selecciona una fecha y carga la lista de estudiantes"
          />
        ) : (
          <View style={styles.listaContainer}>
            <Text style={styles.listaTitle}>{estudiantes.length} estudiantes</Text>
            {estudiantes.map(est => (
              <Card key={est.id} style={styles.estudianteCard}>
                <View style={styles.estudianteHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {`${est.estudiante?.nombre?.[0] || ''}${est.estudiante?.apellido?.[0] || ''}`.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.estudianteInfo}>
                    <Text style={styles.estudianteNombre}>{est.estudiante?.nombre} {est.estudiante?.apellido}</Text>
                    <Text style={styles.estudianteDoc}>{est.estudiante?.numeroDocumento}</Text>
                  </View>
                </View>

                <View style={styles.estadosContainer}>
                  {Object.entries(ESTADOS_ASISTENCIA).map(([key, config]) => (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.estadoButton,
                        { backgroundColor: asistencias[est.id] === key ? config.bgColor : colors.gray[100] },
                        asistencias[est.id] === key && { borderColor: config.color, borderWidth: 2 },
                      ]}
                      onPress={() => cambiarEstado(est.id, key)}
                    >
                      <Ionicons
                        name={config.icon}
                        size={16}
                        color={asistencias[est.id] === key ? config.color : colors.gray[500]}
                      />
                      <Text
                        style={[
                          styles.estadoLabel,
                          { color: asistencias[est.id] === key ? config.color : colors.gray[600] },
                        ]}
                      >
                        {config.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Card>
            ))}
            <View style={{ height: spacing.xl }} />
          </View>
        )}
      </ScrollView>

      {/* Footer con botón guardar */}
      {estudiantes.length > 0 && (
        <View style={styles.footer}>
          <Button
            title={guardando ? 'Guardando...' : 'Guardar Asistencia'}
            onPress={handleGuardarAsistencia}
            loading={guardando}
            disabled={guardando}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  header: {
    backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center',
    padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.gray[200],
  },
  backButton: { marginRight: spacing.md },
  headerTitle: { flex: 1 },
  headerText: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.gray[900] },
  headerSubtext: { fontSize: fontSize.sm, color: colors.gray[600], marginTop: spacing.xs },
  content: { flex: 1, padding: spacing.lg },
  cursosList: { padding: spacing.lg },
  sectionTitle: {
    fontSize: fontSize.lg, fontWeight: '600', color: colors.gray[900],
    marginBottom: spacing.md,
  },
  cursoCard: {
    backgroundColor: colors.white, borderRadius: borderRadius.lg,
    padding: spacing.md, flexDirection: 'row', alignItems: 'center',
    marginBottom: spacing.md, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 3, elevation: 2,
  },
  cursoIcon: {
    width: 48, height: 48, borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[50], justifyContent: 'center', alignItems: 'center',
  },
  cursoInfo: { flex: 1, marginLeft: spacing.md },
  cursoNombre: { fontSize: fontSize.base, fontWeight: '700', color: colors.gray[900] },
  cursoGrado: { fontSize: fontSize.sm, color: colors.gray[500], marginTop: 2 },
  selectoresCard: { marginBottom: spacing.lg },
  fechaRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md,
    gap: spacing.sm,
  },
  fechaLabel: { fontSize: fontSize.sm, fontWeight: '600', color: colors.gray[700] },
  fechaButton: {
    flex: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    backgroundColor: colors.gray[50], borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: colors.gray[200],
  },
  fechaText: { fontSize: fontSize.base, color: colors.gray[900] },
  resumenCard: { marginBottom: spacing.lg },
  resumenTitle: {
    fontSize: fontSize.base, fontWeight: '600', color: colors.gray[900], marginBottom: spacing.md,
  },
  resumenGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  resumenItem: { flex: 1, minWidth: 70, alignItems: 'center', padding: spacing.sm, borderRadius: borderRadius.md },
  resumenNumero: { fontSize: fontSize.lg, fontWeight: 'bold' },
  resumenLabel: { fontSize: fontSize.xs, fontWeight: '500' },
  listaContainer: { marginTop: spacing.sm },
  listaTitle: {
    fontSize: fontSize.sm, fontWeight: '600', color: colors.gray[700],
    marginBottom: spacing.md, marginLeft: spacing.xs,
  },
  estudianteCard: { marginBottom: spacing.md },
  estudianteHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primary[600], justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: fontSize.sm, fontWeight: 'bold', color: colors.white },
  estudianteInfo: { marginLeft: spacing.md, flex: 1 },
  estudianteNombre: { fontSize: fontSize.base, fontWeight: '600', color: colors.gray[900] },
  estudianteDoc: { fontSize: fontSize.xs, color: colors.gray[500], marginTop: 2 },
  estadosContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  estadoButton: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.md, gap: spacing.xs,
  },
  estadoLabel: { fontSize: fontSize.xs, fontWeight: '600' },
  footer: {
    backgroundColor: colors.white, padding: spacing.lg,
    borderTopWidth: 1, borderTopColor: colors.gray[200],
  },
});

export default MiAsistenciaScreen;
