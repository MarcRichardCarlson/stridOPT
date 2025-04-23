import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Modal, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { getTheme } from '../../../theme/theme';
import { useNotifications } from '../../../contexts/NotificationContext';
import { RootStackParamList } from '../../../../App';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const HomeRightHeader: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const { themeMode } = useTheme();
  const theme = getTheme(themeMode);
  const { unreadCount, notifications } = useNotifications();

  return (
    <View style={styles.headerButtons}>
      <TouchableOpacity
        style={styles.notificationButton}
        onPress={() => setModalVisible(!modalVisible)}
      >
        <Ionicons name="notifications-outline" size={24} color={theme.colors.text} />
        {unreadCount > 0 && (
          <View style={[styles.notificationBadge, { backgroundColor: theme.colors.error }]}>
            <Text style={styles.notificationCount}>{unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        animationType="none"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Notifications</Text>
            </View>
            {notifications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                  Nothing happening right now ❤️
                </Text>
              </View>
            ) : (
              <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={[styles.notificationItem, { borderBottomColor: theme.colors.border }]}>
                    <Text style={[styles.notificationText, { color: theme.colors.text }]}>
                      {item.message}
                    </Text>
                    <Text style={[styles.notificationTime, { color: theme.colors.textSecondary }]}>
                      {new Date(item.createdAt).toLocaleTimeString()}
                    </Text>
                  </View>
                )}
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    padding: 8,
    marginRight: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
  },
  modalContainer: {
    position: 'absolute',
    top: 120,
    right: 10,
    width: 300,
    maxHeight: 400,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  modalHeader: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  notificationItem: {
    padding: 15,
    borderBottomWidth: 1,
  },
  notificationText: {
    fontSize: 14,
    marginBottom: 5,
  },
  notificationTime: {
    fontSize: 12,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});