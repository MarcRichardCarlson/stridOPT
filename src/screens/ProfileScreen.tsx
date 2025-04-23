import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, Image, ActivityIndicator } from 'react-native';
import { getTheme } from '../theme/theme';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../contexts/ThemeContext';
import { useFriends } from '../contexts/FriendsContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, getDoc, collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { User } from '../types/user';
import { useProfileImage } from '../hooks/useProfileImage';
import { generateColorFromString } from '../utils/colorUtils';

type ProfileStackParamList = {
  Profile: undefined;
  Settings: undefined;
  Friends: undefined;
};

type ProfileScreenNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'Profile'>;

interface UserEvent {
  id: string;
  date: string;
  attendees: Array<{ userId: string }>;
}

export const ProfileScreen = () => {
  const { user } = useAuth();
  const { themeMode } = useTheme();
  const { friends } = useFriends();
  const theme = getTheme(themeMode);
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileColor, setProfileColor] = useState<string>('');
  const { pickAndProcessImage, isLoading } = useProfileImage();
  const [currentStreak, setCurrentStreak] = useState(0);
  const [joinedEventsCount, setJoinedEventsCount] = useState(0);
  const [tasksCount, setTasksCount] = useState(0);

  useEffect(() => {
    loadProfileColor();
    loadProfileImage();
    calculateStreak();
    calculateJoinedEvents();
    calculateTasksCount();
  }, []);

  const loadProfileColor = async () => {
    if (!user?.uid) return;
    
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      if (userData.profileColor) {
        setProfileColor(userData.profileColor);
      } else {
        // Generate initial color if none exists
        const initialColor = generateColorFromString(user.fullName || user.email || user.uid, themeMode === 'dark');
        setProfileColor(initialColor);
        // Save the initial color
        await updateDoc(doc(db, 'users', user.uid), {
          profileColor: initialColor
        });
      }
    }
  };

  const loadProfileImage = async () => {
    if (!user?.uid) return;
    
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists() && userDoc.data().profileImage) {
      setProfileImage(userDoc.data().profileImage);
    }
  };

  const calculateStreak = () => {
    if (!user) return;

    const eventsRef = collection(db, 'events');
    const q = query(eventsRef);
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as UserEvent[];
      
      // Sort events by date
      const sortedEvents = [...events].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      let streak = 0;
      let currentDate = new Date();
      
      // Check events from most recent to oldest
      for (let i = sortedEvents.length - 1; i >= 0; i--) {
        const eventDate = new Date(sortedEvents[i].date);
        const daysDiff = Math.floor((currentDate.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff > 1) break; // Gap in attendance, streak ends
        
        if (sortedEvents[i].attendees.some(a => a.userId === user.uid)) {
          streak++;
          currentDate = eventDate;
        } else {
          break; // Missed an event, streak ends
        }
      }
      
      setCurrentStreak(streak);
    });

    return () => unsubscribe();
  };

  const calculateJoinedEvents = () => {
    if (!user) return;

    const eventsRef = collection(db, 'events');
    const q = query(eventsRef);
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as UserEvent[];
      
      const count = events.filter(event => 
        event.attendees.some(a => a.userId === user.uid)
      ).length;
      
      setJoinedEventsCount(count);
    });

    return () => unsubscribe();
  };

  const calculateTasksCount = () => {
    if (!user) {
      return;
    }

    const tasksRef = collection(db, 'tasks');
    
    const unsubscribe = onSnapshot(tasksRef, (snapshot) => {
      const userTasks = snapshot.docs.filter(doc => doc.data().userId === user.uid);
      setTasksCount(userTasks.length);
    }, (error) => {
      console.error('Error fetching tasks:', error);
    });

    return () => unsubscribe();
  };

  const handleProfileImageSelect = async () => {
    try {
      const result = await pickAndProcessImage();
      
      if (result.error) {
        console.error(result.error);
        return;
      }

      // Upload the image to Firebase Storage
      const storage = getStorage();
      const imageRef = ref(storage, `profile_images/${user?.uid}`);
      const response = await fetch(result.localUri);
      const blob = await response.blob();
      
      await uploadBytes(imageRef, blob);
      const downloadURL = await getDownloadURL(imageRef);

      // Update user document with the new profile image URL
      if (user?.uid) {
        await updateDoc(doc(db, 'users', user.uid), {
          profileImage: downloadURL
        });
        setProfileImage(downloadURL);
      }
    } catch (error) {
      console.error('Error updating profile image:', error);
    }
  };

  const stats: Array<{
    label: string;
    value: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
  }> = [
    { label: 'Tasks', value: tasksCount.toString(), icon: 'checkmark-circle', color: '#4ECDC4' },
    { label: 'Events', value: joinedEventsCount.toString(), icon: 'calendar', color: '#FF6B6B' },
    { label: 'Friends', value: friends.length.toString(), icon: 'people', color: '#45B7D1' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={themeMode === 'light' ? 'dark-content' : 'light-content'} />
      <ScrollView>

        <View style={[styles.profileSection, { borderBottomColor: theme.colors.border }]}>
          <View 
            style={[
              styles.avatarContainer, 
              { 
                backgroundColor: profileColor,
                shadowColor: themeMode === 'light' ? '#000' : 'transparent',
                shadowOffset: {
                  width: 0,
                  height: 2,
                },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5,
              }
            ]}
          >
            {profileImage ? (
              <Image 
                source={{ uri: profileImage }} 
                style={[styles.profileImage, { backgroundColor: profileColor }]}
              />
            ) : (
              <Text style={[styles.avatarText, { color: themeMode === 'dark' ? '#FFFFFF' : '#000000' }]}>
                {user?.fullName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
              </Text>
            )}
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleProfileImageSelect}
            >
              <Ionicons name="camera" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: theme.colors.text }]}>
              {user?.fullName || 'Error'}
            </Text>
            <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>
              {user?.email}
            </Text>
          </View>
        </View>

        <View style={[styles.statsContainer, { borderBottomColor: theme.colors.border }]}>
          {stats.map((stat, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.statItem}
              onPress={() => {
                if (stat.label === 'Friends') {
                  navigation.navigate('Friends');
                }
              }}
            >
              <View style={[styles.statIconContainer, { backgroundColor: `${stat.color}20` }]}>
                <Ionicons name={stat.icon} size={24} color={stat.color} />
              </View>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{stat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: getTheme('dark').spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getTheme('dark').spacing.sm,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getTheme('dark').spacing.sm,
    paddingVertical: getTheme('dark').spacing.xs,
    borderRadius: 20,
  },
  streakText: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: getTheme('dark').spacing.xs,
  },
  streakEmoji: {
    fontSize: 16,
  },
  settingsButton: {
    padding: getTheme('dark').spacing.sm,
  },
  profileSection: {
    alignItems: 'center',
    padding: getTheme('dark').spacing.lg,
    borderBottomWidth: 1,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  avatarText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    padding: 8,
    borderRadius: 15,
    borderWidth: 2,
  },
  userInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: getTheme('dark').spacing.lg,
    borderBottomWidth: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: getTheme('dark').spacing.sm,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    padding: 4,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
}); 