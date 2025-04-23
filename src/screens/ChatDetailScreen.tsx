import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { getTheme, theme } from '../theme/theme';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore, collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { useRoute, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '@/types/navigation';

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

export const ChatDetailScreen: React.FC = () => {
  const { user } = useAuth();
  const { themeMode } = useTheme();
  const theme = getTheme(themeMode);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const firestore = getFirestore();
  const route = useRoute();
  const navigation = useNavigation();
  const { chatId } = route.params as RootStackParamList['ChatDetail'];

  useEffect(() => {
    const chatRef = doc(firestore, 'chats', chatId);
    const unsubscribeChat = onSnapshot(chatRef, (doc) => {
      if (doc.exists()) {
        setCurrentChat({ id: doc.id, ...doc.data() } as Chat);
      }
    });

    const messagesRef = collection(firestore, 'messages');
    const q = query(
      messagesRef,
      where('chatId', '==', chatId),
      orderBy('timestamp', 'desc')
    );

    const unsubscribeMessages = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];
      setMessages(newMessages.reverse());
      setIsLoading(false);
    });

    return () => {
      unsubscribeChat();
      unsubscribeMessages();
    };
  }, [chatId]);

  const scrollToBottom = () => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    try {
      const messagesRef = collection(firestore, 'messages');
      await addDoc(messagesRef, {
        text: newMessage,
        senderId: user.uid,
        senderName: user.email || 'Anonymous',
        timestamp: serverTimestamp(),
        chatId: chatId,
        type: 'text',
      });

      const chatRef = doc(firestore, 'chats', chatId);
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
    if (!user) return;
    
    setIsUploading(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const storage = getStorage();
      const imageRef = ref(storage, `chat_images/${chatId}/${Date.now()}`);
      
      await uploadBytes(imageRef, blob);
      const downloadURL = await getDownloadURL(imageRef);
      
      const messagesRef = collection(firestore, 'messages');
      await addDoc(messagesRef, {
        chatId: chatId,
        senderId: user.uid,
        senderName: user.email || 'Anonymous',
        timestamp: serverTimestamp(),
        type: 'image',
        imageUrl: downloadURL,
      });
      
      const chatRef = doc(firestore, 'chats', chatId);
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
        <Text style={[styles.timestamp, { color: theme.colors.textSecondary }]}>
          {new Date(item.timestamp?.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Loading chat...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.chatHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.chatTitle, { color: theme.colors.text }]}>
          {currentChat?.type === 'direct' ? 
            `Chat with ${currentChat?.participants.find(p => p !== user?.uid)}` : 
            currentChat?.name || 'Group Chat'}
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesListContent}
          onContentSizeChange={scrollToBottom}
          onLayout={scrollToBottom}
        />

        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.attachmentButton}
            onPress={pickImage}
            disabled={isUploading}
          >
            <Ionicons
              name="attach"
              size={24}
              color={isUploading ? theme.colors.text + '80' : theme.colors.text}
            />
          </TouchableOpacity>

          <TextInput
            style={[styles.input, { color: theme.colors.text }]}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            placeholderTextColor={theme.colors.text + '80'}
            multiline
          />

          <TouchableOpacity
            style={styles.sendButton}
            onPress={sendMessage}
            disabled={!newMessage.trim() || isUploading}
          >
            <Ionicons
              name="send"
              size={24}
              color={!newMessage.trim() || isUploading ? theme.colors.text + '80' : theme.colors.primary}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    marginTop: theme.spacing.md,
    fontSize: 16,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: theme.spacing.sm,
    marginRight: theme.spacing.sm,
  },
  chatTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesListContent: {
    padding: theme.spacing.md,
  },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.primary,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.surface,
  },
  senderName: {
    fontSize: 12,
    marginBottom: theme.spacing.xs,
  },
  messageText: {
    fontSize: 16,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: theme.borderRadius.md,
  },
  timestamp: {
    fontSize: 10,
    marginTop: theme.spacing.xs,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  input: {
    flex: 1,
    marginHorizontal: theme.spacing.md,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    maxHeight: 100,
  },
  attachmentButton: {
    padding: theme.spacing.sm,
  },
  sendButton: {
    padding: theme.spacing.sm,
  },
}); 