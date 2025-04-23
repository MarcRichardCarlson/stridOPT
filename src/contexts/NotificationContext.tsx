import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

interface Notification {
  id: string;
  type: 'friend_request' | 'event_invite' | 'message';
  message: string;
  senderId: string;
  senderName: string;
  read: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const notificationsRef = collection(db, 'notifications');
    const q = query(notificationsRef, where('receiverId', '==', user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      
      setNotifications(notificationsList);
      setUnreadCount(notificationsList.filter(n => !n.read).length);
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    if (!user) return;
    
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, { read: true });
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    const unreadNotifications = notifications.filter(n => !n.read);
    const batch = unreadNotifications.map(notification => 
      updateDoc(doc(db, 'notifications', notification.id), { read: true })
    );
    
    await Promise.all(batch);
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}; 