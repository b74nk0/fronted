import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  RefreshControl, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';
import { notaService } from '../../services/notaService';
import { periodoService } from '../../services/periodoService';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

const MisNotasScreen = () => {
  const { user } = useAuth();
  const [periodos, setPeriodos] = useState([]);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState(null);
  const [notas, setNotas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [estudianteId, setEstudianteId] = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadPeriodos();
      loadUserProfile();
    }, [])
  );

  const loadUserProfile = async () => {
    // Si ya tenemos el ID en el user, usarlo
    if (user?.id) {
      setEstudianteId(user.id);
      return;
    }

    // Si no, obtenerlo del backend
    try {
      const profile = await authService.getProfile();
      setEstudianteId(profile.id);
      console.log('Perfil obtenido:', profile);
    } catch (e) {
      console.error('Error obteniendo perfil:', e);
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

  const cargarNotas = async () => {
    if (!periodoSeleccionado || !estudianteId) {
      console.log('No hay período o usuario seleccionado', { periodoSeleccionado, estudianteId });
      return;
    }

    setLoading(true);
    try {
      console.log('Cargando notas para estudiante:', estudianteId, 'período:', periodoSeleccionado.id);
      const data = await notaService.obtenerPorEstudianteYPeriodo(estudianteId, periodoSeleccionado.id);
      console.log('Notas recibidas:', data);
      setNotas(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error cargando notas:', e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (periodoSeleccionado && estudianteId) {
      cargarNotas();
    }
  }, [periodoSeleccionado, estudianteId]);

  const onRefresh = () => {
    setRefreshing(true);
    cargarNotas().finally(() => setRefreshing(false));
  };

  // Agrupar notas por materia
  const notasPorMateria = () => {
    const grupos = {};
    notas.forEach(nota => {
      const materiaId = nota.asignacion?.materia?.id;
      if (!grupos[materiaId]) {
        grupos[materiaId] = {
          materia: nota.asignacion?.materia,
          curso: nota.asignacion?.curso,
          notas: [],
        };
      }
      grupos[materiaId].notas.push(nota);
    });
    return Object.values(grupos);
  };

  // Calcular promedio por materia
  const calcularPromedioMateria = (notasMateria) => {
    if (notasMateria.length === 0) return 0;
    const suma = notasMateria.reduce((acc, n) => acc + (n.valor || 0), 0);
    return suma / notasMateria.length;
  };

  // Calcular promedio general
  const promedioGeneral = () => {
    const grupos = notasPorMateria();
    if (grupos.length === 0) return 0;
    const sumaPromedios = grupos.reduce((acc, g) => acc + calcularPromedioMateria(g.notas), 0);
    return sumaPromedios / grupos.length;
  };

  const prom = promedioGeneral();

  if (loading && notas.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={styles.loadingText}>Cargando notas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIconWrap}>
          <Ionicons name="stats-chart" size={26} color={colors.primary[600]} />
        </View>
        <View>
          <Text style={styles.headerText}>Mis Notas</Text>
          <Text style={styles.headerSubtext}>
            {notasPorMateria().length} materias · {notas.length} evaluaciones
          </Text>
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
        ) : notas.length === 0 ? (
          <EmptyState
            icon="document-outline"
            title="Sin notas"
            message="Aún no hay calificaciones registradas para este período"
          />
        ) : (
          <>
            {/* Tarjeta de promedio general */}
            <Card style={styles.promedioCard}>
              <View style={styles.promedioHeader}>
                <Ionicons name="trophy" size={28} color={prom >= 3 ? colors.success[600] : colors.danger[600]} />
                <View style={styles.promedioInfo}>
                  <Text style={styles.promedioLabel}>Promedio General</Text>
                  <Text style={[
                    styles.promedioNumero,
                    { color: prom >= 3 ? colors.success[700] : colors.danger[700] }
                  ]}>
                    {prom.toFixed(2)}
                  </Text>
                </View>
              </View>
              <View style={styles.promedioBadge}>
                <Text style={styles.promedioBadgeText}>
                  {prom >= 3 ? '¡Aprobado!' : prom >= 2.5 ? 'En riesgo' : 'Reprobado'}
                </Text>
              </View>
            </Card>

            {/* Notas por materia */}
            {notasPorMateria().map(grupo => {
              const promedioMateria = calcularPromedioMateria(grupo.notas);
              return (
                <Card key={grupo.materia?.id} style={styles.materiaCard}>
                  <View style={styles.materiaHeader}>
                    <View style={styles.materiaIconWrap}>
                      <Ionicons name="book" size={20} color={colors.white} />
                    </View>
                    <View style={styles.materiaInfo}>
                      <Text style={styles.materiaNombre}>{grupo.materia?.nombre}</Text>
                      <Text style={styles.materiaCurso}>{grupo.curso?.nombre}</Text>
                    </View>
                    <View style={[
                      styles.promedioBadgeSmall,
                      { backgroundColor: promedioMateria >= 3 ? colors.success[100] : colors.danger[100] }
                    ]}>
                      <Text style={[
                        styles.promedioBadgeSmallText,
                        { color: promedioMateria >= 3 ? colors.success[700] : colors.danger[700] }
                      ]}>
                        {promedioMateria.toFixed(1)}
                      </Text>
                    </View>
                  </View>

                  {/* Lista de evaluaciones */}
                  <View style={styles.evaluacionesList}>
                    {grupo.notas.map(nota => (
                      <View key={nota.id} style={styles.evaluacionItem}>
                        <View style={styles.evaluacionInfo}>
                          <Text style={styles.evaluacionNombre}>{nota.nombreEvaluacion}</Text>
                          <View style={styles.evaluacionTags}>
                            <View style={styles.tipoBadge}>
                              <Text style={styles.tipoBadgeText}>{nota.tipoEvaluacion}</Text>
                            </View>
                            {nota.peso !== 100 && (
                              <Text style={styles.pesoText}>{nota.peso}%</Text>
                            )}
                          </View>
                        </View>
                        <View style={[
                          styles.notaBadge,
                          { backgroundColor: nota.valor >= 3 ? colors.success[100] : colors.danger[100] }
                        ]}>
                          <Text style={[
                            styles.notaBadgeText,
                            { color: nota.valor >= 3 ? colors.success[700] : colors.danger[700] }
                          ]}>
                            {nota.valor.toFixed(1)}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </Card>
              );
            })}

            <View style={{ height: spacing.xl }} />
          </>
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
  headerIconWrap: {
    width: 48, height: 48, borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[50], justifyContent: 'center', alignItems: 'center',
  },
  headerText: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.gray[900] },
  headerSubtext: { fontSize: fontSize.sm, color: colors.gray[500], marginTop: 2 },

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

  promedioCard: { marginBottom: spacing.lg, padding: spacing.md },
  promedioHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  promedioInfo: { flex: 1 },
  promedioLabel: { fontSize: fontSize.sm, color: colors.gray[600] },
  promedioNumero: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.gray[900] },
  promedioBadge: {
    marginTop: spacing.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md, backgroundColor: colors.success[100],
    alignItems: 'center',
  },
  promedioBadgeText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.success[700] },

  materiaCard: { marginBottom: spacing.md, padding: spacing.md },
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
  materiaCurso: { fontSize: fontSize.xs, color: colors.gray[500] },
  promedioBadgeSmall: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  promedioBadgeSmallText: { fontSize: fontSize.sm, fontWeight: '700' },

  evaluacionesList: { marginTop: spacing.md },
  evaluacionItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.gray[50],
  },
  evaluacionInfo: { flex: 1 },
  evaluacionNombre: { fontSize: fontSize.sm, fontWeight: '600', color: colors.gray[800] },
  evaluacionTags: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 2 },
  tipoBadge: {
    backgroundColor: colors.gray[100], paddingHorizontal: spacing.xs,
    paddingVertical: 2, borderRadius: borderRadius.sm,
  },
  tipoBadgeText: { fontSize: fontSize.xxs, color: colors.gray[600], fontWeight: '600' },
  pesoText: { fontSize: fontSize.xxs, color: colors.gray[500] },
  notaBadge: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: borderRadius.md, minWidth: 50, alignItems: 'center',
  },
  notaBadgeText: { fontSize: fontSize.base, fontWeight: '700' },
});

export default MisNotasScreen;
