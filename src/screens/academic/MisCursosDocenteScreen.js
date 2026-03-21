import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';
import { asignacionDocenteService } from '../../services/asignacionDocenteService';

// ─── Agrupa asignaciones por curso ────────────────────────────────────────────
const agruparPorCurso = (asignaciones) => {
  const mapa = new Map();
  for (const a of asignaciones) {
    if (!mapa.has(a.cursoId)) {
      mapa.set(a.cursoId, {
        cursoId:     a.cursoId,
        cursoNombre: a.cursoNombre,
        gradoNombre: a.gradoNombre,
        materias:    [],
      });
    }
    mapa.get(a.cursoId).materias.push(a);
  }
  return Array.from(mapa.values())
    .sort((a, b) => a.cursoNombre.localeCompare(b.cursoNombre));
};

// ─── Tarjeta de curso ─────────────────────────────────────────────────────────
const CursoCard = ({ grupo, expandido, onToggle }) => (
  <Card style={styles.card}>
    <TouchableOpacity style={styles.cardHeader} onPress={onToggle} activeOpacity={0.7}>
      <View style={styles.cardHeaderLeft}>
        <View style={styles.cardIcon}>
          <Ionicons name="people" size={20} color={colors.primary[600]} />
        </View>
        <View>
          <Text style={styles.cursoNombre}>{grupo.cursoNombre}</Text>
          {grupo.gradoNombre && (
            <Text style={styles.gradoNombre}>{grupo.gradoNombre}</Text>
          )}
          <Text style={styles.cursoSub}>
            {grupo.materias.length} {grupo.materias.length === 1 ? 'materia' : 'materias'}
          </Text>
        </View>
      </View>
      <Ionicons
        name={expandido ? 'chevron-up' : 'chevron-down'}
        size={20} color={colors.gray[400]} />
    </TouchableOpacity>

    {expandido && (
      <View style={styles.materiasContainer}>
        <View style={styles.divider} />
        {grupo.materias.map((a, i) => (
          <View key={a.id}
            style={[styles.materiaRow, i < grupo.materias.length - 1 && styles.materiaRowBorder]}>
            <View style={styles.materiaIconWrap}>
              <Ionicons name="book-outline" size={15} color={colors.primary[500]} />
            </View>
            <Text style={styles.materiaNombre}>{a.materiaNombre}</Text>
          </View>
        ))}
      </View>
    )}
  </Card>
);

// ─── Screen ───────────────────────────────────────────────────────────────────
const MisCursosDocenteScreen = () => {
  const [grupos,     setGrupos]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [expandidos, setExpandidos] = useState(new Set());

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await asignacionDocenteService.misCursos();
      const agrupados = agruparPorCurso(data);
      setGrupos(agrupados);
      // Expandir todos por defecto
      setExpandidos(new Set(agrupados.map(g => g.cursoId)));
    } catch (e) {
      console.error('Error cargando mis cursos:', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const toggleCurso = (cursoId) => {
    setExpandidos(prev => {
      const next = new Set(prev);
      if (next.has(cursoId)) next.delete(cursoId);
      else next.add(cursoId);
      return next;
    });
  };

  const totalMaterias = grupos.reduce((s, g) => s + g.materias.length, 0);

  if (loading) return (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color={colors.primary[600]} />
      <Text style={styles.loadingText}>Cargando mis cursos...</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIconWrap}>
          <Ionicons name="school" size={26} color={colors.primary[600]} />
        </View>
        <View>
          <Text style={styles.headerText}>Mis Cursos</Text>
          <Text style={styles.headerSub}>
            {grupos.length} {grupos.length === 1 ? 'curso' : 'cursos'} · {totalMaterias} {totalMaterias === 1 ? 'materia' : 'materias'}
          </Text>
        </View>
      </View>

      {grupos.length === 0 ? (
        <EmptyState
          icon="school-outline"
          title="Sin cursos asignados"
          message="El administrador aún no ha asignado cursos a tu perfil docente."
        />
      ) : (
        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">

          {/* Resumen */}
          <View style={styles.resumenRow}>
            <View style={styles.resumenCard}>
              <Text style={styles.resumenNum}>{grupos.length}</Text>
              <Text style={styles.resumenLabel}>Cursos</Text>
            </View>
            <View style={styles.resumenCard}>
              <Text style={[styles.resumenNum, { color: colors.primary[600] }]}>{totalMaterias}</Text>
              <Text style={styles.resumenLabel}>Materias</Text>
            </View>
          </View>

          <View style={styles.list}>
            {grupos.map(g => (
              <CursoCard
                key={g.cursoId}
                grupo={g}
                expandido={expandidos.has(g.cursoId)}
                onToggle={() => toggleCurso(g.cursoId)}
              />
            ))}
          </View>

          <View style={{ height: spacing.xl }} />
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: colors.gray[50] },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.sm },
  loadingText:     { fontSize: fontSize.base, color: colors.gray[600] },

  header: {
    backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center',
    gap: spacing.md, padding: spacing.lg,
    borderBottomWidth: 1, borderBottomColor: colors.gray[200],
  },
  headerIconWrap: {
    width: 48, height: 48, borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[50], justifyContent: 'center', alignItems: 'center',
  },
  headerText: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.gray[900] },
  headerSub:  { fontSize: fontSize.sm, color: colors.gray[500], marginTop: 2 },

  resumenRow: {
    flexDirection: 'row', gap: spacing.md,
    marginHorizontal: spacing.lg, marginTop: spacing.lg, marginBottom: spacing.sm,
  },
  resumenCard: {
    flex: 1, backgroundColor: colors.white, borderRadius: borderRadius.lg,
    padding: spacing.md, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 2, elevation: 1,
  },
  resumenNum:   { fontSize: 28, fontWeight: '800', color: colors.gray[900] },
  resumenLabel: { fontSize: fontSize.xs, color: colors.gray[500], marginTop: 2 },

  content: { flex: 1 },
  list:    { padding: spacing.lg, paddingTop: spacing.sm },

  card: { marginBottom: spacing.md },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardIcon: {
    width: 44, height: 44, borderRadius: borderRadius.md,
    backgroundColor: colors.primary[50], justifyContent: 'center', alignItems: 'center',
  },
  cursoNombre: { fontSize: fontSize.base, fontWeight: '700', color: colors.gray[900] },
  gradoNombre: { fontSize: fontSize.xs, color: colors.primary[600], fontWeight: '500', marginTop: 1 },
  cursoSub:    { fontSize: fontSize.xs, color: colors.gray[500], marginTop: 1 },

  materiasContainer: { marginTop: spacing.sm },
  divider:           { height: 1, backgroundColor: colors.gray[100], marginBottom: spacing.sm },
  materiaRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.sm, paddingVertical: spacing.sm,
  },
  materiaRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.gray[50] },
  materiaIconWrap: {
    width: 30, height: 30, borderRadius: borderRadius.sm,
    backgroundColor: colors.primary[50], justifyContent: 'center', alignItems: 'center',
  },
  materiaNombre: { fontSize: fontSize.sm, color: colors.gray[700], fontWeight: '500' },
});

export default MisCursosDocenteScreen;