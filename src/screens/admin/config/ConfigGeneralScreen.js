import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import { colors, spacing, fontSize, borderRadius } from '../../../constants/theme';

const ConfigGeneralScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    notificacionesEmail: true,
    notificacionesPush: true,
    mantenimientoActivo: false,
    registroAbierto: false,
    tamañoMaximoArchivo: '10',
    diasInactividadSesion: '30',
    longitudMinimaPassword: '6',
    requiereNumeroPassword: true,
    requiereMayusculaPassword: true,
    requiereCaracterEspecialPassword: false,
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    // Simular carga
    setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  const toggleConfig = (key) => {
    setConfig({ ...config, [key]: !config[key] });
  };

  const handleSave = async () => {
    setSaving(true);
    setTimeout(() => {
      console.log('Guardar configuración:', config);
      alert('Configuración actualizada correctamente');
      setSaving(false);
    }, 1000);
  };

  const renderSwitch = (label, key, description) => (
    <View style={styles.switchItem}>
      <View style={styles.switchInfo}>
        <Text style={styles.switchLabel}>{label}</Text>
        {description && (
          <Text style={styles.switchDescription}>{description}</Text>
        )}
      </View>
      <TouchableOpacity
        style={[
          styles.switch,
          config[key] && styles.switchActive,
        ]}
        onPress={() => toggleConfig(key)}
      >
        <View style={[
          styles.switchThumb,
          config[key] && styles.switchThumbActive,
        ]} />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={styles.loadingText}>Cargando configuración...</Text>
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
          <Text style={styles.headerText}>Configuración General</Text>
          <Text style={styles.headerSubtext}>Parámetros del sistema</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Notificaciones */}
        <Card>
          <View style={styles.cardHeader}>
            <Ionicons name="notifications" size={24} color={colors.primary[600]} />
            <Text style={styles.cardTitle}>Notificaciones</Text>
          </View>
          
          {renderSwitch(
            'Notificaciones por Email',
            'notificacionesEmail',
            'Enviar notificaciones importantes por correo electrónico'
          )}
          
          {renderSwitch(
            'Notificaciones Push',
            'notificacionesPush',
            'Enviar notificaciones push a dispositivos móviles'
          )}
        </Card>

        {/* Sistema */}
        <Card>
          <View style={styles.cardHeader}>
            <Ionicons name="server" size={24} color={colors.primary[600]} />
            <Text style={styles.cardTitle}>Sistema</Text>
          </View>
          
          {renderSwitch(
            'Modo Mantenimiento',
            'mantenimientoActivo',
            'Solo administradores podrán acceder al sistema'
          )}
          
          {renderSwitch(
            'Registro Abierto',
            'registroAbierto',
            'Permitir que nuevos usuarios se registren'
          )}

          <Input
            label="Tamaño máximo de archivo (MB)"
            placeholder="10"
            value={config.tamañoMaximoArchivo}
            onChangeText={(text) => setConfig({ ...config, tamañoMaximoArchivo: text })}
            keyboardType="numeric"
          />

          <Input
            label="Días de inactividad para cerrar sesión"
            placeholder="30"
            value={config.diasInactividadSesion}
            onChangeText={(text) => setConfig({ ...config, diasInactividadSesion: text })}
            keyboardType="numeric"
          />
        </Card>

        {/* Seguridad de Contraseñas */}
        <Card>
          <View style={styles.cardHeader}>
            <Ionicons name="lock-closed" size={24} color={colors.primary[600]} />
            <Text style={styles.cardTitle}>Seguridad de Contraseñas</Text>
          </View>
          
          <Input
            label="Longitud mínima de contraseña"
            placeholder="6"
            value={config.longitudMinimaPassword}
            onChangeText={(text) => setConfig({ ...config, longitudMinimaPassword: text })}
            keyboardType="numeric"
          />

          {renderSwitch(
            'Requiere al menos un número',
            'requiereNumeroPassword'
          )}
          
          {renderSwitch(
            'Requiere al menos una mayúscula',
            'requiereMayusculaPassword'
          )}
          
          {renderSwitch(
            'Requiere al menos un carácter especial',
            'requiereCaracterEspecialPassword'
          )}
        </Card>

        {/* Información del Sistema */}
        <Card>
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle" size={24} color={colors.primary[600]} />
            <Text style={styles.cardTitle}>Información del Sistema</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Versión:</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Base de Datos:</Text>
            <Text style={styles.infoValue}>PostgreSQL</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Última actualización:</Text>
            <Text style={styles.infoValue}>04/03/2025</Text>
          </View>
        </Card>

        {/* Botón Guardar */}
        <View style={styles.saveButtonContainer}>
          <Button
            title={saving ? 'Guardando...' : 'Guardar Configuración'}
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
  },
  switchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  switchInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  switchLabel: {
    fontSize: fontSize.base,
    fontWeight: '500',
    color: colors.gray[800],
    marginBottom: spacing.xs,
  },
  switchDescription: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    lineHeight: 18,
  },
  switch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.gray[300],
    padding: 2,
    justifyContent: 'center',
  },
  switchActive: {
    backgroundColor: colors.primary[600],
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignSelf: 'flex-start',
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  infoLabel: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
  },
  infoValue: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.gray[900],
  },
  saveButtonContainer: {
    marginTop: spacing.lg,
  },
});

export default ConfigGeneralScreen;