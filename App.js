import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import LinkingConfig from './src/navigation/LinkingConfig';

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer linking={LinkingConfig}>
          <StatusBar style="auto" />
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}