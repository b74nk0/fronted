import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { configuracionService } from '../../../services/configuracionService';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import { colors, spacing, fontSize, borderRadius } from '../../../constants/theme';

const ConfigInstitucionScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configId, setConfigId] = useState(null);
  const [logoUri, setLogoUri] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    nit: '',
    direccion: '',
    telefono: '',
    email: '',
    sitioWeb: '',
    ciudad: '',
    departamento: '',
    rector: '',
    lema: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await configuracionService.obtener();
      
      console.log('Configuración recibida:', data);
      
      if (data) {
        setConfigId(data.id);
        setFormData({
          nombre: data.nombre || '',
          nit: data.nit || '',
          direccion: data.direccion || '',
          telefono: data.telefono || '',
          email: data.email || '',
          sitioWeb: data.sitioWeb || '',
          ciudad: data.ciudad || '',
          departamento: data.departamento || '',
          rector: data.rector || '',
          lema: data.lema || '',
        });
        
        // Si hay logo/imagen en la respuesta
        if (data.logoUrl) {
          setLogoUri(data.logoUrl);
        }
      }
    } catch (error) {
      console.error('Error cargando configuración:', error);
      
      // Si es 404, significa que no existe configuración aún
      if (error.response?.status === 404) {
        console.log('No existe configuración, se creará una nueva al guardar');
      } else {
        Alert.alert(
          'Error',
          'No se pudo cargar la configuración institucional'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    if (!formData.nit.trim()) {
      newErrors.nit = 'El NIT es requerido';
    }

    if (!formData.direccion.trim()) {
      newErrors.direccion = 'La dirección es requerida';
    }

    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El teléfono es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.ciudad.trim()) {
      newErrors.ciudad = 'La ciudad es requerida';
    }

    if (!formData.departamento.trim()) {
      newErrors.departamento = 'El departamento es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Por favor completa todos los campos requeridos');
      return;
    }

    setSaving(true);
    try {
      let resultado;
      
      if (configId) {
        // Actualizar configuración existente
        console.log('Actualizando configuración ID:', configId);
        resultado = await configuracionService.actualizar(configId, formData);
      } else {
        // Crear nueva configuración
        console.log('Creando nueva configuración');
        resultado = await configuracionService.crear(formData);
        setConfigId(resultado.id);
      }

      console.log('Configuración guardada:', resultado);

      Alert.alert(
        'Éxito',
        'La información institucional se guardó correctamente',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error guardando configuración:', error);
      console.error('Error response:', error.response?.data);
      
      Alert.alert(
        'Error',
        error.response?.data?.message || 'No se pudo guardar la configuración'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSelectLogo = () => {
    // TODO: Implementar selector de imagen
    Alert.alert(
      'Próximamente',
      'La funcionalidad de subir logo estará disponible próximamente'
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={styles.loadingText}>Cargando información...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.gray[700]} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.headerText}>Información Institucional</Text>
          <Text style={styles.headerSubtext}>Datos generales del colegio</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Mensaje si no existe configuración */}
        {!configId && (
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color={colors.primary[600]} />
            <Text style={styles.infoText}>
              Aún no hay información institucional configurada. Completa el formulario para crear la configuración inicial.
            </Text>
          </View>
        )}

        {/* Logo */}
        <Card style={styles.logoCard}>
          <Text style={styles.sectionTitle}>Logo Institucional</Text>
          <View style={styles.logoContainer}>
            <View style={styles.logoPreview}>
              {logoUri ? (
                <Image source={{ uri: logoUri }} style={styles.logoImage} />
              ) : (
                <Ionicons name="business" size={64} color={colors.gray[400]} />
              )}
            </View>
            <View style={styles.logoActions}>
              <Button
                title="Seleccionar Logo"
                onPress={handleSelectLogo}
                variant="outline"
              />
              <Text style={styles.logoHint}>
                Formatos: PNG, JPG. Tamaño recomendado: 512x512px
              </Text>
            </View>
          </View>
        </Card>

        {/* Información Básica */}
        <Card>
          <Text style={styles.sectionTitle}>Información Básica</Text>
          
          <Input
            label="Nombre de la Institución *"
            placeholder="Nombre del colegio"
            value={formData.nombre}
            onChangeText={(text) => updateField('nombre', text)}
            error={errors.nombre}
          />

          <Input
            label="NIT *"
            placeholder="000.000.000-0"
            value={formData.nit}
            onChangeText={(text) => updateField('nit', text)}
            error={errors.nit}
            keyboardType="numeric"
          />

          <Input
            label="Lema Institucional"
            placeholder="Lema o eslogan"
            value={formData.lema}
            onChangeText={(text) => updateField('lema', text)}
          />

          <Input
            label="Rector(a)"
            placeholder="Nombre del rector"
            value={formData.rector}
            onChangeText={(text) => updateField('rector', text)}
          />
        </Card>

        {/* Ubicación */}
        <Card>
          <Text style={styles.sectionTitle}>Ubicación</Text>
          
          <Input
            label="Dirección *"
            placeholder="Dirección completa"
            value={formData.direccion}
            onChangeText={(text) => updateField('direccion', text)}
            error={errors.direccion}
          />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Input
                label="Ciudad *"
                placeholder="Ciudad"
                value={formData.ciudad}
                onChangeText={(text) => updateField('ciudad', text)}
                error={errors.ciudad}
              />
            </View>
            <View style={{ width: spacing.md }} />
            <View style={{ flex: 1 }}>
              <Input
                label="Departamento *"
                placeholder="Departamento"
                value={formData.departamento}
                onChangeText={(text) => updateField('departamento', text)}
                error={errors.departamento}
              />
            </View>
          </View>
        </Card>

        {/* Contacto */}
        <Card>
          <Text style={styles.sectionTitle}>Información de Contacto</Text>
          
          <Input
            label="Teléfono *"
            placeholder="+57 300 000 0000"
            value={formData.telefono}
            onChangeText={(text) => updateField('telefono', text)}
            error={errors.telefono}
            keyboardType="phone-pad"
            leftIcon="call-outline"
          />

          <Input
            label="Email *"
            placeholder="contacto@institucion.edu.co"
            value={formData.email}
            onChangeText={(text) => updateField('email', text)}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon="mail-outline"
          />

          <Input
            label="Sitio Web"
            placeholder="www.institucion.edu.co"
            value={formData.sitioWeb}
            onChangeText={(text) => updateField('sitioWeb', text)}
            autoCapitalize="none"
            leftIcon="globe-outline"
          />
        </Card>

        {/* Botón Guardar */}
        <View style={styles.saveButtonContainer}>
          <Button
            title={saving ? 'Guardando...' : configId ? 'Actualizar Información' : 'Guardar Información'}
            onPress={handleSave}
            loading={saving}
            disabled={saving}
          />
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSize.base,
    color: colors.gray[600],
  },
  header: {
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  backButton: {
    marginRight: spacing.md,
  },
  headerTitle: {
    flex: 1,
  },
  headerText: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  headerSubtext: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    marginTop: spacing.xs,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primary[50],
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.primary[700],
    lineHeight: 20,
  },
  logoCard: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing.lg,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  logoPreview: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gray[200],
    borderStyle: 'dashed',
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.lg,
  },
  logoActions: {
    flex: 1,
  },
  logoHint: {
    fontSize: fontSize.xs,
    color: colors.gray[600],
    marginTop: spacing.sm,
  },
  row: {
    flexDirection: 'row',
  },
  saveButtonContainer: {
    marginTop: spacing.lg,
  },
});

export default ConfigInstitucionScreen;