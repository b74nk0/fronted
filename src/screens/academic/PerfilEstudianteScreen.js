import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import Card from '../../components/common/Card';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';
import { datosAdicionalesService } from '../../services/datosAdicionalesService';

// ─── Fila de dato ─────────────────────────────────────────────────────────────
const DataRow = ({ label, value, icon }) => (
  <View style={styles.dataRow}>
    <View style={styles.dataLabelRow}>
      {icon && <Ionicons name={icon} size={15} color={colors.gray[400]} />}
      <Text style={styles.dataLabel}>{label}</Text>
    </View>
    <Text style={styles.dataValue}>{value || '—'}</Text>
  </View>
);

// ─── Fila con botón de llamar ─────────────────────────────────────────────────
const ContactRow = ({ label, nombre, telefono, icon }) => {
  const llamar = () => {
    if (telefono) Linking.openURL(`tel:${telefono}`);
  };
  return (
    <View style={styles.contactRow}>
      <View style={styles.contactInfo}>
        <View style={styles.dataLabelRow}>
          {icon && <Ionicons name={icon} size={15} color={colors.gray[400]} />}
          <Text style={styles.dataLabel}>{label}</Text>
        </View>
        <Text style={styles.contactNombre}>{nombre || '—'}</Text>
        {telefono ? (
          <Text style={styles.contactTelefono}>{telefono}</Text>
        ) : null}
      </View>
      {telefono ? (
        <TouchableOpacity style={styles.callBtn} onPress={llamar}>
          <Ionicons name="call" size={18} color={colors.white} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

// ─── Sección con título ───────────────────────────────────────────────────────
const Section = ({ title, icon, children }) => (
  <Card style={styles.section}>
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={18} color={colors.primary[600]} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    {children}
  </Card>
);

// ─── Screen principal ─────────────────────────────────────────────────────────
const PerfilEstudianteScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { usuario } = route.params;

  const [datosAdicionales, setDatosAdicionales] = useState(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    const load = async () => {
      setLoading(true);
      try {
        const datos = await datosAdicionalesService.obtenerPorUsuario(usuario.id);
        setDatosAdicionales(datos);
      } catch {
        setDatosAdicionales(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [usuario.id]));

  const iniciales = `${usuario.nombre?.[0] || ''}${usuario.apellido?.[0] || ''}`.toUpperCase();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[700]} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.headerText}>Perfil del Estudiante</Text>
          <Text style={styles.headerSubtext}>Solo lectura</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text style={styles.loadingText}>Cargando perfil...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">

          {/* Avatar */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{iniciales}</Text>
            </View>
            <Text style={styles.avatarNombre}>{usuario.nombre} {usuario.apellido}</Text>
            <Text style={styles.avatarEmail}>{usuario.email}</Text>
            <View style={styles.rolBadge}>
              <Text style={styles.rolBadgeText}>Estudiante</Text>
            </View>
          </View>

          {/* Datos personales */}
          <Section title="Datos Personales" icon="person-outline">
            <DataRow label="Nombre"            value={usuario.nombre}         icon="person-outline" />
            <DataRow label="Apellido"           value={usuario.apellido}       icon="person-outline" />
            <DataRow label="Tipo de documento"  value={usuario.tipoDocumento}  icon="card-outline" />
            <DataRow label="Número de documento" value={usuario.numeroDocumento} icon="card-outline" />
            <DataRow label="Email"              value={usuario.email}          icon="mail-outline" />
          </Section>

          {/* Información adicional */}
          <Section title="Información Adicional" icon="information-circle-outline">
            <DataRow label="Teléfono"           value={datosAdicionales?.telefono}       icon="call-outline" />
            <DataRow label="Dirección"           value={datosAdicionales?.direccion}      icon="location-outline" />
            <DataRow label="Ciudad"              value={datosAdicionales?.ciudad}         icon="business-outline" />
            <DataRow label="Fecha de nacimiento" value={datosAdicionales?.fechaNacimiento} icon="calendar-outline" />
            <DataRow label="Género"              value={datosAdicionales?.genero}         icon="transgender-outline" />
            <DataRow label="EPS"                 value={datosAdicionales?.eps}            icon="medical-outline" />
            <DataRow label="Tipo de sangre"      value={datosAdicionales?.tipoSangre}     icon="water-outline" />
          </Section>

          {/* Contactos de familia — sección destacada para el docente */}
          <Card style={[styles.section, styles.familiaSection]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="people-outline" size={18} color={colors.primary[600]} />
              <Text style={styles.sectionTitle}>Familia / Acudiente</Text>
            </View>
            <View style={styles.familiaBanner}>
              <Ionicons name="shield-checkmark-outline" size={15} color={colors.primary[700]} />
              <Text style={styles.familiaBannerText}>
                Información de contacto de emergencia
              </Text>
            </View>

            <ContactRow
              label="Padre"
              nombre={datosAdicionales?.nombrePadre}
              telefono={datosAdicionales?.telefonoPadre}
              icon="man-outline"
            />
            <View style={styles.divider} />
            <ContactRow
              label="Madre"
              nombre={datosAdicionales?.nombreMadre}
              telefono={datosAdicionales?.telefonoMadre}
              icon="woman-outline"
            />
            <View style={styles.divider} />
            <ContactRow
              label="Acudiente"
              nombre={datosAdicionales?.acudiente}
              telefono={datosAdicionales?.telefonoAcudiente}
              icon="person-outline"
            />
          </Card>

          {/* Banner solo lectura */}
          <View style={styles.readOnlyBanner}>
            <Ionicons name="lock-closed-outline" size={15} color={colors.gray[500]} />
            <Text style={styles.readOnlyText}>
              Vista de solo lectura. Los datos son administrados por la institución.
            </Text>
          </View>

          <View style={{ height: spacing.xl }} />
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: spacing.md, fontSize: fontSize.base, color: colors.gray[600] },

  header: {
    backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center',
    padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.gray[200],
  },
  backButton:    { marginRight: spacing.md },
  headerTitle:   { flex: 1 },
  headerText:    { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.gray[900] },
  headerSubtext: { fontSize: fontSize.sm, color: colors.gray[500], marginTop: 2 },

  content: { flex: 1 },

  avatarSection: {
    alignItems: 'center', paddingVertical: spacing.xl,
    backgroundColor: colors.white,
    borderBottomWidth: 1, borderBottomColor: colors.gray[100],
    marginBottom: spacing.md,
  },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#16a34a',
    justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md,
  },
  avatarText:   { fontSize: 32, fontWeight: '800', color: colors.white },
  avatarNombre: { fontSize: fontSize.xl, fontWeight: '700', color: colors.gray[900] },
  avatarEmail:  { fontSize: fontSize.sm, color: colors.gray[500], marginTop: 4 },
  rolBadge: {
    marginTop: spacing.sm, backgroundColor: '#dcfce7',
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: borderRadius.full, borderWidth: 1, borderColor: '#86efac',
  },
  rolBadgeText: { fontSize: fontSize.xs, color: '#15803d', fontWeight: '600' },

  section: { marginHorizontal: spacing.lg, marginBottom: spacing.md },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginBottom: spacing.md, paddingBottom: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.gray[100],
  },
  sectionTitle: { fontSize: fontSize.base, fontWeight: '700', color: colors.gray[900] },

  dataRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.gray[50],
  },
  dataLabelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flex: 1 },
  dataLabel:    { fontSize: fontSize.sm, color: colors.gray[500] },
  dataValue:    { fontSize: fontSize.sm, fontWeight: '500', color: colors.gray[800], flex: 1, textAlign: 'right' },

  // Familia
  familiaSection: { borderWidth: 1, borderColor: colors.primary[200] },
  familiaBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.primary[50], padding: spacing.sm,
    borderRadius: borderRadius.md, marginBottom: spacing.md,
  },
  familiaBannerText: { fontSize: fontSize.xs, color: colors.primary[700], fontWeight: '500' },

  contactRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  contactInfo:    { flex: 1 },
  contactNombre:  { fontSize: fontSize.sm, fontWeight: '600', color: colors.gray[900], marginTop: 2 },
  contactTelefono: { fontSize: fontSize.sm, color: colors.primary[600], marginTop: 2 },
  callBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#16a34a',
    justifyContent: 'center', alignItems: 'center', marginLeft: spacing.md,
  },
  divider: { height: 1, backgroundColor: colors.gray[100], marginVertical: spacing.xs },

  readOnlyBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginHorizontal: spacing.lg, marginBottom: spacing.md,
    backgroundColor: colors.gray[100], padding: spacing.md, borderRadius: borderRadius.lg,
  },
  readOnlyText: { flex: 1, fontSize: fontSize.xs, color: colors.gray[500] },
});

export default PerfilEstudianteScreen;