import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const LandingScreen = () => {
  const navigation = useNavigation();
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  const heroImages = [
    require('../../../assets/images/hero-1.jpg'),
    require('../../../assets/images/hero-2.jpg'),
    require('../../../assets/images/hero-3.jpg'),
  ];

  const services = [
    {
      icon: 'book-outline',
      title: 'Gestión Académica',
      description: 'Control de horarios, planes de estudio y seguimiento docente.',
      color: colors.primary[600],
    },
    {
      icon: 'checkmark-done-outline',
      title: 'Actividades y Evaluaciones',
      description: 'Creación de tareas, exámenes y rúbricas de calificación.',
      color: '#9333ea',
    },
    {
      icon: 'folder-outline',
      title: 'Documentación',
      description: 'Almacenamiento digital de certificados, informes y más.',
      color: '#16a34a',
    },
    {
      icon: 'cash-outline',
      title: 'Matrículas y Finanzas',
      description: 'Gestión de pagos, becas y estados de cuenta.',
      color: '#eab308',
    },
    {
      icon: 'briefcase-outline',
      title: 'Administración Escolar',
      description: 'Control de personal, inventario y recursos.',
      color: '#dc2626',
    },
    {
      icon: 'library-outline',
      title: 'Biblioteca',
      description: 'Catálogo digital, préstamos y devoluciones.',
      color: '#6366f1',
    },
  ];

  // Carrusel automático
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroImages.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const renderHeroCarousel = () => (
    <View style={styles.heroContainer}>
      {heroImages.map((image, index) => (
        <Animated.View
          key={index}
          style={[
            styles.heroSlide,
            {
              opacity: activeSlide === index ? 1 : 0,
            },
          ]}
        >
          <Image source={image} style={styles.heroImage} />
        </Animated.View>
      ))}
      
      {/* Overlay oscuro */}
      <View style={styles.heroOverlay} />
      
      {/* Contenido del Hero */}
      <View style={styles.heroContent}>
        <Image
          source={require('../../../assets/images/Scolaris-logo.png')}
          style={styles.heroLogo}
          resizeMode="contain"
        />
        <Text style={styles.heroTitle}>Gestión Escolar Simplificada</Text>
        <Text style={styles.heroSubtitle}>
          Optimiza procesos académicos, administrativos y financieros con Scolaris.
        </Text>
        <TouchableOpacity
          style={styles.heroCTA}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.8}
        >
          <Text style={styles.heroCTAText}>Explorar Servicios</Text>
          <Ionicons name="arrow-forward" size={20} color={colors.primary[600]} />
        </TouchableOpacity>
      </View>

      {/* Indicadores del carrusel */}
      <View style={styles.carouselIndicators}>
        {heroImages.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              activeSlide === index && styles.activeIndicator,
            ]}
          />
        ))}
      </View>
    </View>
  );

  const renderServiceCard = (service, index) => (
    <View key={index} style={styles.serviceCard}>
      <View style={[styles.serviceIconContainer, { backgroundColor: service.color }]}>
        <Ionicons name={service.icon} size={32} color={colors.white} />
      </View>
      <Text style={styles.serviceTitle}>{service.title}</Text>
      <Text style={styles.serviceDescription}>{service.description}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Hero Section */}
        {renderHeroCarousel()}

        {/* Servicios Section */}
        <View style={styles.servicesSection}>
          <Text style={styles.sectionTitle}>Nuestros Servicios</Text>
          <Text style={styles.sectionSubtitle}>
            Soluciones integrales para la gestión educativa moderna
          </Text>

          <View style={styles.servicesGrid}>
            {services.map((service, index) => renderServiceCard(service, index))}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerContent}>
            <Text style={styles.footerTitle}>Contacto</Text>
            <View style={styles.footerItem}>
              <Ionicons name="mail" size={16} color={colors.primary[400]} />
              <Text style={styles.footerText}>shirosoluciones@outlook.com</Text>
            </View>
            <View style={styles.footerItem}>
              <Ionicons name="call" size={16} color={colors.primary[400]} />
              <Text style={styles.footerText}>+57 301 769 1477</Text>
            </View>
          </View>
          <View style={styles.footerCopyright}>
            <Text style={styles.copyrightText}>
              © 2026 Shiro Soluciones. Todos los derechos reservados.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Botón flotante de Login */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => navigation.navigate('Login')}
        activeOpacity={0.9}
      >
        <Ionicons name="log-in-outline" size={24} color={colors.white} />
        <Text style={styles.floatingButtonText}>Iniciar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  
  // Hero Styles
  heroContainer: {
    height: SCREEN_HEIGHT * 0.7,
    position: 'relative',
  },
  heroSlide: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  heroContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    zIndex: 10,
  },
  heroLogo: {
    width: 200,
    height: 80,
    marginBottom: spacing.lg,
  },
  heroTitle: {
    fontSize: Platform.OS === 'web' ? 48 : 36,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.md,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroSubtitle: {
    fontSize: fontSize.lg,
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.xl,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  heroCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  heroCTAText: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.primary[600],
    marginRight: spacing.sm,
  },
  carouselIndicators: {
    position: 'absolute',
    bottom: spacing.lg,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  activeIndicator: {
    width: 24,
    backgroundColor: colors.white,
  },

  // Services Section
  servicesSection: {
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.gray[50],
  },
  sectionTitle: {
    fontSize: fontSize.xxxl,
    fontWeight: 'bold',
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  sectionSubtitle: {
    fontSize: fontSize.base,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCard: {
    width: Platform.OS === 'web' ? '31%' : '48%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  serviceIconContainer: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  serviceTitle: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: spacing.sm,
  },
  serviceDescription: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    lineHeight: 20,
  },

  // Footer
  footer: {
    backgroundColor: colors.gray[900],
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  footerContent: {
    marginBottom: spacing.lg,
  },
  footerTitle: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: spacing.md,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  footerText: {
    fontSize: fontSize.sm,
    color: colors.gray[300],
    marginLeft: spacing.sm,
  },
  footerCopyright: {
    borderTopWidth: 1,
    borderTopColor: colors.gray[700],
    paddingTop: spacing.md,
    alignItems: 'center',
  },
  copyrightText: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
  },

  // Floating Button
  floatingButton: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[600],
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingButtonText: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
});

export default LandingScreen;