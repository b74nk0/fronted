import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';
import { api } from '../../services/api';

const ResetPasswordScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  // Obtenemos el token
  let token = route.params?.token || '';
  if (!token && typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    token = urlParams.get('token') || '';
  }

  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [loading, setLoading] = useState(false);
  const [validandoToken, setValidandoToken] = useState(true);
  const [tokenValido, setTokenValido] = useState(false);
  const [completado, setCompletado] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const validar = async () => {
      if (!token) {
        setTokenValido(false);
        setValidandoToken(false);
        return;
      }
      try {
        await api.get(`/auth/reset-password?token=${token}`);
        setTokenValido(true);
      } catch (e) {
        setTokenValido(false);
      } finally {
        setValidandoToken(false);
      }
    };
    validar();
  }, [token]);

  const validate = () => {
    const e = {};
    if (!password) e.password = 'Requerido';
    else if (password.length < 6) e.password = 'Mínimo 6 caracteres';
    if (!confirmar) e.confirmar = 'Requerido';
    else if (password !== confirmar) e.confirmar = 'Las contraseñas no coinciden';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleReset = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setCompletado(true);
    } catch (e) {
      const msg = e.response?.data?.message || 'Error al restablecer la contraseña';
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  // Navegación limpia hacia Auth (Login)
  const handleGoToLogin = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Auth' }],
      })
    );
  };
  
  // Navegación hacia ForgotPassword reemplazando la pantalla actual
  const handleGoToForgot = () => {
    navigation.replace('ForgotPassword');
  };

  if (validandoToken) return (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color={colors.primary[600]} />
      <Text style={styles.loadingText}>Verificando enlace...</Text>
    </View>
  );

  if (!tokenValido) return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={[styles.iconWrap, { backgroundColor: '#fee2e2' }]}>
            <Ionicons name="alert-circle-outline" size={36} color={colors.red[600]} />
          </View>
          <Text style={styles.title}>Enlace inválido</Text>
          <Text style={styles.subtitle}>
            Este enlace de recuperación es inválido o ha expirado.
          </Text>
        </View>
        <View style={styles.card}>
          <Button title="Solicitar nuevo enlace" onPress={handleGoToForgot} style={{ marginBottom: spacing.md }} />
          <TouchableOpacity style={styles.backLink} onPress={handleGoToLogin}>
            <Ionicons name="arrow-back" size={16} color={colors.primary[600]} />
            <Text style={styles.backLinkText}>Volver al inicio de sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );

  if (completado) return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={[styles.iconWrap, { backgroundColor: '#dcfce7' }]}>
            <Ionicons name="checkmark-circle-outline" size={36} color="#16a34a" />
          </View>
          <Text style={styles.title}>¡Contraseña restablecida!</Text>
          <Text style={styles.subtitle}>
            Tu contraseña ha sido actualizada correctamente.
          </Text>
        </View>
        <View style={styles.card}>
          <Button title="Ir al inicio de sesión" onPress={handleGoToLogin} />
        </View>
      </ScrollView>
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Ionicons name="lock-closed-outline" size={36} color={colors.primary[600]} />
          </View>
          <Text style={styles.title}>Nueva contraseña</Text>
          <Text style={styles.subtitle}>Crea una contraseña segura</Text>
        </View>

        <View style={styles.card}>
          <Input
            label="Nueva contraseña *"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChangeText={t => { setPassword(t); setErrors(e => ({ ...e, password: null })); }}
            secureTextEntry
            error={errors.password}
          />
          <Input
            label="Confirmar contraseña *"
            placeholder="Repite la contraseña"
            value={confirmar}
            onChangeText={t => { setConfirmar(t); setErrors(e => ({ ...e, confirmar: null })); }}
            secureTextEntry
            error={errors.confirmar}
          />

          {errors.general && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.red[600]} />
              <Text style={styles.errorBannerText}>{errors.general}</Text>
            </View>
          )}

          <Button
            title={loading ? 'Guardando...' : 'Restablecer contraseña'}
            onPress={handleReset}
            disabled={loading}
            style={{ marginTop: spacing.sm }}
          />

          <TouchableOpacity style={styles.backLink} onPress={handleGoToLogin}>
            <Ionicons name="arrow-back" size={16} color={colors.primary[600]} />
            <Text style={styles.backLinkText}>Volver al inicio de sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  loadingText: { fontSize: fontSize.base, color: colors.gray[600] },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl, maxWidth: 480, alignSelf: 'center', width: '100%' },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  iconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primary[50], justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg },
  title: { fontSize: 24, fontWeight: '800', color: colors.gray[900], textAlign: 'center' },
  subtitle: { fontSize: fontSize.sm, color: colors.gray[500], textAlign: 'center', marginTop: spacing.sm, lineHeight: 20 },
  card: { backgroundColor: colors.white, borderRadius: borderRadius.xl, padding: spacing.xl, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: '#fee2e2', padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.md },
  errorBannerText: { fontSize: fontSize.sm, color: colors.red[600], flex: 1 },
  backLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, marginTop: spacing.lg },
  backLinkText: { fontSize: fontSize.sm, color: colors.primary[600], fontWeight: '600' },
});

export default ResetPasswordScreen;
