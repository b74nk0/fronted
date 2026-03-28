const LinkingConfig = {
  prefixes: [
    'https://scolaris-liart.vercel.app',
    'http://localhost:8081',
    'scolaris://',
  ],
  config: {
    screens: {
      // Rutas públicas directas (en AppNavigator)
      ResetPassword: {
        path: 'reset-password',
        parse: {
          token: (token) => token,
        },
      },
      ForgotPassword: 'forgot-password',
      
      // Rutas anidadas (Dentro de AuthNavigator)
      Auth: {
        path: 'auth',
        screens: {
          Login: 'login',
          // Si tienes Register, va aquí dentro
          // Register: 'register',
        },
      },

      // Rutas autenticadas (Dentro de MainNavigator)
      Main: {
        path: 'main',
        screens: {
          Dashboard: '',
          Calendario: 'calendario',
          MiPerfil: 'perfil',
        },
      },
    },
  },
};

export default LinkingConfig;
