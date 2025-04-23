import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { getTheme } from '../theme/theme';
import { useEvents } from '../contexts/EventsContext';
import { useNavigation } from '@react-navigation/native';
import { EventVisibility } from '../types/event';
import { Picker } from '@react-native-picker/picker';

export const CreateEventScreen = () => {
  const { themeMode } = useTheme();
  const theme = getTheme(themeMode);
  const { addEvent } = useEvents();
  const navigation = useNavigation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [visibility, setVisibility] = useState<EventVisibility>('public');

  const handleSubmit = async () => {
    try {
      await addEvent({
        title,
        description,
        startTime,
        endTime,
        location,
        visibility
      });
      navigation.goBack();
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.form}>
        <Text style={[styles.label, { color: theme.colors.text }]}>Title</Text>
        <TextInput
          style={[styles.input, { 
            backgroundColor: theme.colors.surface,
            color: theme.colors.text,
            borderColor: theme.colors.border
          }]}
          value={title}
          onChangeText={setTitle}
          placeholder="Event title"
          placeholderTextColor={theme.colors.textSecondary}
        />

        <Text style={[styles.label, { color: theme.colors.text }]}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea, { 
            backgroundColor: theme.colors.surface,
            color: theme.colors.text,
            borderColor: theme.colors.border
          }]}
          value={description}
          onChangeText={setDescription}
          placeholder="Event description"
          placeholderTextColor={theme.colors.textSecondary}
          multiline
        />

        <Text style={[styles.label, { color: theme.colors.text }]}>Start Time</Text>
        <TextInput
          style={[styles.input, { 
            backgroundColor: theme.colors.surface,
            color: theme.colors.text,
            borderColor: theme.colors.border
          }]}
          value={startTime}
          onChangeText={setStartTime}
          placeholder="YYYY-MM-DD HH:MM"
          placeholderTextColor={theme.colors.textSecondary}
        />

        <Text style={[styles.label, { color: theme.colors.text }]}>End Time</Text>
        <TextInput
          style={[styles.input, { 
            backgroundColor: theme.colors.surface,
            color: theme.colors.text,
            borderColor: theme.colors.border
          }]}
          value={endTime}
          onChangeText={setEndTime}
          placeholder="YYYY-MM-DD HH:MM"
          placeholderTextColor={theme.colors.textSecondary}
        />

        <Text style={[styles.label, { color: theme.colors.text }]}>Location</Text>
        <TextInput
          style={[styles.input, { 
            backgroundColor: theme.colors.surface,
            color: theme.colors.text,
            borderColor: theme.colors.border
          }]}
          value={location}
          onChangeText={setLocation}
          placeholder="Event location"
          placeholderTextColor={theme.colors.textSecondary}
        />

        <Text style={[styles.label, { color: theme.colors.text }]}>Visibility</Text>
        <View style={[styles.pickerContainer, { 
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border
        }]}>
          <Picker
            selectedValue={visibility}
            onValueChange={(value) => setVisibility(value as EventVisibility)}
            style={{ color: theme.colors.text }}
          >
            <Picker.Item label="Public" value="public" />
            <Picker.Item label="Friends Only" value="friends" />
            <Picker.Item label="Private" value="private" />
          </Picker>
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={handleSubmit}
        >
          <Text style={styles.buttonText}>Create Event</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  pickerContainer: {
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  button: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
}); 