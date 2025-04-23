import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { theme } from '../theme/theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const LandingScreen = () => {
  const navigation = useNavigation<NavigationProp>();

  const features = [
    {
      icon: 'calendar',
      title: 'Event Management',
      description: 'Organize your schedule with smart event tracking and reminders'
    },
    {
      icon: 'chatbubbles',
      title: 'Team Collaboration',
      description: 'Connect and collaborate with your team in real-time'
    },
    {
      icon: 'checkmark-circle',
      title: 'Task Tracking',
      description: 'Stay on top of your tasks with intuitive tracking tools'
    },
    {
      icon: 'flame',
      title: 'Event Streaks',
      description: 'Build and maintain streaks by attending your events consistently'
    }
  ];

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.logoContainer}>
        <View style={styles.logoWrapper}>
          <Ionicons name="rocket" size={80} color={theme.colors.primary} />
        </View>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Welcome to StridOPT
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Your personal productivity companion
        </Text>
      </View>

      <View style={styles.featuresContainer}>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name={feature.icon as keyof typeof Ionicons.glyphMap} size={32} color={theme.colors.text} />
            </View>
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, { color: theme.colors.text }]}>
                {feature.title}
              </Text>
              <Text style={[styles.featureDescription, { color: theme.colors.textSecondary }]}>
                {feature.description}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={[styles.buttonText, { color: theme.colors.background }]}>
            Get Started
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    padding: theme.spacing.xl,
    marginTop: 0,
  },
  logoWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    shadowColor: theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  featuresContainer: {
    padding: theme.spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  featureDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  buttonContainer: {
    padding: theme.spacing.xl,
  },
  button: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 