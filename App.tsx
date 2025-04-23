import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, SafeAreaView, StatusBar } from 'react-native';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { FriendsProvider } from './src/contexts/FriendsContext';
import { NotificationProvider, useNotifications } from './src/contexts/NotificationContext';
import { getTheme } from './src/theme/theme';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { AppearanceScreen } from './src/screens/AppearanceScreen';
import { AccountScreen } from './src/screens/AccountScreen';
import { TodosScreen } from './src/screens/TodosScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { EventsScreen } from './src/screens/EventsScreen';
import { theme } from './src/theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { LandingScreen } from './src/screens/LandingScreen';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from './src/config/firebase';
import { FriendsScreen } from './src/screens/FriendsScreen';
import { EventsProvider } from './src/contexts/EventsContext';
import { EventLeftHeader } from './src/components/headers/EventHeader/EventLeftHeader';
import { EventRightHeader } from './src/components/headers/EventHeader/EventRightHeader';
import { ProfileLeftHeader } from './src/components/headers/ProfileHeader/ProfileLeftHeader';
import { ProfileRightHeader } from './src/components/headers/ProfileHeader/ProfileRightHeader';
import { HomeRightHeader } from './src/components/headers/HomeHeader/HomeRightHeader';
import { ChatRightHeader } from './src/components/headers/ChatHeader/ChatRightHeader';
import { StreakProvider } from './src/contexts/StreakContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

export type RootStackParamList = {
  Events: {
    currentStreak?: number;
    openAddModal?: boolean;
    openEditMode?: boolean;
    isEditMode?: boolean;
  };
  Profile: undefined;
  Settings: undefined;
  Friends: undefined;
  Main: {
    screen: string;
  };
};

// Define a type for valid Ionicons names
type IoniconsName = 
  | 'home'
  | 'home-outline'
  | 'list'
  | 'list-outline'
  | 'chatbubbles'
  | 'chatbubbles-outline'
  | 'calendar'
  | 'calendar-outline'
  | 'person'
  | 'person-outline'
  | 'settings'
  | 'settings-outline'
  | 'add'
  | 'add-outline'
  | 'close'
  | 'close-outline'
  | 'alert-circle'
  | 'alert-circle-outline'
  | 'camera'
  | 'camera-outline'
  | 'chevron-forward'
  | 'chevron-forward-outline'
  | 'log-out'
  | 'log-out-outline'
  | 'rocket'
  | 'rocket-outline'
  | 'checkmark-circle'
  | 'checkmark-circle-outline'
  | 'filter'
  | 'filter-outline'
  | 'search'
  | 'search-outline'
  | 'notifications'
  | 'notifications-outline'
  | 'create-outline'
  | 'people-outline'
  | 'arrow-back';

interface UserEvent {
  id: string;
  date: string;
  attendees: Array<{ userId: string }>;
}

const TabNavigator = ({ themeMode }: { themeMode: "light" | "dark" }) => {
  const theme = getTheme(themeMode);
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [isEditMode, setIsEditMode] = useState(false);
  const { unreadCount } = useNotifications();

  const TodosScreenWrapper = () => {
    return <TodosScreen isEditMode={isEditMode} />;
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: IoniconsName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Todos') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Chat') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Events') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'home';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
        headerStyle: {
          backgroundColor: theme.colors.surface,
          height: 110,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
          color: theme.colors.text,
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={({ navigation }) => ({
          title: 'Home',
          headerRight: () => (
            <HomeRightHeader />
          ),
        })}
      />
      <Tab.Screen 
        name="Todos" 
        component={TodosScreenWrapper}
        options={({ navigation }) => ({
          title: 'Todos',
          headerRight: () => (
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setIsEditMode(!isEditMode)}
              >
                <Ionicons 
                  name={isEditMode ? "close" : "create-outline"} 
                  size={24} 
                  color={theme.colors.text} 
                />
              </TouchableOpacity>
            </View>
          ),
        })}
      />
      <Tab.Screen 
        name="Chat" 
        component={ChatScreen}
        options={() => ({
          title: 'Chat',
          headerRight: () => (
            <ChatRightHeader 
              themeMode={themeMode} 
              onOpenNewChat={() => {
                // The actual function will be set by ChatScreen's useLayoutEffect
                return null;
              }}
            />
          ),
        })}
      />
      <Tab.Screen 
        name="Events" 
        component={EventsScreen}
        options={() => ({
          title: 'Events',
          headerLeft: () => (
            <EventLeftHeader themeMode={themeMode} />
          ),
          headerRight: () => (
            <EventRightHeader themeMode={themeMode} />
          ),
        })}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ 
          headerShown: true,
          headerLeft: () => (
            <ProfileLeftHeader />
          ),
          headerTitle: () => (
            <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Profile</Text>
            </View>
          ),
          headerRight: () => (
            <ProfileRightHeader />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const MainTabNavigator = () => {
  const { themeMode } = useTheme();
  return <TabNavigator themeMode={themeMode} />;
};

const Navigation = ({ themeMode }: { themeMode: "light" | "dark" }) => {
  const { user } = useAuth();
  const theme = getTheme(themeMode);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.text,
      }}
    >
      {!user ? (
        <>
          <Stack.Screen 
            name="Landing" 
            component={LandingScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Login" 
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Register" 
            component={RegisterScreen}
            options={{ headerShown: false }}
          />
        </>
      ) : (
        <>
          <Stack.Screen 
            name="Main" 
            component={MainTabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen}
            options={{ 
              title: 'Settings',
              headerShown: true,
              headerLeft: () => (
                <View style={styles.headerLeft}>
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.navigate('Main', { screen: 'Profile' })}
                  >
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                  </TouchableOpacity>
                </View>
              ),
            }}
          />
          <Stack.Screen 
            name="Friends" 
            component={FriendsScreen}
            options={{ 
              title: 'Friends',
              headerShown: true,
              headerLeft: () => (
                <View style={styles.headerLeft}>
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.navigate('Main', { screen: 'Profile' })}
                  >
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                  </TouchableOpacity>
                </View>
              ),
            }}
          />
          <Stack.Screen 
            name="Appearance" 
            component={AppearanceScreen}
            options={{ 
              title: 'Appearance',
              headerShown: true,
              headerLeft: () => (
                <View style={styles.headerLeft}>
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.navigate('Settings')}
                  >
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                  </TouchableOpacity>
                </View>
              ),
            }}
          />
          <Stack.Screen 
            name="Account" 
            component={AccountScreen}
            options={{ 
              title: 'Account',
              headerShown: true,
              headerLeft: () => (
                <View style={styles.headerLeft}>
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.navigate('Settings')}
                  >
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                  </TouchableOpacity>
                </View>
              ),
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

const AppContent = () => {
  const { themeMode } = useTheme();
  const currentTheme = getTheme(themeMode);

  const navigationTheme = {
    dark: themeMode === 'dark',
    colors: {
      primary: currentTheme.colors.primary,
      background: currentTheme.colors.background,
      card: currentTheme.colors.surface,
      text: currentTheme.colors.text,
      border: currentTheme.colors.border,
      notification: currentTheme.colors.primary,
    },
    fonts: {
      regular: {
        fontFamily: 'System',
        fontWeight: '400' as const,
      },
      medium: {
        fontFamily: 'System',
        fontWeight: '500' as const,
      },
      bold: {
        fontFamily: 'System',
        fontWeight: '700' as const,
      },
      heavy: {
        fontFamily: 'System',
        fontWeight: '800' as const,
      },
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <StreakProvider>
        <EventsProvider>
          <NotificationProvider>
            <Navigation themeMode={themeMode} />
          </NotificationProvider>
        </EventsProvider>
      </StreakProvider>
    </NavigationContainer>
  );
};

const AppWithTheme = () => {
  const { themeMode } = useTheme();
  const currentTheme = getTheme(themeMode);

  return (
    <>
      <StatusBar
        barStyle={themeMode === 'light' ? 'dark-content' : 'light-content'}
        backgroundColor={currentTheme.colors.background}
        translucent={true}
      />
      <AppContent />
    </>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <FriendsProvider>
          <EventsProvider>
            <NotificationProvider>
              <AppWithTheme />
            </NotificationProvider>
          </EventsProvider>
        </FriendsProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: theme.spacing.xl,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.xl * 2,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: theme.spacing.md,
  },
  subtitle: {
    fontSize: 18,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  featuresContainer: {
    marginVertical: theme.spacing.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    shadowColor: theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  featureText: {
    fontSize: 18,
    marginLeft: theme.spacing.md,
    fontWeight: '500',
  },
  buttonContainer: {
    marginBottom: theme.spacing.xl,
  },
  button: {
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    shadowColor: theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    borderWidth: 2,
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xl,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 20,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: theme.spacing.xs,
  },
  streakEmoji: {
    fontSize: 14,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'center',
  },
  editButton: {
    padding: theme.spacing.sm,
    marginRight: theme.spacing.sm,
  },
  headerButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.xl,
    marginLeft: theme.spacing.sm,
  },
  iconButton: {
    padding: theme.spacing.sm,
    marginLeft: theme.spacing.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginRight: theme.spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginLeft: theme.spacing.md,
  },
  settingsButton: {
    padding: theme.spacing.sm,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  notificationButton: {
    padding: theme.spacing.sm,
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: theme.colors.error,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCount: {
    color: theme.colors.background,
    fontSize: 12,
    fontWeight: 'bold',
  },
} as const);
