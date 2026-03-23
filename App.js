import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { Analytics } from "@vercel/analytics/next"

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Analytics>
          <StatusBar style="auto" />
        </Analytics>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}