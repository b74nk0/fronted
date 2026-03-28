import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';
import { api } from '../../services/api';

const ForgotPasswordScreen = () => {
  const navigation = useNavigation();

  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async () => {
    if (!email.trim()) { setError('Ingresa tu correo electrónico'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Correo inválido'); return; }

    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setEnviado(true);
    } catch (e) {
      // Siempre mostrar éxito para no revelar si el email existe
      setEnviado(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Logo / header */}
        <View style={styles.header}>
          <View style={styles.logoWrap}>
            <Ionicons name="lock-open-outline" size={36} color={colors.primary[600]} />
          </View>
          <Text style={styles.title}>Recuperar contraseña</Text>
          <Text style={styles.subtitle}>
            Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña
          </Text>
        </View>

        {enviado ? (
          /* Estado: correo enviado */
          <View style={styles.successCard}>
            <View style={styles.successIcon}>
              <Ionicons name="mail-outline" size={40} color="#16a34a" />
            </View>
            <Text style={styles.successTitle}>¡Correo enviado!</Text>
            <Text style={styles.successText}>
              Si tu correo está registrado en Scolaris, recibirás un enlace para restablecer tu contraseña.
            </Text>
            <Text style={styles.successHint}>
              Revisa también tu carpeta de spam.
            </Text>
            <Button
              title="Volver al inicio de sesión"
              onPress={() => navigation.navigate('Login')}
              style={styles.backBtn}
            />
          </View>
        ) : (
          /* Formulario */
          <View style={styles.form}>
            <Input
              label="Correo electrónico"
              placeholder="tu@correo.com"
              value={email}
              onChangeText={t => { setEmail(t); setError(''); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={error}
            />

            <Button
              title={loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
              onPress={handleSubmit}
              disabled={loading}
              style={styles.submitBtn}
            />

            {loading && (
              <ActivityIndicator
                color={colors.primary[600]}
                style={{ marginTop: spacing.md }}
              />
            )}

            <TouchableOpacity
              style={styles.backLink}
              onPress={() => navigation.navigate('Login')}>
              <Ionicons name="arrow-back" size={16} color={colors.primary[600]} />
              <Text style={styles.backLinkText}>Volver al inicio de sesión</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  scroll: {
    flexGrow: 1, justifyContent: 'center',
    padding: spacing.xl, maxWidth: 480, alignSelf: 'center', width: '100%',
  },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  logoWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.primary[50], justifyContent: 'center',
    alignItems: 'center', marginBottom: spacing.lg,
  },
  title:    { fontSize: 24, fontWeight: '800', color: colors.gray[900], textAlign: 'center' },
  subtitle: {
    fontSize: fontSize.sm, color: colors.gray[500],
    textAlign: 'center', marginTop: spacing.sm, lineHeight: 20,
  },

  form: {
    backgroundColor: colors.white, borderRadius: borderRadius.xl,
    padding: spacing.xl,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  submitBtn: { marginTop: spacing.sm },
  backLink: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, marginTop: spacing.lg,
  },
  backLinkText: { fontSize: fontSize.sm, color: colors.primary[600], fontWeight: '600' },

  successCard: {
    backgroundColor: colors.white, borderRadius: borderRadius.xl,
    padding: spacing.xl, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  successIcon: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#dcfce7',
    justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg,
  },
  successTitle: { fontSize: fontSize.xl, fontWeight: '800', color: colors.gray[900], marginBottom: spacing.sm },
  successText:  { fontSize: fontSize.sm, color: colors.gray[600], textAlign: 'center', lineHeight: 20 },
  successHint:  { fontSize: fontSize.xs, color: colors.gray[400], textAlign: 'center', marginTop: spacing.sm },
  backBtn:      { marginTop: spacing.xl, width: '100%' },
});

export default ForgotPasswordScreen;