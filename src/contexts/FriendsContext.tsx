import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import { Friend, FriendRequest, FriendStatus } from '../types/friend';

interface FriendsContextType {
  friends: Friend[];
  friendRequests: FriendRequest[];
  sendFriendRequest: (receiverId: string) => Promise<void>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  rejectFriendRequest: (requestId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
}

const FriendsContext = createContext<FriendsContextType | undefined>(undefined);

export const FriendsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);

  useEffect(() => {
    if (!user) {
      console.log('No user found in FriendsContext');
      return;
    }

    //console.log('Current user in FriendsContext:', {
    //  uid: user.uid,
    //  email: user.email
    //});

    // Listen for friend requests
    const requestsQuery = query(
      collection(db, 'friendRequests'),
      where('receiverId', '==', user.uid),
      where('status', '==', 'pending')
    );

    const requestsUnsubscribe = onSnapshot(requestsQuery, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FriendRequest[];
      //console.log('Friend requests:', requests);
      setFriendRequests(requests);
    });

    // Listen for friends
    const friendsQuery = query(
      collection(db, 'friends'),
      where('userId', '==', user.uid),
      where('status', '==', 'accepted')
    );

    const friendsUnsubscribe = onSnapshot(friendsQuery, async (snapshot) => {
      //console.log('Raw friends snapshot:', snapshot.docs.map(doc => doc.data()));
      
      // Use a Set to track unique friendIds
      const uniqueFriendIds = new Set<string>();
      
      const friendsList = await Promise.all(snapshot.docs.map(async (doc) => {
        const friendData = doc.data() as Friend;
        
        // Skip if we've already processed this friend
        if (uniqueFriendIds.has(friendData.friendId)) {
          //console.log('Skipping duplicate friend:', friendData.friendId);
          return null;
        }
        
        uniqueFriendIds.add(friendData.friendId);
        //console.log('Processing friend:', friendData);
        
        try {
          // Fetch the friend's full information from users collection
          const friendUserDoc = await getDocs(query(
            collection(db, 'users'),
            where('uid', '==', friendData.friendId)
          ));
          
          //console.log('Friend user document:', friendUserDoc.docs[0]?.data());
          
          const friendUserData = friendUserDoc.docs[0]?.data();
          
          if (!friendUserData) {
            console.warn(`No user data found for friend ID: ${friendData.friendId}`);
            return {
              ...friendData,
              id: doc.id,
              friendEmail: friendData.friendEmail || 'Unknown Email',
              friendName: friendData.friendName || 'Unknown User'
            };
          }

          const processedFriend = {
            ...friendData,
            id: doc.id,
            friendEmail: friendUserData.email,
            friendName: friendUserData.name || friendUserData.displayName || friendUserData.email?.split('@')[0] || 'Unknown User',
            profileImage: friendUserData.profileImage
          } as Friend;

          //console.log('Processed friend:', processedFriend);
          return processedFriend;
        } catch (error) {
          console.error(`Error fetching friend data for ${friendData.friendId}:`, error);
          return {
            ...friendData,
            id: doc.id,
            friendEmail: friendData.friendEmail || 'Unknown Email',
            friendName: friendData.friendName || 'Unknown User'
          };
        }
      }));
      
      // Filter out null values (duplicates) and log the final list
      const filteredFriendsList = friendsList.filter(friend => friend !== null) as Friend[];
      //console.log('Final friends list:', filteredFriendsList);
      setFriends(filteredFriendsList);
    });

    return () => {
      requestsUnsubscribe();
      friendsUnsubscribe();
    };
  }, [user]);

  const sendFriendRequest = async (receiverId: string) => {
    if (!user) return;

    try {
      // Check if a request already exists
      const existingRequestQuery = query(
        collection(db, 'friendRequests'),
        where('senderId', '==', user.uid),
        where('receiverId', '==', receiverId),
        where('status', '==', 'pending')
      );
      
      const existingRequest = await getDocs(existingRequestQuery);
      if (!existingRequest.empty) {
        console.log('Friend request already sent');
        return;
      }

      // Get current user's information
      const currentUserDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', user.uid)));
      const currentUserData = currentUserDoc.docs[0]?.data();

      // Create friend request
      const requestRef = await addDoc(collection(db, 'friendRequests'), {
        senderId: user.uid,
        senderEmail: user.email,
        senderName: currentUserData?.name || currentUserData?.displayName || user.email?.split('@')[0] || 'Unknown User',
        receiverId: receiverId,
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      // Create notification for the receiver
      await addDoc(collection(db, 'notifications'), {
        type: 'friend_request',
        message: `${currentUserData?.name || currentUserData?.displayName || user.email?.split('@')[0] || 'Unknown User'} sent you a friend request`,
        senderId: user.uid,
        senderName: currentUserData?.name || currentUserData?.displayName || user.email?.split('@')[0] || 'Unknown User',
        receiverId: receiverId,
        read: false,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  const acceptFriendRequest = async (requestId: string) => {
    if (!user) return;

    const requestRef = doc(db, 'friendRequests', requestId);
    const request = friendRequests.find(r => r.id === requestId);

    if (!request) return;

    const now = new Date().toISOString();

    // Update request status
    await updateDoc(requestRef, {
      status: 'accepted',
      updatedAt: now
    });

    // Get both users' information
    const [senderDoc, currentUserDoc] = await Promise.all([
      getDocs(query(collection(db, 'users'), where('uid', '==', request.senderId))),
      getDocs(query(collection(db, 'users'), where('uid', '==', user.uid)))
    ]);

    const senderData = senderDoc.docs[0]?.data();
    const currentUserData = currentUserDoc.docs[0]?.data();

    // Create friend relationship for both users
    await addDoc(collection(db, 'friends'), {
      userId: user.uid,
      friendId: request.senderId,
      friendEmail: senderData?.email,
      friendName: senderData?.name || senderData?.displayName || senderData?.email?.split('@')[0] || 'Unknown User',
      status: 'accepted',
      createdAt: now,
      updatedAt: now
    });

    await addDoc(collection(db, 'friends'), {
      userId: request.senderId,
      friendId: user.uid,
      friendEmail: user.email,
      friendName: currentUserData?.name || currentUserData?.displayName || user.email?.split('@')[0] || 'Unknown User',
      status: 'accepted',
      createdAt: now,
      updatedAt: now
    });
  };

  const rejectFriendRequest = async (requestId: string) => {
    if (!user) return;

    const requestRef = doc(db, 'friendRequests', requestId);
    await updateDoc(requestRef, {
      status: 'rejected',
      updatedAt: new Date().toISOString()
    });
  };

  const removeFriend = async (friendId: string) => {
    if (!user) return;

    // Delete friend relationship for both users
    const userFriendsQuery = query(
      collection(db, 'friends'),
      where('userId', '==', user.uid),
      where('friendId', '==', friendId)
    );

    const friendFriendsQuery = query(
      collection(db, 'friends'),
      where('userId', '==', friendId),
      where('friendId', '==', user.uid)
    );

    const [userFriends, friendFriends] = await Promise.all([
      getDocs(userFriendsQuery),
      getDocs(friendFriendsQuery)
    ]);

    userFriends.forEach(async (doc) => {
      await deleteDoc(doc.ref);
    });

    friendFriends.forEach(async (doc) => {
      await deleteDoc(doc.ref);
    });
  };

  return (
    <FriendsContext.Provider value={{
      friends,
      friendRequests,
      sendFriendRequest,
      acceptFriendRequest,
      rejectFriendRequest,
      removeFriend
    }}>
      {children}
    </FriendsContext.Provider>
  );
};

export const useFriends = () => {
  const context = useContext(FriendsContext);
  if (context === undefined) {
    throw new Error('useFriends must be used within a FriendsProvider');
  }
  return context;
}; 