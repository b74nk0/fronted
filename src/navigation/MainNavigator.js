import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

// Screens - Dashboard
import DashboardScreen from '../screens/dashboard/DashboardScreen';

// Screens - Admin
import UsuariosScreen from '../screens/admin/UsuariosScreen';
import CrearUsuarioScreen from '../screens/admin/CrearUsuarioScreen';
import EditarUsuarioScreen from '../screens/admin/EditarUsuarioScreen';
import AdministracionEscolarScreen from '../screens/admin/AdministracionEscolarScreen';
import ConfiguracionScreen from '../screens/admin/ConfiguracionScreen';

// Screens - Config
import ConfigInstitucionScreen from '../screens/admin/config/ConfigInstitucionScreen';
import ConfigPeriodosScreen from '../screens/admin/config/ConfigPeriodosScreen';
import ConfigSubPeriodosScreen from '../screens/admin/config/ConfigSubPeriodosScreen';
import ConfigGradosScreen from '../screens/admin/config/ConfigGradosScreen';
import ConfigRolesScreen from '../screens/admin/config/ConfigRolesScreen';
import ConfigTiposDocumentoScreen from '../screens/admin/config/ConfigTiposDocumentoScreen';
import ConfigGeneralScreen from '../screens/admin/config/ConfigGeneralScreen';

// Screens - Académico
import GestionAcademicaScreen from '../screens/academic/GestionAcademicaScreen';
import MateriasScreen from '../screens/academic/config/MateriasScreen';
import PlanesEstudioScreen from '../screens/academic/config/PlanesEstudioScreen';
import CompetenciasScreen from '../screens/academic/config/CompetenciasScreen';
import DocumentacionScreen from '../screens/academic/DocumentacionScreen';
import DocentesScreen from '../screens/academic/DocentesScreen';
import MatriculasScreen from '../screens/academic/MatriculasScreen';
import CursosScreen from '../screens/admin/CursosScreen';
import AsignacionDocenteScreen from '../screens/admin/AsignacionDocenteScreen';
import AsistenciaScreen from '../screens/academic/AsistenciaScreen';

//Screens - Docente
import PerfilEstudianteScreen from '../screens/academic/PerfilEstudianteScreen';
import MiAsistenciaScreen from '../screens/dashboard/MiAsistenciaScreen';
import NotasDocenteScreen from '../screens/academic/NotasDocenteScreen';

// Screens - Estudiante
import MisNotasScreen from '../screens/academic/MisNotasScreen';

// Screens - Admin Reportes
import ReporteNotasAdminScreen from '../screens/academic/ReporteNotasAdminScreen';

// Screens - Finance
import PensionesScreen from '../screens/finance/PensionesScreen';
import MisPensionesScreen from '../screens/finance/MisPensionesScreen';
import ReportePagosScreen from '../screens/finance/ReportePagosScreen';

// Screens - Compartidas (todos los roles)
import MiPerfilScreen from '../screens/profile/MiPerfilScreen';
import CalendarioScreen from '../screens/calendario/CalendarioScreen';

// Custom Drawer
import CustomDrawerContent from '../components/layout/CustomDrawerContent';
import MisCursosDocenteScreen from '../screens/academic/MisCursosDocenteScreen';

const Drawer = createDrawerNavigator();

const MainNavigator = () => {
  const { user } = useAuth();

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
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: '#0284c7' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        drawerActiveTintColor: '#0ea5e9',
        drawerInactiveTintColor: '#64748b',
        drawerStyle: { backgroundColor: '#f8fafc' },
      }}
    >
      {/* ── Dashboard (todos) ───────────────────────────────────────────── */}
      <Drawer.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Inicio',
          drawerIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />

      {/* ── ADMINISTRADOR y ADMINISTRATIVO ──────────────────────────────── */}
      {(isAdmin || isAdministrativo) && (
        <>
          <Drawer.Screen name="Usuarios" component={UsuariosScreen}
            options={{ title: 'Usuarios', drawerIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} /> }} />

          <Drawer.Screen name="GestionAcademica" component={GestionAcademicaScreen}
            options={{ title: 'Gestión Académica', drawerIcon: ({ color, size }) => <Ionicons name="school" size={size} color={color} /> }} />

          <Drawer.Screen name="Pensiones" component={PensionesScreen}
            options={{ title: 'Pensiones', drawerIcon: ({ color, size }) => <Ionicons name="cash" size={size} color={color} /> }} />

          <Drawer.Screen name="ReportePagos" component={ReportePagosScreen}
            options={{ title: 'Reporte de Pagos', drawerIcon: ({ color, size }) => <Ionicons name="receipt" size={size} color={color} /> }} />

          <Drawer.Screen name="AdministracionEscolar" component={AdministracionEscolarScreen}
            options={{ title: 'Administración Escolar', drawerIcon: ({ color, size }) => <Ionicons name="briefcase" size={size} color={color} /> }} />

          <Drawer.Screen name="Configuracion" component={ConfiguracionScreen}
            options={{ title: 'Configuración', drawerIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} /> }} />

          {/* Ocultas - Usuarios */}
          <Drawer.Screen name="CrearUsuario" component={CrearUsuarioScreen}
            options={{ drawerItemStyle: { display: 'none' }, title: 'Crear Usuario' }} />
          <Drawer.Screen name="EditarUsuario" component={EditarUsuarioScreen}
            options={{ drawerItemStyle: { display: 'none' }, title: 'Editar Usuario' }} />

          {/* Ocultas - Académico */}
          <Drawer.Screen name="Materias" component={MateriasScreen}
            options={{ drawerItemStyle: { display: 'none' }, title: 'Materias' }} />
          <Drawer.Screen name="PlanesEstudio" component={PlanesEstudioScreen}
            options={{ drawerItemStyle: { display: 'none' }, title: 'Planes de Estudio' }} />
          <Drawer.Screen name="Competencias" component={CompetenciasScreen}
            options={{ drawerItemStyle: { display: 'none' }, title: 'Competencias y Logros' }} />
          <Drawer.Screen name="Matriculas" component={MatriculasScreen}
            options={{ drawerItemStyle: { display: 'none' }, title: 'Matrículas' }} />
          <Drawer.Screen name="Cursos" component={CursosScreen}
            options={{ drawerItemStyle: { display: 'none' }, title: 'Cursos' }} />
          <Drawer.Screen name="AsignacionDocente" component={AsignacionDocenteScreen}
            options={{ drawerItemStyle: { display: 'none' }, title: 'Asignación Docente' }} />
          <Drawer.Screen name="Asistencia" component={AsistenciaScreen}
            options={{ drawerItemStyle: { display: 'none' }, title: 'Registro de Asistencia' }} />

          {/* Ocultas - Configuración */}
          <Drawer.Screen name="ConfigInstitucion" component={ConfigInstitucionScreen}
            options={{ drawerItemStyle: { display: 'none' }, title: 'Información Institucional' }} />
          <Drawer.Screen name="ConfigPeriodos" component={ConfigPeriodosScreen}
            options={{ drawerItemStyle: { display: 'none' }, title: 'Períodos Académicos' }} />
          <Drawer.Screen name="ConfigSubPeriodos" component={ConfigSubPeriodosScreen}
            options={{ drawerItemStyle: { display: 'none' }, title: 'Configurar Períodos' }} />
          <Drawer.Screen name="ConfigGrados" component={ConfigGradosScreen}
            options={{ drawerItemStyle: { display: 'none' }, title: 'Grados y Niveles' }} />
          <Drawer.Screen name="ConfigRoles" component={ConfigRolesScreen}
            options={{ drawerItemStyle: { display: 'none' }, title: 'Roles del Sistema' }} />
          <Drawer.Screen name="ConfigTiposDocumento" component={ConfigTiposDocumentoScreen}
            options={{ drawerItemStyle: { display: 'none' }, title: 'Tipos de Documento' }} />
          <Drawer.Screen name="ConfigGeneral" component={ConfigGeneralScreen}
            options={{ drawerItemStyle: { display: 'none' }, title: 'Configuración General' }} />
          <Drawer.Screen name="ReporteNotas" component={ReporteNotasAdminScreen}
            options={{ drawerItemStyle: { display: 'none' }, title: 'Reporte de Notas' }} />
        </>
      )}

      {/* ── DOCENTE ─────────────────────────────────────────────────────── */}
      {isDocente && (
        <>
          <Drawer.Screen name="GestionAcademicaDocente" component={MisCursosDocenteScreen}
            options={{ title: 'Mis Cursos', drawerIcon: ({ color, size }) => <Ionicons name="school" size={size} color={color} /> }} />
          <Drawer.Screen name="Usuarios" component={UsuariosScreen}
            options={{ drawerItemStyle: { display: 'none' }, title: 'Estudiantes' }} />
          <Drawer.Screen name="Documentacion" component={DocumentacionScreen}
            options={{ title: 'Documentación', drawerIcon: ({ color, size }) => <Ionicons name="document-text" size={size} color={color} /> }} />
          <Drawer.Screen name="PerfilEstudiante" component={PerfilEstudianteScreen}
            options={{ drawerItemStyle: { display: 'none' }, title: 'Perfil Estudiante' }} />
          <Drawer.Screen name="NotasDocente" component={NotasDocenteScreen}
            options={{ drawerItemStyle: { display: 'none' }, title: 'Gestión de Notas' }} />
        </>
      )}

      {/* ── ESTUDIANTE ───────────────────────────────────────────────────── */}
      {isEstudiante && (
        <>
          <Drawer.Screen name="MisPensiones" component={MisPensionesScreen}
            options={{ title: 'Matrícula y Finanzas', drawerIcon: ({ color, size }) => <Ionicons name="cash" size={size} color={color} /> }} />
          <Drawer.Screen name="Certificados" component={DocumentacionScreen}
            options={{ title: 'Certificados', drawerIcon: ({ color, size }) => <Ionicons name="ribbon" size={size} color={color} /> }} />
          <Drawer.Screen name="Docentes" component={DocentesScreen}
            options={{ title: 'Docentes', drawerIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} /> }} />
          <Drawer.Screen name="MisNotas" component={MisNotasScreen}
            options={{ title: 'Mis Notas', drawerIcon: ({ color, size }) => <Ionicons name="stats-chart" size={size} color={color} /> }} />
        </>
      )}

      {/* ── PANTALLAS OCULTAS (siempre registradas, accesibles por navegación) ── */}
      <Drawer.Screen name="MiAsistencia" component={MiAsistenciaScreen}
        options={{ drawerItemStyle: { display: 'none' }, title: 'Mi Asistencia' }} />

      {/* ── PANTALLAS COMPARTIDAS (todos los roles) ────────────────────── */}
      <Drawer.Screen
        name="Calendario"
        component={CalendarioScreen}
        options={{
          title: 'Calendario',
          drawerIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="MiPerfil"
        component={MiPerfilScreen}
        options={{
          title: 'Mi Perfil',
          drawerIcon: ({ color, size }) => <Ionicons name="person-circle" size={size} color={color} />,
        }}
      />

    </Drawer.Navigator>
  );
};

export default MainNavigator;
