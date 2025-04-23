import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { getTheme } from '../../../theme/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useEvents } from '../../../contexts/EventsContext';

interface EventRightHeaderProps {
  themeMode: 'light' | 'dark';
}

export const EventRightHeader: React.FC<EventRightHeaderProps> = ({ themeMode }) => {
  const theme = getTheme(themeMode);
  const { setIsAddModalVisible } = useEvents();

  return (
    <TouchableOpacity
      style={[styles.addButton, { backgroundColor: themeMode === 'dark' ? '#FFFFFF' : '#000000' }]}
      onPress={() => setIsAddModalVisible(true)}
    >
      <Ionicons name="add" size={24} color={theme.colors.background} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  addButton: {
    width: 35,
    height: 35,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: getTheme('dark').spacing.md,
    marginBottom: getTheme('dark').spacing.sm,
  },
});