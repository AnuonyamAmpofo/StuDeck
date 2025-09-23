// ...existing code...
//     <View style={styles.container}>
//       <Text style={styles.fire}>🔥</Text>
//       <View style={styles.motivation}>
//         <Text style={styles.text}>{streak}-day streak</Text>
//         {message && <Text>{message}</Text>}
//       </View>
//       <TouchableOpacity onPress={() => setStreak(streak + 1)}>
//         <Text style={styles.add}>+ Add Day</Text>
//       </TouchableOpacity>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   motivation: {
//     flex: 1,
//     flexDirection: 'column',
//     justifyContent: 'center',
//   },
//   container: {
//     flexDirection: "row",
    
//     alignItems: "center",
//     // margin: 16,
//     backgroundColor: "#fef3c7",
//     padding: 12,
//     borderRadius: 12,
//   },
//   fire: {
//     fontSize: 28,
//     marginRight: 8,
//   },
//   text: {
//     fontSize: 18,
//     fontFamily: "Onest",
//     flex: 1,
//   },
//   add: {
//     fontSize: 16,
//     fontFamily: "Onest",
//     color: "#f97316",
//     fontWeight: "600",
//   },
// });


// src/components/Streak.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons"; // expo install @expo/vector-icons

type Props = {
  streakDays: number;
  completedDays: string[]; // e.g. ["Mon", "Tue", "Wed"]
};

function getStreakMessage(streak: number) {
    if (streak >= 200) return "Legendary! 200+ days!";
    if (streak >= 100) return "Incredible! 100+ days!";
    if (streak >= 50) return "Amazing! 50+ days!";
    if (streak >= 20) return `Superb! ${streak} days‼️`;
    if (streak >= 10) return `Great job! ${streak} days and counting‼️`;
    if (streak >= 6) return `Looking Good! ${streak} days and counting ‼️`;
    return null;
}

// ...existing code...

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function Streak({ streakDays, completedDays }: Props) {
  const message = getStreakMessage(streakDays);
  return (
    <View style={styles.container}>
      {/* Row with flame, streak, and motivation message at the end */}
      <View style={styles.streakRow}>
        <View style={styles.leftBlock}>
          <Ionicons name="flame" size={28} color="#f89771ff" />
          <View style={{ marginLeft: 8 }}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#111827",
    padding: 16,
    borderRadius: 16,
    width: "100%",
  },
  motivational:{
    color: "#fff",
    fontFamily: "Onset",
    fontSize: 16
  },
   motivation: {
    flex: 1,
    flexDirection: 'column',
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
    fontFamily: "Century",
    fontWeight: "bold",
    color: "white",
  },
  subText: {
    fontSize: 14,
    color: "#9ca3af",
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
