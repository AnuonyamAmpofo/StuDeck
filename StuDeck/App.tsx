// App.tsx
import React, { useCallback } from "react";
import { Image } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useFonts as useMontserrat, Montserrat_400Regular, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { useFonts as usePoppins, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold, Poppins_900Black } from '@expo-google-fonts/poppins';
// import AppLoading from 'expo-app-loading';

// Screens
import HomeScreen from "./src/screens/Home";
import CalendarScreen from "./src/screens/Calendar";
import CourseScreen from "./src/screens/Course";
import FocusScreen from "./src/screens/Focus";
import AnalyticsScreen from "./src/screens/Analytics";

SplashScreen.preventAutoHideAsync();
const Tab = createBottomTabNavigator();


export default function App() {
  const [onestLoaded] = useFonts({
    Onest: require("./assets/fonts/Onest-VariableFont_wght.ttf"),
  });
  const [montserratLoaded] = useMontserrat({
    Montserrat_400Regular,
    // Montserrat_600SemiBold,
    Montserrat_700Bold,
  });
  const [poppinsLoaded] = usePoppins({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    Poppins_900Black,
  });

  const allFontsLoaded = onestLoaded && montserratLoaded && poppinsLoaded;

  const onLayoutRootView = useCallback(async () => {
    if (allFontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [allFontsLoaded]);

  if (!allFontsLoaded) {
    return null;
  }

  return (
    <NavigationContainer onReady={onLayoutRootView}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: { position: "absolute",
            bottom: 30,
            left: 20,
            right: 20,
            backgroundColor: "#fff",
            borderRadius: 50,
            height: 70,
            shadowColor: "#000",
            shadowOpacity: 0.1,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 10,
            elevation: 5,
            marginHorizontal: 7,
            // justifyContent:"center"

          },
          tabBarItemStyle:{
            justifyContent: "center",
            alignItems: "center",
            paddingVertical: 7,
          },
          tabBarLabelStyle: { fontFamily: "Montserrat_700Bold" },
          tabBarIcon: ({ focused, size }) => {
            let iconSource;

            if (route.name === "Home") {
              iconSource = require("./assets/icons/home.png");
            } else if (route.name === "Calendar") {
              iconSource = require("./assets/icons/calendar.png");
            } else if (route.name === "Courses") {
              iconSource = require("./assets/icons/course.png");
            } else if (route.name === "Focus") {
              iconSource = require("./assets/icons/focus.png");
            } else if (route.name === "Analytics") {
              iconSource = require("./assets/icons/analytics.png"); 
            }

            return (
              <Image
                source={iconSource}
                style={{
                  width: size,
                  height: size,
                  tintColor: focused ? "#2516f9ff" : "gray",
                }}
              />
            );
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Calendar" component={CalendarScreen} />
        <Tab.Screen name="Courses" component={CourseScreen} />
        <Tab.Screen name="Focus" component={FocusScreen} />
        <Tab.Screen name="Analytics" component={AnalyticsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
