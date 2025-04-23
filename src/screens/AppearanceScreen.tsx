import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { getTheme } from '../theme/theme';
import { useTheme } from '../contexts/ThemeContext';
import Ionicons from '@expo/vector-icons/Ionicons';

interface AppearanceSectionProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  children: React.ReactNode;
}

const AppearanceSection: React.FC<AppearanceSectionProps> = ({ title, icon, color, children }) => {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <Text style={[styles.sectionTitle, { color: getTheme('dark').colors.text }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
};

interface AppearanceOptionProps {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

const AppearanceOption: React.FC<AppearanceOptionProps> = ({ title, description, value, onValueChange }) => {
  const { themeMode } = useTheme();
  const theme = getTheme(themeMode);
  
  return (
    <View style={styles.option}>
      <View style={styles.optionText}>
        <Text style={[styles.optionTitle, { color: theme.colors.text }]}>{title}</Text>
        <Text style={[styles.optionDescription, { color: theme.colors.textSecondary }]}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ 
          false: themeMode === 'dark' ? '#2C2C2C' : theme.colors.border, 
          true: themeMode === 'dark' ? '#007AFF' : theme.colors.primary 
        }}
        thumbColor={value ? (themeMode === 'dark' ? '#FFFFFF' : theme.colors.primary) : theme.colors.textSecondary}
      />
    </View>
  );
};

export const AppearanceScreen = () => {
  const { themeMode, toggleTheme } = useTheme();
  const theme = getTheme(themeMode);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AppearanceSection title="Theme" icon="color-palette" color="#96CEB4">
        <AppearanceOption
          title="Dark Mode"
          description="Switch between light and dark theme"
          value={themeMode === 'dark'}
          onValueChange={toggleTheme}
        />
      </AppearanceSection>

      <AppearanceSection title="Information" icon="information-circle" color="#D4A5A5">
        <View style={styles.infoContainer}>
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            StridOPT uses a carefully designed color scheme to ensure optimal readability and visual comfort.
            The app automatically adapts to your system preferences but you can also manually switch between
            light and dark themes.
          </Text>
          <Text style={[styles.infoText, { color: theme.colors.textSecondary, marginTop: theme.spacing.md }]}>
            Dark theme is recommended for low-light environments and can help reduce eye strain.
          </Text>
        </View>
      </AppearanceSection>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: getTheme('dark').spacing.xl,
    padding: getTheme('dark').spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getTheme('dark').spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: getTheme('dark').spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: getTheme('dark').spacing.md,
    backgroundColor: getTheme('dark').colors.surface,
    borderRadius: getTheme('dark').borderRadius.md,
    marginBottom: getTheme('dark').spacing.sm,
  },
  optionText: {
    flex: 1,
    marginRight: getTheme('dark').spacing.md,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: getTheme('dark').spacing.xs,
  },
  optionDescription: {
    fontSize: 14,
  },
  infoContainer: {
    padding: getTheme('dark').spacing.md,
    backgroundColor: getTheme('dark').colors.surface,
    borderRadius: getTheme('dark').borderRadius.md,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
}); 