import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, TextInput, Image, ActivityIndicator, Alert } from 'react-native';
import { useFriends } from '../contexts/FriendsContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getTheme } from '../theme/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { collection, query, where, getDocs, orderBy, limit, DocumentData } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { generateColorFromString } from '../utils/colorUtils';

interface User {
  id: string;
  uid: string;
  email: string;
  fullName?: string;
  displayName?: string;
  name?: string;
  profileImage?: string;
}

interface FirestoreUser {
  uid: string;
  email: string;
  fullName?: string;
  name?: string;
  displayName?: string;
  profileImage?: string;
}

type RootStackParamList = {
  Main: {
    screen: 'Chat';
    params: {
      preSelectedFriend?: {
        id: string;
        name: string;
        email: string;
        profileImage?: string;
      };
    };
  };
  Chat: {
    preSelectedFriend?: {
      id: string;
      name: string;
      email: string;
      profileImage?: string;
    };
  };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const FriendsScreen = () => {
  const { friends, friendRequests, acceptFriendRequest, rejectFriendRequest, removeFriend, sendFriendRequest } = useFriends();
  const { user } = useAuth();
  const { themeMode } = useTheme();
  const theme = getTheme(themeMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [discoverUsers, setDiscoverUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<string[]>([]);
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    loadDiscoverUsers();
  }, []);

  const loadDiscoverUsers = async () => {
    if (!user) {
      console.log('No user found');
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('Fetching users...');
      const usersRef = collection(db, 'users');
      const q = query(usersRef);

      const snapshot = await getDocs(q);
      console.log('Total users found:', snapshot.docs.length);
      
      const users = snapshot.docs
        .map(doc => {
          const data = doc.data() as FirestoreUser;
          return { 
            id: doc.id, 
            ...data,
            displayName: data.name || (data.email ? data.email.split('@')[0] : 'Unknown User')
          } as User;
        })
        .filter((userData: User) => !friends.some(friend => friend.friendId === userData.uid));

      console.log('Filtered users:', users.length);
      setDiscoverUsers(users);
    } catch (error) {
      console.error('Error loading discover users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const searchUsers = async (searchText: string) => {
    if (!searchText.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef);

      const snapshot = await getDocs(q);
      const results = snapshot.docs
        .map(doc => {
          const data = doc.data() as FirestoreUser;
          return {
            id: doc.id,
            uid: data.uid,
            email: data.email,
            fullName: data.fullName,
            displayName: data.displayName || data.name || (data.email ? data.email.split('@')[0] : 'Unknown User'),
            profileImage: data.profileImage
          } as User;
        })
        .filter(user => user.uid !== user?.uid && user.email.toLowerCase().includes(searchText.toLowerCase()));

      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendFriendRequest = async (userId: string) => {
    if (!user) return;
    
    setPendingRequests(prev => [...prev, userId]);
    try {
      await sendFriendRequest(userId);
    } catch (error) {
      console.error('Error sending friend request:', error);
      setPendingRequests(prev => prev.filter(id => id !== userId));
    }
  };

  const handleRemoveFriend = (friendId: string, friendName: string) => {
    Alert.alert(
      "Remove Friend",
      `Are you sure you want to remove ${friendName} from your friends?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => removeFriend(friendId)
        }
      ]
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={64} color={theme.colors.textSecondary} />
      <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>
        No Friends Yet
      </Text>
      <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
        Search for friends or discover new people to connect with
      </Text>
    </View>
  );

  const renderUserItem = ({ item, isDiscover = false }: { item: any, isDiscover?: boolean }) => {
    const displayName = item.friendName || item.fullName || item.displayName || (item.email ? item.email.split('@')[0] : 'Unknown User');
    const firstLetter = displayName.charAt(0).toUpperCase();
    const backgroundColor = generateColorFromString(displayName, themeMode === 'dark');
    
    // Check if there's a pending request from you to this user
    const hasPendingRequest = pendingRequests.includes(item.uid) || friendRequests.some(request => 
      request.senderId === user?.uid && request.receiverId === item.uid
    );

    return (
      <View style={[styles.userItem, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.userInfo}>
          {item.profileImage ? (
            <Image 
              source={{ uri: item.profileImage }} 
              style={styles.avatar} 
            />
          ) : (
            <View style={[styles.avatar, { backgroundColor }]}>
              <Text style={[styles.avatarText, { color: themeMode === 'dark' ? '#FFFFFF' : '#000000' }]}>
                {firstLetter}
              </Text>
            </View>
          )}
          <View style={styles.userDetails}>
            <Text style={[styles.userName, { color: theme.colors.text }]}>
              {item.friendName || item.fullName || item.displayName || (item.email ? item.email.split('@')[0] : 'Unknown User')}
            </Text>
            <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>
              {item.email}
            </Text>
          </View>
        </View>
        {isDiscover && item.uid !== user?.uid && (
          <TouchableOpacity
            style={[
              styles.addButton, 
              { 
                backgroundColor: hasPendingRequest 
                  ? themeMode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.2)' 
                    : 'rgba(0, 0, 0, 0.2)'
                  : theme.colors.primary,
                borderWidth: hasPendingRequest ? 1 : 0,
                borderColor: theme.colors.textSecondary
              }
            ]}
            onPress={() => {
              if (!hasPendingRequest) {
                handleSendFriendRequest(item.uid);
              }
            }}
            disabled={hasPendingRequest}
          >
            <Ionicons 
              name={hasPendingRequest ? "time-outline" : "person-add"} 
              size={24} 
              color={hasPendingRequest ? theme.colors.textSecondary : "#FFFFFF"} 
            />
          </TouchableOpacity>
        )}
        {!isDiscover && (
          <View style={styles.friendActions}>
            <TouchableOpacity
              style={[styles.chatButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => {
                navigation.navigate('Main', {
                  screen: 'Chat',
                  params: {
                    preSelectedFriend: {
                      id: item.friendId,
                      name: item.friendName || item.fullName || item.displayName || (item.email ? item.email.split('@')[0] : 'Unknown User'),
                      email: item.email,
                      profileImage: item.profileImage
                    }
                  }
                });
              }}
            >
              <Ionicons name="chatbubble" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.removeButton, { 
                backgroundColor: 'transparent',
                borderWidth: 1,
                borderColor: theme.colors.textSecondary,
                flexDirection: 'row',
                paddingHorizontal: 12,
                gap: 4
              }]}
              onPress={() => handleRemoveFriend(item.friendId, displayName)}
            >
              <Ionicons name="person-remove" size={20} color={theme.colors.textSecondary} />
              <Text style={[styles.removeButtonText, { color: theme.colors.textSecondary }]}>
                Remove
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderFriendRequest = ({ item }: { item: any }) => {
    const senderName = item.senderEmail ? item.senderEmail.split('@')[0] : 'Unknown User';
    
    return (
      <View style={[styles.requestItem, { 
        backgroundColor: theme.colors.surface,
        width: '100%',
        marginRight: 0
      }]}>
        <View style={styles.userInfo}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
            <Ionicons name="person" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.userDetails}>
            <Text style={[styles.userName, { color: theme.colors.text }]}>{senderName}</Text>
            <Text style={[styles.requestStatus, { color: theme.colors.textSecondary }]}>Pending Request</Text>
          </View>
        </View>
        <View style={styles.requestActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => acceptFriendRequest(item.id)}
          >
            <Ionicons name="checkmark" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.error }]}
            onPress={() => rejectFriendRequest(item.id)}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { 
            backgroundColor: theme.colors.surface,
            color: theme.colors.text,
            borderColor: theme.colors.border 
          }]}
          placeholder="Search users..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            searchUsers(text);
          }}
        />
      </View>

      {searchQuery ? (
        <View style={styles.searchResults}>
          <FlatList
            data={searchResults}
            renderItem={({ item }) => renderUserItem({ item, isDiscover: true })}
            keyExtractor={item => item.id}
          />
        </View>
      ) : (
        <>
          {friendRequests.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Friend Requests</Text>
              <FlatList
                data={friendRequests}
                renderItem={renderFriendRequest}
                keyExtractor={item => item.id}
                horizontal={false}
                showsHorizontalScrollIndicator={false}
              />
            </View>
          )}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Your Friends</Text>
            {friends.length > 0 ? (
              <FlatList
                data={friends}
                renderItem={({ item }) => renderUserItem({ item })}
                keyExtractor={item => item.id}
              />
            ) : (
              renderEmptyState()
            )}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Discover People</Text>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
              </View>
            ) : (
              <FlatList
                data={discoverUsers}
                renderItem={({ item }) => renderUserItem({ item, isDiscover: true })}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.discoverList}
              />
            )}
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  searchResults: {
    maxHeight: 200,
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    width: '100%',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
  },
  userEmail: {
    fontSize: 14,
  },
  requestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    width: '100%',
  },
  requestStatus: {
    fontSize: 14,
    marginTop: 4,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendActions: {
    flexDirection: 'row',
    gap: 8,
  },
  chatButton: {
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButton: {
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  discoverList: {
    paddingBottom: 16,
  },
}); 