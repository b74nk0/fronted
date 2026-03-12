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
const Section = ({ title, icon, children, onEdit }) => (
  <Card style={styles.section}>
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        <Ionicons name={icon} size={18} color={colors.primary[600]} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {onEdit && (
        <TouchableOpacity style={styles.editBtn} onPress={onEdit}>
          <Ionicons name="pencil-outline" size={15} color={colors.primary[600]} />
          <Text style={styles.editBtnText}>Editar</Text>
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

  const [usuarioCompleto, setUsuarioCompleto] = useState(null);
  const [datosAdicionales, setDatosAdicionales] = useState(null);
  const [loading, setLoading] = useState(true);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editSection, setEditSection] = useState(null); // 'basicos' | 'adicionales' | 'familia'
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({});

  // ─── Roles ──────────────────────────────────────────────────────────────────
  const hasRole = (roleName) => {
    if (!user?.roles || !Array.isArray(user.roles)) return false;
    return user.roles.some(r => {
      const s = typeof r === 'string' ? r : r.nombre;
      return s?.toLowerCase() === roleName.toLowerCase();
    });
  };
  const isAdmin = hasRole('ADMINISTRADOR');
  const isAdministrativo = hasRole('ADMINISTRATIVO');
  const canEdit = isAdmin || isAdministrativo;

  // ─── Cargar datos ────────────────────────────────────────────────────────────
  const loadDatos = async () => {
  setLoading(true);
  try {
    const usuarioData = await usuarioService.me();
    setUsuarioCompleto(usuarioData);

    // Usar el id que viene de /usuarios/me, no del AuthContext
    const datosData = await datosAdicionalesService.obtenerPorUsuario(usuarioData.id).catch(() => null);
    setDatosAdicionales(datosData);
  } catch (error) {
    console.error('Error cargando perfil:', error);
  } finally {
    setLoading(false);
  }
};

  useFocusEffect(useCallback(() => { loadDatos(); }, []));

  // ─── Abrir modal edición ─────────────────────────────────────────────────────
  const openEdit = (section) => {
    setEditSection(section);
    if (section === 'basicos') {
      setFormData({
        nombre: usuarioCompleto?.nombre || '',
        apellido: usuarioCompleto?.apellido || '',
      });
    } else if (section === 'adicionales') {
      setFormData({
        telefono: datosAdicionales?.telefono || '',
        direccion: datosAdicionales?.direccion || '',
        ciudad: datosAdicionales?.ciudad || '',
        fechaNacimiento: datosAdicionales?.fechaNacimiento || '',
        genero: datosAdicionales?.genero || '',
        eps: datosAdicionales?.eps || '',
        tipoSangre: datosAdicionales?.tipoSangre || '',
      });
    } else if (section === 'familia') {
      setFormData({
        nombrePadre: datosAdicionales?.nombrePadre || '',
        telefonoPadre: datosAdicionales?.telefonoPadre || '',
        nombreMadre: datosAdicionales?.nombreMadre || '',
        telefonoMadre: datosAdicionales?.telefonoMadre || '',
        acudiente: datosAdicionales?.acudiente || '',
        telefonoAcudiente: datosAdicionales?.telefonoAcudiente || '',
      });
    }
    setEditModalVisible(true);
  };

  const closeEdit = () => {
    setEditModalVisible(false);
    setEditSection(null);
    setFormData({});
  };

  // ─── Guardar ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      if (editSection === 'basicos') {
        await usuarioService.actualizar(usuarioCompleto.id, {
          nombre: formData.nombre,
          apellido: formData.apellido,
          email: usuarioCompleto.email,
          numeroDocumento: usuarioCompleto.numeroDocumento,
          tipoDocumento: usuarioCompleto.tipoDocumento,
          roles: usuarioCompleto.roles,
          password: '', // vacío → el service no modifica la contraseña
        });
      } else {
        // adicionales o familia — merge con datos existentes
        const payload = { ...datosAdicionales, ...formData };
        if (datosAdicionales?.id) {
          const updated = await datosAdicionalesService.actualizar(datosAdicionales.id, payload);
          setDatosAdicionales(updated);
        } else {
          const created = await datosAdicionalesService.crear(usuarioCompleto.id, payload);
          setDatosAdicionales(created);
        }
      }
      closeEdit();
      await loadDatos();
    } catch (error) {
      console.error('Error guardando perfil:', error);
    } finally {
      setSaving(false);
    }
  };

  const update = (field, value) => setFormData(f => ({ ...f, [field]: value }));

  // ─── Modal edición ────────────────────────────────────────────────────────────
  const renderEditModal = () => (
    <Modal visible={editModalVisible} transparent animationType="fade" onRequestClose={closeEdit}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editSection === 'basicos' && 'Editar Datos Personales'}
              {editSection === 'adicionales' && 'Editar Información Adicional'}
              {editSection === 'familia' && 'Editar Datos de Familia'}
            </Text>
            <TouchableOpacity onPress={closeEdit}>
              <Ionicons name="close" size={24} color={colors.gray[600]} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            {editSection === 'basicos' && (
              <>
                <Input label="Nombre *" value={formData.nombre}
                  onChangeText={t => update('nombre', t)} placeholder="Nombre" />
                <Input label="Apellido *" value={formData.apellido}
                  onChangeText={t => update('apellido', t)} placeholder="Apellido" />
              </>
            )}

            {editSection === 'adicionales' && (
              <>
                <Input label="Teléfono" value={formData.telefono}
                  onChangeText={t => update('telefono', t)}
                  placeholder="3001234567" keyboardType="phone-pad" />
                <Input label="Dirección" value={formData.direccion}
                  onChangeText={t => update('direccion', t)} placeholder="Dirección" />
                <Input label="Ciudad" value={formData.ciudad}
                  onChangeText={t => update('ciudad', t)} placeholder="Ciudad" />
                <Input label="Fecha de nacimiento (YYYY-MM-DD)" value={formData.fechaNacimiento}
                  onChangeText={t => update('fechaNacimiento', t)} placeholder="1990-01-15" />
                <Input label="Género" value={formData.genero}
                  onChangeText={t => update('genero', t)} placeholder="Masculino / Femenino / Otro" />
                <Input label="EPS" value={formData.eps}
                  onChangeText={t => update('eps', t)} placeholder="Nombre de la EPS" />
                <Input label="Tipo de sangre" value={formData.tipoSangre}
                  onChangeText={t => update('tipoSangre', t)} placeholder="O+, A-, B+..." />
              </>
            )}

            {editSection === 'familia' && (
              <>
                <Input label="Nombre del padre" value={formData.nombrePadre}
                  onChangeText={t => update('nombrePadre', t)} placeholder="Nombre completo" />
                <Input label="Teléfono del padre" value={formData.telefonoPadre}
                  onChangeText={t => update('telefonoPadre', t)} keyboardType="phone-pad" />
                <Input label="Nombre de la madre" value={formData.nombreMadre}
                  onChangeText={t => update('nombreMadre', t)} placeholder="Nombre completo" />
                <Input label="Teléfono de la madre" value={formData.telefonoMadre}
                  onChangeText={t => update('telefonoMadre', t)} keyboardType="phone-pad" />
                <Input label="Acudiente" value={formData.acudiente}
                  onChangeText={t => update('acudiente', t)} placeholder="Nombre del acudiente" />
                <Input label="Teléfono del acudiente" value={formData.telefonoAcudiente}
                  onChangeText={t => update('telefonoAcudiente', t)} keyboardType="phone-pad" />
              </>
            )}
            <View style={{ height: spacing.md }} />
          </ScrollView>

          <View style={styles.modalFooter}>
            <Button title="Cancelar" onPress={closeEdit} variant="outline" style={{ flex: 1 }} />
            <Button
              title={saving ? 'Guardando...' : 'Guardar'}
              onPress={handleSave}
              disabled={saving}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  const nombre = usuarioCompleto?.nombre || '';
  const apellido = usuarioCompleto?.apellido || '';
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

        {/* Datos personales */}
        <Section
          title="Datos Personales"
          icon="person-outline"
          onEdit={canEdit ? () => openEdit('basicos') : null}
        >
          <DataRow label="Nombre" value={usuarioCompleto?.nombre} icon="person-outline" />
          <DataRow label="Apellido" value={usuarioCompleto?.apellido} icon="person-outline" />
          <DataRow label="Tipo de documento" value={usuarioCompleto?.tipoDocumento} icon="card-outline" />
          <DataRow label="Número de documento" value={usuarioCompleto?.numeroDocumento} icon="card-outline" />
          <DataRow label="Email" value={usuarioCompleto?.email} icon="mail-outline" />
        </Section>

        {/* Información adicional */}
        <Section
          title="Información Adicional"
          icon="information-circle-outline"
          onEdit={canEdit ? () => openEdit('adicionales') : null}
        >
          <DataRow label="Teléfono" value={datosAdicionales?.telefono} icon="call-outline" />
          <DataRow label="Dirección" value={datosAdicionales?.direccion} icon="location-outline" />
          <DataRow label="Ciudad" value={datosAdicionales?.ciudad} icon="business-outline" />
          <DataRow label="Fecha de nacimiento" value={datosAdicionales?.fechaNacimiento} icon="calendar-outline" />
          <DataRow label="Género" value={datosAdicionales?.genero} icon="transgender-outline" />
          <DataRow label="EPS" value={datosAdicionales?.eps} icon="medical-outline" />
          <DataRow label="Tipo de sangre" value={datosAdicionales?.tipoSangre} icon="water-outline" />
        </Section>

        {/* Datos de familia */}
        <Section
          title="Datos de Familia / Acudiente"
          icon="people-outline"
          onEdit={canEdit ? () => openEdit('familia') : null}
        >
          <DataRow label="Nombre del padre" value={datosAdicionales?.nombrePadre} icon="man-outline" />
          <DataRow label="Teléfono padre" value={datosAdicionales?.telefonoPadre} icon="call-outline" />
          <DataRow label="Nombre de la madre" value={datosAdicionales?.nombreMadre} icon="woman-outline" />
          <DataRow label="Teléfono madre" value={datosAdicionales?.telefonoMadre} icon="call-outline" />
          <DataRow label="Acudiente" value={datosAdicionales?.acudiente} icon="person-outline" />
          <DataRow label="Teléfono acudiente" value={datosAdicionales?.telefonoAcudiente} icon="call-outline" />
        </Section>

        {!canEdit && (
          <View style={styles.readOnlyBanner}>
            <Ionicons name="lock-closed-outline" size={16} color={colors.gray[500]} />
            <Text style={styles.readOnlyText}>
              Solo lectura. Contacta al administrador para modificar tus datos.
            </Text>
          </View>
        )}

        <View style={{ height: spacing.xl }} />
      </ScrollView>

      {renderEditModal()}
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
  backButton: { marginRight: spacing.md },
  headerTitle: { flex: 1 },
  headerText: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.gray[900] },
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
  avatarText: { fontSize: 32, fontWeight: '800', color: colors.white },
  avatarNombre: { fontSize: fontSize.xl, fontWeight: '700', color: colors.gray[900] },
  avatarEmail: { fontSize: fontSize.sm, color: colors.gray[500], marginTop: 4 },
  rolBadge: {
    marginTop: spacing.sm, backgroundColor: colors.primary[50],
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.primary[200],
  },
  rolBadgeText: { fontSize: fontSize.xs, color: colors.primary[700], fontWeight: '600' },

  section: { marginHorizontal: spacing.lg, marginBottom: spacing.md },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.md, paddingBottom: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.gray[100],
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionTitle: { fontSize: fontSize.base, fontWeight: '700', color: colors.gray[900] },

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
  dataLabel: { fontSize: fontSize.sm, color: colors.gray[500] },
  dataValue: {
    fontSize: fontSize.sm, fontWeight: '500', color: colors.gray[800],
    flex: 1, textAlign: 'right',
  },

  readOnlyBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginHorizontal: spacing.lg, marginBottom: spacing.md,
    backgroundColor: colors.gray[100], padding: spacing.md, borderRadius: borderRadius.lg,
  },
  readOnlyText: { flex: 1, fontSize: fontSize.xs, color: colors.gray[500] },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.white, borderRadius: borderRadius.xl,
    width: '100%', maxWidth: 520, maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.gray[200],
  },
  modalTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.gray[900] },
  modalBody: { padding: spacing.lg },
  modalFooter: {
    flexDirection: 'row', gap: spacing.md,
    padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.gray[200],
  },
});

export default MiPerfilScreen;