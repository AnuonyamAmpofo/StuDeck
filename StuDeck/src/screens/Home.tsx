import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, StatusBar, Alert } from "react-native";
import Streak from "../components/Streak";
import AddTaskModal from "../components/AddTaskModal";
import AssignmentsList from "../components/TasksCard";
import { jwtDecode } from "jwt-decode";
import * as SecureStore from "expo-secure-store";
import type { Task } from "../components/TasksCard";
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
// import { API_BASE_URL } from '@env';



const API_BASE_URL = 'http://172.31.144.1:5000/api';
type HomeScreenProps = BottomTabScreenProps<any, 'Home'> & {
  onLogout: () => void;
};

export default function HomeScreen({ navigation, onLogout, route }: HomeScreenProps & { route?: any }) {
  const [username, setUsername] = useState("...");
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshTasksFlag, setRefreshTasksFlag] = useState(false);
  const [mostUrgentTask, setMostUrgentTask] = useState<Task | null>(null);

  // --- Streak state ---
  const [streakDays, setStreakDays] = useState(0);
  const [completedDays, setCompletedDays] = useState<string[]>([]);
  const [streakLoading, setStreakLoading] = useState(true);

  useEffect(() => {
    // Listen for navigation param to trigger streak refresh
    if (route?.params?.refreshStreak) {
      setRefreshTasksFlag(flag => !flag);
      navigation.setParams({ refreshStreak: false }); // Clear the param
    }
  }, [route?.params?.refreshStreak]);
  // --- Fetch streak data ---
  useEffect(() => {
    const fetchStreak = async () => {
      setStreakLoading(true);
      const accessToken = await SecureStore.getItemAsync("accessToken");
      const userId = await SecureStore.getItemAsync("userId");
      if (!accessToken || !userId) {
        setStreakDays(0);
        setCompletedDays([]);
        setStreakLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE_URL}/streak/${userId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setStreakDays(data.streakDays);
          setCompletedDays(data.completedDays);
        } else {
          setStreakDays(0);
          setCompletedDays([]);
        }
      } catch {
        setStreakDays(0);
        setCompletedDays([]);
      }
      setStreakLoading(false);
    };
    fetchStreak();
  }, [refreshTasksFlag]);

  useEffect(() => {
    const fetchUsername = async () => {
      let accessToken = await SecureStore.getItemAsync('accessToken');
      let triedRefresh = false;

      const getUsername = async (token: string | null) => {
        if (!token) return false;
        try {
          const res = await fetch(`${API_BASE_URL}/users/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (res.ok) {
            const data = await res.json();
            setUsername(data.username);
            setError(null);
            return true;
          } else if (res.status === 401 && !triedRefresh) {
            // Token expired, try refresh
            triedRefresh = true;
            const refreshToken = await SecureStore.getItemAsync('refreshToken');
            if (!refreshToken) {
              setError("Session expired. Please log in again.");
              setUsername("Guest");
              return false;
            }
            // Get new access token
            const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refreshToken }),
            });
            if (refreshRes.ok) {
              const refreshData = await refreshRes.json();
              await SecureStore.setItemAsync('accessToken', refreshData.accessToken);
              await SecureStore.setItemAsync('refreshToken', refreshData.refreshToken);
              // Retry with new access token
              return await getUsername(refreshData.accessToken);
            } else {
              setError("Session expired. Please log in again.");
              setUsername("Guest");
              return false;
            }
          } else {
            const errData = await res.json().catch(() => ({}));
            setError(errData.message || `Error: ${res.status}`);
            setUsername("Guest");
            return false;
          }
        } catch (err: any) {
          setError(err.message || "Network error");
          setUsername("Guest");
          return false;
        }
      };

      await getUsername(accessToken);
    };
    fetchUsername();
  }, [refreshTasksFlag]);

  useEffect(() => {
    const logTokenInfo = async () => {
      const accessToken = await SecureStore.getItemAsync('accessToken');
      if (accessToken) {
        const decoded = jwtDecode(accessToken);
        console.log("Decoded access token:", decoded);
      }
    };
    logTokenInfo();
  }, []);

  const handleTaskCreated = () => {
    setRefreshTasksFlag(flag => !flag);
  };

  useEffect(() => {
    const fetchMostUrgentTask = async () => {
      let accessToken = await SecureStore.getItemAsync('accessToken');
      let triedRefresh = false;

      const getTasks = async (token: string | null): Promise<Task[]> => {
        if (!token) return [];
        try {
          const res = await fetch(`${API_BASE_URL}/tasks`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (res.ok) {
            const tasks: Task[] = await res.json();
            return tasks;
          } else if (res.status === 401 && !triedRefresh) {
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
        } catch {
          return [];
        }
      };

      const allTasks = await getTasks(accessToken);
      const now = new Date();
      const pendingTasks = allTasks
        .filter(
          task =>
            task.status === 'pending' &&
            new Date(task.dueDate).getTime() > now.getTime()
        )
        .sort(
          (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        );
      setMostUrgentTask(pendingTasks[0] || null);
    };

    fetchMostUrgentTask();
  }, [refreshTasksFlag]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.logoSect}>
          <Image source={require("../../assets/Studeck Logo.png")} style={styles.logo}/>
          <Text style={styles.appLogo}>{username}</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity>
            <Text style={styles.icon}>🔔</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.logoutButtonSmall}
            onPress={() => {
              Alert.alert(
                "Log out",
                "Are you sure you want to log out?",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Log out",
                    style: "destructive",
                    onPress: async () => {
                      await SecureStore.deleteItemAsync('accessToken');
                      await SecureStore.deleteItemAsync('refreshToken');
                      setUsername("Guest");
                      setError(null);
                      onLogout();
                    },
                  },
                ],
                { cancelable: true }
              );
            }}
          >
            <Text style={styles.logoutButtonSmallText}>Log out</Text>
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: 40,
          // paddingHorizontal: 20,
          paddingVertical: 20,
          // paddingTop:10,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Urgent Task */}
        <View style={styles.urgentTaskCard}>
          <View style={styles.urgentTaskHeader}>
            <Text style={styles.urgentTaskIcon}>⏰</Text>
            <Text style={styles.urgentTaskTitle}>Up Next</Text>
          </View>
          {mostUrgentTask ? (
            <>
              <Text style={styles.urgentTaskName}>{mostUrgentTask.title}</Text>
              {mostUrgentTask.category ? (
                <Text style={styles.urgentTaskCategory}>{mostUrgentTask.category}</Text>
              ) : null}
              <Text style={styles.urgentTaskDue}>
                Due: {new Date(mostUrgentTask.dueDate).toLocaleString()}
              </Text>
            </>
          ) : (
            <Text style={styles.urgentTaskEmpty}>No upcoming tasks 🎉</Text>
          )}
        </View>

        {/* Streak Card */}
        {streakLoading ? (
          <View style={[styles.urgentTaskCard, { alignItems: "center", justifyContent: "center" }]}>
            <Text style={{ color: "#fff" }}>Loading streak...</Text>
          </View>
        ) : (
          <Streak streakDays={streakDays} completedDays={completedDays} />
        )}

        {/* Tasks Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Tasks</Text>
          <AssignmentsList navigation={navigation} refreshFlag={refreshTasksFlag} />
        </View>

        {/* Mini Calendar Placeholder */}
        <Text style={styles.sectionTitle}>Today’s Task</Text>
        <View style={styles.calendarBox}>
          <Text style={styles.calendarText}>📅 Mini Calendar Component Here</Text>
        </View>

        <AddTaskModal
          visible={showAddModal}
          onClose={() => setShowAddModal(false)}
          onTaskCreated={handleTaskCreated}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 10,
    paddingBottom: 7
  },
  logoSect:{
    flexDirection: "row",
    alignItems: "center"
  },
  appLogo: {
    fontFamily: "Onest",
    fontSize: 18,
    // fontWeight: "400",
    alignItems: "center",
    justifyContent: "center",
    // marginVertical: 30,
  },
  logo: {
    width: 65,
    height: 40, 
  },
  headerIcons: {
    flexDirection: "row",
    gap: 15,
    alignItems: "center"
  },
  icon: {
    fontSize: 20,
  },
// Replace these styles in your StyleSheet.create():

urgentTaskCard: {
  backgroundColor: "#8b5cf6",
  borderRadius: 16,
  padding: 16,
  marginBottom: 20,
  shadowColor: "#000000ff",
  shadowOpacity: 0.7,
  shadowOffset: { width: 7, height: 9 },
  shadowRadius: 12,
  elevation: 8,
  borderLeftWidth: 5,
  borderLeftColor: "#fbbf24",
},
urgentTaskHeader: {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 10,
},
urgentTaskIcon: {
  fontSize: 20,
  marginRight: 6,
},
urgentTaskTitle: {
  fontFamily: "Montserrat_700Bold",
  fontSize: 14,
  color: "#fbbf24",
  letterSpacing: 1.2,
  textTransform: "uppercase",
},
urgentTaskName: {
  fontFamily: "Montserrat_700Bold",
  fontSize: 18,
  color: "#ffffff",
  marginBottom: 6,
  lineHeight: 24,
},
urgentTaskCategory: {
  fontFamily: "Montserrat_600SemiBold",
  fontSize: 11,
  color: "#8b5cf6",
  backgroundColor: "#fbbf24",
  paddingHorizontal: 12,
  paddingVertical: 4,
  borderRadius: 12,
  alignSelf: "flex-start",
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: 0.5,
},
urgentTaskDue: {
  fontFamily: "Onest",
  fontSize: 13,
  color: "#fef3c7",
  marginTop: 2,
},
urgentTaskEmpty: {
  fontFamily: "Onest",
  fontSize: 15,
  color: "#e9d5ff",
  textAlign: "center",
  marginTop: 4,
},

  section: {
    marginTop: 30,
  },
  sectionTitle: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 18,
    // fontWeight: "bold",
    marginBottom: 10,
  },

  taskGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 7,
  },
  taskCard: {
    backgroundColor: "#e5e7eb",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: "48%",
    maxWidth: "48%",
    marginBottom: 12,
    height: 70
  },
  taskText: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: "#111827",
  },

  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    minWidth: "48%",
    maxWidth: "48%",
    marginBottom: 12,
  },
  moreCard: {
    backgroundColor: "#9ca3af",
    flex: 1,
    // marginRight: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  addCard: {
    backgroundColor: "#3b82f6",
    flex: 1,
    marginLeft: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  btnText: {
    color: "white",
    fontFamily: 'Montserrat_700Bold',
    // fontWeight: "bold",
    fontSize: 14,
  },

  calendarBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  calendarText: {
    fontFamily: "Onest",
    fontSize: 14,
    color: "#777",
  },

  logoutButton: {
    backgroundColor: "#ef4444",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 10,
    marginHorizontal: 0,
  },
  logoutButtonText: {
    color: "#fff",
    fontFamily: "Montserrat_700Bold",
    fontSize: 16,
    letterSpacing: 1,
  },
  logoutButtonSmall: {
    backgroundColor: "#ef4444",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutButtonSmallText: {
    color: "#fff",
    fontFamily: "Montserrat_700Bold",
    fontSize: 14,
  },
});

interface TaskGridProps {
  onMorePress?: () => void;
  onAddPress?: () => void;
  onTaskPress?: (task: Task) => void;
  refreshFlag?: boolean;
  navigation?: any; // <-- Add this
}
