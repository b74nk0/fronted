// src/navigation/AppNavigator.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
import { ActivityIndicator, View } from 'react-native';
import { colors } from '../constants/theme';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      
      {/* 1. Flujo No Autenticado (Agrupado) */}
      {!isAuthenticated ? (
        <>
          {/* Auth (Login/Register) como pantalla principal de este flujo */}
          <Stack.Screen name="Auth" component={AuthNavigator} />
          
          {/* Pantallas públicas que se abren encima de Auth (modales o flujo externo) */}
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        </>
      ) : (
        // 2. Flujo Autenticado
        <Stack.Screen name="Main" component={MainNavigator} />
      )}

    </Stack.Navigator>
  );
};

export default AppNavigator;
