import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { usuarioService } from '../../services/usuarioService';
import { datosAdicionalesService } from '../../services/datosAdicionalesService';

// ─── Fila de dato solo lectura ────────────────────────────────────────────────
const DataRow = ({ label, value, icon }) => (
  <View style={styles.dataRow}>
    <View style={styles.dataLabelContainer}>
      {icon && <Ionicons name={icon} size={15} color={colors.gray[400]} />}
      <Text style={styles.dataLabel}>{label}</Text>
    </View>
    <Text style={styles.dataValue}>{value || '—'}</Text>
  </View>
);

// ─── Sección con título ───────────────────────────────────────────────────────
const Section = ({ title, icon, children, onEdit, editLabel }) => (
  <Card style={styles.section}>
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        <Ionicons name={icon} size={18} color={colors.primary[600]} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {onEdit && (
        <TouchableOpacity style={styles.editBtn} onPress={onEdit}>
          <Ionicons name="pencil-outline" size={15} color={colors.primary[600]} />
          <Text style={styles.editBtnText}>{editLabel || 'Editar'}</Text>
        </TouchableOpacity>
      )}
    </View>
    {children}
  </Card>
);

// ─── Screen principal ─────────────────────────────────────────────────────────
const MiPerfilScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();

  const [usuarioCompleto,  setUsuarioCompleto]  = useState(null);
  const [datosAdicionales, setDatosAdicionales] = useState(null);
  const [loading,          setLoading]          = useState(true);

  // Modales independientes
  const [passwordModal, setPasswordModal] = useState(false);
  const [familiaModal,  setFamiliaModal]  = useState(false);
  const [saving,        setSaving]        = useState(false);

  // Form contraseña
  const [formPassword, setFormPassword] = useState({
    passwordActual: '', passwordNueva: '', confirmar: '',
  });
  const [passwordErrors, setPasswordErrors] = useState({});

  // Form teléfonos familia
  const [formFamilia, setFormFamilia] = useState({
    telefonoPadre: '', telefonoMadre: '', telefonoAcudiente: '',
  });

  // ─── Cargar datos ────────────────────────────────────────────────────────────
  const loadDatos = async () => {
    setLoading(true);
    try {
      const usuarioData = await usuarioService.me();
      setUsuarioCompleto(usuarioData);
      const datosData = await datosAdicionalesService
        .obtenerPorUsuario(usuarioData.id).catch(() => null);
      setDatosAdicionales(datosData);
    } catch (error) {
      console.error('Error cargando perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { loadDatos(); }, []));

  // ─── Abrir modal contraseña ───────────────────────────────────────────────────
  const openPasswordModal = () => {
    setFormPassword({ passwordActual: '', passwordNueva: '', confirmar: '' });
    setPasswordErrors({});
    setPasswordModal(true);
  };

  // ─── Abrir modal familia ──────────────────────────────────────────────────────
  const openFamiliaModal = () => {
    setFormFamilia({
      telefonoPadre:     datosAdicionales?.telefonoPadre     || '',
      telefonoMadre:     datosAdicionales?.telefonoMadre     || '',
      telefonoAcudiente: datosAdicionales?.telefonoAcudiente || '',
    });
    setFamiliaModal(true);
  };

  // ─── Guardar contraseña ───────────────────────────────────────────────────────
  const handleSavePassword = async () => {
    const e = {};
    if (!formPassword.passwordNueva)           e.passwordNueva = 'Requerido';
    else if (formPassword.passwordNueva.length < 6) e.passwordNueva = 'Mínimo 6 caracteres';
    if (formPassword.passwordNueva !== formPassword.confirmar)
      e.confirmar = 'Las contraseñas no coinciden';
    setPasswordErrors(e);
    if (Object.keys(e).length > 0) return;

    setSaving(true);
    try {
      await usuarioService.actualizar(usuarioCompleto.id, {
        nombre:          usuarioCompleto.nombre,
        apellido:        usuarioCompleto.apellido,
        email:           usuarioCompleto.email,
        numeroDocumento: usuarioCompleto.numeroDocumento,
        tipoDocumento:   usuarioCompleto.tipoDocumento,
        roles:           usuarioCompleto.roles,
        password:        formPassword.passwordNueva,
      });
      setPasswordModal(false);
    } catch (error) {
      console.error('Error actualizando contraseña:', error);
      setPasswordErrors({ general: 'No se pudo actualizar la contraseña' });
    } finally {
      setSaving(false);
    }
  };

  // ─── Guardar teléfonos familia ────────────────────────────────────────────────
  const handleSaveFamilia = async () => {
    setSaving(true);
    try {
      const payload = {
        ...datosAdicionales,
        telefonoPadre:     formFamilia.telefonoPadre,
        telefonoMadre:     formFamilia.telefonoMadre,
        telefonoAcudiente: formFamilia.telefonoAcudiente,
      };
      if (datosAdicionales?.id) {
        const updated = await datosAdicionalesService.actualizar(datosAdicionales.id, payload);
        setDatosAdicionales(updated);
      } else {
        const created = await datosAdicionalesService.crear(usuarioCompleto.id, payload);
        setDatosAdicionales(created);
      }
      setFamiliaModal(false);
    } catch (error) {
      console.error('Error actualizando teléfonos:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color={colors.primary[600]} />
      <Text style={styles.loadingText}>Cargando perfil...</Text>
    </View>
  );

  const nombre    = usuarioCompleto?.nombre   || '';
  const apellido  = usuarioCompleto?.apellido || '';
  const iniciales = `${nombre[0] || ''}${apellido[0] || ''}`.toUpperCase();
  const rolesTexto = (usuarioCompleto?.roles || user?.roles || [])
    .map(r => typeof r === 'string' ? r : r.nombre).join(', ') || '—';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[700]} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.headerText}>Mi Perfil</Text>
          <Text style={styles.headerSubtext}>{rolesTexto}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{iniciales}</Text>
          </View>
          <Text style={styles.avatarNombre}>{nombre} {apellido}</Text>
          <Text style={styles.avatarEmail}>{usuarioCompleto?.email}</Text>
          <View style={styles.rolBadge}>
            <Text style={styles.rolBadgeText}>{rolesTexto}</Text>
          </View>
        </View>

        {/* Banner informativo */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle-outline" size={16} color={colors.primary[600]} />
          <Text style={styles.infoBannerText}>
            Los datos personales son gestionados por la institución. Solo puedes modificar tu contraseña y los teléfonos de contacto familiar.
          </Text>
        </View>

        {/* Datos personales — solo lectura */}
        <Section title="Datos Personales" icon="person-outline">
          <DataRow label="Nombre"              value={usuarioCompleto?.nombre}          icon="person-outline" />
          <DataRow label="Apellido"            value={usuarioCompleto?.apellido}        icon="person-outline" />
          <DataRow label="Tipo de documento"   value={usuarioCompleto?.tipoDocumento}   icon="card-outline" />
          <DataRow label="Número de documento" value={usuarioCompleto?.numeroDocumento} icon="card-outline" />
          <DataRow label="Email"               value={usuarioCompleto?.email}           icon="mail-outline" />
        </Section>

        {/* Contraseña — editable */}
        <Section
          title="Seguridad"
          icon="lock-closed-outline"
          onEdit={openPasswordModal}
          editLabel="Cambiar contraseña"
        >
          <View style={styles.passwordRow}>
            <Ionicons name="key-outline" size={16} color={colors.gray[400]} />
            <Text style={styles.passwordText}>••••••••••••</Text>
          </View>
          <Text style={styles.passwordHint}>
            Tu contraseña es privada y está protegida
          </Text>
        </Section>

        {/* Información adicional — solo lectura */}
        <Section title="Información Adicional" icon="information-circle-outline">
          <DataRow label="Teléfono"           value={datosAdicionales?.telefono}        icon="call-outline" />
          <DataRow label="Dirección"           value={datosAdicionales?.direccion}       icon="location-outline" />
          <DataRow label="Ciudad"              value={datosAdicionales?.ciudad}          icon="business-outline" />
          <DataRow label="Fecha de nacimiento" value={datosAdicionales?.fechaNacimiento} icon="calendar-outline" />
          <DataRow label="Género"              value={datosAdicionales?.genero}          icon="transgender-outline" />
          <DataRow label="EPS"                 value={datosAdicionales?.eps}             icon="medical-outline" />
          <DataRow label="Tipo de sangre"      value={datosAdicionales?.tipoSangre}      icon="water-outline" />
        </Section>

        {/* Familia — solo teléfonos editables */}
        <Section
          title="Datos de Familia / Acudiente"
          icon="people-outline"
          onEdit={openFamiliaModal}
          editLabel="Actualizar teléfonos"
        >
          <DataRow label="Nombre del padre"  value={datosAdicionales?.nombrePadre}      icon="man-outline" />
          <DataRow label="Teléfono padre"    value={datosAdicionales?.telefonoPadre}    icon="call-outline" />
          <DataRow label="Nombre de la madre" value={datosAdicionales?.nombreMadre}     icon="woman-outline" />
          <DataRow label="Teléfono madre"    value={datosAdicionales?.telefonoMadre}    icon="call-outline" />
          <DataRow label="Acudiente"         value={datosAdicionales?.acudiente}        icon="person-outline" />
          <DataRow label="Teléfono acudiente" value={datosAdicionales?.telefonoAcudiente} icon="call-outline" />
        </Section>

        <View style={{ height: spacing.xl }} />
      </ScrollView>

      {/* ── Modal cambiar contraseña ──────────────────────────────────────────── */}
      <Modal visible={passwordModal} transparent animationType="fade"
        onRequestClose={() => setPasswordModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cambiar Contraseña</Text>
              <TouchableOpacity onPress={() => setPasswordModal(false)}>
                <Ionicons name="close" size={24} color={colors.gray[600]} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <Input label="Nueva contraseña *"
                placeholder="Mínimo 8 caracteres"
                value={formPassword.passwordNueva}
                onChangeText={t => setFormPassword(f => ({ ...f, passwordNueva: t }))}
                secureTextEntry error={passwordErrors.passwordNueva} />
              <Input label="Confirmar contraseña *"
                placeholder="Repite la contraseña"
                value={formPassword.confirmar}
                onChangeText={t => setFormPassword(f => ({ ...f, confirmar: t }))}
                secureTextEntry error={passwordErrors.confirmar} />

              {/* Requisitos visuales */}
              <View style={styles.requisitos}>
                <View style={styles.requisitoRow}>
                  <Ionicons
                    name={formPassword.passwordNueva.length >= 8
                      ? 'checkmark-circle' : 'ellipse-outline'}
                    size={14}
                    color={formPassword.passwordNueva.length >= 8 ? '#16a34a' : colors.gray[300]}
                  />
                  <Text style={[styles.requisitoText,
                    formPassword.passwordNueva.length >= 8 && styles.requisitoOk]}>
                    Mínimo 8 caracteres
                  </Text>
                </View>
                <View style={styles.requisitoRow}>
                  <Ionicons
                    name={formPassword.passwordNueva &&
                      formPassword.passwordNueva === formPassword.confirmar
                      ? 'checkmark-circle' : 'ellipse-outline'}
                    size={14}
                    color={formPassword.passwordNueva &&
                      formPassword.passwordNueva === formPassword.confirmar
                      ? '#16a34a' : colors.gray[300]}
                  />
                  <Text style={[styles.requisitoText,
                    formPassword.passwordNueva &&
                    formPassword.passwordNueva === formPassword.confirmar &&
                    styles.requisitoOk]}>
                    Las contraseñas coinciden
                  </Text>
                </View>
              </View>

              {passwordErrors.general && (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle-outline" size={15} color={colors.red[600]} />
                  <Text style={styles.errorBannerText}>{passwordErrors.general}</Text>
                </View>
              )}
              <View style={{ height: spacing.md }} />
            </ScrollView>
            <View style={styles.modalFooter}>
              <Button title="Cancelar" onPress={() => setPasswordModal(false)}
                variant="outline" style={{ flex: 1 }} />
              <Button title={saving ? 'Guardando...' : 'Cambiar'}
                onPress={handleSavePassword} disabled={saving} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal actualizar teléfonos familia ───────────────────────────────── */}
      <Modal visible={familiaModal} transparent animationType="fade"
        onRequestClose={() => setFamiliaModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Teléfonos de Contacto</Text>
              <TouchableOpacity onPress={() => setFamiliaModal(false)}>
                <Ionicons name="close" size={24} color={colors.gray[600]} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <View style={styles.modalInfoBanner}>
                <Ionicons name="information-circle-outline" size={15} color={colors.primary[600]} />
                <Text style={styles.modalInfoText}>
                  Solo puedes actualizar los números de teléfono de contacto.
                </Text>
              </View>
              <Input label="Teléfono padre"
                value={formFamilia.telefonoPadre}
                onChangeText={t => setFormFamilia(f => ({ ...f, telefonoPadre: t }))}
                keyboardType="phone-pad" placeholder="Número de contacto" />
              <Input label="Teléfono madre"
                value={formFamilia.telefonoMadre}
                onChangeText={t => setFormFamilia(f => ({ ...f, telefonoMadre: t }))}
                keyboardType="phone-pad" placeholder="Número de contacto" />
              <Input label="Teléfono acudiente"
                value={formFamilia.telefonoAcudiente}
                onChangeText={t => setFormFamilia(f => ({ ...f, telefonoAcudiente: t }))}
                keyboardType="phone-pad" placeholder="Número de contacto" />
              <View style={{ height: spacing.md }} />
            </ScrollView>
            <View style={styles.modalFooter}>
              <Button title="Cancelar" onPress={() => setFamiliaModal(false)}
                variant="outline" style={{ flex: 1 }} />
              <Button title={saving ? 'Guardando...' : 'Guardar'}
                onPress={handleSaveFamilia} disabled={saving} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: colors.gray[50] },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText:     { marginTop: spacing.md, fontSize: fontSize.base, color: colors.gray[600] },

  header: {
    backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center',
    padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.gray[200],
  },
  backButton:    { marginRight: spacing.md },
  headerTitle:   { flex: 1 },
  headerText:    { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.gray[900] },
  headerSubtext: { fontSize: fontSize.sm, color: colors.gray[600], marginTop: 2 },

  content: { flex: 1 },

  avatarSection: {
    alignItems: 'center', paddingVertical: spacing.xl,
    backgroundColor: colors.white,
    borderBottomWidth: 1, borderBottomColor: colors.gray[100],
    marginBottom: spacing.md,
  },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.primary[600],
    justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md,
  },
  avatarText:   { fontSize: 32, fontWeight: '800', color: colors.white },
  avatarNombre: { fontSize: fontSize.xl, fontWeight: '700', color: colors.gray[900] },
  avatarEmail:  { fontSize: fontSize.sm, color: colors.gray[500], marginTop: 4 },
  rolBadge: {
    marginTop: spacing.sm, backgroundColor: colors.primary[50],
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.primary[200],
  },
  rolBadgeText: { fontSize: fontSize.xs, color: colors.primary[700], fontWeight: '600' },

  infoBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    backgroundColor: colors.primary[50], marginHorizontal: spacing.lg,
    marginBottom: spacing.md, padding: spacing.md, borderRadius: borderRadius.lg,
  },
  infoBannerText: { flex: 1, fontSize: fontSize.xs, color: colors.primary[700], lineHeight: 18 },

  section: { marginHorizontal: spacing.lg, marginBottom: spacing.md },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.md, paddingBottom: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.gray[100],
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionTitle:    { fontSize: fontSize.base, fontWeight: '700', color: colors.gray[900] },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    borderRadius: borderRadius.full, borderWidth: 1,
    borderColor: colors.primary[300], backgroundColor: colors.primary[50],
  },
  editBtnText: { fontSize: fontSize.xs, color: colors.primary[600], fontWeight: '600' },

  dataRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.gray[50],
  },
  dataLabelContainer: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flex: 1 },
  dataLabel:  { fontSize: fontSize.sm, color: colors.gray[500] },
  dataValue:  { fontSize: fontSize.sm, fontWeight: '500', color: colors.gray[800], flex: 1, textAlign: 'right' },

  passwordRow:  { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  passwordText: { fontSize: fontSize.lg, color: colors.gray[400], letterSpacing: 3 },
  passwordHint: { fontSize: fontSize.xs, color: colors.gray[400], marginTop: 2 },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.white, borderRadius: borderRadius.xl,
    width: '100%', maxWidth: 480, maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.gray[200],
  },
  modalTitle:  { fontSize: fontSize.lg, fontWeight: '700', color: colors.gray[900] },
  modalBody:   { padding: spacing.lg },
  modalFooter: {
    flexDirection: 'row', gap: spacing.md,
    padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.gray[200],
  },
  modalInfoBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.primary[50], padding: spacing.sm,
    borderRadius: borderRadius.md, marginBottom: spacing.md,
  },
  modalInfoText: { flex: 1, fontSize: fontSize.xs, color: colors.primary[700] },

  requisitos:    { gap: spacing.xs, marginBottom: spacing.md },
  requisitoRow:  { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  requisitoText: { fontSize: fontSize.xs, color: colors.gray[400] },
  requisitoOk:   { color: '#16a34a', fontWeight: '500' },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: '#fee2e2', padding: spacing.sm,
    borderRadius: borderRadius.md, marginBottom: spacing.sm,
  },
  errorBannerText: { flex: 1, fontSize: fontSize.xs, color: colors.red[600] },
});

export default MiPerfilScreen;