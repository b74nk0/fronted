import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';

const MODULOS = [
  {
    seccion: 'Estructura Curricular',
    descripcion: 'Configuración base de qué y cómo se enseña',
    items: [
      {
        title: 'Matrículas y Admisiones',
        icon: 'person-add',
        color: '#f59e0b',
        screen: 'Matriculas',
        description: 'Expedientes, pre-inscripciones y promoción',
      },{
        title: 'Materias',
        icon: 'book',
        color: '#0284c7',
        screen: 'Materias',
        description: 'Gestionar las materias activas del sistema',
      },
      {
        title: 'Asignación Docente',
        icon: 'people-circle-outline',
        color: '#0bb3f5',
        screen: 'Cursos',
        description: 'Asignación de docentes a cursos y materias'
      },
      {
        title: 'Planes de Estudio',
        icon: 'document-text',
        color: '#9333ea',
        screen: 'PlanesEstudio',
        description: 'Asignar materias y carga horaria por grado',
      },
      {
        title: 'Competencias y Logros',
        icon: 'ribbon',
        color: '#16a34a',
        screen: 'Competencias',
        description: 'Criterios de evaluación por materia y grado',
      },
      {
        title: 'Registro de Asistencia',
        icon: 'checkmark-circle',
        color: '#dc2626',
        screen: 'Asistencia',
        description: 'Control de asistencia diaria por curso',
      },
      {
        title: 'Compendio de Notas',
        icon: 'stats-chart',
        color: '#0891b2',
        screen: 'ReporteNotas',
        description: 'Ver notas, promedios y boletines por curso',
      },
    ],
  },
  {
    seccion: 'Próximamente',
    descripcion: 'Módulos en desarrollo',
    items: [
      {
        title: 'Horarios',
        icon: 'calendar',
        color: '#7c3aed',
        screen: null,
        description: 'Generador de horarios y agenda escolar',
      },
    ],
  },
];

const GestionAcademicaScreen = () => {
  const navigation = useNavigation();

  const handleNavigate = (screen) => {
    if (!screen) return;
    navigation.navigate(screen);
  };

  const renderItem = (item, index) => {
    const disabled = !item.screen;
    return (
      <TouchableOpacity
        key={index}
        style={[styles.card, disabled && styles.cardDisabled]}
        onPress={() => handleNavigate(item.screen)}
        activeOpacity={disabled ? 1 : 0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: disabled ? colors.gray[200] : item.color }]}>
          <Ionicons
            name={item.icon}
            size={28}
            color={disabled ? colors.gray[400] : colors.white}
          />
        </View>
        <View style={styles.cardContent}>
          <View style={styles.cardTitleRow}>
            <Text style={[styles.cardTitle, disabled && styles.cardTitleDisabled]}>
              {item.title}
            </Text>
            {disabled && (
              <View style={styles.proximamenteBadge}>
                <Text style={styles.proximamenteText}>Pronto</Text>
              </View>
            )}
          </View>
          <Text style={[styles.cardDescription, disabled && styles.cardDescriptionDisabled]}>
            {item.description}
          </Text>
        </View>
        {!disabled && (
          <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIconContainer}>
          <Ionicons name="school" size={28} color={colors.primary[600]} />
        </View>
        <View>
          <Text style={styles.headerText}>Gestión Académica</Text>
          <Text style={styles.headerSubtext}>Estructura y configuración académica</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {MODULOS.map((seccion, si) => (
          <View key={si} style={styles.seccion}>
            <Text style={styles.seccionTitle}>{seccion.seccion}</Text>
            <Text style={styles.seccionDesc}>{seccion.descripcion}</Text>
            <View style={styles.seccionItems}>
              {seccion.items.map((item, ii) => renderItem(item, ii))}
            </View>
          </View>
        ))}
        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  header: {
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerIconContainer: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.gray[900] },
  headerSubtext: { fontSize: fontSize.sm, color: colors.gray[500], marginTop: 2 },
  content: { flex: 1 },
  seccion: { padding: spacing.lg, paddingBottom: 0 },
  seccionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  seccionDesc: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginBottom: spacing.md,
  },
  seccionItems: { gap: spacing.sm },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: spacing.sm,
  },
  cardDisabled: {
    backgroundColor: colors.gray[50],
    shadowOpacity: 0,
    elevation: 0,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 4 },
  cardTitle: { fontSize: fontSize.base, fontWeight: '600', color: colors.gray[900] },
  cardTitleDisabled: { color: colors.gray[400] },
  cardDescription: { fontSize: fontSize.sm, color: colors.gray[500], lineHeight: 18 },
  cardDescriptionDisabled: { color: colors.gray[400] },
  proximamenteBadge: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  proximamenteText: { fontSize: fontSize.xs, color: colors.gray[500], fontWeight: '500' },
});

export default GestionAcademicaScreen;