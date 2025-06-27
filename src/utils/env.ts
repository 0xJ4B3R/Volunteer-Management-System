export const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = import.meta.env[key];
  
  if (!value && defaultValue === undefined) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  
  return value || defaultValue || '';
};

export const isDevelopment = (): boolean => {
  return import.meta.env.DEV;
};

export const isProduction = (): boolean => {
  return import.meta.env.PROD;
};

export const getApiUrl = (): string => {
  return getEnvVar('VITE_API_URL', 'http://localhost:3000/api');
};

export const getAppName = (): string => {
  return getEnvVar('VITE_APP_NAME', 'Volunteer Management System');
};

export const getAppVersion = (): string => {
  return getEnvVar('VITE_APP_VERSION', '1.0.0');
}; 