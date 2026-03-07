import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

const CustomDrawerContent = (props) => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    // Confirmación para web y móvil
    const confirmMessage = '¿Estás seguro que deseas cerrar sesión?';
    
    let confirmed = false;
    if (Platform.OS === 'web') {
      confirmed = window.confirm(confirmMessage);
    } else {
      // Para móvil podrías usar una librería de modales o Alert nativo
      confirmed = true; // Por ahora directo en móvil
    }

    if (confirmed) {
      console.log('Cerrando sesión...');
      await logout();
      console.log('Sesión cerrada exitosamente');
    }
  };

  return (
    <View style={styles.container}>
      <DrawerContentScrollView {...props} contentContainerStyle={styles.scrollView}>
        {/* Header del Drawer */}
        <View style={styles.header}>
          <Image
            source={require('../../../assets/images/aulalink-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person-circle" size={50} color="#0ea5e9" />
            </View>
            <Text style={styles.userName}>{user?.nombre || user?.email}</Text>
            <Text style={styles.userRole}>
              {user?.roles?.[0] || 'Usuario'}
            </Text>
          </View>
        </View>

        {/* Items del menú */}
        <View style={styles.menuItems}>
          <DrawerItemList {...props} />
        </View>
      </DrawerContentScrollView>

      {/* Footer con botón de logout */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>

        <View style={styles.footerInfo}>
          <Text style={styles.footerText}>© 2025 Shiro Soluciones</Text>
          <Text style={styles.footerVersion}>v1.0.0</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    paddingTop: 0,
  },
  header: {
    backgroundColor: '#0284c7',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  logo: {
    width: 120,
    height: 40,
    marginBottom: 20,
  },
  userInfo: {
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 10,
  },
  userName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userRole: {
    color: '#bae6fd',
    fontSize: 14,
  },
  menuItems: {
    paddingTop: 10,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    padding: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    marginBottom: 16,
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  footerInfo: {
    alignItems: 'center',
  },
  footerText: {
    color: '#64748b',
    fontSize: 12,
    marginBottom: 4,
  },
  footerVersion: {
    color: '#94a3b8',
    fontSize: 11,
  },
});

export default CustomDrawerContent;