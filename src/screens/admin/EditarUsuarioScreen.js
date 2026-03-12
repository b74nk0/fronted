import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import ConfirmModal from '../../components/common/ConfirmModal';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';
import { usuarioService } from '../../services/usuarioService';
import { rolService } from '../../services/rolService';
import { tipoDocumentoService } from '../../services/tipoDocumentoService';
import { datosAdicionalesService } from '../../services/datosAdicionalesService';

// ─── Título de sección ────────────────────────────────────────────────────────
const SectionTitle = ({ icon, title }) => (
  <View style={styles.sectionHeader}>
    <Ionicons name={icon} size={18} color={colors.primary[600]} />
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

const EditarUsuarioScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { usuario } = route.params;

  // ─── Form datos básicos ──────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    nombre: usuario.nombre || '',
    apellido: usuario.apellido || '',
    email: usuario.email || '',
    password: '',
    numeroDocumento: usuario.numeroDocumento || '',
    tipoDocumento: usuario.tipoDocumento || '',
    roles: usuario.roles || [],
  });

  // ─── Form datos adicionales ──────────────────────────────────────────────────
  const [datosId, setDatosId] = useState(null);
  const [datosForm, setDatosForm] = useState({
    telefono: '',
    direccion: '',
    ciudad: '',
    fechaNacimiento: '',
    genero: '',
    eps: '',
    tipoSangre: '',
    nombrePadre: '',
    telefonoPadre: '',
    nombreMadre: '',
    telefonoMadre: '',
    acudiente: '',
    telefonoAcudiente: '',
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState([]);
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState(true);
  const [confirmVisible, setConfirmVisible] = useState(false);

  // ─── Cargar catálogos + datos adicionales ────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [rolesData, tiposData] = await Promise.all([
          rolService.listar(),
          tipoDocumentoService.listar(),
        ]);
        setRoles(rolesData);
        setTiposDocumento(tiposData);

        try {
          const datos = await datosAdicionalesService.obtenerPorUsuario(usuario.id);
          if (datos) {
            setDatosId(datos.id);
            setDatosForm({
              telefono: datos.telefono || '',
              direccion: datos.direccion || '',
              ciudad: datos.ciudad || '',
              fechaNacimiento: datos.fechaNacimiento || '',
              genero: datos.genero || '',
              eps: datos.eps || '',
              tipoSangre: datos.tipoSangre || '',
              nombrePadre: datos.nombrePadre || '',
              telefonoPadre: datos.telefonoPadre || '',
              nombreMadre: datos.nombreMadre || '',
              telefonoMadre: datos.telefonoMadre || '',
              acudiente: datos.acudiente || '',
              telefonoAcudiente: datos.telefonoAcudiente || '',
            });
          }
        } catch {
          // Sin datos adicionales aún, es normal
        }
      } catch (error) {
        console.error('Error cargando catálogos:', error);
      } finally {
        setLoadingCatalogos(false);
      }
    };
    load();
  }, []);

  const updateField = (field, value) => {
    setFormData(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }));
  };

  const updateDatos = (field, value) => setDatosForm(f => ({ ...f, [field]: value }));

  const toggleRol = (nombreRol) => {
    const nuevos = formData.roles.includes(nombreRol)
      ? formData.roles.filter(r => r !== nombreRol)
      : [...formData.roles, nombreRol];
    updateField('roles', nuevos);
  };

  // ─── Validar ────────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!formData.nombre.trim()) e.nombre = 'Requerido';
    if (!formData.apellido.trim()) e.apellido = 'Requerido';
    if (!formData.email.trim()) e.email = 'Requerido';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Email inválido';
    if (!formData.numeroDocumento.trim()) e.numeroDocumento = 'Requerido';
    if (!formData.tipoDocumento) e.tipoDocumento = 'Selecciona un tipo';
    if (formData.roles.length === 0) e.roles = 'Selecciona al menos un rol';
    if (formData.password && formData.password.length < 6)
      e.password = 'Mínimo 6 caracteres';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ─── Guardar ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Actualizar datos básicos del usuario
      const payload = { ...formData };
      if (!payload.password?.trim()) delete payload.password;
      await usuarioService.actualizar(usuario.id, payload);

      // 2. Crear o actualizar datos adicionales
      const tieneDatos = Object.values(datosForm).some(v => String(v || '').trim());
      if (datosId) {
        await datosAdicionalesService.actualizar(datosId, datosForm);
      } else if (tieneDatos) {
        await datosAdicionalesService.crear(usuario.id, datosForm);
      }

      setConfirmVisible(false);
      navigation.goBack();
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      setConfirmVisible(false);
    } finally {
      setSaving(false);
    }
  };

  if (loadingCatalogos) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={styles.loadingText}>Cargando datos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[700]} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.headerText}>Editar Usuario</Text>
          <Text style={styles.headerSubtext}>{usuario.nombre} {usuario.apellido}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">

        {/* ── Datos personales ─────────────────────────────────────────────── */}
        <Card style={styles.section}>
          <SectionTitle icon="person-outline" title="Datos Personales" />
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Input label="Nombre *" value={formData.nombre}
                onChangeText={t => updateField('nombre', t)} error={errors.nombre} />
            </View>
            <View style={{ width: spacing.md }} />
            <View style={{ flex: 1 }}>
              <Input label="Apellido *" value={formData.apellido}
                onChangeText={t => updateField('apellido', t)} error={errors.apellido} />
            </View>
          </View>

          <Text style={styles.fieldLabel}>Tipo de Documento *</Text>
          <View style={styles.chipGroup}>
            {tiposDocumento.map(td => (
              <TouchableOpacity key={td.id}
                style={[styles.chip, formData.tipoDocumento === td.nombre && styles.chipSelected]}
                onPress={() => updateField('tipoDocumento', td.nombre)}>
                <Text style={[styles.chipText, formData.tipoDocumento === td.nombre && styles.chipTextSelected]}>
                  {td.nombre}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.tipoDocumento && <Text style={styles.errorText}>{errors.tipoDocumento}</Text>}

          <Input label="Número de Documento *" value={formData.numeroDocumento}
            onChangeText={t => updateField('numeroDocumento', t)}
            error={errors.numeroDocumento} keyboardType="numeric" />
        </Card>

        {/* ── Acceso al sistema ─────────────────────────────────────────────── */}
        <Card style={styles.section}>
          <SectionTitle icon="lock-closed-outline" title="Acceso al Sistema" />
          <Input label="Email *" value={formData.email}
            onChangeText={t => updateField('email', t)}
            error={errors.email} keyboardType="email-address" autoCapitalize="none" />
          <Input label="Nueva Contraseña"
            placeholder="Dejar vacío para no cambiar"
            value={formData.password}
            onChangeText={t => updateField('password', t)}
            error={errors.password} secureTextEntry />
        </Card>

        {/* ── Roles ────────────────────────────────────────────────────────── */}
        <Card style={styles.section}>
          <SectionTitle icon="shield-outline" title="Roles" />
          {roles.map(rol => (
            <TouchableOpacity key={rol.id} style={styles.rolItem} onPress={() => toggleRol(rol.nombre)}>
              <View style={[styles.checkbox, formData.roles.includes(rol.nombre) && styles.checkboxChecked]}>
                {formData.roles.includes(rol.nombre) && (
                  <Ionicons name="checkmark" size={14} color={colors.white} />
                )}
              </View>
              <Text style={styles.rolNombre}>{rol.nombre}</Text>
            </TouchableOpacity>
          ))}
          {errors.roles && <Text style={styles.errorText}>{errors.roles}</Text>}
        </Card>

        {/* ── Información adicional ─────────────────────────────────────────── */}
        <Card style={styles.section}>
          <SectionTitle icon="information-circle-outline" title="Información Adicional" />
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Input label="Teléfono" value={datosForm.telefono}
                onChangeText={t => updateDatos('telefono', t)} keyboardType="phone-pad" />
            </View>
            <View style={{ width: spacing.md }} />
            <View style={{ flex: 1 }}>
              <Input label="Ciudad" value={datosForm.ciudad}
                onChangeText={t => updateDatos('ciudad', t)} />
            </View>
          </View>
          <Input label="Dirección" value={datosForm.direccion}
            onChangeText={t => updateDatos('direccion', t)} />
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Input label="Fecha de nacimiento (YYYY-MM-DD)" value={datosForm.fechaNacimiento}
                onChangeText={t => updateDatos('fechaNacimiento', t)} placeholder="1990-01-15" />
            </View>
            <View style={{ width: spacing.md }} />
            <View style={{ flex: 1 }}>
              <Input label="Género" value={datosForm.genero}
                onChangeText={t => updateDatos('genero', t)} placeholder="Masculino / Femenino" />
            </View>
          </View>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Input label="EPS" value={datosForm.eps}
                onChangeText={t => updateDatos('eps', t)} />
            </View>
            <View style={{ width: spacing.md }} />
            <View style={{ flex: 1 }}>
              <Input label="Tipo de sangre" value={datosForm.tipoSangre}
                onChangeText={t => updateDatos('tipoSangre', t)} placeholder="O+, A-, B+..." />
            </View>
          </View>
        </Card>

        {/* ── Familia / Acudiente ───────────────────────────────────────────── */}
        <Card style={styles.section}>
          <SectionTitle icon="people-outline" title="Familia / Acudiente" />
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Input label="Nombre del padre" value={datosForm.nombrePadre}
                onChangeText={t => updateDatos('nombrePadre', t)} />
            </View>
            <View style={{ width: spacing.md }} />
            <View style={{ flex: 1 }}>
              <Input label="Teléfono padre" value={datosForm.telefonoPadre}
                onChangeText={t => updateDatos('telefonoPadre', t)} keyboardType="phone-pad" />
            </View>
          </View>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Input label="Nombre de la madre" value={datosForm.nombreMadre}
                onChangeText={t => updateDatos('nombreMadre', t)} />
            </View>
            <View style={{ width: spacing.md }} />
            <View style={{ flex: 1 }}>
              <Input label="Teléfono madre" value={datosForm.telefonoMadre}
                onChangeText={t => updateDatos('telefonoMadre', t)} keyboardType="phone-pad" />
            </View>
          </View>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Input label="Acudiente" value={datosForm.acudiente}
                onChangeText={t => updateDatos('acudiente', t)} />
            </View>
            <View style={{ width: spacing.md }} />
            <View style={{ flex: 1 }}>
              <Input label="Teléfono acudiente" value={datosForm.telefonoAcudiente}
                onChangeText={t => updateDatos('telefonoAcudiente', t)} keyboardType="phone-pad" />
            </View>
          </View>
        </Card>

        {/* ── Botón ────────────────────────────────────────────────────────── */}
        <View style={styles.saveContainer}>
          <Button
            title="Guardar Cambios"
            onPress={() => { if (validate()) setConfirmVisible(true); }}
          />
        </View>

        <View style={{ height: spacing.xl }} />
      </ScrollView>

      <ConfirmModal
        visible={confirmVisible}
        title="Guardar cambios"
        message={`¿Confirmas los cambios para ${formData.nombre} ${formData.apellido}?`}
        confirmText="Guardar"
        confirmColor="primary"
        loading={saving}
        onConfirm={handleSave}
        onCancel={() => setConfirmVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.gray[50] },
  loadingText: { marginTop: spacing.md, fontSize: fontSize.base, color: colors.gray[600] },

  header: {
    backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center',
    padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.gray[200],
  },
  backButton: { marginRight: spacing.md },
  headerTitle: { flex: 1 },
  headerText: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.gray[900] },
  headerSubtext: { fontSize: fontSize.sm, color: colors.gray[600], marginTop: spacing.xs },

  content: { flex: 1, padding: spacing.lg },
  section: { marginBottom: spacing.lg },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginBottom: spacing.md, paddingBottom: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.gray[100],
  },
  sectionTitle: { fontSize: fontSize.base, fontWeight: '700', color: colors.gray[900] },

  row: { flexDirection: 'row' },
  fieldLabel: { fontSize: fontSize.sm, fontWeight: '600', color: colors.gray[700], marginBottom: spacing.sm },

  chipGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full, borderWidth: 1,
    borderColor: colors.gray[300], backgroundColor: colors.white,
  },
  chipSelected: { backgroundColor: colors.primary[600], borderColor: colors.primary[600] },
  chipText: { fontSize: fontSize.sm, color: colors.gray[700], fontWeight: '500' },
  chipTextSelected: { color: colors.white },
  errorText: { fontSize: fontSize.xs, color: colors.red[500], marginTop: -spacing.xs, marginBottom: spacing.xs },

  rolItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, gap: spacing.md },
  checkbox: {
    width: 20, height: 20, borderRadius: borderRadius.sm,
    borderWidth: 2, borderColor: colors.gray[300],
    justifyContent: 'center', alignItems: 'center',
  },
  checkboxChecked: { backgroundColor: colors.primary[600], borderColor: colors.primary[600] },
  rolNombre: { fontSize: fontSize.base, color: colors.gray[700] },

  saveContainer: { marginTop: spacing.sm },
});

export default EditarUsuarioScreen;