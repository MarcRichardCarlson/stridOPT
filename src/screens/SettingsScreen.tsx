import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { getTheme } from '../theme/theme';
import { useAuth } from '../contexts/AuthContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Privacy: undefined;
  Appearance: undefined;
  Account: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface SettingButtonProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
}

const SettingButton: React.FC<SettingButtonProps> = ({ title, icon, color, onPress }) => {
  const { themeMode } = useTheme();
  const theme = getTheme(themeMode);
  
  return (
    <TouchableOpacity
      style={[styles.settingButton, { 
        backgroundColor: theme.colors.surface,
        shadowColor: themeMode === 'light' ? '#000' : 'transparent',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
      }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingButtonContent}>
        <View style={styles.settingButtonLeft}>
          <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
            <Ionicons name={icon} size={24} color={color} />
          </View>
          <Text style={[styles.settingButtonText, { color: theme.colors.text }]}>
            {title}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color={theme.colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );
};

export const SettingsScreen = () => {
  const { signOut } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const { themeMode } = useTheme();
  const theme = getTheme(themeMode);

  const settings: { title: string; icon: keyof typeof Ionicons.glyphMap; color: string; onPress: () => void }[] = [
    { title: 'Account', icon: 'person-circle', color: '#FF6B6B', onPress: () => navigation.navigate('Account') },
    { title: 'Notifications', icon: 'notifications', color: '#4ECDC4', onPress: () => {} },
    { title: 'Privacy', icon: 'shield', color: '#45B7D1', onPress: () => navigation.navigate('Privacy') },
    { title: 'Appearance', icon: 'color-palette', color: '#96CEB4', onPress: () => navigation.navigate('Appearance') },
    { title: 'Help & Support', icon: 'help-circle', color: '#FFEEAD', onPress: () => {} },
    { title: 'About', icon: 'information-circle', color: '#D4A5A5', onPress: () => {} },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.settingsList}>
        {settings.map((setting, index) => (
          <SettingButton
            key={index}
            title={setting.title}
            icon={setting.icon}
            color={setting.color}
            onPress={setting.onPress}
          />
        ))}
      </View>

      <TouchableOpacity 
        style={[styles.logoutButton, { 
          backgroundColor: theme.colors.background,
          borderWidth: 1,
          borderColor: theme.colors.error,
          shadowColor: themeMode === 'light' ? '#000' : 'transparent',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 2,
        }]}
        onPress={signOut}
      >
        <View style={styles.logoutButtonContent}>
          <View style={styles.logoutButtonLeft}>
            <View style={[styles.iconContainer, { backgroundColor: `${theme.colors.error}10` }]}>
              <Ionicons name="log-out" size={24} color={theme.colors.error} />
            </View>
            <Text style={[styles.logoutButtonText, { color: theme.colors.error }]}>Sign Out</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={theme.colors.textSecondary} />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: getTheme('dark').spacing.md,
  },
  settingsList: {
    padding: getTheme('dark').spacing.md,
  },
  settingButton: {
    borderRadius: getTheme('dark').borderRadius.md,
    marginBottom: getTheme('dark').spacing.sm,
  },
  settingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: getTheme('dark').spacing.md,
  },
  settingButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingButtonText: {
    fontSize: 16,
    marginLeft: getTheme('dark').spacing.md,
  },
  logoutButton: {
    margin: getTheme('dark').spacing.md,
    borderRadius: getTheme('dark').borderRadius.md,
  },
  logoutButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: getTheme('dark').spacing.md,
  },
  logoutButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 16,
    marginLeft: getTheme('dark').spacing.md,
    fontWeight: '500',
  },
} as const); 