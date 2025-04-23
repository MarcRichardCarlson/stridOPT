import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, onSnapshot, or, and, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import { useFriends } from './FriendsContext';
import { Event, EventVisibility } from '../types/event';

interface EventsContextType {
  events: Event[];
  addEvent: (event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEvent: (eventId: string, event: Partial<Event>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  isEditMode: boolean;
  toggleEditMode: () => void;
  isAddModalVisible: boolean;
  setIsAddModalVisible: (value: boolean) => void;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export const EventsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { friends } = useFriends();
  const [events, setEvents] = useState<Event[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);

  const toggleEditMode = () => {
    setIsEditMode(prev => !prev);
  };

  useEffect(() => {
    if (!user) return;

    // Get friend IDs
    const friendIds = friends.map(friend => friend.friendId);

    // Base query for user's own events and public events
    const baseQuery = query(
      collection(db, 'events'),
      or(
        where('userId', '==', user.uid),
        where('visibility', '==', 'public')
      )
    );

    // If user has friends, add the friends-only events query
    const finalQuery = friendIds.length > 0
      ? query(
          collection(db, 'events'),
          or(
            where('userId', '==', user.uid),
            where('visibility', '==', 'public'),
            and(
              where('visibility', '==', 'friends'),
              where('userId', 'in', friendIds)
            )
          )
        )
      : baseQuery;

    const unsubscribe = onSnapshot(finalQuery, (snapshot) => {
      const eventsList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date && !isNaN(new Date(data.date).getTime()) 
            ? new Date(data.date).toISOString() 
            : new Date().toISOString(),
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString()
        } as Event;
      });
      setEvents(eventsList);
    }, (error) => {
      console.error('Error fetching events:', error);
    });

    return () => unsubscribe();
  }, [user, friends]);

  const addEvent = async (event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

    await addDoc(collection(db, 'events'), {
      ...event,
      userId: user.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  };

  const updateEvent = async (eventId: string, event: Partial<Event>) => {
    if (!user) return;

    const eventRef = doc(db, 'events', eventId);
    await updateDoc(eventRef, {
      ...event,
      updatedAt: new Date().toISOString()
    });
  };

  const deleteEvent = async (eventId: string) => {
    if (!user) return;

    const eventRef = doc(db, 'events', eventId);
    await deleteDoc(eventRef);
  };

  return (
    <EventsContext.Provider value={{
      events,
      addEvent,
      updateEvent,
      deleteEvent,
      isEditMode,
      toggleEditMode,
      isAddModalVisible,
      setIsAddModalVisible
    }}>
      {children}
    </EventsContext.Provider>
  );
};

export const useEvents = () => {
  const context = useContext(EventsContext);
  if (context === undefined) {
    throw new Error('useEvents must be used within an EventsProvider');
  }
  return context;
}; 