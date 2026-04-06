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

const ConfiguracionScreen = () => {
  const navigation = useNavigation();

  const configSections = [
    {
      id: 'institucion',
      title: 'Información Institucional',
      description: 'Datos generales del colegio',
      icon: 'business',
      color: colors.primary[600],
      screen: 'ConfigInstitucion',
    },
    {
      id: 'periodos',
      title: 'Períodos Académicos',
      description: 'Años lectivos y períodos',
      icon: 'calendar',
      color: '#9333ea',
      screen: 'ConfigPeriodos',
    },
    {
      id: 'grados',
      title: 'Grados y Niveles',
      description: 'Estructura académica',
      icon: 'school',
      color: '#16a34a',
      screen: 'ConfigGrados',
    },
    {
      id: 'certificados',
      title: 'Certificados',
      description: 'Plantillas de certificados',
      icon: 'ribbon',
      color: '#0d9488',
      screen: 'ConfigCertificados',
    },
    {
      id: 'roles',
      title: 'Roles del Sistema',
      description: 'Gestionar permisos',
      icon: 'shield-checkmark',
      color: '#dc2626',
      screen: 'ConfigRoles',
    },
    {
      id: 'documentos',
      title: 'Tipos de Documento',
      description: 'CC, TI, CE, Pasaporte, etc.',
      icon: 'card',
      color: '#f59e0b',
      screen: 'ConfigTiposDocumento',
    },
    {
      id: 'general',
      title: 'Configuración General',
      description: 'Parámetros del sistema',
      icon: 'settings',
      color: '#64748b',
      screen: 'ConfigGeneral',
    },
  ];

  const renderCard = (section) => (
    <TouchableOpacity
      key={section.id}
      style={styles.card}
      onPress={() => navigation.navigate(section.screen)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: section.color }]}>
        <Ionicons name={section.icon} size={32} color={colors.white} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{section.title}</Text>
        <Text style={styles.cardDescription}>{section.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color={colors.gray[400]} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Configuración</Text>
          <Text style={styles.headerSubtitle}>Configuración del sistema</Text>
        </View>
        <View style={styles.headerIcon}>
          <Ionicons name="settings-outline" size={32} color={colors.primary[600]} />
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={colors.primary[600]} />
          <Text style={styles.infoText}>
            Configure los parámetros básicos del sistema antes de usar los demás módulos
          </Text>
        </View>

        <View style={styles.cardsContainer}>
          {configSections.map(renderCard)}
        </View>

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerTitle: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    marginTop: spacing.xs,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    padding: spacing.md,
    margin: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.primary[700],
    lineHeight: 20,
  },
  cardsContainer: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  cardDescription: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
  },
});

export default ConfiguracionScreen;