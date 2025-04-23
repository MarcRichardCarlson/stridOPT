import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../theme/theme';
import { sanitizeEmail, sanitizePassword, validateEmail, validatePasswordStrength, getPasswordRequirements } from '../utils/inputSanitizer';
import { Picker } from '@react-native-picker/picker';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const getDaysInMonth = (month: number, year: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear; i >= currentYear - 100; i--) {
    years.push(i);
  }
  return years;
};

export const RegisterScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [fullNameError, setFullNameError] = useState('');
  const [birthDateError, setBirthDateError] = useState('');
  
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const { signUp } = useAuth();

  const years = useMemo(() => getYears(), []);
  const days = useMemo(() => {
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }, [selectedMonth, selectedYear]);

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
      if (confirmPassword) {
        validateConfirmPasswordInput(confirmPassword);
      }
    }
  };

  const handleConfirmPasswordChange = (text: string) => {
    const sanitized = sanitizePassword(text);
    setConfirmPassword(sanitized);
    if (hasAttemptedSubmit) {
      validateConfirmPasswordInput(sanitized);
    }
  };

  const handleFullNameChange = (text: string) => {
    // Allow spaces and letters, remove other characters
    const sanitized = text.replace(/[^a-zA-Z\s]/g, '');
    setFullName(sanitized);
    if (hasAttemptedSubmit) {
      validateFullNameInput(sanitized);
    }
  };

  const handleDayChange = (day: number) => {
    setSelectedDay(day);
    if (hasAttemptedSubmit) {
      validateBirthDate();
    }
  };

  const handleMonthChange = (month: number) => {
    setSelectedMonth(month);
    // Adjust day if it's greater than days in new month
    const daysInMonth = getDaysInMonth(month, selectedYear);
    if (selectedDay > daysInMonth) {
      setSelectedDay(daysInMonth);
    }
    if (hasAttemptedSubmit) {
      validateBirthDate();
    }
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    // Adjust day if it's greater than days in new month
    const daysInMonth = getDaysInMonth(selectedMonth, year);
    if (selectedDay > daysInMonth) {
      setSelectedDay(daysInMonth);
    }
    if (hasAttemptedSubmit) {
      validateBirthDate();
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

  const validateConfirmPasswordInput = (confirmPasswordToValidate: string) => {
    if (!confirmPasswordToValidate) {
      setConfirmPasswordError('Please confirm your password');
      return false;
    }
    if (confirmPasswordToValidate !== password) {
      setConfirmPasswordError('Passwords do not match');
      return false;
    }
    setConfirmPasswordError('');
    return true;
  };

  const validateFullNameInput = (nameToValidate: string) => {
    if (!nameToValidate) {
      setFullNameError('Full name is required');
      return false;
    }
    if (nameToValidate.length < 2) {
      setFullNameError('Name must be at least 2 characters');
      return false;
    }
    setFullNameError('');
    return true;
  };

  const validateBirthDate = () => {
    const birthDate = new Date(selectedYear, selectedMonth, selectedDay);
    const today = new Date();
    const minAgeDate = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate());
    
    if (birthDate > minAgeDate) {
      setBirthDateError('You must be at least 13 years old');
      return false;
    }
    setBirthDateError('');
    return true;
  };

  const handleRegister = async () => {
    setHasAttemptedSubmit(true);
    
    const isEmailValid = validateEmailInput(email);
    const isPasswordValid = validatePasswordInput(password);
    const isConfirmPasswordValid = validateConfirmPasswordInput(confirmPassword);
    const isFullNameValid = validateFullNameInput(fullName);
    const isBirthDateValid = validateBirthDate();

    if (!isEmailValid || !isPasswordValid || !isConfirmPasswordValid || 
        !isFullNameValid || !isBirthDateValid) {
      return;
    }

    try {
      await signUp(email, password, fullName);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        setEmailError('This email is already in use');
      } else if (error.code === 'auth/weak-password') {
        setPasswordError(getPasswordRequirements());
      } else if (error.code === 'auth/too-many-requests') {
        Alert.alert('Error', 'Too many failed attempts. Please try again later.');
      } else {
        Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      }
    }
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={[styles.title, { color: theme.colors.text }]}>Create Account</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Sign up to get started</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            { 
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              borderColor: hasAttemptedSubmit && fullNameError ? theme.colors.error : theme.colors.border 
            }
          ]}
          placeholder="Full Name"
          placeholderTextColor={theme.colors.textSecondary}
          value={fullName}
          onChangeText={handleFullNameChange}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
        />
        {hasAttemptedSubmit && fullNameError ? (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {fullNameError}
          </Text>
        ) : null}

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

        <View style={styles.datePickerContainer}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={selectedMonth.toString()}
                onValueChange={(value) => handleMonthChange(parseInt(value))}
                style={[styles.picker, { color: theme.colors.text }]}
                itemStyle={styles.pickerItem}
              >
                {MONTHS.map((month, index) => (
                  <Picker.Item key={month} label={month} value={index.toString()} />
                ))}
              </Picker>
            </View>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={selectedDay.toString()}
                onValueChange={(value) => handleDayChange(parseInt(value))}
                style={[styles.picker, { color: theme.colors.text }]}
                itemStyle={styles.pickerItem}
              >
                {days.map(day => (
                  <Picker.Item key={day} label={day.toString()} value={day.toString()} />
                ))}
              </Picker>
            </View>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={selectedYear.toString()}
                onValueChange={(value) => handleYearChange(parseInt(value))}
                style={[styles.picker, { color: theme.colors.text }]}
                itemStyle={styles.pickerItem}
              >
                {years.map(year => (
                  <Picker.Item key={year} label={year.toString()} value={year.toString()} />
                ))}
              </Picker>
            </View>
          </View>
          {hasAttemptedSubmit && birthDateError ? (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {birthDateError}
            </Text>
          ) : null}
        </View>

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
          autoComplete="password-new"
          textContentType="newPassword"
        />
        {hasAttemptedSubmit && passwordError ? (
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
              borderColor: hasAttemptedSubmit && confirmPasswordError ? theme.colors.error : theme.colors.border 
            }
          ]}
          placeholder="Confirm Password"
          placeholderTextColor={theme.colors.textSecondary}
          value={confirmPassword}
          onChangeText={handleConfirmPasswordChange}
          secureTextEntry
          autoComplete="password-new"
          textContentType="newPassword"
        />
        {hasAttemptedSubmit && confirmPasswordError ? (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {confirmPasswordError}
          </Text>
        ) : null}
      </View>

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: theme.colors.primary }]} 
        onPress={handleRegister}
      >
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.linkButton}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={[styles.linkText, { color: theme.colors.primary }]}>
          Already have an account? Sign In
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.xl,
  },
  contentContainer: {
    flexGrow: 1,
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
  datePickerContainer: {
    marginBottom: theme.spacing.xs,
    marginTop: 8,
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: theme.borderRadius.md,
    height: 60,
  },
  pickerWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  picker: {
    height: 50,
    width: 130,
  },
  pickerItem: {
    fontSize: 16,
    color: theme.colors.text,
    height: 50,
    textAlign: 'center',
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
    marginBottom: theme.spacing.xl,
  },
  linkText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 