import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';

let DateTimePicker = null;
if (Platform.OS !== 'web') {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
}

const parseDate = (str) => {
  if (!str) return new Date();
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const formatDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// ─── Web ─────────────────────────────────────────────────────────────────────
const DatePickerWeb = ({ label, value, onChange, error }) => (
  <View style={styles.container}>
    {label && <Text style={styles.label}>{label}</Text>}
    <View style={[styles.input, error && styles.inputError]}>
      <Ionicons name="calendar-outline" size={18} color={colors.gray[500]} />
      <input
        type="date"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        style={{
          flex: 1,
          border: 'none',
          outline: 'none',
          fontSize: 14,
          color: value ? '#111827' : '#9CA3AF',
          backgroundColor: 'transparent',
          cursor: 'pointer',
          paddingLeft: 8,
        }}
      />
    </View>
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

// ─── Móvil ────────────────────────────────────────────────────────────────────
const DatePickerMobile = ({ label, value, onChange, error }) => {
  const [show, setShow] = useState(false);

  const handleChange = (event, selectedDate) => {
    setShow(Platform.OS === 'ios');
    if (event.type === 'dismissed') return;
    if (selectedDate) onChange(formatDate(selectedDate));
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[styles.input, error && styles.inputError]}
        onPress={() => setShow(true)}
        activeOpacity={0.7}
      >
        <Ionicons
          name="calendar-outline"
          size={18}
          color={value ? colors.gray[700] : colors.gray[400]}
        />
        <Text style={[styles.inputText, !value && styles.placeholder]}>
          {value || 'Seleccionar fecha'}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.gray[400]} />
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}
      {show && DateTimePicker && (
        <DateTimePicker
          value={parseDate(value)}
          mode="date"
          display="default"
          onChange={handleChange}
        />
      )}
    </View>
  );
};

// ─── Export ───────────────────────────────────────────────────────────────────
const DatePickerField = (props) => {
  if (Platform.OS === 'web') return <DatePickerWeb {...props} />;
  return <DatePickerMobile {...props} />;
};

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: spacing.xs,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.white,
    minHeight: 44,
  },
  inputError: { borderColor: colors.red[500] },
  inputText: { flex: 1, fontSize: fontSize.base, color: colors.gray[900] },
  placeholder: { color: colors.gray[400] },
  errorText: { fontSize: fontSize.xs, color: colors.red[500], marginTop: spacing.xs },
});

export default DatePickerField;