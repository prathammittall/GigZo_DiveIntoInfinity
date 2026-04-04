import { Tabs } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Platform, Text, StyleSheet, Animated, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Brand, Neutral, Font } from "@/constants/theme";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

function TabIcon({
  name,
  color,
  focused,
  label,
}: {
  name: IoniconsName;
  color: string;
  focused: boolean;
  label: string;
}) {
  const animated = useRef({
    scale: new Animated.Value(focused ? 1 : 0.96),
    tint: new Animated.Value(focused ? 1 : 0),
  }).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(animated.scale, {
        toValue: focused ? 1 : 0.96,
        useNativeDriver: false,
        speed: 18,
        bounciness: 6,
      }),
      Animated.timing(animated.tint, {
        toValue: focused ? 1 : 0,
        duration: 180,
        useNativeDriver: false,
      }),
    ]).start();
  }, [animated, focused]);

  const activeBg = animated.tint.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(2,85,93,0)", "rgba(2,85,93,0.10)"],
  });

  return (
    <Animated.View
      style={[
        styles.tabItem,
        { transform: [{ scale: animated.scale }], backgroundColor: activeBg },
      ]}
    >
      <Animated.View
        style={[styles.iconWrap, focused && styles.iconWrapFocused]}
      >
        <Ionicons name={name} size={20} color={color} />
      </Animated.View>
      <Text
        style={[
          styles.tabLabel,
          { color, fontFamily: focused ? Font.semiBold : Font.medium },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Animated.View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: Brand.primary,
        tabBarInactiveTintColor: Neutral[400],
        tabBarStyle: {
          backgroundColor: "transparent",
          borderTopWidth: 0,
          height: Platform.OS === "ios" ? 100 : 86,
          paddingBottom: Platform.OS === "ios" ? 24 : 14,
          paddingTop: 21,
          paddingHorizontal: 22,
          elevation: 0,
          shadowOpacity: 0,
          position: "absolute",
        },
        tabBarBackground: () => (
          <View style={styles.dockBackdrop}>
            <View style={styles.dockShell} />
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? "home" : "home-outline"}
              color={color}
              focused={focused}
              label="Home"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="plans"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? "shield-checkmark" : "shield-checkmark-outline"}
              color={color}
              focused={focused}
              label="Plans"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="risk-map"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? "map" : "map-outline"}
              color={color}
              focused={focused}
              label="Map"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="claims"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? "flash" : "flash-outline"}
              color={color}
              focused={focused}
              label="Claims"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="edit-profile"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    flex: 1,
    minWidth: 72,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 24,
    minHeight: 52,
    marginTop: 10,
  },
  iconWrap: {
    width: 40,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
  },
  iconWrapFocused: {
    backgroundColor: "transparent",
  },
  tabLabel: {
    fontSize: 10.5,
    letterSpacing: 0.2,
    textAlign: "center",
    marginTop: 1,
  },
  dockBackdrop: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingTop: Platform.OS === "ios" ? 8 : 6,
    paddingBottom: Platform.OS === "ios" ? 2 : 0,
  },
  dockShell: {
    height: Platform.OS === "ios" ? 72 : 64,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderWidth: 1.5,
    borderColor: "rgba(2,85,93,0.14)",
    shadowColor: "#061A1C",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 16,
  },
});
