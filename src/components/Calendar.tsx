import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Calendar as RNCalendar } from 'react-native-calendars';
import { useTheme } from '../contexts/ThemeContext';
import { getTheme } from '../theme/theme';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  description: string;
}

interface CalendarProps {
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
}

export const Calendar: React.FC<CalendarProps> = ({ isFullScreen, onToggleFullScreen }) => {
  const { themeMode } = useTheme();
  const theme = getTheme(themeMode);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Sample events data - in a real app, this would come from your backend
  const events: Event[] = [
    {
      id: '1',
      title: 'Team Meeting',
      date: '2024-03-20',
      time: '10:00 AM',
      description: 'Weekly team sync'
    },
    {
      id: '2',
      title: 'Client Call',
      date: '2024-03-20',
      time: '2:00 PM',
      description: 'Project update with client'
    },
    // Add more sample events as needed
  ];

  const markedDates = events.reduce((acc, event) => {
    acc[event.date] = { marked: true, dotColor: theme.colors.primary };
    return acc;
  }, {} as { [key: string]: { marked: boolean; dotColor: string } });

  const dayEvents = events.filter(event => event.date === selectedDate);

  const renderCalendar = () => (
    <RNCalendar
      onDayPress={(day: { dateString: React.SetStateAction<string>; }) => setSelectedDate(day.dateString)}
      markedDates={{
        ...markedDates,
        [selectedDate]: {
          selected: true,
          marked: markedDates[selectedDate]?.marked,
          dotColor: theme.colors.primary
        }
      }}
      theme={{
        backgroundColor: theme.colors.background,
        calendarBackground: theme.colors.background,
        textSectionTitleColor: theme.colors.text,
        selectedDayBackgroundColor: theme.colors.primary,
        selectedDayTextColor: theme.colors.background,
        todayTextColor: theme.colors.primary,
        dayTextColor: theme.colors.text,
        textDisabledColor: theme.colors.textSecondary,
        dotColor: theme.colors.primary,
        selectedDotColor: theme.colors.background,
        arrowColor: theme.colors.primary,
        monthTextColor: theme.colors.text,
        indicatorColor: theme.colors.primary,
      }}
    />
  );

  const renderEvents = () => (
    <View style={styles.eventsContainer}>
      <Text style={[styles.eventsTitle, { color: theme.colors.text }]}>
        Events for {new Date(selectedDate).toLocaleDateString()}
      </Text>
      {dayEvents.length > 0 ? (
        dayEvents.map(event => (
          <View 
            key={event.id} 
            style={[styles.eventCard, { backgroundColor: theme.colors.surface }]}
          >
            <Text style={[styles.eventTitle, { color: theme.colors.text }]}>
              {event.title}
            </Text>
            <Text style={[styles.eventTime, { color: theme.colors.textSecondary }]}>
              {event.time}
            </Text>
            <Text style={[styles.eventDescription, { color: theme.colors.textSecondary }]}>
              {event.description}
            </Text>
          </View>
        ))
      ) : (
        <Text style={[styles.noEvents, { color: theme.colors.textSecondary }]}>
          No events scheduled for this day
        </Text>
      )}
    </View>
  );

  if (isFullScreen) {
    return (
      <Modal
        visible={isFullScreen}
        animationType="slide"
        onRequestClose={onToggleFullScreen}
      >
        <View style={[styles.fullScreenContainer, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.headerContent}>
              <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Calendar</Text>
              <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
                {new Date(selectedDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Text>
            </View>
            <TouchableOpacity 
              style={[styles.closeButton, { backgroundColor: theme.colors.primary }]}
              onPress={onToggleFullScreen}
            >
              <Text style={[styles.closeButtonText, { color: theme.colors.background }]}>Close</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.scrollView}>
            <View style={styles.calendarContainer}>
              {renderCalendar()}
            </View>
            {renderEvents()}
          </ScrollView>
        </View>
      </Modal>
    );
  }

  return (
    <TouchableOpacity 
      style={[styles.compactContainer, { backgroundColor: theme.colors.surface }]}
      onPress={onToggleFullScreen}
    >
      {renderCalendar()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
  },
  compactContainer: {
    borderRadius: 10,
    padding: 4,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  headerContent: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-end',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  calendarContainer: {
    padding: 16,
  },
  eventsContainer: {
    padding: 16,
  },
  eventsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  eventCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 14,
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 14,
  },
  noEvents: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
}); 