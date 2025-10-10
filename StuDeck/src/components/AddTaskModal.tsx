import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as SecureStore from 'expo-secure-store';
import type { Task } from '../screens/Calendar'; // or wherever Task is defined

interface AddTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
  editTask?: Task | null; // <-- Add this line
}

interface CreateTaskData {
  title: string;
  description?: string;
  category: string;
  dueDate: Date;
  priority: 'low' | 'medium' | 'high';
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({
  visible,
  onClose,
  onTaskCreated,
  editTask,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [dueDate, setDueDate] = useState(new Date());
  const [dueTime, setDueTime] = useState(new Date());
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const API_BASE_URL = 'http://172.17.128.1:5000/api';

  const defaultCategories = [
    'Uni Assignment',
    'Job Interview',
    'Family',
    'Personal',
    'Work',
  ];

  const priorities: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high'];

  // Fetch existing categories from user's tasks
  useEffect(() => {
    if (visible) {
      fetchCategories();
    }
  }, [visible]);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);

      let accessToken = await SecureStore.getItemAsync('accessToken');
      let triedRefresh = false;

      const getCategories = async (token: string | null): Promise<string[]> => {
        if (!token) return defaultCategories;
        try {
          const response = await fetch(`${API_BASE_URL}/tasks`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const tasks: { category?: string }[] = await response.json();
            // Get unique categories from tasks, in order of appearance
            const taskCategories: string[] = [];
            tasks.forEach(task => {
              const cat = (task.category || "").trim();
              if (cat && !taskCategories.includes(cat)) {
                taskCategories.push(cat);
              }
            });
            // Add default categories that are not already present
            const combined = [...taskCategories, ...defaultCategories.filter(def => !taskCategories.includes(def))];
            return combined;
          } else if (response.status === 401 && !triedRefresh) {
            // Try refresh
            triedRefresh = true;
            const refreshToken = await SecureStore.getItemAsync('refreshToken');
            if (!refreshToken) return defaultCategories;
            const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refreshToken }),
            });
            if (refreshRes.ok) {
              const refreshData = await refreshRes.json();
              await SecureStore.setItemAsync('accessToken', refreshData.accessToken);
              await SecureStore.setItemAsync('refreshToken', refreshData.refreshToken);
              return await getCategories(refreshData.accessToken);
            } else {
              return defaultCategories;
            }
          } else {
            return defaultCategories;
          }
        } catch (error) {
          return defaultCategories;
        }
      };

      const categories = await getCategories(accessToken);
      setCategories(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories(defaultCategories);
    } finally {
      setLoadingCategories(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('');
    setNewCategory('');
    setShowNewCategoryInput(false);
    setDueDate(new Date());
    setDueTime(new Date());
    setPriority('medium');
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setDueTime(selectedTime);
    }
  };

  const handleAddNewCategory = () => {
    if (newCategory.trim()) {
      const trimmedCategory = newCategory.trim();
      if (!categories.includes(trimmedCategory)) {
        setCategories([...categories, trimmedCategory]);
      }
      setCategory(trimmedCategory);
      setNewCategory('');
      setShowNewCategoryInput(false);
    }
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a task title');
      return false;
    }
    if (!category.trim()) {
      Alert.alert('Validation Error', 'Please select or add a category');
      Alert.alert('Validation Error', 'Please select or add a category');
      return false;
    }
    
    // Combine date and time
    const combinedDateTime = new Date(dueDate);
    combinedDateTime.setHours(dueTime.getHours());
    combinedDateTime.setMinutes(dueTime.getMinutes());
    
    if (combinedDateTime < new Date()) {
      Alert.alert('Validation Error', 'Due date and time must be in the future');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const accessToken = await SecureStore.getItemAsync('accessToken');

      if (!accessToken) {
        Alert.alert('Error', 'You must be logged in to create tasks');
        setLoading(false);
        return;
      }

      // Combine date and time into a single Date object
      const combinedDateTime = new Date(dueDate);
      combinedDateTime.setHours(dueTime.getHours());
      combinedDateTime.setMinutes(dueTime.getMinutes());
      combinedDateTime.setSeconds(0);
      combinedDateTime.setMilliseconds(0);

      const taskData: CreateTaskData = {
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        dueDate: combinedDateTime,
        priority,
      };

      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(taskData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create task');
      }

      Alert.alert('Success', 'Task created successfully!');
      resetForm();
      onClose();

      if (onTaskCreated) {
        onTaskCreated();
      }
    } catch (error) {
      console.error('Error creating task:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to create task. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Reset and populate form fields when editTask or modal visibility changes
  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title);
      setDescription(editTask.description || '');
      setCategory(editTask.category);
      setPriority(editTask.priority);
      setDueDate(typeof editTask.dueDate === 'string' ? new Date(editTask.dueDate) : editTask.dueDate);
      // ...set other fields as needed
    } else {
      setTitle('');
      setDescription('');
      setCategory('');
      setPriority('medium');
      setDueDate(new Date());
      // ...reset fields for new task
    }
  }, [editTask, visible]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New Task</Text>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <Icon name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalBody}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Title Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Task Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter task title"
                value={title}
                onChangeText={setTitle}
                placeholderTextColor="#999"
                editable={!loading}
              />
            </View>

            {/* Description Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter task description (optional)"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                placeholderTextColor="#999"
                editable={!loading}
              />
            </View>

            {/* Category Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category *</Text>
              {loadingCategories ? (
                <ActivityIndicator size="small" color="#667eea" />
              ) : (
                <>
                  <View style={styles.categoryGrid}>
                    {categories.map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.categoryChip,
                          category === cat && styles.categoryChipSelected,
                        ]}
                        onPress={() => {
                          setCategory(cat);
                          setShowNewCategoryInput(false);
                        }}
                        disabled={loading}
                      >
                        <Text
                          style={[
                            styles.categoryChipText,
                            category === cat && styles.categoryChipTextSelected,
                          ]}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    
                    {/* Add New Category Button */}
                    <TouchableOpacity
                      style={[
                        styles.categoryChip,
                        styles.addCategoryChip,
                        showNewCategoryInput && styles.categoryChipSelected,
                      ]}
                      onPress={() => setShowNewCategoryInput(!showNewCategoryInput)}
                      disabled={loading}
                    >
                      <Icon name="add" size={16} color={showNewCategoryInput ? 'white' : '#667eea'} />
                      <Text
                        style={[
                          styles.categoryChipText,
                          showNewCategoryInput && styles.categoryChipTextSelected,
                        ]}
                      >
                        New
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* New Category Input */}
                  {showNewCategoryInput && (
                    <View style={styles.newCategoryContainer}>
                      <TextInput
                        style={styles.newCategoryInput}
                        placeholder="Enter new category name"
                        value={newCategory}
                        onChangeText={setNewCategory}
                        placeholderTextColor="#999"
                        editable={!loading}
                      />
                      <TouchableOpacity
                        style={styles.addCategoryButton}
                        onPress={handleAddNewCategory}
                        disabled={!newCategory.trim() || loading}
                      >
                        <Icon name="check" size={20} color="white" />
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </View>

            {/* Priority Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Priority</Text>
              <View style={styles.priorityRow}>
                {priorities.map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.priorityChip,
                      priority === p && styles.priorityChipSelected,
                      priority === p && p === 'high' && styles.priorityHigh,
                      priority === p && p === 'medium' && styles.priorityMedium,
                      priority === p && p === 'low' && styles.priorityLow,
                    ]}
                    onPress={() => setPriority(p)}
                    disabled={loading}
                  >
                    <Text
                      style={[
                        styles.priorityChipText,
                        priority === p && styles.priorityChipTextSelected,
                      ]}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Date Picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Due Date *</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
                disabled={loading}
              >
                <Icon name="calendar-today" size={20} color="#667eea" />
                <Text style={styles.dateButtonText}>
                  {dueDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Time Picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Due Time *</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowTimePicker(true)}
                disabled={loading}
              >
                <Icon name="access-time" size={20} color="#667eea" />
                <Text style={styles.dateButtonText}>
                  {dueTime.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={dueDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}

            {showTimePicker && (
              <DateTimePicker
                value={dueTime}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleTimeChange}
              />
            )}
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.submitButtonText}>Create Task</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Replace the entire StyleSheet.create() in AddTaskModal with this:

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#f0ecff',
    backgroundColor: '#fafafa',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: 'Montserrat_700Bold',
    color: '#8b5cf6',
    letterSpacing: 0.5,
  },
  modalBody: {
    padding: 24,
    maxHeight: 500,
  },
  inputGroup: {
    marginBottom: 22,
  },
  inputLabel: {
    fontSize: 15,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#1f2937',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  input: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Onest',
    color: '#111827',
    backgroundColor: '#fafafa',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryChip: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  addCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderColor: '#8b5cf6',
    borderStyle: 'dashed',
  },
  categoryChipSelected: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  categoryChipText: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#6b7280',
  },
  categoryChipTextSelected: {
    color: '#ffffff',
  },
  newCategoryContainer: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 10,
  },
  newCategoryInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#8b5cf6',
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    fontFamily: 'Onest',
    color: '#111827',
    backgroundColor: '#faf5ff',
  },
  addCategoryButton: {
    backgroundColor: '#8b5cf6',
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8b5cf6',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 12,
  },
  priorityChip: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  priorityChipSelected: {
    borderWidth: 2,
    transform: [{ scale: 1.05 }],
  },
  priorityHigh: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  priorityMedium: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
  },
  priorityLow: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  priorityChipText: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#6b7280',
  },
  priorityChipTextSelected: {
    color: '#ffffff',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    padding: 16,
    backgroundColor: '#fafafa',
    gap: 12,
  },
  dateButtonText: {
    fontSize: 16,
    fontFamily: 'Montserrat_500Medium',
    color: '#111827',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 10,
    gap: 14,
    borderTopWidth: 2,
    borderTopColor: '#f0ecff',
    backgroundColor: '#fafafa',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
    color: '#6b7280',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8b5cf6',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: {
    backgroundColor: '#d1d5db',
    shadowOpacity: 0,
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
});

export default AddTaskModal;
export type { AddTaskModalProps };