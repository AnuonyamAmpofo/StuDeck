import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as SecureStore from 'expo-secure-store';
import {jwtDecode} from "jwt-decode";
import AddTaskModal from "../components/AddTaskModal";
// import { API_BASE_URL } from '@env';

// Type definitions
interface Task {
  _id: string;
  id?: string;
  title: string;
  description?: string;
  category: string;
  status: 'urgent' | 'pending' | 'completed' | 'overdue';
  dueDate: string | Date;
  icon?: string;
  userId: string;
}

interface TaskGridProps {
  onMorePress?: () => void;
  onAddPress?: () => void;
  onTaskPress?: (task: Task) => void;
  refreshFlag?: boolean;
  navigation?: any; // <-- Add this line
}

interface TaskCardProps {
  task: Task;
  onPress: () => void;
}

interface TasksCardProps {
  refreshFlag?: boolean;
}

// Individual Task Card Component
const TaskCard: React.FC<TaskCardProps> = ({ task, onPress }) => {
  const getGradientColors = (category: string): [string, string] => {
    const colors: Record<string, [string, string]> = {
      'uni assignment': ['#4169E1', '#1E90FF'],
      'assignment': ['#4169E1', '#1E90FF'],
      'job interview': ['#32CD32', '#90EE90'],
      'interview': ['#32CD32', '#90EE90'],
      'family dinner': ['#8B4789', '#9370DB'],
      'family': ['#8B4789', '#9370DB'],
      'personal': ['#FF6B6B', '#FF8E8E'],
      'work': ['#0037ffff', '#4e4e4eff'],
      'default': ['#667eea', '#764ba2'],
    };

    const lowerCategory = category.toLowerCase();
    for (const key in colors) {
      if (lowerCategory.includes(key)) {
        return colors[key];
      }
    }
    return colors.default;
  };

  const getIconName = (category: string): string => {
    const lowerCategory = category.toLowerCase();
    if (lowerCategory.includes('assignment') || lowerCategory.includes('uni')) return 'book';
    if (lowerCategory.includes('job') || lowerCategory.includes('interview')) return 'work';
    if (lowerCategory.includes('family') || lowerCategory.includes('dinner')) return 'group';
    if (lowerCategory.includes('personal')) return 'person';
    return 'event';
  };

  const formatTimeLeft = (dueDate: string | Date): string => {
    try {
      const now = new Date();
      const due = new Date(dueDate);
      
      if (isNaN(due.getTime())) return 'Invalid date';
      
      const diffTime = due.getTime() - now.getTime();
      const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
      
      if (diffHours < 0) return 'Overdue';
      if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
      
      const diffDays = Math.ceil(diffHours / 24);
      return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <TouchableOpacity style={styles.taskCard} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={getGradientColors(task.category)}
        style={styles.taskGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Decorative blob */}
        <View style={styles.decorativeBlob} />
        
        {/* Status badge */}
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>
            {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
          </Text>
        </View>

        {/* Icon */}
        <View style={styles.iconContainer}>
          <Icon name={getIconName(task.category)} size={32} color="white" />
        </View>

        {/* Title */}
        <Text style={styles.taskTitle} numberOfLines={2}>
          {task.title}
        </Text>

        {/* Time */}
        <View style={styles.timeRow}>
          <Icon name="schedule" size={16} color="rgba(255,255,255,0.9)" />
          <Text style={styles.timeText}>{formatTimeLeft(task.dueDate)}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

// Main Task Grid Component
const TaskGrid: React.FC<TaskGridProps> = ({
  onMorePress,
  onAddPress,
  onTaskPress,
  refreshFlag,
  navigation,
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const API_BASE_URL = 'http://172.17.128.1:5000/api';

  // Fetch tasks from backend
  const fetchTasksWithAuth = async (): Promise<Task[]> => {
    let accessToken = await SecureStore.getItemAsync('accessToken');
    let triedRefresh = false;

    const getTasks = async (token: string | null): Promise<Task[]> => {
      if (!token) return [];
      try {
        const response = await fetch(`${API_BASE_URL}/tasks?limit=3`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          // console.log('Tasks response:', data);
          if (Array.isArray(data)) {
            return data.slice(0, 3);
          }
          return [];
        } else if (response.status === 401 && !triedRefresh) {
          // Try refresh
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
      } catch (err) {
        console.error('Error fetching tasks:', err);
        return [];
      }
    };

    return await getTasks(accessToken);
  };

  // Fetch tasks from backend
  const fetchTasks = async (): Promise<void> => {
    try {
      const accessToken = await SecureStore.getItemAsync('accessToken');
      
      if (!accessToken) {
        console.log('No access token found');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/tasks?limit=3`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // console.log('Tasks response:', data);
      
      if (data.success && data.tasks) {
        setTasks(data.tasks.slice(0, 3)); // Only take first 3
      } else if (Array.isArray(data)) {
        setTasks(data.slice(0, 3));
      } else {
        setTasks([]);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchTasksWithAuth().then(tasks => {
      const now = new Date();
      // Filter for pending and future tasks
      const filteredTasks = tasks.filter(
        task =>
          task.status === 'pending' &&
          new Date(task.dueDate).getTime() > now.getTime()
      );
      // Sort by soonest due date
      filteredTasks.sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      );
      setTasks(filteredTasks.slice(0, 3));
      setLoading(false);
    });
  }, [refreshFlag]);

  const handleTaskPress = (task: Task) => {
    if (onTaskPress) {
      onTaskPress(task);
    } else {
      Alert.alert(
        task.title,
        `Category: ${task.category}\nStatus: ${task.status}`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleMorePress = () => {
    if (navigation) {
      navigation.navigate('Calendar'); // <-- This navigates to the Calendar screen
    } else if (onMorePress) {
      onMorePress();
    } else {
      Alert.alert('More Tasks', 'Navigate to all tasks page');
    }
  };

  const handleAddPress = () => {
    setShowAddModal(true);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#667eea" />
      </View>
    );
  }

  return (
    <>
      <AddTaskModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onTaskCreated={() => {
          // Optionally, you can refresh tasks or trigger a reload here
          setShowAddModal(false);
        }}
        // Optionally: onTaskAdded={refreshTasks}
      />
      <View style={styles.grid}>
        {tasks.length === 0 ? (
          <View style={styles.noTasksContainer}>
            <Text style={styles.noTasksText}>No tasks</Text>
            <View style={styles.actionContainer}>
              <TouchableOpacity
                style={styles.moreCard}
                onPress={handleMorePress}
                activeOpacity={0.8}
              >
                <Text style={styles.btnText}>More</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity
                style={styles.addCard}
                onPress={handleAddPress}
                activeOpacity={0.8}
              >
                <Text style={styles.btnText}>+ Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {/* Render up to 3 tasks */}
            {tasks.slice(0, 3).map((task) => (
              <TaskCard
                key={task._id || task.id}
                task={task}
                onPress={() => handleTaskPress(task)}
              />
            ))}
            {/* Action Buttons Row (More + Add) */}
            <View style={styles.actionContainer}>
              <TouchableOpacity
                style={styles.moreCard}
                onPress={handleMorePress}
                activeOpacity={0.8}
              >
                <Text style={styles.btnText}>More</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity
                style={styles.addCard}
                onPress={handleAddPress}
                activeOpacity={0.8}
              >
                <Text style={styles.btnText}>+ Add</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 7,
  },
  taskCard: {
    width: '48%',
    marginBottom: 12,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    overflow: 'hidden',
    height: 160,
  },
  taskGradient: {
    padding: 16,
    height: '100%',
    position: 'relative',
  },
  decorativeBlob: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontFamily: "Poppins_400Regular",
    textTransform: 'uppercase',
  },
  iconContainer: {
    marginBottom: 8,
  },
  taskTitle: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    marginBottom: 8,
    lineHeight: 20,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    marginLeft: 4,
    fontFamily: "Onest",
  },
  placeholderCard: {
    width: '48%',
    height: 160,
    backgroundColor: '#e5e7eb',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  placeholderText: {
    fontSize: 16,
    color: '#9ca3af',
    fontWeight: '600',
  },
  actionContainer: {
    width: '48%',
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    // borderWidth: 2,
    // borderColor: '#e0e0e0',
    // backgroundColor: 'white',
  },
  divider: {
    height: 7,
    // backgroundColor: '#e0e0e0',
  },
  moreCard: {
    flex: 1,
    backgroundColor: '#9ca3af',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  addCard: {
    flex: 1,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    
  },
  btnText: {
    color: 'white',
    fontFamily: "Poppins_500Medium",
    fontSize: 16,
    justifyContent: "center"
  },
  noTasksContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  noTasksText: {
    fontSize: 18,
    color: '#9ca3af',
    fontWeight: '600',
    marginBottom: 16,
  },
});

export default TaskGrid;
export type { Task, TaskGridProps };