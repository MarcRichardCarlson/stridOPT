import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { getTheme } from '../theme/theme';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Calendar } from '../components/Calendar';

interface ShortcutCardProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

const ShortcutCard: React.FC<ShortcutCardProps> = ({ title, icon, onPress }) => {
  const { themeMode } = useTheme();
  const theme = getTheme(themeMode);

  const cardShadow = themeMode === 'light' ? {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  } : {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  };

  return (
    <TouchableOpacity
      style={[
        styles.card, 
        { 
          backgroundColor: themeMode === 'light' ? '#FFFFFF' : theme.colors.surface,
          ...cardShadow
        }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[
        styles.iconContainer,
        { 
          backgroundColor: themeMode === 'light' 
            ? `${theme.colors.primary}10` 
            : 'rgba(255, 215, 0, 0.1)'
        }
      ]}>
        <Ionicons name={icon} size={32} color={theme.colors.primary} />
      </View>
      <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

const UpcomingUpdates = () => {
  const { themeMode } = useTheme();
  const theme = getTheme(themeMode);

  const updates = [
    { version: '1.1.0', features: ['Real-time chat notifications', 'Event reminders', 'Dark mode improvements'] },
    { version: '1.2.0', features: ['Calendar integration', 'Task categories', 'Profile customization'] },
  ];

  const cardShadow = themeMode === 'light' ? {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  } : {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  };

  return (
    <View style={[
      styles.updatesCard, 
      { 
        backgroundColor: themeMode === 'light' ? '#FFFFFF' : theme.colors.surface,
        ...cardShadow
      }
    ]}>
      <View style={styles.updatesHeader}>
        <Ionicons name="rocket" size={24} color={theme.colors.primary} />
        <Text style={[styles.updatesTitle, { color: theme.colors.text }]}>Upcoming Updates</Text>
      </View>
      
      {updates.map((update, index) => (
        <View key={index} style={styles.updateItem}>
          <Text style={[styles.versionText, { color: theme.colors.primary }]}>
            Version {update.version}
          </Text>
          {update.features.map((feature, featureIndex) => (
            <View key={featureIndex} style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color={theme.colors.primary} />
              <Text style={[styles.featureText, { color: theme.colors.text }]}>{feature}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
};

type RootStackParamList = {
  Todos: undefined;
  Chat: undefined;
  Events: { openAddModal?: boolean };
  Profile: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const HomeScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { themeMode } = useTheme();
  const theme = getTheme(themeMode);
  const [isCalendarFullScreen, setIsCalendarFullScreen] = useState(false);

  const shortcuts = [
    { 
      title: 'Add Todo', 
      icon: 'add-circle' as keyof typeof Ionicons.glyphMap, 
      action: () => navigation.navigate('Todos')
    },
    { 
      title: 'New Chat', 
      icon: 'chatbubble-ellipses' as keyof typeof Ionicons.glyphMap, 
      action: () => navigation.navigate('Chat')
    },
    { 
      title: 'Add Event', 
      icon: 'calendar' as keyof typeof Ionicons.glyphMap, 
      action: () => navigation.navigate('Events', { openAddModal: true })
    },
    { 
      title: 'Settings', 
      icon: 'settings' as keyof typeof Ionicons.glyphMap, 
      action: () => navigation.navigate('Profile')
    },
  ];

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >

      <Calendar 
        isFullScreen={isCalendarFullScreen}
        onToggleFullScreen={() => setIsCalendarFullScreen(!isCalendarFullScreen)}
      />

      <View style={styles.gridContainer}>
        {shortcuts.map((shortcut, index) => (
          <ShortcutCard
            key={index}
            title={shortcut.title}
            icon={shortcut.icon}
            onPress={shortcut.action}
          />
        ))}
      </View>

      <UpcomingUpdates />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: getTheme('dark').spacing.xl,
  },
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: getTheme('dark').spacing.sm,
    marginBottom: getTheme('dark').spacing.xl,
    marginTop: getTheme('dark').spacing.xl,
  },
  card: {
    width: '23%',
    aspectRatio: 1,
    borderRadius: getTheme('dark').borderRadius.lg,
    padding: getTheme('dark').spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    transform: [{ scale: 1 }],
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: getTheme('dark').spacing.xs,
  },
  cardTitle: {
    marginTop: getTheme('dark').spacing.xs,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  updatesCard: {
    borderRadius: getTheme('dark').borderRadius.lg,
    padding: getTheme('dark').spacing.md,
    borderWidth: 1,
  },
  updatesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getTheme('dark').spacing.md,
  },
  updatesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: getTheme('dark').spacing.sm,
  },
  updateItem: {
    marginBottom: getTheme('dark').spacing.md,
  },
  versionText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: getTheme('dark').spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getTheme('dark').spacing.xs,
  },
  featureText: {
    fontSize: 14,
    marginLeft: getTheme('dark').spacing.sm,
  },
}); 