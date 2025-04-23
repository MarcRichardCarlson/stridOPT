import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../theme/theme';
import { sanitizeEmail, sanitizePassword, validateEmail, validatePasswordStrength, getPasswordRequirements } from '../utils/inputSanitizer';

export const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const { signIn } = useAuth();

  const handleEmailChange = (text: string) => {
    const sanitized = sanitizeEmail(text);
    setEmail(sanitized);
    if (hasAttemptedSubmit) {
      validateEmailInput(sanitized);
    }
  };

  const handlePasswordChange = (text: string) => {
    const sanitized = sanitizePassword(text);
    setPassword(sanitized);
    if (hasAttemptedSubmit) {
      validatePasswordInput(sanitized);
    }
  };

  const validateEmailInput = (emailToValidate: string) => {
    if (!emailToValidate) {
      setEmailError('Email is required');
      return false;
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
      setPasswordError('Password is required');
      return false;
    }
    if (!validatePasswordStrength(passwordToValidate)) {
      setPasswordError(getPasswordRequirements());
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleLogin = async () => {
    setHasAttemptedSubmit(true);
    
    const isEmailValid = validateEmailInput(email);
    const isPasswordValid = validatePasswordInput(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    try {
      await signIn(email, password);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        setEmailError('No account found with this email');
      } else if (error.code === 'auth/wrong-password') {
        setPasswordError('Incorrect password');
      } else if (error.code === 'auth/too-many-requests') {
        Alert.alert('Error', 'Too many failed attempts. Please try again later.');
      } else {
        Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Welcome Back</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Sign in to continue</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            { 
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              borderColor: hasAttemptedSubmit && emailError ? theme.colors.error : theme.colors.border 
            }
          ]}
          placeholder="Email"
          placeholderTextColor={theme.colors.textSecondary}
          value={email}
          onChangeText={handleEmailChange}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
        />
        {hasAttemptedSubmit && emailError ? (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {emailError}
          </Text>
        ) : null}

        <TextInput
          style={[
            styles.input,
            { 
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              borderColor: hasAttemptedSubmit && passwordError ? theme.colors.error : theme.colors.border 
            }
          ]}
          placeholder="Password"
          placeholderTextColor={theme.colors.textSecondary}
          value={password}
          onChangeText={handlePasswordChange}
          secureTextEntry
          autoComplete="password"
          textContentType="password"
        />
        {hasAttemptedSubmit && passwordError ? (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {passwordError}
          </Text>
        ) : null}
      </View>

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: theme.colors.primary }]} 
        onPress={handleLogin}
      >
        <Text style={styles.buttonText}>Sign In</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.linkButton}
        onPress={() => navigation.navigate('Register')}
      >
        <Text style={[styles.linkText, { color: theme.colors.primary }]}>
          Don't have an account? Sign Up
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.xl,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: theme.spacing.xl,
  },
  inputContainer: {
    marginBottom: theme.spacing.xl,
  },
  input: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.xs,
    fontSize: 16,
    borderWidth: 1,
    marginTop: 8,
  },
  errorText: {
    fontSize: 12,
    marginBottom: theme.spacing.md,
    marginLeft: theme.spacing.xs,
  },
  button: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  linkButton: {
    alignItems: 'center',
  },
  linkText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 