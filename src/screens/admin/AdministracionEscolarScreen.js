import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const AdministracionEscolarScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Administración Escolar - En desarrollo</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 18,
    color: '#64748b',
  },
});

export default AdministracionEscolarScreen;