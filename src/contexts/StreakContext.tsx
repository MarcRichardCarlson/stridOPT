import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

interface Event {
  id: string;
  date: string;
  attendees: Array<{ userId: string }>;
}

interface StreakContextType {
  currentStreak: number;
}

const StreakContext = createContext<StreakContextType>({
  currentStreak: 0,
});

export const StreakProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currentStreak, setCurrentStreak] = useState(0);

  useEffect(() => {
    if (!user) {
      console.log('No user found, streak reset to 0');
      setCurrentStreak(0);
      return;
    }

    //console.log('Calculating streak for user:', user.uid);
    const eventsRef = collection(db, 'events');
    const q = query(eventsRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Event[];

      //console.log('Total events found:', events.length);
      
      // Sort events by date
      const sortedEvents = [...events].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      let streak = 0;
      let currentDate = new Date();
      
      //console.log('Checking events from most recent to oldest:');
      // Check events from most recent to oldest
      for (let i = sortedEvents.length - 1; i >= 0; i--) {
        const eventDate = new Date(sortedEvents[i].date);
        const daysDiff = Math.floor((currentDate.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24));
        
        //console.log(`Event ${i}:`, {
        //  date: eventDate,
        //  daysDiff,
        //  hasUser: sortedEvents[i].attendees.some(a => a.userId === user.uid)
        //});
        
        if (daysDiff > 1) {
          //console.log('Gap in attendance, streak ends');
          break;
        }
        
        if (sortedEvents[i].attendees.some(a => a.userId === user.uid)) {
          streak++;
          currentDate = eventDate;
          //console.log('User attended, streak increased to:', streak);
        } else {
          //console.log('User missed event, streak ends');
          break;
        }
      }
      
      //console.log('Final streak calculated:', streak);
      setCurrentStreak(streak);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <StreakContext.Provider value={{ currentStreak }}>
      {children}
    </StreakContext.Provider>
  );
};

export const useStreak = () => {
  const context = useContext(StreakContext);
  if (!context) {
    throw new Error('useStreak must be used within a StreakProvider');
  }
  return context;
}; 