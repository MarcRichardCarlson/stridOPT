import React, { useCallback } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { getTheme } from '../../../../src/theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { useEvents } from '../../../contexts/EventsContext';

interface EventLeftHeaderProps {
  themeMode: 'light' | 'dark';
}

export const EventLeftHeader: React.FC<EventLeftHeaderProps> = React.memo(({ themeMode }) => {
  const { isEditMode, toggleEditMode } = useEvents();

  const buttonStyle = [
    styles.editButton, 
    { 
      borderRadius: 8,
    }
  ];

  const iconColor = themeMode === 'dark' ? '#FFFFFF' : '#000000';

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={toggleEditMode}
    >
      <Ionicons 
        name={isEditMode ? "close" : "create-outline"} 
        size={35} 
        color={iconColor} 
      />
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  editButton: {
    width: 35,
    height: 35,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: getTheme('dark').spacing.md,
    marginBottom: getTheme('dark').spacing.sm,
  },
});