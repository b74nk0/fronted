import React, { useState, useEffect, useCallback } from 'react';
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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';
import { usuarioService } from '../../services/usuarioService';
import { rolService } from '../../services/rolService';
import { tipoDocumentoService } from '../../services/tipoDocumentoService';

const FORM_INITIAL = {
  nombre: '',
  apellido: '',
  email: '',
  password: '',
  numeroDocumento: '',
  tipoDocumento: '',
  roles: [],
};

const CrearUsuarioScreen = () => {
  const navigation = useNavigation();
  const [formData, setFormData] = useState(FORM_INITIAL);
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

  // Limpiar form cada vez que la pantalla recibe foco
  useFocusEffect(
    useCallback(() => {
      setFormData(FORM_INITIAL);
      setErrors({});
    }, [])
  );

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

  const selectTipoDocumento = (nombre) => {
    updateField('tipoDocumento', nombre);
  };

  // ─── Validar ────────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!formData.nombre.trim()) e.nombre = 'Requerido';
    if (!formData.apellido.trim()) e.apellido = 'Requerido';
    if (!formData.email.trim()) e.email = 'Requerido';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Email inválido';
    if (!formData.password.trim()) e.password = 'Requerido';
    else if (formData.password.length < 8) e.password = 'Mínimo 8 caracteres';
    if (!formData.numeroDocumento.trim()) e.numeroDocumento = 'Requerido';
    if (!formData.tipoDocumento) e.tipoDocumento = 'Selecciona un tipo';
    if (formData.roles.length === 0) e.roles = 'Selecciona al menos un rol';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ─── Guardar ────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await usuarioService.crear(formData);
      setFormData(FORM_INITIAL); // ← limpiar
      setErrors({});
      navigation.navigate('Usuarios'); // ← ir a Usuarios, no goBack()
      Alert.alert('Éxito', 'Usuario creado correctamente.');
    } catch (error) {
      console.error('Error creando usuario:', error);
      const msg = error.response?.data?.message || 'No se pudo crear el usuario.';
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
          <Text style={styles.headerText}>Crear Usuario</Text>
          <Text style={styles.headerSubtext}>Nuevo registro de usuario</Text>
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
                placeholder="Nombre"
                value={formData.nombre}
                onChangeText={(t) => updateField('nombre', t)}
                error={errors.nombre}
              />
            </View>
            <View style={{ width: spacing.md }} />
            <View style={{ flex: 1 }}>
              <Input
                label="Apellido *"
                placeholder="Apellido"
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
                onPress={() => selectTipoDocumento(td.nombre)}
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
            placeholder="Número"
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
            placeholder="correo@ejemplo.com"
            value={formData.email}
            onChangeText={(t) => updateField('email', t)}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input
            label="Contraseña *"
            placeholder="Mínimo 8 caracteres"
            value={formData.password}
            onChangeText={(t) => updateField('password', t)}
            error={errors.password}
            secureTextEntry
          />
        </Card>

        {/* Roles */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Roles</Text>
          <Text style={styles.sectionSubtitle}>Selecciona uno o más roles</Text>
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
            title={saving ? 'Creando...' : 'Crear Usuario'}
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
  sectionSubtitle: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginBottom: spacing.md,
    marginTop: -spacing.xs,
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

export default CrearUsuarioScreen;