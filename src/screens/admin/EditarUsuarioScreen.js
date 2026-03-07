import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';
import { usuarioService } from '../../services/usuarioService';
import { rolService } from '../../services/rolService';
import { tipoDocumentoService } from '../../services/tipoDocumentoService';

const EditarUsuarioScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { usuario } = route.params;

  const [formData, setFormData] = useState({
    nombre: usuario.nombre || '',
    apellido: usuario.apellido || '',
    email: usuario.email || '',
    password: '',
    numeroDocumento: usuario.numeroDocumento || '',
    tipoDocumento: usuario.tipoDocumento || '',
    roles: usuario.roles || [],
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState([]);
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState(true);

  // ─── Cargar catálogos ────────────────────────────────────────────────────────
  useEffect(() => {
    const loadCatalogos = async () => {
      try {
        const [rolesData, tiposData] = await Promise.all([
          rolService.listar(),
          tipoDocumentoService.listar(),
        ]);
        setRoles(rolesData);
        setTiposDocumento(tiposData);
      } catch (error) {
        console.error('Error cargando catálogos:', error);
        Alert.alert('Error', 'No se pudieron cargar los datos necesarios.');
      } finally {
        setLoadingCatalogos(false);
      }
    };
    loadCatalogos();
  }, []);

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) setErrors({ ...errors, [field]: null });
  };

  const toggleRol = (nombreRol) => {
    const nuevos = formData.roles.includes(nombreRol)
      ? formData.roles.filter((r) => r !== nombreRol)
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

  // ─── Guardar ────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      // Si password está vacía no se envía
      const payload = { ...formData };
      if (!payload.password?.trim()) delete payload.password;

      await usuarioService.actualizar(usuario.id, payload);
      navigation.goBack();
      Alert.alert('Éxito', 'Usuario actualizado correctamente.');
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      const msg = error.response?.data?.message || 'No se pudo actualizar el usuario.';
      Alert.alert('Error', msg);
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
          <Text style={styles.headerSubtext}>
            {usuario.nombre} {usuario.apellido}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* Datos personales */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Datos Personales</Text>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Input
                label="Nombre *"
                value={formData.nombre}
                onChangeText={(t) => updateField('nombre', t)}
                error={errors.nombre}
              />
            </View>
            <View style={{ width: spacing.md }} />
            <View style={{ flex: 1 }}>
              <Input
                label="Apellido *"
                value={formData.apellido}
                onChangeText={(t) => updateField('apellido', t)}
                error={errors.apellido}
              />
            </View>
          </View>

          {/* Tipo de documento */}
          <Text style={styles.fieldLabel}>Tipo de Documento *</Text>
          <View style={styles.chipGroup}>
            {tiposDocumento.map((td) => (
              <TouchableOpacity
                key={td.id}
                style={[
                  styles.chip,
                  formData.tipoDocumento === td.nombre && styles.chipSelected,
                ]}
                onPress={() => updateField('tipoDocumento', td.nombre)}
              >
                <Text
                  style={[
                    styles.chipText,
                    formData.tipoDocumento === td.nombre && styles.chipTextSelected,
                  ]}
                >
                  {td.nombre}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.tipoDocumento && (
            <Text style={styles.errorText}>{errors.tipoDocumento}</Text>
          )}

          <Input
            label="Número de Documento *"
            value={formData.numeroDocumento}
            onChangeText={(t) => updateField('numeroDocumento', t)}
            error={errors.numeroDocumento}
            keyboardType="numeric"
          />
        </Card>

        {/* Acceso */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Acceso al Sistema</Text>
          <Input
            label="Email *"
            value={formData.email}
            onChangeText={(t) => updateField('email', t)}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input
            label="Nueva Contraseña"
            placeholder="Dejar vacío para no cambiar"
            value={formData.password}
            onChangeText={(t) => updateField('password', t)}
            error={errors.password}
            secureTextEntry
          />
        </Card>

        {/* Roles */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Roles</Text>
          {roles.map((rol) => (
            <TouchableOpacity
              key={rol.id}
              style={styles.rolItem}
              onPress={() => toggleRol(rol.nombre)}
            >
              <View
                style={[
                  styles.checkbox,
                  formData.roles.includes(rol.nombre) && styles.checkboxChecked,
                ]}
              >
                {formData.roles.includes(rol.nombre) && (
                  <Ionicons name="checkmark" size={14} color={colors.white} />
                )}
              </View>
              <Text style={styles.rolNombre}>{rol.nombre}</Text>
            </TouchableOpacity>
          ))}
          {errors.roles && <Text style={styles.errorText}>{errors.roles}</Text>}
        </Card>

        {/* Botón */}
        <View style={styles.saveContainer}>
          <Button
            title={saving ? 'Guardando...' : 'Guardar Cambios'}
            onPress={handleSave}
            disabled={saving}
          />
        </View>

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
  },
  loadingText: { marginTop: spacing.md, fontSize: fontSize.base, color: colors.gray[600] },
  header: {
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  backButton: { marginRight: spacing.md },
  headerTitle: { flex: 1 },
  headerText: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.gray[900] },
  headerSubtext: { fontSize: fontSize.sm, color: colors.gray[600], marginTop: spacing.xs },
  content: { flex: 1, padding: spacing.lg },
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  row: { flexDirection: 'row' },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: spacing.sm,
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.gray[300],
    backgroundColor: colors.white,
  },
  chipSelected: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  chipText: { fontSize: fontSize.sm, color: colors.gray[700], fontWeight: '500' },
  chipTextSelected: { color: colors.white },
  errorText: { fontSize: fontSize.xs, color: colors.red[500], marginTop: -spacing.xs },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.gray[100],
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  emailText: { fontSize: fontSize.base, color: colors.gray[600] },
  rolItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.gray[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  rolNombre: { fontSize: fontSize.base, color: colors.gray[700] },
  saveContainer: { marginTop: spacing.sm },
});

export default EditarUsuarioScreen;