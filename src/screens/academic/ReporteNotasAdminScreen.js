import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';
import { cursoService } from '../../services/cursoService';
import { notaService } from '../../services/notaService';
import { periodoAcademicoService } from '../../services/periodoAcademicoService';

const ReporteNotasAdminScreen = () => {
  const [cursos, setCursos] = useState([]);
  const [cursoSeleccionado, setCursoSeleccionado] = useState(null);
  const [periodos, setPeriodos] = useState([]);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState(null);
  const [reporte, setReporte] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  const cargarReporte = async () => {
    if (!cursoSeleccionado || !periodoSeleccionado) return;

    setLoading(true);
    try {
      // El backend debería tener un endpoint para obtener promedios por curso
      // Por ahora usamos el de asignación y agregamos
      setReporte({
        curso: cursoSeleccionado,
        periodo: periodoSeleccionado,
        materias: [],
      });
    } catch (e) {
      console.error('Error cargando reporte:', e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCursos().finally(() => setRefreshing(false));
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
              <Text style={styles.sectionTitle}>Cursos Registrados</Text>
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
            {/* Promedio general del curso */}
            <Card style={styles.resumenCard}>
              <View style={styles.resumenHeader}>
                <Ionicons name="analytics" size={24} color={colors.primary[600]} />
                <Text style={styles.resumenTitle}>Resumen del Período</Text>
              </View>
              <View style={styles.resumenGrid}>
                <View style={styles.resumenItem}>
                  <Text style={styles.resumenNumero}>4.2</Text>
                  <Text style={styles.resumenLabel}>Promedio General</Text>
                </View>
                <View style={[styles.resumenItem, { backgroundColor: colors.success[50] }]}>
                  <Text style={[styles.resumenNumero, { color: colors.success[700] }]}>18</Text>
                  <Text style={[styles.resumenLabel, { color: colors.success[700] }]}>Aprobados</Text>
                </View>
                <View style={[styles.resumenItem, { backgroundColor: colors.danger[50] }]}>
                  <Text style={[styles.resumenNumero, { color: colors.danger[700] }]}>2</Text>
                  <Text style={[styles.resumenLabel, { color: colors.danger[700] }]}>Reprobados</Text>
                </View>
              </View>
            </Card>

            {/* Materias y promedios */}
            <Text style={styles.sectionTitle}>Materias</Text>

            {/* Ejemplo de materia */}
            <Card style={styles.materiaCard}>
              <View style={styles.materiaHeader}>
                <View style={styles.materiaIconWrap}>
                  <Ionicons name="book" size={20} color={colors.white} />
                </View>
                <View style={styles.materiaInfo}>
                  <Text style={styles.materiaNombre}>Matemáticas</Text>
                  <Text style={styles.materiaDocente}>Docente: Juan Pérez</Text>
                </View>
              </View>
              <View style={styles.notasTable}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableCell, styles.colEstudiante]}>Estudiante</Text>
                  <Text style={[styles.tableCell, styles.colNota]}>P1</Text>
                  <Text style={[styles.tableCell, styles.colNota]}>P2</Text>
                  <Text style={[styles.tableCell, styles.colNota]}>Final</Text>
                  <Text style={[styles.tableCell, styles.colNota, { fontWeight: '700' }]}>Def.</Text>
                </View>
                {/* Filas de ejemplo */}
                {[1, 2, 3, 4, 5].map(i => (
                  <View key={i} style={styles.tableRow}>
                    <Text style={[styles.tableCell, styles.colEstudiante]} numberOfLines={1}>
                      Estudiante {i}
                    </Text>
                    <Text style={[styles.tableCell, styles.colNota]}>4.5</Text>
                    <Text style={[styles.tableCell, styles.colNota]}>4.0</Text>
                    <Text style={[styles.tableCell, styles.colNota]}>3.8</Text>
                    <Text style={[
                      styles.tableCell, styles.colNota, styles.notaFinal,
                      { color: 4.1 >= 3 ? colors.success[700] : colors.danger[700] }
                    ]}>
                      4.1
                    </Text>
                  </View>
                ))}
              </View>
            </Card>

            <View style={{ height: spacing.xl }} />
          </View>
        )}
      </ScrollView>
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

  materiaCard: { marginBottom: spacing.md, overflow: 'hidden' },
  materiaHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.gray[100],
  },
  materiaIconWrap: {
    width: 40, height: 40, borderRadius: borderRadius.md,
    backgroundColor: colors.primary[600], justifyContent: 'center', alignItems: 'center',
  },
  materiaInfo: { flex: 1 },
  materiaNombre: { fontSize: fontSize.base, fontWeight: '700', color: colors.gray[900] },
  materiaDocente: { fontSize: fontSize.xs, color: colors.gray[500] },

  notasTable: { marginTop: spacing.md },
  tableHeader: {
    flexDirection: 'row', backgroundColor: colors.gray[100],
    paddingVertical: spacing.sm, paddingHorizontal: spacing.sm,
  },
  tableRow: {
    flexDirection: 'row', paddingVertical: spacing.sm, paddingHorizontal: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.gray[50],
  },
  tableCell: { fontSize: fontSize.xs, color: colors.gray[700] },
  colEstudiante: { flex: 2 },
  colNota: { flex: 1, textAlign: 'center' },
  notaFinal: { fontWeight: '700' },
});

export default ReporteNotasAdminScreen;
