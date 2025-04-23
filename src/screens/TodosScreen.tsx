import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, FlatList, Animated, Platform, Modal } from 'react-native';
import { getTheme } from '../theme/theme';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import Ionicons from '@expo/vector-icons/Ionicons';

type TaskType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'one-time';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  userId: string;
  type: TaskType;
  createdAt: string;
  lastCompleted?: string;
}

interface TodosScreenProps {
  isEditMode: boolean;
}

const taskTypeColors = {
  'daily': '#4ECDC4',
  'weekly': '#FF6B6B',
  'monthly': '#45B7D1',
  'yearly': '#FFD166',
  'one-time': '#A78BFA'
};

const taskTypeIcons: Record<TaskType, keyof typeof Ionicons.glyphMap> = {
  'daily': 'calendar',
  'weekly': 'calendar',
  'monthly': 'calendar',
  'yearly': 'calendar',
  'one-time': 'flag'
};

export const TodosScreen = ({ isEditMode }: TodosScreenProps) => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [selectedType, setSelectedType] = useState<TaskType>('one-time');
  const [showTypeModal, setShowTypeModal] = useState(false);
  const { user } = useAuth();
  const { themeMode } = useTheme();
  const theme = getTheme(themeMode);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (!user) return;

    const tasksRef = collection(db, 'tasks');
    const q = query(tasksRef, where('userId', '==', user.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Todo[];
      setTodos(tasks);
    });

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    return () => unsubscribe();
  }, [user]);

  const addTodo = async () => {
    if (!user || !newTodo.trim()) return;

    try {
      const tasksRef = collection(db, 'tasks');
      await addDoc(tasksRef, {
        text: newTodo.trim(),
        completed: false,
        userId: user.uid,
        type: selectedType,
        createdAt: new Date().toISOString(),
      });
      setNewTodo('');
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const toggleTodo = async (id: string) => {
    if (!user) return;

    try {
      const taskRef = doc(db, 'tasks', id);
      const task = todos.find(t => t.id === id);
      if (task) {
        const now = new Date().toISOString();
        await updateDoc(taskRef, {
          completed: !task.completed,
          lastCompleted: !task.completed ? now : null
        });
      }
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const deleteTodo = async (id: string) => {
    if (!user) return;

    try {
      const taskRef = doc(db, 'tasks', id);
      await deleteDoc(taskRef);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const renderTypeSelector = () => (
    <Modal
      visible={showTypeModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowTypeModal(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowTypeModal(false)}
      >
        <View style={[styles.typeModal, { backgroundColor: theme.colors.surface }]}>
          {Object.entries(taskTypeColors).map(([type, color]) => (
            <TouchableOpacity
              key={type}
              style={[styles.typeOption, { backgroundColor: color }]}
              onPress={() => {
                setSelectedType(type as TaskType);
                setShowTypeModal(false);
              }}
            >
              <Ionicons name={taskTypeIcons[type as TaskType]} size={20} color="#fff" />
              <Text style={styles.typeText}>{type.replace('-', ' ')}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderTodoItem = ({ item }: { item: Todo }) => {
    const taskType = item.type || 'one-time';
    const typeColor = taskTypeColors[taskType] || taskTypeColors['one-time'];
    const typeIcon = taskTypeIcons[taskType] || taskTypeIcons['one-time'];

    // Adjust colors based on theme mode
    const cardBackground = item.completed 
      ? `${typeColor}20` 
      : themeMode === 'light' 
        ? '#FFFFFF' 
        : theme.colors.surface;
    
    const cardBorderColor = item.completed 
      ? typeColor 
      : themeMode === 'light' 
        ? `${typeColor}60` 
        : theme.colors.border;

    const cardShadow = themeMode === 'light' ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    } : {};

    return (
      <Animated.View 
        style={[
          styles.todoItem, 
          { 
            backgroundColor: cardBackground,
            borderColor: cardBorderColor,
            opacity: fadeAnim,
            transform: [{ scale: fadeAnim }],
            ...cardShadow
          }
        ]}
      >
        <TouchableOpacity
          style={styles.todoContent}
          onPress={() => toggleTodo(item.id)}
        >
          <View style={styles.checkboxContainer}>
            <View style={[
              styles.checkbox,
              { 
                backgroundColor: item.completed ? typeColor : 'transparent',
                borderColor: item.completed ? typeColor : themeMode === 'light' ? `${typeColor}80` : theme.colors.border,
                borderWidth: item.completed ? 0 : 2,
                ...(themeMode === 'light' && !item.completed ? {
                  shadowColor: typeColor,
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.2,
                  shadowRadius: 2,
                  elevation: 2,
                } : {})
              }
            ]}>
              {item.completed && (
                <Ionicons name="checkmark" size={18} color="#fff" />
              )}
            </View>
          </View>
          <View style={styles.todoTextContainer}>
            <Text
              style={[
                styles.todoText,
                { 
                  color: theme.colors.text,
                  textDecorationLine: item.completed ? 'line-through' : 'none',
                  opacity: item.completed ? 0.6 : 1,
                  fontWeight: item.completed ? '400' : '500'
                }
              ]}
            >
              {item.text}
            </Text>
          </View>
          <View style={styles.rightContainer}>
            <View style={[styles.taskTypeBadge, { 
              backgroundColor: item.completed ? `${typeColor}80` : typeColor,
              ...(themeMode === 'light' ? {
                shadowColor: typeColor,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.2,
                shadowRadius: 2,
                elevation: 2,
              } : {})
            }]}>
              <Ionicons name={typeIcon} size={12} color="#fff" />
              <Text style={styles.taskTypeText}>{taskType.replace('-', ' ')}</Text>
            </View>
            {isEditMode && (
              <View style={styles.editButtons}>
                <TouchableOpacity
                  style={[styles.editButton, { 
                    backgroundColor: theme.colors.primary,
                    ...(themeMode === 'light' ? {
                      shadowColor: theme.colors.primary,
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.2,
                      shadowRadius: 2,
                      elevation: 2,
                    } : {})
                  }]}
                  onPress={() => {/* TODO: Implement edit */}}
                >
                  <Ionicons name="create-outline" size={16} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.editButton, { 
                    backgroundColor: theme.colors.error,
                    ...(themeMode === 'light' ? {
                      shadowColor: theme.colors.error,
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.2,
                      shadowRadius: 2,
                      elevation: 2,
                    } : {})
                  }]}
                  onPress={() => deleteTodo(item.id)}
                >
                  <Ionicons name="trash-outline" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, { 
            backgroundColor: theme.colors.surface,
            color: theme.colors.text,
            borderColor: theme.colors.border 
          }]}
          placeholder="Add a new task..."
          placeholderTextColor={theme.colors.textSecondary}
          value={newTodo}
          onChangeText={setNewTodo}
          onSubmitEditing={addTodo}
        />
        <TouchableOpacity 
          style={[styles.typeButton, { backgroundColor: taskTypeColors[selectedType] }]}
          onPress={() => setShowTypeModal(true)}
        >
          <Ionicons name={taskTypeIcons[selectedType]} size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
          onPress={addTodo}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={todos}
        keyExtractor={(item) => item.id}
        renderItem={renderTodoItem}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {renderTypeSelector()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 32,
  },
  header: {
    paddingHorizontal: getTheme('dark').spacing.lg,
    marginBottom: getTheme('dark').spacing.lg,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: getTheme('dark').spacing.xs,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    padding: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: getTheme('dark').spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: getTheme('dark').colors.border,
  },
  input: {
    flex: 1,
    height: 40,
    padding: getTheme('dark').spacing.sm,
    borderRadius: getTheme('dark').borderRadius.md,
    marginRight: getTheme('dark').spacing.sm,
  },
  typeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: getTheme('dark').spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: getTheme('dark').spacing.md,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: getTheme('dark').spacing.md,
    borderRadius: getTheme('dark').borderRadius.md,
    marginBottom: getTheme('dark').spacing.sm,
    borderWidth: 1,
  },
  todoContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxContainer: {
    marginRight: getTheme('dark').spacing.md,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  todoTextContainer: {
    flex: 1,
  },
  todoText: {
    fontSize: 16,
    lineHeight: 24,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  taskTypeContainer: {
    marginTop: getTheme('dark').spacing.xs,
  },
  taskTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getTheme('dark').spacing.sm,
    paddingVertical: getTheme('dark').spacing.xs,
    borderRadius: getTheme('dark').borderRadius.sm,
    alignSelf: 'flex-start',
  },
  taskTypeText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: getTheme('dark').spacing.xs,
    textTransform: 'capitalize',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeModal: {
    width: '80%',
    padding: getTheme('dark').spacing.lg,
    borderRadius: getTheme('dark').borderRadius.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: getTheme('dark').spacing.md,
    borderRadius: getTheme('dark').borderRadius.md,
    marginBottom: getTheme('dark').spacing.sm,
  },
  typeText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: getTheme('dark').spacing.sm,
    textTransform: 'capitalize',
  },
}); 