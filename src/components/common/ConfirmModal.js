import React from 'react';
import { View, Text, Modal, StyleSheet } from 'react-native';
import Button from './Button';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';

/**
 * ConfirmModal — reemplaza Alert.alert en toda la app (compatible con web y móvil)
 *
 * Props:
 *  visible      {boolean}   — mostrar/ocultar el modal
 *  title        {string}    — título del modal
 *  message      {string}    — mensaje de confirmación
 *  confirmText  {string}    — texto del botón confirmar (default: 'Confirmar')
 *  cancelText   {string}    — texto del botón cancelar (default: 'Cancelar')
 *  confirmColor {string}    — color del botón confirmar: 'primary' | 'danger' (default: 'primary')
 *  loading      {boolean}   — deshabilita botones y muestra texto de carga
 *  onConfirm    {function}  — callback al confirmar
 *  onCancel     {function}  — callback al cancelar / cerrar
 *
 * Uso:
 *  <ConfirmModal
 *    visible={confirmVisible}
 *    title="Eliminar registro"
 *    message="¿Estás seguro de que deseas eliminar este registro?"
 *    confirmText="Eliminar"
 *    confirmColor="danger"
 *    loading={deleting}
 *    onConfirm={handleDelete}
 *    onCancel={() => setConfirmVisible(false)}
 *  />
 */
const ConfirmModal = ({
  visible = false,
  title = 'Confirmar',
  message = '¿Deseas continuar?',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  confirmColor = 'primary',
  loading = false,
  onConfirm,
  onCancel,
}) => {
  const confirmVariant = confirmColor === 'danger' ? 'danger' : 'primary';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Ícono según tipo */}
          <View style={[
            styles.iconContainer,
            confirmColor === 'danger' ? styles.iconDanger : styles.iconPrimary,
          ]}>
            <Text style={styles.iconText}>
              {confirmColor === 'danger' ? '!' : '?'}
            </Text>
          </View>

          {/* Título */}
          <Text style={styles.title}>{title}</Text>

          {/* Mensaje */}
          <Text style={styles.message}>{message}</Text>

          {/* Botones */}
          <View style={styles.footer}>
            <Button
              title={cancelText}
              onPress={onCancel}
              variant="outline"
              disabled={loading}
              style={styles.btn}
            />
            <Button
              title={loading ? 'Procesando...' : confirmText}
              onPress={onConfirm}
              disabled={loading}
              variant={confirmVariant}
              style={styles.btn}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconPrimary: {
    backgroundColor: colors.primary[100],
  },
  iconDanger: {
    backgroundColor: '#fee2e2',
  },
  iconText: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.gray[700],
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: fontSize.base,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  btn: {
    flex: 1,
  },
});

export default ConfirmModal;