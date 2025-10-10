import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as SecureStore from 'expo-secure-store';
import { Calendar } from 'react-native-calendars';
import AddTaskModal from '../components/AddTaskModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@env';

interface Task {
  _id: string;
  title: string;
  description?: string;
  category: string;
  status: 'urgent' | 'pending' | 'completed' | 'overdue';
  dueDate: string | Date;
  priority: 'low' | 'medium' | 'high';
  reminder?: string;
}

interface TasksCalendarScreenProps {
  navigation?: any;
}

type ViewMode = 'list' | 'calendar';

// App's main colors
const PRIMARY = "#0089EB";
const SECONDARY = "#8f00ff";

const CalendarScreen: React.FC<TasksCalendarScreenProps> = ({ navigation }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('User');
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [markedDates, setMarkedDates] = useState({});
  const [menuTaskId, setMenuTaskId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);

  const priorities: Array<'all' | 'low' | 'medium' | 'high'> = ['all', 'low', 'medium', 'high'];

  const API_BASE_URL = 'http://172.17.128.1:5000/api';
  const TASKS_CACHE_KEY = 'tasks_cache';

  useEffect(() => {
    loadUsername();
    fetchTasks();
  }, []);

  useEffect(() => {
    if (viewMode === 'calendar') {
      generateMarkedDates();
    }
  }, [tasks, viewMode]);

  useEffect(() => {
    if (viewMode === 'calendar' && !selectedDate) {
      const todayStr = new Date().toISOString().split('T')[0];
      setSelectedDate(todayStr);
    }
  }, [viewMode, selectedDate]);

  const loadUsername = async () => {
    const name = await SecureStore.getItemAsync('username');
    if (name) setUsername(name);
  };

  const fetchTasks = async (forceRefresh = false) => {
    try {
      setLoading(true);

      // 1. Try to load from cache first, unless forceRefresh is true
      if (!forceRefresh) {
        const cached = await AsyncStorage.getItem(TASKS_CACHE_KEY);
        if (cached) {
          setTasks(JSON.parse(cached));
        }
      }

      // 2. Always fetch from API if forceRefresh, or if cache is empty
      if (forceRefresh || !(await AsyncStorage.getItem(TASKS_CACHE_KEY))) {
        let accessToken = await SecureStore.getItemAsync('accessToken');
        let triedRefresh = false;

        const getTasks = async (token: string | null): Promise<Task[]> => {
          if (!token) return [];
          try {
            const response = await fetch(`${API_BASE_URL}/tasks`, {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });

            if (response.ok) {
              const data = await response.json();
              // Save to cache
              await AsyncStorage.setItem(TASKS_CACHE_KEY, JSON.stringify(data));
              setTasks(data);
              return Array.isArray(data) ? data : [];
            } else if (response.status === 401 && !triedRefresh) {
              // Try to refresh token
              triedRefresh = true;
              const refreshToken = await SecureStore.getItemAsync('refreshToken');
              if (!refreshToken) return [];
              const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken }),
              });
              if (refreshRes.ok) {
                const refreshData = await refreshRes.json();
                await SecureStore.setItemAsync('accessToken', refreshData.accessToken);
                await SecureStore.setItemAsync('refreshToken', refreshData.refreshToken);
                return await getTasks(refreshData.accessToken);
              } else {
                return [];
              }
            } else {
              return [];
            }
          } catch (error) {
            return [];
          }
        };

        await getTasks(accessToken);
      }

    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMarkedDates = () => {
    const marked: any = {};
    tasks.forEach(task => {
      const dateStr = new Date(task.dueDate).toISOString().split('T')[0];
      if (!marked[dateStr]) {
        marked[dateStr] = { dots: [] };
      }
      const color = getCategoryColor(task.category);
      marked[dateStr].dots.push({ color });
    });
    setMarkedDates(marked);
  };

  // Keep your original category color logic for tasks
  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      'school': '#4169E1',
      'uni assignment': '#4169E1',
      'work': '#32CD32',
      'job interview': '#32CD32',
      'personal': '#FF6B6B',
      'family': '#8B4789',
    };
    return colors[category?.toLowerCase?.()] || '#667eea';
  };

  // Keep your original gradient logic for tasks
  const getGradientColors = (category: string): [string, string] => {
    const colors: Record<string, [string, string]> = {
      'school': ['#4169E1', '#1E90FF'],
      'uni assignment': ['#4169E1', '#1E90FF'],
      'work': ['#32CD32', '#90EE90'],
      'job interview': ['#32CD32', '#90EE90'],
      'family': ['#8B4789', '#9370DB'],
      'personal': ['#FF6B6B', '#FF8E8E'],
    };
    return colors[category?.toLowerCase?.()] || [PRIMARY, SECONDARY];
  };

  const formatDateTime = (date: string | Date): { date: string; time: string } => {
    const d = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let dateStr = '';
    if (d.toDateString() === today.toDateString()) {
      dateStr = 'Today';
    } else if (d.toDateString() === tomorrow.toDateString()) {
      dateStr = 'Tomorrow';
    } else {
      dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }

    const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

    return { date: dateStr, time: timeStr };
  };

  // Get unique categories from tasks
  const userCategories = Array.from(
    new Set(tasks.map((task) => task.category).filter(Boolean))
  );

  const groupTasksByCategory = () => {
    const grouped: Record<string, Task[]> = {};
    let filteredTasks = tasks;

    if (selectedCategory) {
      filteredTasks = filteredTasks.filter(t => t.category === selectedCategory);
    }
    if (selectedPriority) {
      filteredTasks = filteredTasks.filter(t => t.priority === selectedPriority);
    }

    filteredTasks.forEach(task => {
      if (!grouped[task.category]) {
        grouped[task.category] = [];
      }
      grouped[task.category].push(task);
    });

    return grouped;
  };

  const getTasksForDate = (dateStr: string) => {
    return tasks.filter(task => {
      const taskDate = toDateString(task.dueDate);
      return (
        taskDate === dateStr &&
        (!selectedCategory || task.category === selectedCategory) &&
        (!selectedPriority || task.priority === selectedPriority)
      );
    });
  };

  const renderTaskCard = (task: Task) => {
    const { date, time } = formatDateTime(task.dueDate);

    return (
      <TouchableOpacity
        key={task._id}
        style={styles.taskCard}
        onPress={() => Alert.alert(task.title, task.description || 'No description')}
        activeOpacity={0.95}
      >
        <LinearGradient
          colors={getGradientColors(task.category)}
          style={styles.taskGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.decorativeBlob} />

          <View style={styles.taskHeader}>
            <View style={styles.taskTitleRow}>
              <Text style={styles.taskTitle}>{task.title}</Text>
              <Icon name="sync" size={18} color="#fff" />
            </View>
            <TouchableOpacity
              style={styles.moreButton}
              onPress={event => {
                // Get position for menu (optional, for absolute positioning)
                const { pageX, pageY } = event.nativeEvent;
                setMenuTaskId(task._id);
                setMenuPosition({ x: pageX, y: pageY });
              }}
            >
              <Icon name="more-horiz" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text style={styles.taskDueDate}>Due {date}, {time}</Text>

          <View style={styles.progressSection}>
            <Text style={styles.progressLabel}>Progress</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '25%' }]} />
            </View>
          </View>

          {task.reminder && (
            <View style={styles.reminderSection}>
              <Icon name="notifications-none" size={16} color="#fff" />
              <Text style={styles.reminderText}>Reminder: {task.reminder}</Text>
            </View>
          )}
        </LinearGradient>

        {/* 3-dot menu */}
        {menuTaskId === task._id && (
          <View style={[
            styles.menu,
            menuPosition
              ? { position: 'absolute', top: 40, right: 20, zIndex: 9999 }
              : {},
          ]}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuTaskId(null);
                setEditTask(task);
                setEditModalVisible(true);
              }}
            >
              <Text style={styles.menuItemText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleDeleteTask(task._id)}
            >
              <Text style={[styles.menuItemText, { color: '#e53935' }]}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setMenuTaskId(null)}
            >
              <Text style={styles.menuItemText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderListView = () => {
    const groupedTasks = groupTasksByCategory();

    return (
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {Object.keys(groupedTasks).map(category => (
          <View key={category} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category}</Text>
            {[...groupedTasks[category]]
              .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
              .map(task => renderTaskCard(task))}
          </View>
        ))}
      </ScrollView>
    );
  };

  const renderCalendarView = () => {
    return (
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Calendar
          theme={{
            backgroundColor: '#ffffffff',
            calendarBackground: '#fff',
            textSectionTitleColor: '#888',
            selectedDayBackgroundColor: PRIMARY,
            selectedDayTextColor: '#fff',
            todayTextColor: SECONDARY,
            dayTextColor: '#222',
            textDisabledColor: '#ccc',
            monthTextColor: '#222',
            textMonthFontWeight: 'bold',
            textMonthFontSize: 18,
            arrowColor: PRIMARY,
            textDayFontFamily: 'Onest',
            textMonthFontFamily: 'Montserrat_700Bold',
            textDayHeaderFontFamily: 'Montserrat_600SemiBold',
            textDayFontWeight: '400',
            textDayHeaderFontWeight: '600',
          }}
          markedDates={markedDates}
          markingType="multi-dot"
          onDayPress={(day) => {
            setSelectedDate(day.dateString);
          }}
        />

        {selectedDate && (
          <View style={styles.selectedDateTasks}>
            <Text style={styles.selectedDateTitle}>
              Tasks for {new Date(selectedDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
            {getTasksForDate(selectedDate)
              .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
              .map(task => renderTaskCard(task))}
          </View>
        )}
      </ScrollView>
    );
  };

  const handleDeleteTask = async (taskId: string) => {
    setMenuTaskId(null);
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            let accessToken = await SecureStore.getItemAsync('accessToken');
            let triedRefresh = false;

            const deleteTask = async (token: string | null): Promise<boolean> => {
              if (!token) return false;
              try {
                const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
                  method: 'DELETE',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                  },
                });
                if (response.ok) {
                  return true;
                } else if (response.status === 401 && !triedRefresh) {
                  // Try to refresh token
                  triedRefresh = true;
                  const refreshToken = await SecureStore.getItemAsync('refreshToken');
                  if (!refreshToken) return false;
                  const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ refreshToken }),
                  });
                  if (refreshRes.ok) {
                    const refreshData = await refreshRes.json();
                    await SecureStore.setItemAsync('accessToken', refreshData.accessToken);
                    await SecureStore.setItemAsync('refreshToken', refreshData.refreshToken);
                    return await deleteTask(refreshData.accessToken);
                  } else {
                    return false;
                  }
                } else {
                  return false;
                }
              } catch (error) {
                return false;
              }
            };

            try {
              const success = await deleteTask(accessToken);
              if (success) {
                // Remove from local state
                setTasks(prevTasks => {
                  const updated = prevTasks.filter(task => task._id !== taskId);
                  // Update cache as well
                  AsyncStorage.setItem(TASKS_CACHE_KEY, JSON.stringify(updated));
                  return updated;
                });
              } else {
                Alert.alert('Error', 'Failed to delete task.');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete task.');
            }
          },
        },
      ]
    );
  };

  function toDateString(date: string | Date): string {
    // Always returns YYYY-MM-DD in local time
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // console.log('selectedDate:', selectedDate);
  tasks.forEach(task => {
    const taskDate = new Date(task.dueDate).toISOString().split('T')[0];
    // console.log('task:', task.title, 'taskDate:', taskDate);
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appTitle}>Planners</Text>
        <TouchableOpacity style={styles.userButton}>
          <Icon name="person" size={16} color="#fff" />
          <Text style={styles.username}>{username}</Text>
        </TouchableOpacity>
      </View>

      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Tasks Overview</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            style={{ marginRight: 12 }}
            onPress={() => fetchTasks(true)} // Force refresh from API
          >
            <Icon name="refresh" size={28} color={PRIMARY} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <Icon name="add" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters & View Toggle */}
      <View style={styles.filtersRow}>
        {/* Category Dropdown */}
        <View style={{ position: 'relative' }}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowCategoryDropdown((prev) => !prev)}
          >
            <Text style={styles.filterText}>
              {selectedCategory ? selectedCategory : 'Category'}
            </Text>
            <Icon name="keyboard-arrow-down" size={20} color="#888" />
          </TouchableOpacity>
          {showCategoryDropdown && (
            <View style={styles.dropdown}>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setSelectedCategory(null);
                  setShowCategoryDropdown(false);
                }}
              >
                <Text style={[
                  styles.dropdownItemText,
                  !selectedCategory && { color: PRIMARY, fontWeight: 'bold' }
                ]}>
                  All
                </Text>
              </TouchableOpacity>
              {userCategories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSelectedCategory(category);
                    setShowCategoryDropdown(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    selectedCategory === category && { color: PRIMARY, fontWeight: 'bold' }
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Priority Dropdown */}
        <View style={{ position: 'relative' }}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowPriorityDropdown((prev) => !prev)}
          >
            <Text style={styles.filterText}>
              {selectedPriority
                ? selectedPriority === 'all'
                  ? 'All'
                  : selectedPriority.charAt(0).toUpperCase() + selectedPriority.slice(1)
                : 'Priority'}
            </Text>
            <Icon name="keyboard-arrow-down" size={20} color="#888" />
          </TouchableOpacity>
          {showPriorityDropdown && (
            <View style={styles.dropdown}>
              {priorities.map((priority) => (
                <TouchableOpacity
                  key={priority}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSelectedPriority(priority === 'all' ? null : priority);
                    setShowPriorityDropdown(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    (selectedPriority === priority || (priority === 'all' && !selectedPriority)) && { color: PRIMARY, fontWeight: 'bold' }
                  ]}>
                    {priority === 'all'
                      ? 'All'
                      : priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* View Toggle */}
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.viewButton, viewMode === 'list' && styles.viewButtonActive]}
            onPress={() => setViewMode('list')}
          >
            <Icon
              name="view-list"
              size={20}
              color={viewMode === 'list' ? '#fff' : PRIMARY}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewButton, viewMode === 'calendar' && styles.viewButtonActive]}
            onPress={() => setViewMode('calendar')}
          >
            <Icon
              name="calendar-today"
              size={20}
              color={viewMode === 'calendar' ? '#fff' : PRIMARY}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      ) : (
        viewMode === 'list' ? renderListView() : renderCalendarView()
      )}

      {/* Add Task Modal */}
      <AddTaskModal
        visible={editModalVisible}
        onClose={() => {
          setEditModalVisible(false);
          setEditTask(null);
        }}
        onTaskCreated={fetchTasks}
        editTask={editTask}
      />

      {/* {menuTaskId && (
        <TouchableOpacity+
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 9998,
          }}
          activeOpacity={1}
          onPress={() => setMenuTaskId(null)}
        />
      )} */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  appTitle: {
    fontSize: 32,
    color: PRIMARY,
    fontFamily: 'Montserrat_700Bold',
  },
  userButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SECONDARY,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    fontFamily: 'Montserrat_600SemiBold',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 16,
    color: '#888',
    fontFamily: 'Montserrat_600SemiBold',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
    backgroundColor: '#fff',
    zIndex: 10,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  filterText: {
    fontSize: 14,
    color: '#888',
    fontFamily: 'Onest',
  },
  viewToggle: {
    flexDirection: 'row',
    marginLeft: 'auto',
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    padding: 4,
  },
  viewButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  viewButtonActive: {
    backgroundColor: PRIMARY,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    marginBottom: 60,
    backgroundColor: '#fff',
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 18,
    color: PRIMARY,
    marginBottom: 12,
    fontFamily: 'Montserrat_700Bold',
  },
  taskCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  taskGradient: {
    padding: 20,
    position: 'relative',
    minHeight: 180,
  },
  decorativeBlob: {
    position: 'absolute',
    top: -50,
    right: -30,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  taskTitle: {
    fontSize: 20,
    color: '#fff',
    fontFamily: 'Montserrat_700Bold',
  },
  moreButton: {
    padding: 4,
  },
  taskDueDate: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 16,
    fontFamily: 'Onest',
  },
  progressSection: {
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 12,
    color: '#fff',
    marginBottom: 6,
    fontFamily: 'Onest',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: SECONDARY,
    borderRadius: 3,
  },
  reminderSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reminderText: {
    fontSize: 13,
    color: '#fff',
    fontFamily: 'Onest',
  },
  selectedDateTasks: {
    marginTop: 20,
  },
  selectedDateTitle: {
    fontSize: 18,
    color: PRIMARY,
    marginBottom: 16,
    fontFamily: 'Montserrat_700Bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
    marginTop: 8,
    overflow: 'hidden',
    zIndex: 1000,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'Onest',
  },
  menu: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 9999,
    minWidth: 120,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  menuItemText: {
    fontSize: 16,
    color: '#222',
    fontFamily: 'Onest',
  },
});

export default CalendarScreen;

export type { TasksCalendarScreenProps, Task };