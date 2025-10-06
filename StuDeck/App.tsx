// App.tsx
import React, { useCallback, useState, useEffect } from "react";
import { Image } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import * as SecureStore from "expo-secure-store";
import { useFonts as useMontserrat, Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold, Montserrat_700Bold, Montserrat_800ExtraBold, Montserrat_900Black } from '@expo-google-fonts/montserrat';
import { useFonts as usePoppins, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold, Poppins_900Black } from '@expo-google-fonts/poppins';

// Screens
import LoginPage from "./src/screens/Login";
import SignupPage from "./src/screens/SignUp";
import HomeScreen from "./src/screens/Home";
import CalendarScreen from "./src/screens/Calendar";
import CourseScreen from "./src/screens/Course";
import CourseDetailsScreen from "./src/screens/CourseDetails";
import FocusScreen from "./src/screens/Focus";
import AnalyticsScreen from "./src/screens/Analytics";

SplashScreen.preventAutoHideAsync();
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

interface MainTabsProps {
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  setAccessToken: React.Dispatch<React.SetStateAction<string | null>>;
}

function MainTabs({ setIsLoggedIn, setAccessToken }: MainTabsProps) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          bottom: 20,
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
        },
        tabBarItemStyle: {
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
      <Tab.Screen
        name="Home"
        children={(props) => (
          <HomeScreen
            {...props}
            onLogout={() => {
              setIsLoggedIn(false);
              setAccessToken(null);
            }}
          />
        )}
      />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Courses" component={CourseScreen} />
      <Tab.Screen name="Focus" component={FocusScreen} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [onestLoaded] = useFonts({
    Onest: require("./assets/fonts/Onest-VariableFont_wght.ttf"),
  });
  const [montserratLoaded] = useMontserrat({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
    Montserrat_900Black
  });
  const [poppinsLoaded] = usePoppins({
    Poppins_400Regular,
    Poppins_500Medium,
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

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Try auto-login on app start
  useEffect(() => {
    const tryAutoLogin = async () => {
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      if (!refreshToken) return;
      try {
        const res = await fetch('http://172.28.0.1:5000/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (res.ok) {
          const data = await res.json();
          await SecureStore.setItemAsync('accessToken', data.accessToken); // <-- Add this!
          await SecureStore.setItemAsync('refreshToken', data.refreshToken);
          setAccessToken(data.accessToken);
          setIsLoggedIn(true);
        }
      } catch (err) {
        // Optionally handle error
      }
    };
    tryAutoLogin();
  }, []);

  if (!allFontsLoaded) {
    return null;
  }

  if (!isLoggedIn) {
    if (showSignup) {
      return (
        <SignupPage
          onNavigateToLogin={() => setShowSignup(false)}
          onSignUpSuccess={async (data) => {
            await SecureStore.setItemAsync('refreshToken', data.refreshToken);
            setAccessToken(data.accessToken);
            setIsLoggedIn(true);
            setShowSignup(false);
          }}
        />
      );
    }
    return (
      <LoginPage
        onLoginSuccess={async (data) => {
          await SecureStore.setItemAsync('refreshToken', data.refreshToken);
          setAccessToken(data.accessToken);
          setIsLoggedIn(true);
        }}
        onNavigateToSignup={() => setShowSignup(true)}
      />
    );
  }

  return (
    <NavigationContainer onReady={onLayoutRootView}>
      <Stack.Navigator>
        <Stack.Screen
          name="MainTabs"
          children={() => (
            <MainTabs setIsLoggedIn={setIsLoggedIn} setAccessToken={setAccessToken} />
          )}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CourseDetails"
          component={CourseDetailsScreen}
          options={{ headerShown: false}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
