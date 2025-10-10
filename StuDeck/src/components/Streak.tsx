import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  streakDays: number;
  completedDays: string[];
};

function getStreakMessage(streak: number) {
  if (streak >= 200) return `Legendary! ${streak} days and counting‼️`;
  if (streak >= 100) return `Incredible! ${streak} days and counting‼️`;
  if (streak >= 50) return `Amazing! ${streak} days and counting‼️`;
  if (streak >= 20) return `Superb! ${streak} days‼️`;
  if (streak >= 10) return `Great job! ${streak} days and counting‼️`;
  if (streak >= 6) return `Looking Good! ${streak} days and counting ‼️`;
  return null;
}

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function Streak({ streakDays, completedDays }: Props) {
  const message = getStreakMessage(streakDays);

  return (
    <LinearGradient
      colors={["#0089EB", "#8f00ff"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Row with flame, streak, and motivation message at the end */}
      <View style={styles.streakRow}>
        <View style={styles.leftBlock}>
          <Ionicons name="flame" size={45} color="#f89771ff" />
          <View style={{ marginLeft: 3 }}>
            <Text style={styles.streakText}>{streakDays} days</Text>
            <Text style={styles.subText}>Study streak</Text>
          </View>
        </View>
        {message && <Text style={styles.motivational}>{message}</Text>}
      </View>

      {/* Week days row */}
      <View style={styles.weekRow}>
        {weekDays.map((day) => {
          const done = completedDays.includes(day);
          return (
            <View key={day} style={styles.dayItem}>
              <View
                style={[
                  styles.circle,
                  { backgroundColor: done ? "#0089EB" : "#374151" },
                ]}
              >
                {done && <Ionicons name="checkmark" size={14} color="white" />}
              </View>
              <Text style={styles.dayLabel}>{day}</Text>
            </View>
          );
        })}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    width: "100%",
  },
  motivational: {
    color: "#fff",
    fontFamily: 'Montserrat_700Bold',
    fontSize: 14,
    textAlign: "right",
    flexShrink: 1,
    flexWrap: 'wrap',
    maxWidth: '60%',
  },
  motivation: {
    flex: 1,
    justifyContent: 'center',
  },
  streakRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  leftBlock: {
    flexDirection: "row",
    alignItems: "center",
  },
  streakText: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    color: "white",
  },
  subText: {
    fontSize: 14,
    color: "#9ca3af",
    fontFamily: "Poppins_400Regular"
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayItem: {
    alignItems: "center",
  },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  dayLabel: {
    fontSize: 12,
    color: "white",
  },
});