import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getTheme } from '../../../theme/theme';
import Ionicons from '@expo/vector-icons/Ionicons';

interface ChatRightHeaderProps {
  themeMode: 'light' | 'dark';
  onOpenNewChat: () => void;
}

export const ChatRightHeader: React.FC<ChatRightHeaderProps> = ({ themeMode, onOpenNewChat }) => {
  const theme = getTheme(themeMode);

  return (
    <View style={{ marginRight: 16 }}>
      <TouchableOpacity 
        onPress={onOpenNewChat}
        style={{ padding: 8 }}
      >
        <Ionicons name="add" size={24} color={theme.colors.primary} />
      </TouchableOpacity>
    </View>
  );
}; 