import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getTheme } from '../../../theme/theme';
import { useStreak } from '../../../contexts/StreakContext';

export const ProfileLeftHeader: React.FC = () => {
  const { themeMode } = useTheme();
  const theme = getTheme(themeMode);
  const { currentStreak } = useStreak();

  return (
    <View>
      {currentStreak > 0 && (
        <View style={[styles.streakContainer, { 
          backgroundColor: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
        }]}>
          <Text style={[styles.streakText, { color: theme.colors.text }]}>{currentStreak}</Text>
          <Text style={styles.streakEmoji}>🔥</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    justifyContent: 'center',
    marginLeft: getTheme('dark').spacing.md,
    marginBottom: getTheme('dark').spacing.sm,
  },
  streakText: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
  },
  streakEmoji: {
    fontSize: 16,
  },
});