export type EventVisibility = 'public' | 'friends' | 'private';

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  startTime: string;
  endTime: string;
  location?: string;
  userId: string;
  creatorId: string;
  visibility: EventVisibility;
  attendees: {
    userId: string;
    profileImage?: string;
    name: string;
    profileColor?: string;
    status?: 'going' | 'maybe' | 'cant';
  }[];
  createdAt: string;
  updatedAt: string;
} 