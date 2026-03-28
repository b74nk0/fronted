import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';

const LoginScreen = () => {
  const navigation = useNavigation();
  const { login, isAuthenticated } = useAuth();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [errors,   setErrors]   = useState({});
  const [loginError, setLoginError] = useState(''); // error general del login
  const [loading,  setLoading]  = useState(false);

  const validateForm = () => {
    const e = {};
    if (!email.trim())
      e.email = 'El correo es requerido';
    else if (!/\S+@\S+\.\S+/.test(email))
      e.email = 'El correo no es válido';
    if (!password)
      e.password = 'La contraseña es requerida';
    else if (password.length < 3)
      e.password = 'La contraseña debe tener al menos 3 caracteres';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    setLoginError('');
    if (!validateForm()) return;

    setLoading(true);
    try {
      await login(email, password);
    } catch (error) {
      const msg = error.response?.data?.message ||
        'Credenciales inválidas. Verifica tu correo y contraseña.';
      setLoginError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="log-in-outline" size={48} color={colors.primary[600]} />
          </View>
          <Text style={styles.title}>Iniciar Sesión</Text>
          <Text style={styles.subtitle}>Accede a tu cuenta de Scolaris</Text>
        </View>

        {/* Formulario */}
        <View style={styles.form}>

          {/* Banner de error de login */}
          {loginError ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.red[600]} />
              <Text style={styles.errorBannerText}>{loginError}</Text>
            </View>
          ) : null}

          <Input
            label="Correo Electrónico"
            placeholder="ejemplo@scolaris.com"
            value={email}
            onChangeText={t => {
              setEmail(t);
              setLoginError('');
              if (errors.email) setErrors({ ...errors, email: null });
            }}
            leftIcon="mail-outline"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />

          <Input
            label="Contraseña"
            placeholder="••••••••"
            value={password}
            onChangeText={t => {
              setPassword(t);
              setLoginError('');
              if (errors.password) setErrors({ ...errors, password: null });
            }}
            leftIcon="lock-closed-outline"
            secureTextEntry
            error={errors.password}
          />

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.forgotPasswordText}>
              ¿Olvidaste tu contraseña?
            </Text>
          </TouchableOpacity>

          <Button
            title={loading ? 'Ingresando...' : 'Ingresar'}
            onPress={handleLogin}
            disabled={loading}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            ¿No tienes una cuenta?{' '}
            <Text style={styles.footerLink}>Contacta al administrador</Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: colors.white },
  scrollContent: {
    flexGrow: 1, paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl, paddingBottom: spacing.xl,
    justifyContent: 'center',
  },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  iconContainer: {
    width: 96, height: 96, borderRadius: borderRadius.full,
    backgroundColor: colors.primary[50],
    justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg,
  },
  title:    { fontSize: fontSize.xxxl, fontWeight: 'bold', color: colors.gray[900], marginBottom: spacing.xs },
  subtitle: { fontSize: fontSize.base, color: colors.gray[600], textAlign: 'center' },

  form: { width: '100%', maxWidth: 400, alignSelf: 'center' },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: '#fee2e2', borderWidth: 1, borderColor: '#fca5a5',
    borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.md,
  },
  errorBannerText: { flex: 1, fontSize: fontSize.sm, color: colors.red[700], fontWeight: '500' },

  forgotPassword: { alignSelf: 'flex-end', marginBottom: spacing.lg },
  forgotPasswordText: { fontSize: fontSize.sm, color: colors.primary[600], fontWeight: '500' },

  footer:     { marginTop: spacing.xl, alignItems: 'center' },
  footerText: { fontSize: fontSize.sm, color: colors.gray[600] },
  footerLink: { color: colors.primary[600], fontWeight: '600' },
});

export default LoginScreen;