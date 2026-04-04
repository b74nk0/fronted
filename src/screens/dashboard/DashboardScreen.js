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
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';

const DashboardScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation();

  const hasRole = (roleName) => {
    if (!user?.roles || !Array.isArray(user.roles)) return false;
    return user.roles.some(role => {
      const roleStr = typeof role === 'string' ? role : role.nombre;
      return roleStr?.toLowerCase() === roleName.toLowerCase();
    });
  };

  const isAdmin = hasRole('ADMINISTRADOR');
  const isAdministrativo = hasRole('ADMINISTRATIVO');
  const isDocente = hasRole('DOCENTE');
  const isEstudiante = hasRole('ESTUDIANTE');

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour > 6 && hour < 12) return '¡Buenos días!';
    if (hour >= 12 && hour < 18) return '¡Buenas tardes!';
    return '¡Buenas noches!';
  };

  const adminCards = [
    {
      title: 'Usuarios',
      icon: 'people',
      color: colors.primary[600],
      screen: 'Usuarios',
      description: 'Gestionar usuarios del sistema',
    },
    {
      title: 'Gestión Académica',
      icon: 'school',
      color: '#9333ea',
      screen: 'GestionAcademica',
      description: 'Cursos, materias y docentes',
    },
    {
      title: 'Pensiones',
      icon: 'cash',
      color: '#16a34a',
      screen: 'Pensiones',
      description: 'Pensiones y pagos',
    },
    {
      title: 'Administración',
      icon: 'briefcase',
      color: '#dc2626',
      screen: 'AdministracionEscolar',
      description: 'Personal e inventario',
    },
    {
      title: 'Configuración',
      icon: 'settings',
      color: '#64748b',
      screen: 'Configuracion',
      description: 'Configuración del sistema',
    },
  ];

  const docenteCards = [
    {
      title: 'Mis Cursos',
      icon: 'book',
      color: colors.primary[600],
      screen: 'GestionAcademicaDocente',
      description: 'Ver y gestionar mis cursos',
    },
    {
      title: 'Estudiantes',
      icon: 'people',
      color: '#0891b2',
      screen: 'Usuarios',
      description: 'Ver listado de estudiantes',
    },
    {
      title: 'Evaluaciones',
      icon: 'clipboard',
      color: '#9333ea',
      screen: 'GestionAcademicaDocente',
      description: 'Crear y calificar evaluaciones',
    },
    {
      title: 'Asistencia',
      icon: 'checkmark-circle',
      color: '#16a34a',
      screen: 'MiAsistencia',
      description: 'Tomar asistencia',
    },
    {
      title: 'Documentos',
      icon: 'document-text',
      color: '#eab308',
      screen: 'Documentacion',
      description: 'Mis documentos',
    },
  ];

  const estudianteCards = [
    {
      title: 'Mis Notas',
      icon: 'star',
      color: colors.primary[600],
      screen: 'FinanzasEstudiante',
      description: 'Ver mis calificaciones',
    },
    {
      title: 'Horario',
      icon: 'time',
      color: '#9333ea',
      screen: 'FinanzasEstudiante',
      description: 'Mi horario de clases',
    },
    {
      title: 'Matricula y Pension',
      icon: 'cash',
      color: '#16a34a',
      screen: 'MisPensiones',
      description: 'Estado de cuenta',
    },
    {
      title: 'Certificados',
      icon: 'ribbon',
      color: '#eab308',
      screen: 'Certificados',
      description: 'Mis certificados',
    },
  ];

  const getCards = () => {
    if (isAdmin || isAdministrativo) return adminCards;
    if (isDocente) return docenteCards;
    if (isEstudiante) return estudianteCards;
    return [];
  };

  const renderCard = (card, index) => (
    <TouchableOpacity
      key={index}
      style={styles.card}
      onPress={() => navigation.navigate(card.screen)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: card.color }]}>
        <Ionicons name={card.icon} size={32} color={colors.white} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{card.title}</Text>
        <Text style={styles.cardDescription}>{card.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color={colors.gray[400]} />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.userName}>{user?.nombre || user?.email}</Text>
        </View>
        <View style={[styles.roleBadge, { backgroundColor: colors.primary[100] }]}>
          <Text style={[styles.roleText, { color: colors.primary[700] }]}>
            {user?.roles?.[0] || 'Usuario'}
          </Text>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>

        {/* ── Fecha → navega al Calendario ── */}
        <TouchableOpacity
          style={styles.statCard}
          onPress={() => navigation.navigate('Calendario')}
          activeOpacity={0.7}
        >
          <Ionicons name="calendar-outline" size={24} color={colors.primary[600]} />
          <Text style={styles.statValue}>
            {new Date().toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'long',
            })}
          </Text>
          <Text style={styles.statLabel}>Fecha</Text>
        </TouchableOpacity>

        <View style={styles.statCard}>
          <Ionicons name="notifications-outline" size={24} color={colors.primary[600]} />
          <Text style={styles.statValue}>5</Text>
          <Text style={styles.statLabel}>Notificaciones</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="alert-circle-outline" size={24} color={colors.primary[600]} />
          <Text style={styles.statValue}>2</Text>
          <Text style={styles.statLabel}>Pendientes</Text>
        </View>
      </View>

      {/* Main Cards */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Accesos Rápidos</Text>
        <View style={styles.cardsContainer}>
          {getCards().map((card, index) => renderCard(card, index))}
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actividad Reciente</Text>
        <View style={styles.activityCard}>
          <Ionicons name="time-outline" size={20} color={colors.gray[500]} />
          <Text style={styles.activityText}>No hay actividad reciente</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  header: {
    backgroundColor: colors.white, padding: spacing.lg,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: colors.gray[200],
  },
  greeting: { fontSize: fontSize.base, color: colors.gray[600] },
  userName: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.gray[900], marginTop: spacing.xs },
  roleBadge: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  roleText: { fontSize: fontSize.sm, fontWeight: '600' },
  statsContainer: { flexDirection: 'row', padding: spacing.lg, gap: spacing.md },
  statCard: {
    flex: 1, backgroundColor: colors.white, padding: spacing.md,
    borderRadius: borderRadius.lg, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 2, elevation: 2,
  },
  statValue: { fontSize: fontSize.lg, fontWeight: 'bold', color: colors.gray[900], marginTop: spacing.xs },
  statLabel: { fontSize: fontSize.xs, color: colors.gray[600], marginTop: spacing.xs },
  section: { padding: spacing.lg },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: 'bold', color: colors.gray[900], marginBottom: spacing.md },
  cardsContainer: { gap: spacing.md },
  card: {
    backgroundColor: colors.white, padding: spacing.lg,
    borderRadius: borderRadius.lg, flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  iconContainer: {
    width: 56, height: 56, borderRadius: borderRadius.md,
    justifyContent: 'center', alignItems: 'center', marginRight: spacing.md,
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: fontSize.base, fontWeight: '600', color: colors.gray[900], marginBottom: spacing.xs },
  cardDescription: { fontSize: fontSize.sm, color: colors.gray[600] },
  activityCard: {
    backgroundColor: colors.white, padding: spacing.lg,
    borderRadius: borderRadius.lg, flexDirection: 'row',
    alignItems: 'center', gap: spacing.md,
  },
  activityText: { fontSize: fontSize.sm, color: colors.gray[600] },
});

export default DashboardScreen;