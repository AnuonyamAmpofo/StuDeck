
import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from "react-native";
import Streak from "../components/Streak"
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  return (
    // <SafeAreaView style={{paddingTop: 30}}>
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.appLogo}>StuDeck</Text>
        <View style={styles.headerIcons}>
          <Text style={styles.icon}>🔔</Text>
          <Text style={styles.icon}>👤</Text>
        </View>
      </View>

      {/* Urgent Task */}
      <View style={styles.urgentTask}>
        <Text style={styles.urgentTitle}>Most Urgent Task</Text>
        <Text style={styles.urgentText}>Finish Math Assignment 📘</Text>
      </View>

      {/* Streak Card */}
      <Streak streakDays={142} completedDays={["Mon", "Tue", "Wed", "Thu"]} />


      {/* Study Progress Section */}
      <Text style={styles.sectionTitle}>Your Courses</Text>
      <View style={styles.studyGrid}>
        <TouchableOpacity style={styles.studyCard}>
          <Text style={styles.courseName}>Math 101</Text>
          <Text style={styles.progress}>Progress: 60%</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.studyCard}>
          <Text style={styles.courseName}>History</Text>
          <Text style={styles.progress}>Progress: 20%</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.studyCard}>
          <Text style={styles.courseName}>Biology</Text>
          <Text style={styles.progress}>Progress: 40%</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.studyCard}>
          <Text style={styles.courseName}>CS 202 </Text>
          <Text style={styles.progress}>Progress: 75%</Text>
        </TouchableOpacity>
      </View>

      {/* Mini Calendar Placeholder */}
      <Text style={styles.sectionTitle}>Today’s Tasks</Text>
      <View style={styles.calendarBox}>
        <Text style={styles.calendarText}>📅 Mini Calendar Component Here</Text>
      </View>
    </ScrollView>
  // </SafeAreaView>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 20,
  },
  appLogo: {
    fontFamily: "Century Gothic",
    fontSize: 24,
    fontWeight: "400",
  },
  headerIcons: {
    flexDirection: "row",
    gap: 15,
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
  streakCard: {
    backgroundColor: "#e6f7ff",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  streakNumber: {
    fontFamily: "Onest",
    fontSize: 32,
    fontWeight :'bold',
    color: "#007acc",
  },
  streakLabel: {
    fontFamily: "Onest",
    fontSize: 14,
    color: "#555",
    marginTop: 4,
  },
  sectionTitle: {
    fontFamily: "Onest",
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  studyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  studyCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: "47%",
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  courseName: {
    fontFamily: "Onest",
    fontSize: 19,
    marginBottom: 8,
    // fontWeight: '700'
  },
  progress: {
    fontFamily: "Onest",
    fontSize: 14,
    color: "#666",
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
