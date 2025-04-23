import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { theme } from '../theme/theme';
import Ionicons from '@expo/vector-icons/Ionicons';

interface PrivacySectionProps {
  title: string;
  icon: string;
  color: string;
  children: React.ReactNode;
}

const PrivacySection: React.FC<PrivacySectionProps> = ({ title, icon, color, children }) => {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
};

interface PrivacyOptionProps {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

const PrivacyOption: React.FC<PrivacyOptionProps> = ({ title, description, value, onValueChange }) => {
  return (
    <View style={styles.option}>
      <View style={styles.optionText}>
        <Text style={[styles.optionTitle, { color: theme.colors.text }]}>{title}</Text>
        <Text style={[styles.optionDescription, { color: theme.colors.textSecondary }]}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
        thumbColor={value ? theme.colors.primary : theme.colors.textSecondary}
      />
    </View>
  );
};

export const PrivacyScreen = () => {
  const [dataCollection, setDataCollection] = useState({
    analytics: true,
    crashReports: true,
    usageData: false,
  });

  const [sharingPreferences, setSharingPreferences] = useState({
    profileVisibility: true,
    activityStatus: true,
    locationSharing: false,
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    biometricAuth: true,
    autoLock: true,
  });

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <PrivacySection title="Data Collection" icon="analytics" color="#4ECDC4">
        <PrivacyOption
          title="Analytics"
          description="Help us improve by sharing usage statistics"
          value={dataCollection.analytics}
          onValueChange={(value) => setDataCollection({ ...dataCollection, analytics: value })}
        />
        <PrivacyOption
          title="Crash Reports"
          description="Automatically send crash reports to help fix issues"
          value={dataCollection.crashReports}
          onValueChange={(value) => setDataCollection({ ...dataCollection, crashReports: value })}
        />
        <PrivacyOption
          title="Usage Data"
          description="Share detailed usage patterns for better features"
          value={dataCollection.usageData}
          onValueChange={(value) => setDataCollection({ ...dataCollection, usageData: value })}
        />
      </PrivacySection>

      <PrivacySection title="Sharing Preferences" icon="share-social" color="#FF6B6B">
        <PrivacyOption
          title="Profile Visibility"
          description="Allow others to view your profile"
          value={sharingPreferences.profileVisibility}
          onValueChange={(value) => setSharingPreferences({ ...sharingPreferences, profileVisibility: value })}
        />
        <PrivacyOption
          title="Activity Status"
          description="Show when you're active on the app"
          value={sharingPreferences.activityStatus}
          onValueChange={(value) => setSharingPreferences({ ...sharingPreferences, activityStatus: value })}
        />
        <PrivacyOption
          title="Location Sharing"
          description="Share your location with friends"
          value={sharingPreferences.locationSharing}
          onValueChange={(value) => setSharingPreferences({ ...sharingPreferences, locationSharing: value })}
        />
      </PrivacySection>

      <PrivacySection title="Security" icon="shield" color="#45B7D1">
        <PrivacyOption
          title="Two-Factor Authentication"
          description="Add an extra layer of security to your account"
          value={securitySettings.twoFactorAuth}
          onValueChange={(value) => setSecuritySettings({ ...securitySettings, twoFactorAuth: value })}
        />
        <PrivacyOption
          title="Biometric Authentication"
          description="Use fingerprint or face ID to log in"
          value={securitySettings.biometricAuth}
          onValueChange={(value) => setSecuritySettings({ ...securitySettings, biometricAuth: value })}
        />
        <PrivacyOption
          title="Auto-Lock"
          description="Lock the app after a period of inactivity"
          value={securitySettings.autoLock}
          onValueChange={(value) => setSecuritySettings({ ...securitySettings, autoLock: value })}
        />
      </PrivacySection>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
          Last updated: {new Date().toLocaleDateString()}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: theme.spacing.md,
  },
  section: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  optionText: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
  },
  footer: {
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
  },
}); 