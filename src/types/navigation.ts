import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  Profile: undefined;
  Chat: {
    preSelectedFriend?: {
      id: string;
      userId: string;
      friendId: string;
      name: string;
      avatar?: string;
      status: 'pending' | 'accepted' | 'rejected';
      createdAt: any;
      updatedAt: any;
    };
  };
  ChatDetail: { chatId: string };
  FriendRequests: undefined;
  Notifications: undefined;
  Settings: undefined;
  TaskDetails: { taskId: string };
  EventDetails: { eventId: string };
  CreateTask: undefined;
  CreateEvent: undefined;
  EditTask: { taskId: string };
  EditEvent: { eventId: string };
  ForgotPassword: undefined;
  CreateChat: undefined;
};

export type RootStackNavigationProp = NativeStackNavigationProp<RootStackParamList>; 