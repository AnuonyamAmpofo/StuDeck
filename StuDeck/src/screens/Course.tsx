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
  TextInput,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '@env';

interface Course {
  _id: string;
  name: string;
  description?: string;
  color: string;
  decks: [];
  // cardCount: number;
  userId: string;
  createdAt: string;
}

interface CoursesScreenProps {
  navigation?: any;
}

const CourseScreen: React.FC<CoursesScreenProps> = ({ navigation }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseDescription, setNewCourseDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState('#4169E1');

  // const API_BASE_URL = 'http://192.168.128.1:5000/api';

  const courseColors = [
    '#4169E1', '#FF6B6B', '#32CD32', '#FFD700',
    '#FF69B4', '#8B4789', '#FF8C00', '#20B2AA',
  ];

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      let accessToken = await SecureStore.getItemAsync('accessToken');
      let triedRefresh = false;

      const getCourses = async (token: string | null): Promise<Course[]> => {
        if (!token) return [];
        try {
          const response = await fetch(`${API_BASE_URL}/courses`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            return Array.isArray(data) ? data : data.courses || [];
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
              return await getCourses(refreshData.accessToken);
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

      const data = await getCourses(accessToken);
      setCourses(data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async () => {
    if (!newCourseName.trim()) {
      Alert.alert('Error', 'Please enter a course name');
      return;
    }

    let accessToken = await SecureStore.getItemAsync('accessToken');
    let triedRefresh = false;

    const createCourse = async (token: string | null): Promise<boolean> => {
      if (!token) return false;
      try {
        const response = await fetch(`${API_BASE_URL}/courses`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: newCourseName.trim(),
            description: newCourseDescription.trim(),
            color: selectedColor,
          }),
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
            return await createCourse(refreshData.accessToken);
          } else {
            return false;
          }
        } else {
          const data = await response.json();
          Alert.alert('Error', data.message || 'Failed to create course');
          return false;
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to create course');
        return false;
      }
    };

    try {
      const success = await createCourse(accessToken);
      if (success) {
        Alert.alert('Success', 'Course created successfully!');
        setNewCourseName('');
        setNewCourseDescription('');
        setSelectedColor('#4169E1');
        setModalVisible(false);
        fetchCourses();
      }
    } catch (error) {
      console.error('Error creating course:', error);
      Alert.alert('Error', 'Failed to create course');
    }
  };

  const navigateToCourse = (course: Course) => {
    if (navigation) {
      navigation.navigate('CourseDetails', { courseId: course._id, courseName: course.name });
    }
  };

  const renderCourseCard = (course: Course) => {
    return (
      <TouchableOpacity
        key={course._id}
        style={styles.courseCard}
        onPress={() => navigateToCourse(course)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[course.color, `${course.color}CC`]}
          style={styles.courseGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.courseHeader}>
            <Text style={styles.courseName}>{course.name}</Text>
            <Icon name="chevron-right" size={24} color="white" />
          </View>

          {course.description && (
            <Text style={styles.courseDescription} numberOfLines={2}>
              {course.description}
            </Text>
          )}

          <View style={styles.courseStats}>
            <View style={styles.statItem}>
              <Icon name="style" size={18} color="rgba(255,255,255,0.9)" />
              <Text style={styles.statText}>{course.decks.length || 0} Decks</Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="credit-card" size={18} color="rgba(255,255,255,0.9)" />
              {/* <Text style={styles.statText}>{course.cardCount || 0} Cards</Text> */}
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9f9f9" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Courses</Text>
          <Text style={styles.headerSubtitle}>Your study materials</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Icon name="add" size={28} color="white" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
        </View>
      ) : courses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="school" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No courses yet</Text>
          <Text style={styles.emptySubtext}>Create your first course to get started</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {courses.map(course => renderCourseCard(course))}
        </ScrollView>
      )}

      {/* Create Course Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Course</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Course Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Biology 101"
                  value={newCourseName}
                  onChangeText={setNewCourseName}
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Optional description"
                  value={newCourseDescription}
                  onChangeText={setNewCourseDescription}
                  multiline
                  numberOfLines={3}
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Course Color</Text>
                <View style={styles.colorGrid}>
                  {courseColors.map(color => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        selectedColor === color && styles.colorOptionSelected,
                      ]}
                      onPress={() => setSelectedColor(color)}
                    >
                      {selectedColor === color && (
                        <Icon name="check" size={20} color="white" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.createButton}
                onPress={handleCreateCourse}
              >
                <Text style={styles.createButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Replace the entire StyleSheet.create() in CourseScreen with this:

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
  headerTitle: {
    fontSize: 32,
    fontFamily: 'Montserrat_700Bold',
    color: '#0089EB',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Onest',
    color: '#888',
    marginTop: 4,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0089EB',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#0089EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  courseCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  courseGradient: {
    padding: 20,
    minHeight: 150,
    position: 'relative',
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  courseName: {
    fontSize: 22,
    fontFamily: 'Montserrat_700Bold',
    color: '#fff',
    flex: 1,
  },
  courseDescription: {
    fontSize: 14,
    fontFamily: 'Onest',
    color: 'rgba(255,255,255,0.95)',
    marginBottom: 16,
    lineHeight: 20,
  },
  courseStats: {
    flexDirection: 'row',
    gap: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    fontFamily: 'Montserrat_500Medium',
    color: 'rgba(255,255,255,0.95)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#fff',
  },
  emptyText: {
    fontSize: 20,
    fontFamily: 'Montserrat_700Bold',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Onest',
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
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
    color: '#0089EB',
    letterSpacing: 0.5,
  },
  modalBody: {
    padding: 24,
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
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#0089EB',
    transform: [{ scale: 1.1 }],
    elevation: 6,
    shadowColor: '#0089EB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
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
    backgroundColor: '#fff',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
    color: '#6b7280',
  },
  createButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: '#0089EB',
    alignItems: 'center',
    shadowColor: '#0089EB',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
  },
  createButtonText: {
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
});

export default CourseScreen;