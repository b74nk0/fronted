import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';

const AuthHeader = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: async () => {
            console.log('Usuario confirmó logout');
            await logout();
            console.log('Logout ejecutado desde header');
          },
        },
      ]
    );
  };

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

  return (
    <View style={styles.header}>
      <View style={styles.userInfo}>
        <Ionicons name="person-circle" size={32} color={colors.white} />
        <Text style={styles.userName}>{user?.nombre || user?.email}</Text>
      </View>
      
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        activeOpacity={0.7}
      >
        <Ionicons name="log-out-outline" size={24} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary[700],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  userName: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: '600',
  },
  logoutButton: {
    padding: spacing.sm,
  },
});

export default AuthHeader;