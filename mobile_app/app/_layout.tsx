import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Redirect, Stack, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { useFonts } from "expo-font";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { useAppStore } from "@/store/useAppStore";
import { getAccessToken, clearAccessToken } from "@/services/authStorage";
import { getMyProfile } from "@/services/userApi";

const GigZoTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#02555d",
    background: "#f7f8fa",
    card: "#ffffff",
    text: "#111827",
    border: "#e5e7eb",
  },
};

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const segments = useSegments();
  const [sessionChecked, setSessionChecked] = useState(false);
  const [fontsLoaded] = useFonts({
    "Inter-Regular": Inter_400Regular,
    "Inter-Medium": Inter_500Medium,
    "Inter-SemiBold": Inter_600SemiBold,
    "Inter-Bold": Inter_700Bold,
  });
  const { isOnboarded, hasHydrated, setUser, setOnboarded } = useAppStore();

  useEffect(() => {
    let mounted = true;

    const bootstrapSession = async () => {
      if (!hasHydrated) {
        return;
      }

      try {
        const token = await getAccessToken();
        if (!token) {
          if (mounted) {
            setSessionChecked(true);
          }
          return;
        }

        const profile = await getMyProfile();
        if (mounted) {
          setUser({
            id: profile.id,
            phone: profile.phone,
            name: profile.name || "",
            platform: profile.platform || "Zomato",
            city: profile.city || "",
            zone: profile.zone || "",
            coveragePerDay: profile.coveragePerDay || 0,
            activePlan: profile.activePlan || "basic",
            isProtected: profile.isProtected,
            workerId: profile.workerId,
            type: profile.type,
            pincode: profile.pincode,
            workingArea: profile.workingArea,
            age: profile.age,
            workingHoursPerDay: profile.workingHoursPerDay,
            avgDailyEarning: profile.avgDailyEarning,
          });
          setOnboarded(true);
        }
      } catch (_error) {
        await clearAccessToken();
        if (mounted) {
          setOnboarded(false);
        }
      } finally {
        if (mounted) {
          setSessionChecked(true);
        }
      }
    };

    void bootstrapSession();

    return () => {
      mounted = false;
    };
  }, [hasHydrated, setOnboarded, setUser]);

  if (!fontsLoaded || !hasHydrated || !sessionChecked) {
    return <View style={{ flex: 1, backgroundColor: "#f7f8fa" }} />;
  }

  const isInOnboarding = segments[0] === "onboarding";

  return (
    <ThemeProvider value={GigZoTheme}>
      <StatusBar style="dark" backgroundColor="#ffffff" />
      {!isOnboarded && !isInOnboarding && (
        <Redirect href="/onboarding/welcome" />
      )}
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
    </ThemeProvider>
  );
}
