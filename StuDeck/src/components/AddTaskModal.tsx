// components/AddTaskModal.tsx
import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";

type TaskShape = {
  title: string;
  time: Date;
  repeat: string;
  day: string;
  course?: string;
  category?: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (task: TaskShape) => void;
  // optional lists if you want to pass courses/categories as pickers later:
  courses?: string[];
  categories?: string[];
};

export default function AddTaskModal({ visible, onClose, onSave, courses = [], categories = [] }: Props) {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [repeat, setRepeat] = useState("Never");
  const [showRepeatOptions, setShowRepeatOptions] = useState(false);
  const [day, setDay] = useState("Monday");
  const [course, setCourse] = useState(courses.length ? courses[0] : "");
  const [category, setCategory] = useState(categories.length ? categories[0] : "");

  const reset = () => {
    setTitle("");
    setTime(new Date());
    setRepeat("Never");
    setShowRepeatOptions(false);
    setDay("Monday");
    setCourse(courses.length ? courses[0] : "");
    setCategory(categories.length ? categories[0] : "");
  };

  const handleSave = () => {
    if (!title.trim()) return; // require title
    onSave({ title: title.trim(), time, repeat, day, course, category });
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.header}>Add Task</Text>

          {/* Task Title - full width */}
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Task title"
            placeholderTextColor="#9ca3af"
            style={styles.titleInput}
          />

          {/* Row: Time (left) & Repeat (right) */}
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.smallInput, styles.timeInput]}
              onPress={() => setShowTimePicker(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.smallText}>
                ⏰ {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.smallInput, styles.repeatInput]}
              onPress={() => setShowRepeatOptions((s) => !s)}
              activeOpacity={0.8}
            >
              <Text style={styles.smallText}>Repeat: {repeat}</Text>
            </TouchableOpacity>
          </View>

          {/* Day selector below time (aligned left width same as time) */}
          <View style={styles.row}>
            <View style={[styles.smallInput, styles.timeInput, { marginTop: 8 }]}>
              <Picker
                selectedValue={day}
                onValueChange={(v) => setDay(String(v))}
                style={{ height: 32, width: "100%" }}
                itemStyle={{ fontSize: 13 }}
              >
                <Picker.Item label="Monday" value="Monday" />
                <Picker.Item label="Tuesday" value="Tuesday" />
                <Picker.Item label="Wednesday" value="Wednesday" />
                <Picker.Item label="Thursday" value="Thursday" />
                <Picker.Item label="Friday" value="Friday" />
                <Picker.Item label="Saturday" value="Saturday" />
                <Picker.Item label="Sunday" value="Sunday" />
              </Picker>
            </View>

            {/* empty placeholder to keep layout identical to wireframe */}
            <View style={{ flex: 0.32 }} />
          </View>

          {/* If user tapped repeat, show quick options (wireframe style) */}
          {showRepeatOptions && (
            <View style={styles.repeatOptions}>
              {["Never", "Daily", "Weekly", "Monthly"].map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={styles.repeatOption}
                  onPress={() => {
                    setRepeat(opt);
                    setShowRepeatOptions(false);
                  }}
                >
                  <Text style={{ color: "#111827" }}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Add Course (full width small) */}
          <TextInput
            value={course}
            onChangeText={setCourse}
            placeholder="Add course (optional)"
            placeholderTextColor="#9ca3af"
            style={styles.smallFull}
          />

          {/* Add Category (full width small) */}
          <TextInput
            value={category}
            onChangeText={setCategory}
            placeholder="Add category (optional)"
            placeholderTextColor="#9ca3af"
            style={styles.smallFull}
          />

          {/* Buttons row: Cancel (text) + Save (filled) */}
          <View style={styles.actions}>
            <TouchableOpacity onPress={() => { reset(); onClose(); }}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>

          {/* Native time picker */}
          {showTimePicker && (
            <DateTimePicker
              value={time}
              mode="time"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              is24Hour={false}
              onChange={(_, selected) => {
                setShowTimePicker(false);
                if (selected) setTime(selected);
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    maxWidth: 720,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 20,
  },
  header: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
    color: "#111827",
  },
  titleInput: {
    height: 45, // wireframe
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 12,
    marginBottom: 12,
    color: "#111827",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  smallInput: {
    height: 32, // wireframe
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 10,
    justifyContent: "center",
  },
  timeInput: {
    flex: 0.68,
    marginRight: 10,
  },
  repeatInput: {
    flex: 0.32,
  },
  smallText: {
    fontSize: 13,
    color: "#111827",
  },
  repeatOptions: {
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 12,
    overflow: "hidden",
  },
  repeatOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e6e6e6",
  },
  smallFull: {
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 10,
    justifyContent: "center",
    marginTop: 12,
    color: "#111827",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 16,
    gap: 12,
  },
  cancelText: {
    color: "#6b7280",
    fontSize: 15,
  },
  saveBtn: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});
