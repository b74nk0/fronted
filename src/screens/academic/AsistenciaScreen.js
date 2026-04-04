import React, { useState, useCallback } from 'react';
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
import EmptyState from '../../components/common/EmptyState';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';
import { asistenciaService } from '../../services/asistenciaService';
import { cursoService } from '../../services/cursoService';
import { estudianteCursoService } from '../../services/estudianteCursoService';

// Estados de asistencia
const ESTADOS_ASISTENCIA = {
  PRESENTE: { label: 'Presente', color: '#16a34a', bgColor: '#dcfce7', icon: 'checkmark-circle' },
  AUSENTE: { label: 'Ausente', color: '#dc2626', bgColor: '#fee2e2', icon: 'close-circle' },
  TARDE: { label: 'Tarde', color: '#ca8a04', bgColor: '#fef9c3', icon: 'time' },
  EXCUSA: { label: 'Excusa', color: '#2563eb', bgColor: '#dbeafe', icon: 'document-text' },
};

// Dropdown selector reutilizable
const DropdownSelector = ({ label, placeholder, value, options, onSelect, error }) => {
  const [open, setOpen] = useState(false);
  return (
    <View style={ddStyles.container}>
      {label && <Text style={ddStyles.label}>{label}</Text>}
      <TouchableOpacity
        style={[ddStyles.trigger, open && ddStyles.triggerOpen, error && ddStyles.triggerError]}
        onPress={() => setOpen(!open)}
        activeOpacity={0.7}
      >
        <Text style={[ddStyles.triggerText, !value && ddStyles.placeholder]}>
          {value ? value.nombre : placeholder}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.gray[500]} />
      </TouchableOpacity>
      {error && <Text style={ddStyles.errorText}>{error}</Text>}
      {open && (
        <View style={ddStyles.dropdown}>
          <ScrollView
            style={{ maxHeight: 220 }}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
          >
            {options.length === 0 ? (
              <Text style={ddStyles.emptyText}>Sin opciones disponibles</Text>
            ) : (
              options.map(opt => (
                <TouchableOpacity
                  key={opt.id}
                  style={[ddStyles.option, value?.id === opt.id && ddStyles.optionSelected]}
                  onPress={() => { onSelect(opt); setOpen(false); }}
                >
                  <Text style={[ddStyles.optionText, value?.id === opt.id && ddStyles.optionTextSelected]}>
                    {opt.nombre}
                  </Text>
                  {value?.id === opt.id && <Ionicons name="checkmark" size={16} color={colors.primary[600]} />}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const ddStyles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.gray[700], marginBottom: spacing.xs },
  trigger: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: colors.gray[300], borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2,
    backgroundColor: colors.white, minHeight: 44,
  },
  triggerOpen: { borderColor: colors.primary[400], borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  triggerError: { borderColor: colors.red[500] },
  triggerText: { fontSize: fontSize.base, color: colors.gray[900], flex: 1 },
  placeholder: { color: colors.gray[400] },
  errorText: { fontSize: fontSize.xs, color: colors.red[500], marginTop: spacing.xs },
  dropdown: {
    borderWidth: 1, borderTopWidth: 0, borderColor: colors.primary[200],
    borderBottomLeftRadius: borderRadius.md, borderBottomRightRadius: borderRadius.md,
    backgroundColor: colors.white, marginBottom: spacing.xs,
  },
  option: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1, borderBottomColor: colors.gray[50],
  },
  optionSelected: { backgroundColor: colors.primary[50] },
  optionText: { fontSize: fontSize.sm, color: colors.gray[800] },
  optionTextSelected: { color: colors.primary[700], fontWeight: '600' },
  emptyText: { padding: spacing.md, color: colors.gray[400], fontSize: fontSize.sm, textAlign: 'center' },
});

// Selector de fecha simple
const DatePickerButton = ({ label, value, onPress }) => (
  <View style={{ marginBottom: spacing.md }}>
    <Text style={ddStyles.label}>{label}</Text>
    <TouchableOpacity style={ddStyles.trigger} onPress={onPress}>
      <Text style={ddStyles.triggerText}>
        {value ? new Date(value).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Seleccionar fecha'}
      </Text>
      <Ionicons name="calendar" size={18} color={colors.gray[500]} />
    </TouchableOpacity>
  </View>
);

// Card de estudiante para asistencia
const EstudianteAsistenciaCard = ({ estudiante, estado, onEstadoChange }) => {
  const getInitials = (nombre, apellido) =>
    `${nombre?.[0] || ''}${apellido?.[0] || ''}`.toUpperCase();

  return (
    <Card style={styles.estudianteCard}>
      <View style={styles.estudianteHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(estudiante.nombre, estudiante.apellido)}</Text>
        </View>
        <View style={styles.estudianteInfo}>
          <Text style={styles.estudianteNombre}>{estudiante.nombre} {estudiante.apellido}</Text>
          <Text style={styles.estudianteDoc}>{estudiante.numeroDocumento}</Text>
        </View>
      </View>

      <View style={styles.estadosContainer}>
        {Object.entries(ESTADOS_ASISTENCIA).map(([key, config]) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.estadoButton,
              { backgroundColor: estado === key ? config.bgColor : colors.gray[100] },
              estado === key && { borderColor: config.color, borderWidth: 2 },
            ]}
            onPress={() => onEstadoChange(key)}
          >
            <Ionicons
              name={config.icon}
              size={18}
              color={estado === key ? config.color : colors.gray[500]}
            />
            <Text
              style={[
                styles.estadoLabel,
                { color: estado === key ? config.color : colors.gray[600] },
              ]}
            >
              {config.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </Card>
  );
};

const AsistenciaScreen = () => {
  const navigation = useNavigation();

  const [cursos, setCursos] = useState([]);
  const [cursoSeleccionado, setCursoSeleccionado] = useState(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().toISOString().split('T')[0]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [asistencias, setAsistencias] = useState({}); // { estudianteCursoId: estado }
  const [loading, setLoading] = useState(false);
  const [cargandoEstudiantes, setCargandoEstudiantes] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Cargar cursos al montar
  useFocusEffect(
    useCallback(() => {
      loadCursos();
    }, [])
  );

  const loadCursos = async () => {
    try {
      const data = await cursoService.listar();
      const cursosArray = Array.isArray(data) ? data : data?.content || [];
      setCursos(cursosArray);
    } catch (e) {
      console.error('Error cargando cursos:', e);
    }
  };

  const cargarEstudiantes = async () => {
    if (!cursoSeleccionado) return;

    setCargandoEstudiantes(true);
    try {
      // Cargar estudiantes del curso
      const estudiantesData = await estudianteCursoService.listarPorCurso(cursoSeleccionado.id);
      console.log('ESTRUCTURA:', JSON.stringify(estudiantesData[0], null, 2));
      const estudiantesArray = Array.isArray(estudiantesData) ? estudiantesData : [];
      setEstudiantes(estudiantesArray);

      // Cargar asistencias existentes para esa fecha
      const asistenciasData = await asistenciaService.obtenerPorCursoYFecha(
        cursoSeleccionado.id,
        fechaSeleccionada
      );
      const asistenciasArray = Array.isArray(asistenciasData) ? asistenciasData : [];

      // Mapear asistencias existentes
      const asistenciasMap = {};
      asistenciasArray.forEach(asis => {
        asistenciasMap[asis.estudianteCursoId] = asis.estado;
      });
      setAsistencias(asistenciasMap);
    } catch (e) {
      console.error('Error cargando estudiantes:', e);
      Alert.alert('Error', 'No se pudieron cargar los estudiantes');
    } finally {
      setCargandoEstudiantes(false);
    }
  };

  const handleGuardarAsistencia = async () => {
    if (!cursoSeleccionado || estudiantes.length === 0) return;

    setGuardando(true);
    try {
      const listaAsistencias = estudiantes.map(est => ({
        estudianteCursoId: est.id,
        estado: asistencias[est.id] || 'PRESENTE',
        observaciones: '',
      }));

      await asistenciaService.registrarLista({
        cursoId: cursoSeleccionado.id,
        fecha: fechaSeleccionada,
        asistencias: listaAsistencias,
      });

      Alert.alert('Éxito', 'Asistencia registrada correctamente');
    } catch (e) {
      console.error('Error guardando asistencia:', e);
      Alert.alert('Error', 'No se pudo registrar la asistencia');
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstado = (estudianteCursoId, estado) => {
    setAsistencias(prev => ({ ...prev, [estudianteCursoId]: estado }));
  };

  const obtenerResumen = () => {
    const resumen = { PRESENTE: 0, AUSENTE: 0, TARDE: 0, EXCUSA: 0 };
    estudiantes.forEach(est => {
      const estado = asistencias[est.id] || 'PRESENTE';
      resumen[estado]++;
    });
    return resumen;
  };

  const resumen = obtenerResumen();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[700]} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.headerText}>Registro de Asistencia</Text>
          <Text style={styles.headerSubtext}>Control de asistencia diaria</Text>
        </View>
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* Selectores */}
        <Card style={styles.selectoresCard}>
          <DropdownSelector
            label="Curso *"
            placeholder="Selecciona un curso"
            value={cursoSeleccionado}
            options={cursos}
            onSelect={(curso) => {
              setCursoSeleccionado(curso);
              setEstudiantes([]);
              setAsistencias({});
            }}
          />

          <DatePickerButton
            label="Fecha *"
            value={fechaSeleccionada}
            onPress={() => {
              // En web, mostrar un input de fecha simple
              const nuevaFecha = prompt('Ingresa la fecha (YYYY-MM-DD):', fechaSeleccionada);
              if (nuevaFecha && /^\d{4}-\d{2}-\d{2}$/.test(nuevaFecha)) {
                setFechaSeleccionada(nuevaFecha);
                setAsistencias({});
              }
            }}
          />

          {cursoSeleccionado && (
            <Button
              title="Cargar estudiantes"
              onPress={cargarEstudiantes}
              loading={cargandoEstudiantes}
              disabled={cargandoEstudiantes}
            />
          )}
        </Card>

        {/* Resumen estadístico */}
        {estudiantes.length > 0 && (
          <Card style={styles.resumenCard}>
            <Text style={styles.resumenTitle}>Resumen</Text>
            <View style={styles.resumenGrid}>
              {Object.entries(ESTADOS_ASISTENCIA).map(([key, config]) => (
                <View key={key} style={[styles.resumenItem, { backgroundColor: config.bgColor }]}>
                  <Text style={[styles.resumenNumero, { color: config.color }]}>{resumen[key]}</Text>
                  <Text style={[styles.resumenLabel, { color: config.color }]}>{config.label}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Lista de estudiantes */}
        {cargandoEstudiantes ? (
          <ActivityIndicator size="large" color={colors.primary[600]} style={{ marginTop: spacing.xl }} />
        ) : estudiantes.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title={cursoSeleccionado ? 'Sin estudiantes' : 'Selecciona un curso'}
            message={cursoSeleccionado
              ? 'No hay estudiantes matriculados en este curso'
              : 'Selecciona un curso y fecha para cargar la lista de estudiantes'}
          />
        ) : (
          <View style={styles.listaContainer}>
            <Text style={styles.listaTitle}>{estudiantes.length} estudiantes</Text>
            {estudiantes.map(est => (
              <EstudianteAsistenciaCard
                key={est.id}
                estudiante={est.estudiante}
                estado={asistencias[est.id] || 'PRESENTE'}
                onEstadoChange={(estado) => cambiarEstado(est.id, estado)}
              />
            ))}
            <View style={{ height: spacing.xl }} />
          </View>
        )}
      </ScrollView>

      {/* Footer con botón guardar */}
      {estudiantes.length > 0 && (
        <View style={styles.footer}>
          <Button
            title={guardando ? 'Guardando...' : 'Guardar Asistencia'}
            onPress={handleGuardarAsistencia}
            loading={guardando}
            disabled={guardando}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  header: {
    backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center',
    padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.gray[200],
  },
  backButton: { marginRight: spacing.md },
  headerTitle: { flex: 1 },
  headerText: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.gray[900] },
  headerSubtext: { fontSize: fontSize.sm, color: colors.gray[600], marginTop: spacing.xs },
  content: { flex: 1, padding: spacing.lg },
  selectoresCard: { marginBottom: spacing.lg },
  resumenCard: { marginBottom: spacing.lg },
  resumenTitle: {
    fontSize: fontSize.base, fontWeight: '600', color: colors.gray[900], marginBottom: spacing.md,
  },
  resumenGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm,
  },
  resumenItem: {
    flex: 1, minWidth: 70, alignItems: 'center',
    padding: spacing.sm, borderRadius: borderRadius.md,
  },
  resumenNumero: { fontSize: fontSize.lg, fontWeight: 'bold' },
  resumenLabel: { fontSize: fontSize.xs, fontWeight: '500' },
  listaContainer: { marginTop: spacing.sm },
  listaTitle: {
    fontSize: fontSize.sm, fontWeight: '600', color: colors.gray[700],
    marginBottom: spacing.md, marginLeft: spacing.xs,
  },
  estudianteCard: { marginBottom: spacing.md },
  estudianteHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primary[600], justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: fontSize.sm, fontWeight: 'bold', color: colors.white },
  estudianteInfo: { marginLeft: spacing.md, flex: 1 },
  estudianteNombre: { fontSize: fontSize.base, fontWeight: '600', color: colors.gray[900] },
  estudianteDoc: { fontSize: fontSize.xs, color: colors.gray[500], marginTop: 2 },
  estadosContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  estadoButton: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.md, gap: spacing.xs,
  },
  estadoLabel: { fontSize: fontSize.xs, fontWeight: '600' },
  footer: {
    backgroundColor: colors.white, padding: spacing.lg,
    borderTopWidth: 1, borderTopColor: colors.gray[200],
  },
});

export default AsistenciaScreen;
