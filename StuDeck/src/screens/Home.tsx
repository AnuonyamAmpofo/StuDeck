import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from "react-native";
import Streak from "../components/Streak";
import AddTaskModal from "../components/AddTaskModal";

export default function HomeScreen() {

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.logoSect}>
        <Image source={require("../../assets/Studeck Logo.png")} style={styles.logo}/>
        <Text style={styles.appLogo}>Studeck</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity>
          <Text style={styles.icon}>🔔</Text>
          </TouchableOpacity>

          <TouchableOpacity>
            <Text style={styles.icon}>👤</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Urgent Task */}
      <View style={styles.urgentTask}>
        <Text style={styles.urgentTitle}>Up Next...</Text>
        <Text style={styles.urgentText}>Finish Math Assignment 📘</Text>
      </View>

      {/* Streak Card */}
      <Streak streakDays={142} completedDays={["Mon", "Tue", "Wed"]} />

      {/* Tasks Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Tasks</Text>

        <View style={styles.taskGrid}>
          {/* Task 1 */}
          <View style={styles.taskCard}>
            <Text style={styles.taskText}>Task 1</Text>
          </View>

          {/* Task 2 */}
          <View style={styles.taskCard}>
            <Text style={styles.taskText}>Task 2</Text>
          </View>

          {/* Task 3 */}
          <View style={styles.taskCard}>
            <Text style={styles.taskText}>Task 3</Text>
          </View>

          {/* More + Add Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.taskCard, styles.moreCard]}>
              <Text style={styles.btnText}>More</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.taskCard, styles.addCard]}>
              <Text style={styles.btnText}>+ Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Mini Calendar Placeholder */}
      <Text style={styles.sectionTitle}>Today’s Tasks</Text>
      <View style={styles.calendarBox}>
        <Text style={styles.calendarText}>📅 Mini Calendar Component Here</Text>
      </View>
    </ScrollView>
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
    marginVertical: 20,
  },
  logoSect:{
    flexDirection: "row",
    alignItems: "center"
  },
  appLogo: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 24,
    // fontWeight: "400",
  },
  logo: {
    width:70,
    height: 50 
  },
  headerIcons: {
    flexDirection: "row",
    gap: 15,
    alignItems: "center"
  },
  icon: {
    fontSize: 20,
  },

  urgentTask: {
    backgroundColor: "#ffe6e6",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  urgentTitle: {
    fontFamily: "Onest",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
  },
  urgentText: {
    fontFamily: "Onest",
    fontSize: 14,
  },

  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontFamily: "Onest",
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
});
