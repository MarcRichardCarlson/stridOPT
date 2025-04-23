import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  SafeAreaView,
  FlatList
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { getTheme } from '../theme/theme';
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import Ionicons from '@expo/vector-icons/Ionicons';

interface CreateChatModalProps {
  visible: boolean;
  onClose: () => void;
}

interface Friend {
  id: string;
  name: string;
  email: string;
}

export const CreateChatModal: React.FC<CreateChatModalProps> = ({ visible, onClose }) => {
  const { themeMode } = useTheme();
  const theme = getTheme(themeMode);
  const { user } = useAuth();
  const [chatName, setChatName] = useState('');
  const [error, setError] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    if (!user?.uid) return;
    
    try {
      const friendsRef = collection(db, 'users');
      const q = query(friendsRef, where('uid', '!=', user.uid));
      const querySnapshot = await getDocs(q);
      
      const friendsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().fullName || 'Anonymous',
        email: doc.data().email
      }));
      
      setFriends(friendsList);
    } catch (err) {
      console.error('Error loading friends:', err);
      setError('Failed to load friends');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFriend = (friendId: string) => {
    setSelectedFriends(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleCreateChat = async () => {
    if (!chatName.trim()) {
      setError('Please enter a chat name');
      return;
    }

    if (selectedFriends.length === 0) {
      setError('Please select at least one friend');
      return;
    }

    if (!user?.uid) {
      setError('You must be logged in to create a chat');
      return;
    }

    try {
      await addDoc(collection(db, 'chats'), {
        name: chatName.trim(),
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        members: [user.uid, ...selectedFriends],
        lastMessage: null,
        lastMessageTime: null,
        type: 'group'
      });
      setChatName('');
      setSelectedFriends([]);
      setError('');
      onClose();
    } catch (err) {
      console.error('Error creating chat:', err);
      setError('Failed to create chat. Please try again.');
    }
  };

  const renderFriendItem = ({ item }: { item: Friend }) => (
    <TouchableOpacity
      style={[
        styles.friendItem,
        { 
          backgroundColor: selectedFriends.includes(item.id) 
            ? theme.colors.primary + '20' 
            : theme.colors.surface 
        }
      ]}
      onPress={() => toggleFriend(item.id)}
    >
      <View style={styles.friendInfo}>
        <Text style={[styles.friendName, { color: theme.colors.text }]}>
          {item.name}
        </Text>
        <Text style={[styles.friendEmail, { color: theme.colors.textSecondary }]}>
          {item.email}
        </Text>
      </View>
      {selectedFriends.includes(item.id) && (
        <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.modalOverlayTouchable} />
        </TouchableWithoutFeedback>
        
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Create Group Chat</Text>
            
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text,
                  borderColor: error ? theme.colors.error : theme.colors.border
                }
              ]}
              placeholder="Enter group name"
              placeholderTextColor={theme.colors.textSecondary}
              value={chatName}
              onChangeText={(text) => {
                setChatName(text);
                setError('');
              }}
            />
            
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Select Friends
            </Text>
            
            <FlatList
              data={friends}
              renderItem={renderFriendItem}
              keyExtractor={item => item.id}
              style={styles.friendsList}
              contentContainerStyle={styles.friendsListContent}
            />
            
            {error ? (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {error}
              </Text>
            ) : null}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton, { borderColor: theme.colors.border }]}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={[styles.buttonText, { color: theme.colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.colors.primary }]}
                onPress={handleCreateChat}
                activeOpacity={0.7}
                disabled={!chatName.trim() || selectedFriends.length === 0}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={[styles.buttonText, { color: theme.colors.background }]}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 0 : 20,
  },
  keyboardAvoidingView: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flex: 1,
    paddingTop: 20,
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginTop: 40,
    maxHeight: '80%',
    transform: [{ translateY: 0 }],
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    alignSelf: 'flex-start',
    marginBottom: 12,
    marginTop: 16,
  },
  input: {
    width: '100%',
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  friendsList: {
    width: '100%',
    maxHeight: 200,
  },
  friendsListContent: {
    paddingBottom: 16,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
  },
  friendEmail: {
    fontSize: 14,
  },
  errorText: {
    width: '100%',
    textAlign: 'left',
    marginBottom: 16,
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
    gap: 12,
    marginTop: 20,
    zIndex: 1,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 1,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
}); 