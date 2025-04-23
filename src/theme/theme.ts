export const lightTheme = {
  colors: {
    primary: '#007AFF',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    text: '#000000',
    textSecondary: '#666666',
    border: '#E0E0E0',
    error: '#FF3B30',
    success: '#34C759',
    warning: '#FF9500',
    info: '#5856D6',
    accent: '#FF2D55',
    white: '#FFFFFF',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 16,
    xl: 24,
  },
};

export const darkTheme = {
  colors: {
    primary: '#007AFF',
    background: '#121212',
    surface: '#1E1E1E',
    text: '#FFFFFF',
    textSecondary: '#B3B3B3',
    border: '#2C2C2C',
    error: '#FF3B30',
    success: '#34C759',
    warning: '#FF9500',
    info: '#5856D6',
    accent: '#FF2D55',
    white: '#FFFFFF',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 16,
    xl: 24,
  },
};

export const getTheme = (mode: 'light' | 'dark') => {
  return mode === 'light' ? lightTheme : darkTheme;
};

// Export dark theme as default for static styles
export const theme = darkTheme; 