// Frontend configuration
const config = {
  // API Configuration
  api: {
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
    timeout: 10000,
  },
  
  // App Configuration
  app: {
    name: 'Trading Journal',
    version: '1.0.0',
  },
  
  // Feature Flags
  features: {
    enableDebugMode: import.meta.env.VITE_DEBUG_MODE === 'true',
    enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  }
};

export default config;
