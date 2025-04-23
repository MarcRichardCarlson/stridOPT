import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { getTheme } from '../../../theme/theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../../App';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ProfileRightHeader: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { themeMode } = useTheme();
  const theme = getTheme(themeMode);

  return (
    <View style={styles.headerRight}>
      <TouchableOpacity
        style={styles.headerFriendsButton}
        onPress={() => navigation.navigate('Friends')}
      >
        <Ionicons name="people-outline" size={24} color={theme.colors.primary} />
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.headerSettingsButton}
        onPress={() => navigation.navigate('Settings')}
      >
        <Ionicons name="settings-outline" size={24} color={theme.colors.primary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerFriendsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: getTheme('dark').spacing.md,
    marginBottom: getTheme('dark').spacing.sm,
  },
  headerSettingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: getTheme('dark').spacing.md,
    marginBottom: getTheme('dark').spacing.sm,
  },
});