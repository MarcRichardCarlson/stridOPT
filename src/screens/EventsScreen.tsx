import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, TextInput, ScrollView, Image, Animated } from 'react-native';
import { getTheme } from '../theme/theme';
import { useTheme } from '../contexts/ThemeContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';
import { useEvents } from '../contexts/EventsContext';
import { collection, addDoc, updateDoc, doc, onSnapshot, query, where, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { generateColorFromString } from '../utils/colorUtils';
import { Event } from '../types/event';
import { RootStackParamList } from '../../App';

type EventsScreenNavigationProp = BottomTabNavigationProp<RootStackParamList>;

export const EventsScreen = () => {
  const { themeMode } = useTheme();
  const theme = getTheme(themeMode);
  const { events, addEvent, updateEvent, deleteEvent, isEditMode, isAddModalVisible, setIsAddModalVisible } = useEvents();
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
  });
  const { user } = useAuth();
  const [confirmingEventId, setConfirmingEventId] = useState<string | null>(null);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [cardHeights] = useState(() => new Map<string, Animated.Value>());
  const navigation = useNavigation<EventsScreenNavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'Events'>>();

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (route.params?.openAddModal) {
        setIsAddModalVisible(true);
        navigation.setParams({ openAddModal: false });
      }
    });

    return unsubscribe;
  }, [navigation, route.params]);

  useEffect(() => {
    const calculateStreak = () => {
      if (!events.length || !user) {
        setCurrentStreak(0);
        return;
      }

      try {
        // Sort events by date
        const sortedEvents = [...events].sort((a, b) => {
          const dateA = a.date ? new Date(a.date).getTime() : 0;
          const dateB = b.date ? new Date(b.date).getTime() : 0;
          return dateA - dateB;
        });
        
        let streak = 0;
        let currentDate = new Date();
        
        // Check events from most recent to oldest
        for (let i = sortedEvents.length - 1; i >= 0; i--) {
          const event = sortedEvents[i];
          if (!event.date) continue;

          const eventDate = new Date(event.date);
          if (isNaN(eventDate.getTime())) continue;

          const daysDiff = Math.floor((currentDate.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff > 1) break; // Gap in attendance, streak ends
          
          if (event.attendees?.some(a => a.userId === user.uid)) {
            streak++;
            currentDate = eventDate;
          } else {
            break; // Missed an event, streak ends
          }
        }
        
        setCurrentStreak(streak);
      } catch (error) {
        console.error('Error calculating streak:', error);
        setCurrentStreak(0);
      }
    };

    calculateStreak();
  }, [events, user]);

  useEffect(() => {
    // Initialize height animations for each event
    events.forEach(event => {
      if (!cardHeights.has(event.id)) {
        cardHeights.set(event.id, new Animated.Value(0));
      }
    });
  }, [events]);

  const animateCardHeight = (eventId: string, show: boolean) => {
    const height = cardHeights.get(eventId);
    if (height) {
      Animated.spring(height, {
        toValue: show ? 1 : 0,
        useNativeDriver: false,
        tension: 50,
        friction: 7,
      }).start();
    }
  };

  useEffect(() => {
    // Animate all cards when edit mode changes
    events.forEach(event => {
      animateCardHeight(event.id, isEditMode);
    });
  }, [isEditMode]);

  const handleAddEvent = async () => {
    if (newEvent.title.trim() && user) {
      try {
        await addEvent({
          title: newEvent.title,
          description: newEvent.description,
          date: newEvent.date,
          time: newEvent.time,
          startTime: newEvent.time,
          endTime: newEvent.time,
          attendees: [],
          visibility: 'friends',
          userId: user.uid,
          creatorId: user.uid
        });
        setNewEvent({ title: '', description: '', date: '', time: '' });
        setIsAddModalVisible(false);
      } catch (error) {
        console.error('Error adding event:', error);
      }
    }
  };

  const handleJoinEvent = async (eventId: string) => {
    if (!user) return;

    try {
      const eventRef = doc(db, 'events', eventId);
      const event = events.find(e => e.id === eventId);
      
      if (!event) return;

      const isAttending = event.attendees.some(a => a.userId === user.uid);
      
      if (isAttending) {
        // Show confirmation dialog
        setConfirmingEventId(eventId);
      } else {
        // Add user to attendees
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.data();
        
        const newAttendee = {
          userId: user.uid,
          name: user.fullName || 'Anonymous',
          profileImage: userData?.profileImage || null,
          profileColor: userData?.profileColor || generateColorFromString(user.fullName || user.email || user.uid, themeMode === 'dark')
        };

        await updateDoc(eventRef, {
          attendees: [...event.attendees, newAttendee]
        });
      }
    } catch (error) {
      console.error('Error updating event attendance:', error);
    }
  };

  const handleConfirmCancel = async (eventId: string) => {
    try {
      const eventRef = doc(db, 'events', eventId);
      const event = events.find(e => e.id === eventId);
      
      if (!event) return;

      await updateDoc(eventRef, {
        attendees: event.attendees.filter(a => a.userId !== user?.uid)
      });
      
      setConfirmingEventId(null);
    } catch (error) {
      console.error('Error canceling attendance:', error);
    }
  };

  const isUserAttending = (event: Event) => {
    return user ? event.attendees.some(a => a.userId === user.uid) : false;
  };

  const handleTitleChange = (text: string) => {
    if (text.length <= 30) {
      setNewEvent({ ...newEvent, title: text });
    }
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent) return;
    
    try {
      await updateEvent(editingEvent.id, {
        title: newEvent.title,
        description: newEvent.description,
        date: newEvent.date,
        time: newEvent.time,
        startTime: newEvent.time,
        endTime: newEvent.time
      });
      setEditingEvent(null);
      setIsAddModalVisible(false);
      setNewEvent({
        title: '',
        description: '',
        date: '',
        time: '',
      });
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!isEditMode) return; // Only allow deletion in edit mode
    
    try {
      await deleteEvent(eventId);
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const startEditingEvent = (event: Event) => {
    setEditingEvent(event);
    setNewEvent({
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
    });
    setIsAddModalVisible(true);
  };

  const isEventCreator = (event: Event) => {
    return event.creatorId === user?.uid;
  };

  const toggleEditMode = () => {
    setIsAddModalVisible(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        {currentStreak > 0 && (
          <View style={[styles.streakContainer, { backgroundColor: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }]}>
            <Text style={[styles.streakText, { color: theme.colors.text }]}>{currentStreak}</Text>
            <Text style={[styles.streakEmoji, { color: theme.colors.text }]}>🔥</Text>
          </View>
        )}
      </View>
      <ScrollView style={styles.eventsList}>
        {events.map((event) => {
          const heightAnim = cardHeights.get(event.id) || new Animated.Value(0);
          const buttonHeight = heightAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 40]
          });

          return (
            <Animated.View
              key={event.id}
              style={[
                styles.eventCard,
                { 
                  backgroundColor: theme.colors.surface,
                  marginBottom: Animated.add(getTheme('dark').spacing.md, buttonHeight),
                  shadowColor: themeMode === 'light' ? '#000' : 'transparent',
                  shadowOffset: {
                    width: 0,
                    height: 2,
                  },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 5,
                }
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.titleContainer}>
                  <Text style={[styles.eventTitle, { color: theme.colors.text }]}>
                    {event.title}
                  </Text>
                </View>
                <View style={styles.attendeesContainer}>
                  {event.attendees.map((attendee, index) => {
                    const attendeeColor = generateColorFromString(attendee.name || attendee.userId, themeMode === 'dark');
                    return (
                      <View 
                        key={index} 
                        style={[
                          styles.attendeeAvatar,
                          { 
                            marginLeft: index > 0 ? -10 : 0,
                            zIndex: event.attendees.length - index,
                            backgroundColor: attendee.profileColor || generateColorFromString(attendee.name || attendee.userId, themeMode === 'dark'),
                            borderColor: theme.colors.background,
                            shadowColor: themeMode === 'light' ? theme.colors.primary : 'transparent',
                          }
                        ]}
                      >
                        {attendee.profileImage ? (
                          <Image
                            source={{ uri: attendee.profileImage }}
                            style={styles.avatarImage}
                          />
                        ) : (
                          <Text style={[styles.avatarText, { color: themeMode === 'dark' ? '#FFFFFF' : '#000000' }]}>
                            {attendee.name.charAt(0).toUpperCase()}
                          </Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>

              <View style={styles.eventContent}>
                <View style={styles.eventDetails}>
                  <View style={styles.descriptionContainer}>
                    <Text 
                      style={[styles.eventDescription, { color: theme.colors.textSecondary }]}
                    >
                      {event.description}
                    </Text>
                  </View>
                  <View style={styles.eventDateTimeContainer}>
                    <Ionicons name="calendar" size={16} color={theme.colors.primary} />
                    <Text style={[styles.eventDateTime, { color: theme.colors.textSecondary }]}>
                      {event.date} at {event.time}
                    </Text>
                  </View>
                </View>
                <View style={styles.buttonContainer}>
                  {isUserAttending(event) ? (
                    confirmingEventId === event.id ? (
                      <View style={styles.confirmationContainer}>
                        <Text style={[styles.confirmationText, { color: theme.colors.text }]}>
                          Are you sure?
                        </Text>
                        <View style={styles.confirmationButtons}>
                          <TouchableOpacity
                            style={[styles.confirmationButton, styles.yesButton, { borderColor: theme.colors.text }]}
                            onPress={() => handleConfirmCancel(event.id)}
                          >
                            <Text style={[styles.confirmationButtonText, { color: theme.colors.text }]}>Yes</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.confirmationButton, styles.noButton, { backgroundColor: theme.colors.text }]}
                            onPress={() => setConfirmingEventId(null)}
                          >
                            <Text style={[styles.noButtonText, { color: theme.colors.background }]}>No</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[styles.cancelButton, { borderColor: theme.colors.text}]}
                        onPress={() => handleJoinEvent(event.id)}
                      >
                        <Ionicons name="close-circle" size={20} color={theme.colors.text} />
                        <Text style={[styles.cancelButtonText, { color: theme.colors.text }]}>
                          OPT out
                        </Text>
                      </TouchableOpacity>
                    )
                  ) : (
                    <TouchableOpacity
                      style={[styles.joinButton, { backgroundColor: theme.colors.primary }]}
                      onPress={() => handleJoinEvent(event.id)}
                    >
                      <Ionicons name="checkmark-circle" size={20} color={theme.colors.text} />
                      <Text style={[styles.joinButtonText, { color: theme.colors.text }]}>Going</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              {isEditMode && (
                <Animated.View 
                  style={[
                    styles.floatingActions,
                    { 
                      opacity: heightAnim,
                      transform: [{ translateY: Animated.multiply(heightAnim, -1) }]
                    }
                  ]}
                >
                  <TouchableOpacity
                    style={[styles.floatingAction, { 
                      backgroundColor: `${theme.colors.primary}20`,
                      borderColor: theme.colors.primary 
                    }]}
                    onPress={() => startEditingEvent(event)}
                  >
                    <Ionicons name="pencil-outline" size={20} color={theme.colors.primary} />
                    <Text style={[styles.floatingActionText, { color: theme.colors.primary }]}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.floatingAction, { 
                      backgroundColor: `${theme.colors.error}20`,
                      borderColor: theme.colors.error 
                    }]}
                    onPress={() => handleDeleteEvent(event.id)}
                  >
                    <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
                    <Text style={[styles.floatingActionText, { color: theme.colors.error }]}>Delete</Text>
                  </TouchableOpacity>
                </Animated.View>
              )}
            </Animated.View>
          );
        })}
      </ScrollView>

      <Modal
        visible={isAddModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {
          setIsAddModalVisible(false);
          setEditingEvent(null);
          setNewEvent({
            title: '',
            description: '',
            date: '',
            time: '',
          });
        }}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {editingEvent ? 'Edit Event' : 'Add New Event'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setIsAddModalVisible(false);
                  setEditingEvent(null);
                  setNewEvent({
                    title: '',
                    description: '',
                    date: '',
                    time: '',
                  });
                }}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.border 
              }]}
              placeholder="Event Title (max 30 characters)"
              placeholderTextColor={theme.colors.textSecondary}
              value={newEvent.title}
              onChangeText={handleTitleChange}
              maxLength={30}
            />

            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.border 
              }]}
              placeholder="Description"
              placeholderTextColor={theme.colors.textSecondary}
              value={newEvent.description}
              onChangeText={(text) => setNewEvent({ ...newEvent, description: text })}
              multiline
            />

            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.border 
              }]}
              placeholder="Date (YYYY-MM-DD)"
              placeholderTextColor={theme.colors.textSecondary}
              value={newEvent.date}
              onChangeText={(text) => setNewEvent({ ...newEvent, date: text })}
            />

            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.border 
              }]}
              placeholder="Time (HH:MM)"
              placeholderTextColor={theme.colors.textSecondary}
              value={newEvent.time}
              onChangeText={(text) => setNewEvent({ ...newEvent, time: text })}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
                onPress={editingEvent ? handleUpdateEvent : handleAddEvent}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>
                  {editingEvent ? 'Update Event' : 'Add Event'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: getTheme('dark').spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getTheme('dark').spacing.lg,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getTheme('dark').spacing.sm,
    paddingVertical: getTheme('dark').spacing.xs,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  streakText: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: getTheme('dark').spacing.xs,
  },
  streakEmoji: {
    fontSize: 16,
  },
  eventsList: {
    flex: 1,
  },
  eventCard: {
    padding: getTheme('dark').spacing.lg,
    borderRadius: getTheme('dark').borderRadius.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getTheme('dark').spacing.md,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: getTheme('dark').spacing.sm,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: getTheme('dark').spacing.sm,
  },
  eventContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  eventDetails: {
    flex: 1,
    marginRight: getTheme('dark').spacing.md,
  },
  eventDescription: {
    fontSize: 15,
    marginBottom: getTheme('dark').spacing.sm,
    lineHeight: 22,
  },
  eventDateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventDateTime: {
    fontSize: 14,
    marginLeft: getTheme('dark').spacing.xs,
  },
  attendeesContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  attendeeAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    overflow: 'hidden',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  buttonContainer: {
    alignSelf: 'flex-end',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: getTheme('dark').spacing.sm,
    paddingHorizontal: getTheme('dark').spacing.lg,
    borderRadius: getTheme('dark').borderRadius.md,
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: getTheme('dark').spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    borderRadius: getTheme('dark').borderRadius.lg,
    padding: getTheme('dark').spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getTheme('dark').spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: getTheme('dark').spacing.sm,
  },
  input: {
    padding: getTheme('dark').spacing.md,
    borderRadius: getTheme('dark').borderRadius.md,
    marginBottom: getTheme('dark').spacing.md,
    borderWidth: 1,
  },
  modalButtons: {
    marginTop: getTheme('dark').spacing.md,
  },
  modalButton: {
    padding: getTheme('dark').spacing.md,
    borderRadius: getTheme('dark').borderRadius.md,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: getTheme('dark').spacing.xs,
    paddingHorizontal: getTheme('dark').spacing.md,
    borderRadius: getTheme('dark').borderRadius.md,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: getTheme('dark').spacing.xs,
  },
  confirmationContainer: {
    alignItems: 'center',
  },
  confirmationText: {
    fontSize: 14,
    marginBottom: getTheme('dark').spacing.xs,
  },
  confirmationButtons: {
    flexDirection: 'row',
    gap: getTheme('dark').spacing.sm,
  },
  confirmationButton: {
    paddingVertical: getTheme('dark').spacing.xs,
    paddingHorizontal: getTheme('dark').spacing.md,
    borderRadius: getTheme('dark').borderRadius.lg,
    minWidth: 60,
    alignItems: 'center',
  },
  yesButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  noButton: {
    backgroundColor: 'transparent',
  },
  confirmationButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  noButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  descriptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: getTheme('dark').spacing.sm,
  },
  expandButton: {
    padding: getTheme('dark').spacing.xs,
  },
  exitEditButton: {
    padding: getTheme('dark').spacing.sm,
    borderRadius: getTheme('dark').borderRadius.md,
  },
  exitEditText: {
    fontWeight: '600',
  },
  floatingActions: {
    position: 'absolute',
    bottom: -45,
    left: '10%',
    right: '10%',
    flexDirection: 'row',
    gap: getTheme('dark').spacing.sm,
    backgroundColor: 'transparent',
    padding: getTheme('dark').spacing.xs,
    borderRadius: getTheme('dark').borderRadius.lg,
  },
  floatingAction: {
    flex: 1,
    height: 40,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: getTheme('dark').spacing.xs,
    borderWidth: 1,
    borderTopWidth: 0,
  },
  floatingActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  editButton: {
    padding: getTheme('dark').spacing.sm,
    borderRadius: getTheme('dark').borderRadius.lg,
    marginLeft: getTheme('dark').spacing.sm,
  },
}); 