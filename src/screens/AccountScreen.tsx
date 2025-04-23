import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, ScrollView, Modal } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getTheme } from '../theme/theme';
import { sanitizeEmail, sanitizePassword, validateEmail, validatePasswordStrength, getPasswordRequirements } from '../utils/inputSanitizer';
import { updateEmail, updatePassword, updateProfile } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { auth } from '../config/firebase';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ColorPicker from 'react-native-wheel-color-picker';
import { generateColorFromString } from '../utils/colorUtils';

type RootStackParamList = {
  Main: {
    screen: string;
  };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const AccountScreen = () => {
  const { user, signOut, setUser } = useAuth();
  const { themeMode } = useTheme();
  const theme = getTheme(themeMode);
  const navigation = useNavigation<NavigationProp>();

  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [profileColor, setProfileColor] = useState('');
  const [isColorPickerVisible, setIsColorPickerVisible] = useState(false);

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [fullNameError, setFullNameError] = useState('');

  useEffect(() => {
    loadProfileColor();
  }, []);

  const loadProfileColor = async () => {
    if (!user?.uid) return;
    
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      if (userData.profileColor) {
        setProfileColor(userData.profileColor);
      } else {
        // Generate initial color if none exists
        const initialColor = generateColorFromString(user.fullName || user.email || user.uid, themeMode === 'dark');
        setProfileColor(initialColor);
        // Save the initial color
        await updateDoc(doc(db, 'users', user.uid), {
          profileColor: initialColor
        });
      }
    }
  };

  const handleColorSelect = async (color: string) => {
    if (!user?.uid) return;
    
    try {
      setProfileColor(color);
      // Don't close the modal here, let the user click Done
    } catch (error) {
      console.error('Error updating profile color:', error);
      Alert.alert('Error', 'Failed to update profile color. Please try again.');
    }
  };

  const handleColorSave = async () => {
    if (!user?.uid) return;
    
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        profileColor: profileColor
      });
      setIsColorPickerVisible(false);
      // Navigate to Profile screen
      navigation.navigate('Main', { screen: 'Profile' });
    } catch (error) {
      console.error('Error updating profile color:', error);
      Alert.alert('Error', 'Failed to update profile color. Please try again.');
    }
  };

  const handleEmailChange = (text: string) => {
    const sanitized = sanitizeEmail(text);
    setNewEmail(sanitized);
    validateEmailInput(sanitized);
  };

  const handlePasswordChange = (text: string) => {
    const sanitized = sanitizePassword(text);
    setNewPassword(sanitized);
    validatePasswordInput(sanitized);
    if (confirmNewPassword) {
      validateConfirmPasswordInput(confirmNewPassword);
    }
  };

  const handleConfirmPasswordChange = (text: string) => {
    const sanitized = sanitizePassword(text);
    setConfirmNewPassword(sanitized);
    validateConfirmPasswordInput(sanitized);
  };

  const handleFullNameChange = (text: string) => {
    const sanitized = text.replace(/[^a-zA-Z\s]/g, '');
    setNewFullName(sanitized);
    validateFullNameInput(sanitized);
  };

  const validateEmailInput = (emailToValidate: string) => {
    if (!emailToValidate) {
      setEmailError('');
      return true;
    }
    if (!validateEmail(emailToValidate)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePasswordInput = (passwordToValidate: string) => {
    if (!passwordToValidate) {
      setPasswordError('');
      return true;
    }
    if (!validatePasswordStrength(passwordToValidate)) {
      setPasswordError(getPasswordRequirements());
      return false;
    }
    setPasswordError('');
    return true;
  };

  const validateConfirmPasswordInput = (confirmPasswordToValidate: string) => {
    if (!confirmPasswordToValidate) {
      setConfirmPasswordError('');
      return true;
    }
    if (confirmPasswordToValidate !== newPassword) {
      setConfirmPasswordError('Passwords do not match');
      return false;
    }
    setConfirmPasswordError('');
    return true;
  };

  const validateFullNameInput = (nameToValidate: string) => {
    if (!nameToValidate) {
      setFullNameError('');
      return true;
    }
    if (nameToValidate.length < 2) {
      setFullNameError('Name must be at least 2 characters');
      return false;
    }
    setFullNameError('');
    return true;
  };

  const handleUpdateEmail = async () => {
    if (!newEmail || !validateEmailInput(newEmail)) return;
    
    try {
      if (auth.currentUser) {
        await updateEmail(auth.currentUser, newEmail);
        const userDoc = doc(db, 'users', user?.uid || '');
        await updateDoc(userDoc, { email: newEmail });
        Alert.alert('Success', 'Email updated successfully');
        setNewEmail('');
      }
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        Alert.alert('Error', 'Please sign in again to update your email');
        signOut();
      } else {
        Alert.alert('Error', 'Failed to update email. Please try again.');
      }
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmNewPassword || 
        !validatePasswordInput(newPassword) || 
        !validateConfirmPasswordInput(confirmNewPassword)) return;
    
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        Alert.alert('Success', 'Password updated successfully');
        setNewPassword('');
        setConfirmNewPassword('');
      }
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        Alert.alert('Error', 'Please sign in again to update your password');
        signOut();
      } else {
        Alert.alert('Error', 'Failed to update password. Please try again.');
      }
    }
  };

  const handleUpdateFullName = async () => {
    if (!newFullName || !validateFullNameInput(newFullName)) return;
    
    try {
      if (auth.currentUser) {
        // Update Firebase Auth profile
        await updateProfile(auth.currentUser, { displayName: newFullName });
        
        // Update Firestore
        const userDoc = doc(db, 'users', user?.uid || '');
        await updateDoc(userDoc, { 
          fullName: newFullName,
          updatedAt: new Date().toISOString()
        });
        
        // Update local state
        setUser({
          uid: user?.uid || '',
          email: user?.email || '',
          fullName: newFullName,
          profileImage: user?.profileImage || '',
          createdAt: user?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        
        // Navigate to profile screen
        navigation.navigate('Main', { screen: 'Profile' });
        setNewFullName('');
      }
    } catch (error) {
      console.error('Error updating name:', error);
      Alert.alert('Error', 'Failed to update name. Please try again.');
    }
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={[styles.title, { color: theme.colors.text }]}>Account Settings</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Update your account information</Text>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Profile Color</Text>
        <View style={styles.colorPreviewContainer}>
          <View 
            style={[
              styles.colorPreview, 
              { backgroundColor: profileColor }
            ]} 
          />
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
            onPress={() => setIsColorPickerVisible(true)}
          >
            <Text style={styles.buttonText}>Change Color</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Update Email</Text>
        <TextInput
          style={[
            styles.input,
            { 
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              borderColor: emailError ? theme.colors.error : theme.colors.border 
            }
          ]}
          placeholder="New Email"
          placeholderTextColor={theme.colors.textSecondary}
          value={newEmail}
          onChangeText={handleEmailChange}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
        />
        {emailError ? (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {emailError}
          </Text>
        ) : null}
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={handleUpdateEmail}
        >
          <Text style={styles.buttonText}>Update Email</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Update Password</Text>
        <TextInput
          style={[
            styles.input,
            { 
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              borderColor: passwordError ? theme.colors.error : theme.colors.border 
            }
          ]}
          placeholder="New Password"
          placeholderTextColor={theme.colors.textSecondary}
          value={newPassword}
          onChangeText={handlePasswordChange}
          secureTextEntry
          autoComplete="password-new"
          textContentType="newPassword"
        />
        {passwordError ? (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {passwordError}
          </Text>
        ) : null}
        <TextInput
          style={[
            styles.input,
            { 
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              borderColor: confirmPasswordError ? theme.colors.error : theme.colors.border 
            }
          ]}
          placeholder="Confirm New Password"
          placeholderTextColor={theme.colors.textSecondary}
          value={confirmNewPassword}
          onChangeText={handleConfirmPasswordChange}
          secureTextEntry
          autoComplete="password-new"
          textContentType="newPassword"
        />
        {confirmPasswordError ? (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {confirmPasswordError}
          </Text>
        ) : null}
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={handleUpdatePassword}
        >
          <Text style={styles.buttonText}>Update Password</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Update Name</Text>
        <TextInput
          style={[
            styles.input,
            { 
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              borderColor: fullNameError ? theme.colors.error : theme.colors.border 
            }
          ]}
          placeholder="New Full Name"
          placeholderTextColor={theme.colors.textSecondary}
          value={newFullName}
          onChangeText={handleFullNameChange}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
        />
        {fullNameError ? (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {fullNameError}
          </Text>
        ) : null}
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={handleUpdateFullName}
        >
          <Text style={styles.buttonText}>Update Name</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={isColorPickerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsColorPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Select Profile Color</Text>
              <TouchableOpacity
                onPress={() => setIsColorPickerVisible(false)}
                style={styles.closeButton}
              >
                <Text style={[styles.closeButtonText, { color: theme.colors.text }]}>×</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.colorPickerContainer}>
              <ColorPicker
                color={profileColor}
                onColorChange={handleColorSelect}
                onColorChangeComplete={handleColorSelect}
                thumbSize={30}
                sliderSize={30}
                noSnap={true}
                row={false}
              />
            </View>
            <TouchableOpacity
              style={[styles.doneButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleColorSave}
            >
              <Text style={[styles.doneButtonText, { color: theme.colors.background }]}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  input: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    fontSize: 16,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 4,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  colorPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  colorPreview: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    borderRadius: 10,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  colorPickerContainer: {
    width: '100%',
    height: 300,
    marginBottom: 20,
  },
  doneButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 