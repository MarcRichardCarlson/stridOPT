export type FriendStatus = 'pending' | 'accepted' | 'rejected';

export interface Friend {
  id: string;
  userId: string; // The user who owns this friend record
  friendId: string; // The other user
  friendEmail?: string;
  friendName?: string;
  status: FriendStatus;
  createdAt: string;
  updatedAt: string;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  senderEmail?: string;
  senderName?: string;
  status: FriendStatus;
  createdAt: string;
  updatedAt: string;
} 