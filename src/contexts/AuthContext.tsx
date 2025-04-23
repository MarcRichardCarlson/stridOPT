import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth } from '../config/firebase';
import { User, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User as UserType } from '../types/user';
import { User as FirebaseUser } from 'firebase/auth';
import { User as CustomUser } from '../types/user';
import { generateColorFromString } from '../utils/colorUtils';

export interface AuthContextType {
  user: CustomUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: CustomUser | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = '@stridopt:session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStoredUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem(SESSION_KEY);
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error loading stored user:', error);
      }
      setLoading(false);
    };

    loadStoredUser();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(firebaseUser));
        } catch (error) {
          console.error('Error storing user:', error);
        }
      } else {
        try {
          await AsyncStorage.removeItem(SESSION_KEY);
        } catch (error) {
          console.error('Error removing stored user:', error);
        }
      }
      await handleAuthStateChanged(firebaseUser);
    });

    return () => unsubscribe();
  }, []);

  const handleAuthStateChanged = async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      try {
        //console.log('Firebase User:', {
        //  uid: firebaseUser.uid,
        //  email: firebaseUser.email,
        //  displayName: firebaseUser.displayName
        //});

        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          //console.log('Firestore User Data:', userData);

          const customUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            fullName: userData.fullName || firebaseUser.displayName || '',
            profileImage: userData.profileImage || '',
            createdAt: userData.createdAt || new Date().toISOString(),
            updatedAt: userData.updatedAt || new Date().toISOString()
          };

          //console.log('Setting Custom User:', customUser);
          setUser(customUser);
        } else {
          // If no Firestore doc exists, create one with the Firebase user data
          const customUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            fullName: firebaseUser.displayName || '',
            profileImage: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          await setDoc(doc(db, 'users', firebaseUser.uid), customUser);
          console.log('Created new user document:', customUser);
          setUser(customUser);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    } else {
      console.log('No Firebase user found');
      setUser(null);
    }
    setLoading(false);
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update user profile with display name
      await updateProfile(user, {
        displayName: fullName,
      });

      // Generate profile color
      const profileColor = generateColorFromString(fullName || email, false);

      // Create complete user data object
      const userData = {
        uid: user.uid,
        email: email,
        fullName: fullName,
        profileImage: '',
        profileColor: profileColor,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Store user data in Firestore
      await setDoc(doc(db, 'users', user.uid), userData);
      
      // Update local state
      setUser(userData);
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      await AsyncStorage.removeItem(SESSION_KEY);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const getUserData = async (uid: string): Promise<CustomUser | null> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as CustomUser;
        return {
          ...userData,
          profileColor: userData.profileColor || generateColorFromString(userData.fullName || userData.email, false)
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signUp,
      signOut: handleSignOut,
      setUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 