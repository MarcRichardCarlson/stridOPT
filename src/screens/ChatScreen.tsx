import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Linking,
  Modal,
  ScrollView,
} from 'react-native';
import { getTheme, theme } from '../theme/theme';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore, collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, getDoc, DocumentData, QueryDocumentSnapshot, DocumentReference, QuerySnapshot, DocumentSnapshot, Firestore, getFirestore as getFirestoreInstance } from 'firebase/firestore';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { RootStackParamList, RootStackNavigationProp } from '@/types/navigation';
import { generateColorFromString } from '../utils/colorUtils';
import { ChatRightHeader } from '../components/headers/ChatHeader/ChatRightHeader';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: any;
  imageUrl?: string;
  type: 'text' | 'image' | 'link';
}

interface Chat {
  id: string;
  name?: string;
  type: 'direct' | 'group';
  participants: string[];
  lastMessage?: string;
  lastMessageTime?: any;
}

interface Friend {
  id: string;
  userId: string;
  friendId: string;
  friendEmail?: string;
  friendName?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
  avatar?: string;
}

interface UserData {
  displayName?: string;
  email?: string;
  photoURL?: string;
}

interface FriendData {
  userId: string;
  friendId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

interface NewChatModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateChat: (type: 'direct' | 'group', participants: string[], name?: string) => void;
  friends: Friend[];
  preSelectedFriend?: Friend;
}

const NewChatModal: React.FC<NewChatModalProps> = ({ 
  visible, 
  onClose, 
  onCreateChat,
  friends,
  preSelectedFriend
}) => {
  const { themeMode } = useTheme();
  const theme = getTheme(themeMode);
  const [chatType, setChatType] = useState<'direct' | 'group'>('direct');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (preSelectedFriend) {
      setSelectedFriends([preSelectedFriend.id]);
      setChatType('direct');
    }
  }, [preSelectedFriend]);

  const toggleFriend = (friendId: string) => {
    if (chatType === 'direct') {
      setSelectedFriends([friendId]);
    } else {
      setSelectedFriends(prev => 
        prev.includes(friendId) 
          ? prev.filter(id => id !== friendId)
          : [...prev, friendId]
      );
    }
  };

  const handleCreate = async () => {
    if (isCreating) return;
    
    setIsCreating(true);
    try {
      if (chatType === 'direct' && selectedFriends.length === 1) {
        await onCreateChat('direct', selectedFriends);
      } else if (chatType === 'group' && selectedFriends.length > 0 && groupName.trim()) {
        await onCreateChat('group', selectedFriends, groupName.trim());
      }
      onClose();
    } catch (error) {
      console.error('Error creating chat:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const renderFriendItem = ({ item }: { item: Friend }) => {
    const displayName = item.friendName || item.friendEmail?.split('@')[0] || 'Unknown User';
    const firstLetter = displayName.charAt(0).toUpperCase();
    const backgroundColor = generateColorFromString(displayName, themeMode === 'dark');
    
    return (
      <TouchableOpacity
        style={[
          styles.friendItem,
          selectedFriends.includes(item.id) && styles.selectedFriend
        ]}
        onPress={() => toggleFriend(item.id)}
      >
        <View style={styles.friendAvatar}>
          {item.avatar ? (
            <Image
              source={{ uri: item.avatar }}
              style={styles.avatarImage}
            />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor }]}>
              <Text style={[styles.avatarText, { color: theme.colors.background }]}>
                {firstLetter}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.friendInfo}>
          <Text style={[styles.friendName, { color: theme.colors.text }]}>
            {displayName}
          </Text>
        </View>
        {selectedFriends.includes(item.id) && (
          <Ionicons
            name="checkmark-circle"
            size={24}
            color={theme.colors.primary}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.modalOverlay, { backgroundColor: 'transparent' }]}>
        <View style={[styles.modalContent, { marginTop: 0 }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              New Chat
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.chatTypeSelector}>
            <TouchableOpacity
              style={[
                styles.chatTypeButton,
                chatType === 'direct' && styles.selectedChatType
              ]}
              onPress={() => setChatType('direct')}
            >
              <Ionicons
                name="person"
                size={24}
                color={chatType === 'direct' ? theme.colors.primary : theme.colors.text}
              />
              <Text style={[
                styles.chatTypeText,
                { color: chatType === 'direct' ? theme.colors.primary : theme.colors.text }
              ]}>
                Direct Message
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.chatTypeButton,
                chatType === 'group' && styles.selectedChatType
              ]}
              onPress={() => setChatType('group')}
            >
              <Ionicons
                name="people"
                size={24}
                color={chatType === 'group' ? theme.colors.primary : theme.colors.text}
              />
              <Text style={[
                styles.chatTypeText,
                { color: chatType === 'group' ? theme.colors.primary : theme.colors.text }
              ]}>
                Group Chat
              </Text>
            </TouchableOpacity>
          </View>

          {chatType === 'group' && (
            <TextInput
              style={[styles.groupNameInput, { color: theme.colors.text }]}
              value={groupName}
              onChangeText={setGroupName}
              placeholder="Group Name"
              placeholderTextColor={theme.colors.textSecondary}
            />
          )}

          <FlatList
            data={friends}
            renderItem={renderFriendItem}
            keyExtractor={item => item.id}
            style={styles.friendsList}
          />

          <TouchableOpacity
            style={[
              styles.createButton,
              (!selectedFriends.length || (chatType === 'group' && !groupName.trim())) && styles.createButtonDisabled
            ]}
            onPress={handleCreate}
            disabled={!selectedFriends.length || (chatType === 'group' && !groupName.trim()) || isCreating}
          >
            {isCreating ? (
              <ActivityIndicator color={theme.colors.background} />
            ) : (
              <Text style={[styles.createButtonText, { color: theme.colors.background }]}>
                Create Chat
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export const ChatScreen: React.FC = () => {
  const { user } = useAuth();
  const { themeMode } = useTheme();
  const theme = getTheme(themeMode);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isNewChatModalVisible, setIsNewChatModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const firestore = getFirestore();
  const route = useRoute<RouteProp<RootStackParamList, 'Chat'>>();
  const preSelectedFriend = route.params?.preSelectedFriend;
  const navigation = useNavigation<RootStackNavigationProp>();

  // Expose the function to open the new chat modal
  const openNewChatModal = () => {
    setIsNewChatModalVisible(true);
  };

  // Pass the function to the header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <ChatRightHeader 
          themeMode={themeMode} 
          onOpenNewChat={openNewChatModal}
        />
      ),
    });
  }, [navigation, themeMode]);

  useEffect(() => {
    if (preSelectedFriend && user) {
      const existingChat = chats.find(chat => 
        chat.type === 'direct' && 
        chat.participants.includes(preSelectedFriend.friendId)
      );

      if (existingChat) {
        setCurrentChat(existingChat);
      } else {
        handleCreateChat('direct', [preSelectedFriend.friendId]);
      }
    }
  }, [preSelectedFriend, user, chats]);

  const dynamicStyles = {
    modalContent: {
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
    },
  };

  const scrollToBottom = () => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFirestoreError = (error: any, context: string) => {
    console.error(`Error in ${context}:`, error);
    setError(`Error loading ${context}. Please check your internet connection and try again.`);
    setIsLoading(false);
  };

  // Fetch user's chats with retry logic
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    let retryCount = 0;
    const maxRetries = 3;
    let unsubscribe: (() => void) | null = null;

    const setupChatListener = () => {
      try {
        const chatsRef = collection(firestore, 'chats');
        const q = query(
          chatsRef,
          where('participants', 'array-contains', user.uid),
          orderBy('lastMessageTime', 'desc')
        );

        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const newChats = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
            })) as Chat[];
            setChats(newChats);
            setError(null);
            setIsLoading(false);
            retryCount = 0; // Reset retry count on successful connection
          },
          (error) => {
            console.error('Chat listener error:', error);
            if (retryCount < maxRetries) {
              retryCount++;
              console.log(`Retrying chat listener (attempt ${retryCount}/${maxRetries})...`);
              setTimeout(setupChatListener, 1000 * retryCount);
            } else {
              handleFirestoreError(error, 'chats');
            }
          }
        );
      } catch (error) {
        handleFirestoreError(error, 'chats');
      }
    };

    setupChatListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  // Fetch messages for current chat with retry logic
  useEffect(() => {
    if (!currentChat || !user) return;

    let retryCount = 0;
    const maxRetries = 3;
    let unsubscribe: (() => void) | null = null;

    const setupMessageListener = () => {
      try {
        const messagesRef = collection(firestore, 'messages');
        const q = query(
          messagesRef,
          where('chatId', '==', currentChat.id),
          orderBy('timestamp', 'desc')
        );

        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const newMessages = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
            })) as Message[];
            setMessages(newMessages.reverse());
            setError(null);
            retryCount = 0; // Reset retry count on successful connection
          },
          (error) => {
            console.error('Message listener error:', error);
            if (retryCount < maxRetries) {
              retryCount++;
              console.log(`Retrying message listener (attempt ${retryCount}/${maxRetries})...`);
              setTimeout(setupMessageListener, 1000 * retryCount);
            } else {
              handleFirestoreError(error, 'messages');
            }
          }
        );
      } catch (error) {
        handleFirestoreError(error, 'messages');
      }
    };

    setupMessageListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentChat, user]);

  // Fetch friends with retry logic
  useEffect(() => {
    if (!user) return;

    let retryCount = 0;
    const maxRetries = 3;
    let unsubscribe: (() => void) | null = null;

    const setupFriendListener = () => {
      try {
        const friendsRef = collection(firestore, 'friends');
        const q = query(
          friendsRef,
          where('userId', '==', user.uid),
          where('status', '==', 'accepted')  // Only get accepted friends
        );

        unsubscribe = onSnapshot(
          q,
          async (snapshot: QuerySnapshot<DocumentData>) => {
            // Create a Map to store unique friends by friendId
            const uniqueFriendsMap = new Map();
            
            await Promise.all(
              snapshot.docs.map(async (docSnapshot: QueryDocumentSnapshot<DocumentData>) => {
                const friendData = docSnapshot.data() as FriendData;
                // Only process if we haven't seen this friendId before
                if (!uniqueFriendsMap.has(friendData.friendId)) {
                  const friendUserRef = doc(getFirestoreInstance(), 'users', friendData.friendId);
                  const friendUserDoc = await getDoc(friendUserRef);
                  const friendUserData = friendUserDoc.data() as UserData;
                  
                  uniqueFriendsMap.set(friendData.friendId, {
                    id: docSnapshot.id,
                    ...friendData,
                    friendName: friendUserData?.displayName || friendUserData?.email?.split('@')[0] || 'Unknown User',
                    avatar: friendUserData?.photoURL,
                  });
                }
              })
            );
            
            // Convert Map values to array
            const newFriends = Array.from(uniqueFriendsMap.values()) as Friend[];
            setFriends(newFriends);
            setError(null);
            retryCount = 0; // Reset retry count on successful connection
          },
          (error) => {
            console.error('Friend listener error:', error);
            if (retryCount < maxRetries) {
              retryCount++;
              console.log(`Retrying friend listener (attempt ${retryCount}/${maxRetries})...`);
              setTimeout(setupFriendListener, 1000 * retryCount);
            } else {
              handleFirestoreError(error, 'friends');
            }
          }
        );
      } catch (error) {
        handleFirestoreError(error, 'friends');
      }
    };

    setupFriendListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentChat || !user) return;

    try {
      const messagesRef = collection(firestore, 'messages');
      await addDoc(messagesRef, {
        text: newMessage,
        senderId: user.uid,
        senderName: user.email || 'Anonymous',
        timestamp: serverTimestamp(),
        chatId: currentChat.id,
        type: 'text',
      });

      const chatRef = doc(firestore, 'chats', currentChat.id);
      await updateDoc(chatRef, {
        lastMessage: newMessage,
        lastMessageTime: serverTimestamp(),
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const uploadImage = async (uri: string) => {
    if (!currentChat || !user) return;
    
    setIsUploading(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const storage = getStorage();
      const imageRef = ref(storage, `chat_images/${currentChat.id}/${Date.now()}`);
      
      await uploadBytes(imageRef, blob);
      const downloadURL = await getDownloadURL(imageRef);
      
      const messagesRef = collection(firestore, 'messages');
      await addDoc(messagesRef, {
        chatId: currentChat.id,
        senderId: user.uid,
        senderName: user.email || 'Anonymous',
        timestamp: serverTimestamp(),
        type: 'image',
        imageUrl: downloadURL,
      });
      
      const chatRef = doc(firestore, 'chats', currentChat.id);
      await updateDoc(chatRef, {
        lastMessage: '📷 Image',
        lastMessageTime: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleLinkPress = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex);
    if (urls && urls.length > 0) {
      Linking.openURL(urls[0]);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.senderId === user?.uid;
    
    return (
      <View style={[
        styles.messageContainer,
        isMe ? styles.myMessage : styles.otherMessage
      ]}>
        {!isMe && (
          <Text style={[styles.senderName, { color: theme.colors.text }]}>
            {item.senderName}
          </Text>
        )}
        {item.type === 'image' ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.messageImage}
            resizeMode="cover"
          />
        ) : (
          <Text style={[
            styles.messageText,
            { color: isMe ? theme.colors.background : theme.colors.text }
          ]}>
            {item.text}
          </Text>
        )}
        <Text style={[styles.timestamp, { color: theme.colors.text }]}>
          {new Date(item.timestamp?.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  const renderChatItem = ({ item }: { item: Chat }) => {
    const isSelected = currentChat?.id === item.id;
    const otherParticipant = item.participants.find(p => p !== user?.uid);
    const chatName = item.type === 'direct' ? 
      `Chat with ${otherParticipant}` : 
      item.name || 'Group Chat';

    return (
      <TouchableOpacity
        style={[
          styles.chatItem,
          isSelected && styles.selectedChatItem
        ]}
        onPress={() => setCurrentChat(item)}
      >
        <View style={styles.chatAvatar}>
          <Ionicons
            name={item.type === 'direct' ? 'person' : 'people'}
            size={24}
            color={theme.colors.primary}
          />
        </View>
        <View style={styles.chatInfo}>
          <Text style={[styles.chatName, { color: theme.colors.text }]}>{chatName}</Text>
          <Text style={[styles.lastMessage, { color: theme.colors.textSecondary }]} numberOfLines={1}>
            {item.lastMessage || 'No messages yet'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Ionicons name="chatbubbles-outline" size={64} color={theme.colors.textSecondary} />
      <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>
        No Chats Yet
      </Text>
      <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
        Start a new conversation with a friend or create a group chat
      </Text>
      <TouchableOpacity
        style={styles.emptyStateNewChatButton}
        onPress={openNewChatModal}
      >
        <Text style={[styles.emptyStateNewChatButtonText, { color: theme.colors.primary }]}>
          Start a Chat
        </Text>
      </TouchableOpacity>
    </View>
  );

  const handleCreateChat = async (type: 'direct' | 'group', participants: string[], name?: string) => {
    if (!user) return;

    try {
      const chatsRef = collection(firestore, 'chats');
      const newChat = {
        type,
        participants: [...participants, user.uid],
        createdAt: serverTimestamp(),
        lastMessageTime: serverTimestamp(),
        lastMessage: '',
        ...(type === 'group' ? { name: name || 'Group Chat' } : {}),
      };

      const chatDoc = await addDoc(chatsRef, newChat);
      const createdChat = { id: chatDoc.id, ...newChat } as Chat;
      setCurrentChat(createdChat);
      setChats(prevChats => [createdChat, ...prevChats]);
    } catch (error) {
      console.error('Error creating chat:', error);
      throw error;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" />
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading chats...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={theme.colors.error} />
          <Text style={[styles.errorText, { color: theme.colors.text }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setIsLoading(true);
              // Retry fetching chats
              const chatsRef = collection(firestore, 'chats');
              const q = query(
                chatsRef,
                where('participants', 'array-contains', user?.uid),
                orderBy('lastMessageTime', 'desc')
              );
              onSnapshot(q, 
                (snapshot) => {
                  const newChats = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                  })) as Chat[];
                  setChats(newChats);
                  setError(null);
                  setIsLoading(false);
                },
                (error) => {
                  handleFirestoreError(error, 'chats');
                }
              );
            }}
          >
            <Text style={[styles.retryButtonText, { color: theme.colors.background }]}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      ) : chats.length === 0 ? (
        renderEmptyState()
      ) : (
        <View style={styles.chatListContainer}>
          <View style={styles.chatListHeader}>
            <Text style={[styles.chatListTitle, { color: theme.colors.text }]}>
              Your Chats
            </Text>
          </View>
          <FlatList
            data={chats}
            renderItem={renderChatItem}
            keyExtractor={item => item.id}
            style={styles.chatList}
            contentContainerStyle={styles.chatListContent}
          />
        </View>
      )}

      <NewChatModal
        visible={isNewChatModalVisible}
        onClose={() => setIsNewChatModalVisible(false)}
        onCreateChat={handleCreateChat}
        friends={friends}
        preSelectedFriend={preSelectedFriend}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: getTheme('dark').spacing.md,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: getTheme('dark').spacing.xl,
  },
  errorText: {
    marginTop: getTheme('dark').spacing.md,
    marginBottom: getTheme('dark').spacing.xl,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: getTheme('dark').colors.primary,
    padding: getTheme('dark').spacing.md,
    borderRadius: getTheme('dark').borderRadius.md,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
    padding: getTheme('dark').spacing.md,
  },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: getTheme('dark').spacing.sm,
    padding: getTheme('dark').spacing.md,
    borderRadius: getTheme('dark').borderRadius.md,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: getTheme('dark').colors.primary,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: getTheme('dark').colors.surface,
  },
  senderName: {
    fontSize: 12,
    marginBottom: getTheme('dark').spacing.xs,
  },
  messageText: {
    fontSize: 16,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: getTheme('dark').borderRadius.md,
  },
  timestamp: {
    fontSize: 10,
    marginTop: getTheme('dark').spacing.xs,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: getTheme('dark').spacing.md,
    borderTopWidth: 1,
    borderTopColor: getTheme('dark').colors.border,
  },
  input: {
    flex: 1,
    marginHorizontal: getTheme('dark').spacing.md,
    padding: getTheme('dark').spacing.sm,
    borderRadius: getTheme('dark').borderRadius.md,
    backgroundColor: getTheme('dark').colors.surface,
    maxHeight: 100,
  },
  attachmentButton: {
    padding: getTheme('dark').spacing.sm,
  },
  sendButton: {
    padding: getTheme('dark').spacing.sm,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: getTheme('dark').spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: getTheme('dark').colors.border,
  },
  selectedChatItem: {
    backgroundColor: getTheme('dark').colors.surface,
  },
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: getTheme('dark').colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: getTheme('dark').spacing.md,
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: getTheme('dark').spacing.xs,
  },
  lastMessage: {
    fontSize: 14,
    color: getTheme('dark').colors.textSecondary,
  },
  chatTime: {
    fontSize: 12,
    color: getTheme('dark').colors.textSecondary,
  },
  sidebar: {
    width: 300,
    borderRightWidth: 1,
    borderRightColor: getTheme('dark').colors.border,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: getTheme('dark').spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: getTheme('dark').colors.border,
  },
  sidebarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  chatsList: {
    flex: 1,
  },
  chatArea: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: getTheme('dark').spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: getTheme('dark').colors.border,
  },
  chatTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  messagesListContent: {
    padding: getTheme('dark').spacing.md,
    paddingBottom: getTheme('dark').spacing.lg,
  },
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChatText: {
    fontSize: 16,
    color: getTheme('dark').colors.textSecondary,
    marginTop: getTheme('dark').spacing.md,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: getTheme('dark').spacing.xl,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: getTheme('dark').spacing.lg,
    marginBottom: getTheme('dark').spacing.sm,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: getTheme('dark').spacing.xl,
  },
  emptyStateNewChatButton: {
    paddingVertical: getTheme('dark').spacing.md,
    paddingHorizontal: getTheme('dark').spacing.xl,
    borderRadius: getTheme('dark').borderRadius.md,
    backgroundColor: getTheme('dark').colors.surface,
    borderWidth: 1,
    borderColor: getTheme('dark').colors.primary,
  },
  emptyStateNewChatButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-start',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderBottomLeftRadius: theme.borderRadius.lg,
    borderBottomRightRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    maxHeight: '80%',
    marginTop: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    marginTop: theme.spacing.xl,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  chatTypeSelector: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
  },
  chatTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginHorizontal: theme.spacing.sm,
  },
  selectedChatType: {
    backgroundColor: theme.colors.surface,
  },
  chatTypeText: {
    marginLeft: theme.spacing.sm,
    fontSize: 16,
    fontWeight: 'bold',
  },
  groupNameInput: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.lg,
  },
  friendsList: {
    maxHeight: 300,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  selectedFriend: {
    backgroundColor: theme.colors.surface,
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  createButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  createButtonDisabled: {
    backgroundColor: theme.colors.textSecondary,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  chatListContainer: {
    flex: 1,
    padding: theme.spacing.md,
  },
  chatListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  chatListTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  newChatButton: {
    padding: theme.spacing.sm,
  },
  chatList: {
    flex: 1,
  },
  chatListContent: {
    paddingBottom: theme.spacing.lg,
  },
}); 