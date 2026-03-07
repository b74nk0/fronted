import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';
import { usuarioService } from '../../services/usuarioService';
import { useAuth } from '../../context/AuthContext';

// Color por rol
const getRolColor = (rol) => {
  const map = {
    Administrador: '#dc2626',
    Administrativo: '#0284c7',
    Docente: '#9333ea',
    Estudiante: '#16a34a',
    Padre: '#f59e0b',
  };
  return map[rol] || '#64748b';
};

const getInitials = (nombre, apellido) => {
  return `${nombre?.[0] || ''}${apellido?.[0] || ''}`.toUpperCase();
};

const UsuariosScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [filtrados, setFiltrados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  // Determinar si es docente
  const esDocente = user?.roles?.some(
    (r) => (typeof r === 'string' ? r : r.nombre)?.toLowerCase() === 'docente'
  );

  // ─── Cargar ─────────────────────────────────────────────────────────────────
  const loadUsuarios = async () => {
    setLoading(true);
    try {
      const data = esDocente
        ? await usuarioService.listarEstudiantes()
        : await usuarioService.listar();
      setUsuarios(data);
      setFiltrados(data);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      Alert.alert('Error', 'No se pudieron cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadUsuarios();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadUsuarios();
    setRefreshing(false);
  }, []);

  // ─── Búsqueda ────────────────────────────────────────────────────────────────
  const handleBusqueda = (texto) => {
    setBusqueda(texto);
    if (!texto.trim()) {
      setFiltrados(usuarios);
      return;
    }
    const lower = texto.toLowerCase();
    setFiltrados(
      usuarios.filter(
        (u) =>
          u.nombre?.toLowerCase().includes(lower) ||
          u.apellido?.toLowerCase().includes(lower) ||
          u.email?.toLowerCase().includes(lower) ||
          u.numeroDocumento?.includes(lower)
      )
    );
  };

  // ─── Eliminar ────────────────────────────────────────────────────────────────
  const handleDelete = (usuario) => {
    Alert.alert(
      'Eliminar usuario',
      `¿Estás seguro de que deseas eliminar a ${usuario.nombre} ${usuario.apellido}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await usuarioService.eliminar(usuario.id);
              await loadUsuarios();
            } catch (error) {
              console.error('Error eliminando usuario:', error);
              Alert.alert('Error', 'No se pudo eliminar el usuario.');
            }
          },
        },
      ]
    );
  };

  // ─── Render card ─────────────────────────────────────────────────────────────
  const renderUsuarioCard = (usuario) => {
    const rolPrincipal = usuario.roles?.[0] || 'Sin rol';
    const color = getRolColor(rolPrincipal);

    return (
      <Card key={usuario.id} style={styles.card}>
        <View style={styles.cardRow}>
          {/* Avatar */}
          <View style={[styles.avatar, { backgroundColor: color }]}>
            <Text style={styles.avatarText}>
              {getInitials(usuario.nombre, usuario.apellido)}
            </Text>
          </View>

          {/* Info */}
          <View style={styles.cardInfo}>
            <Text style={styles.cardNombre}>
              {usuario.nombre} {usuario.apellido}
            </Text>
            <Text style={styles.cardEmail}>{usuario.email}</Text>
            <View style={styles.cardMeta}>
              <Text style={styles.cardDoc}>
                {usuario.tipoDocumento} {usuario.numeroDocumento}
              </Text>
              <View style={styles.rolesTags}>
                {usuario.roles?.map((rol) => (
                  <View
                    key={rol}
                    style={[styles.rolTag, { backgroundColor: getRolColor(rol) + '20' }]}
                  >
                    <Text style={[styles.rolTagText, { color: getRolColor(rol) }]}>
                      {rol}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Acciones */}
          {!esDocente && (
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => navigation.navigate('EditarUsuario', { usuario })}
              >
                <Ionicons name="pencil" size={18} color={colors.primary[600]} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => handleDelete(usuario)}
              >
                <Ionicons name="trash" size={18} color={colors.red[500]} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Card>
    );
  };

  if (loading && usuarios.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={styles.loadingText}>Cargando usuarios...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitle}>
          <Text style={styles.headerText}>
            {esDocente ? 'Estudiantes' : 'Usuarios'}
          </Text>
          <Text style={styles.headerSubtext}>
            {filtrados.length} {esDocente ? 'estudiantes' : 'usuarios'}
          </Text>
        </View>
        {!esDocente && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('CrearUsuario')}
          >
            <Ionicons name="add" size={24} color={colors.white} />
          </TouchableOpacity>
        )}
      </View>

      {/* Búsqueda */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color={colors.gray[400]} />
        <TextInput
          style={styles.searchInput}
          placeholder={`Buscar ${esDocente ? 'estudiante' : 'usuario'}...`}
          placeholderTextColor={colors.gray[400]}
          value={busqueda}
          onChangeText={handleBusqueda}
        />
        {busqueda.length > 0 && (
          <TouchableOpacity onPress={() => handleBusqueda('')}>
            <Ionicons name="close-circle" size={18} color={colors.gray[400]} />
          </TouchableOpacity>
        )}
      </View>

      {/* Lista */}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filtrados.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title={busqueda ? 'Sin resultados' : `No hay ${esDocente ? 'estudiantes' : 'usuarios'}`}
            message={
              busqueda
                ? 'Intenta con otro término de búsqueda'
                : `${esDocente ? 'No hay estudiantes registrados' : 'Crea el primer usuario'}`
            }
          />
        ) : (
          <View style={styles.list}>{filtrados.map(renderUsuarioCard)}</View>
        )}
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
  headerTitle: { flex: 1 },
  headerText: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.gray[900] },
  headerSubtext: { fontSize: fontSize.sm, color: colors.gray[600], marginTop: spacing.xs },
  addButton: {
    width: 40,
    height: 40,
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray[200],
    gap: spacing.sm,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.gray[900],
  },
  content: { flex: 1 },
  list: { padding: spacing.lg },
  card: { marginBottom: spacing.md },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: fontSize.base, fontWeight: 'bold', color: colors.white },
  cardInfo: { flex: 1 },
  cardNombre: { fontSize: fontSize.base, fontWeight: '600', color: colors.gray[900] },
  cardEmail: { fontSize: fontSize.sm, color: colors.gray[500], marginTop: 2 },
  cardMeta: { marginTop: spacing.xs, gap: spacing.xs },
  cardDoc: { fontSize: fontSize.xs, color: colors.gray[500] },
  rolesTags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: 2 },
  rolTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  rolTagText: { fontSize: fontSize.xs, fontWeight: '600' },
  cardActions: { flexDirection: 'row', gap: spacing.xs },
  iconButton: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[100],
  },
});

export default UsuariosScreen;