import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';

const MODULOS = [
  {
    title: 'Compendio de Notas',
    icon: 'stats-chart',
    color: '#0891b2',
    screen: 'ReporteNotas',
    description: 'Ver calificaciones y promedios por curso',
  },
  {
    title: 'Configuración General',
    icon: 'settings',
    color: '#64748b',
    screen: 'ConfigGeneral',
    description: 'Parámetros generales del sistema',
  },
  {
    title: 'Períodos Académicos',
    icon: 'calendar',
    color: '#0284c7',
    screen: 'ConfigPeriodos',
    description: 'Gestionar períodos y subperíodos',
  },
  {
    title: 'Grados y Niveles',
    icon: 'school',
    color: '#16a34a',
    screen: 'ConfigGrados',
    description: 'Configurar grados por nivel educativo',
  },
  {
    title: 'Información Institucional',
    icon: 'business',
    color: '#7c3aed',
    screen: 'ConfigInstitucion',
    description: 'Datos de la institución',
  },
  {
    title: 'Tipos de Documento',
    icon: 'document',
    color: '#f59e0b',
    screen: 'ConfigTiposDocumento',
    description: 'Tipos de identificación',
  },
  {
    title: 'Roles del Sistema',
    icon: 'people',
    color: '#9333ea',
    screen: 'ConfigRoles',
    description: 'Gestionar roles y permisos',
  },
  {
    title: 'Configurar Certificados',
    icon: 'ribbon',
    color: '#dc2626',
    screen: 'ConfigCertificados',
    description: 'Plantillas de certificados',
  },
];

const AdministracionEscolarScreen = () => {
  const navigation = useNavigation();

  const handleNavigate = (screen) => {
    if (!screen) return;
    navigation.navigate(screen);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerIconContainer}>
          <Ionicons name="briefcase" size={28} color={colors.primary[600]} />
        </View>
        <View>
          <Text style={styles.headerText}>Administración Escolar</Text>
          <Text style={styles.headerSubtext}>Configuración y gestión del sistema</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {MODULOS.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.card}
            onPress={() => handleNavigate(item.screen)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
              <Ionicons name={item.icon} size={28} color={colors.white} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDescription}>{item.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
          </TouchableOpacity>
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
    marginHorizontal: spacing.lg,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: fontSize.base, fontWeight: '700', color: colors.gray[900], marginBottom: 4 },
  cardDescription: { fontSize: fontSize.sm, color: colors.gray[500] },
});

export default AdministracionEscolarScreen;