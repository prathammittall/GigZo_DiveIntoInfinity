import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Brand,
  Neutral,
  Shadow,
  Spacing,
  Font,
} from "@/constants/theme";
import { useAppStore } from "@/store/useAppStore";
import { GigzoLogoMark } from "@/components/gigzo-ui";

type ModernNavBarProps = {
  title?: string;
  showLogo?: boolean;
  showNotifications?: boolean;
  showProfile?: boolean;
  backgroundColor?: string;
  transparent?: boolean;
  children?: React.ReactNode;
};

function ActionButton({
  icon,
  onPress,
  transparent,
  showDot = false,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  onPress?: () => void;
  transparent: boolean;
  showDot?: boolean;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      style={[
        styles.actionButton,
        transparent && styles.actionButtonTransparent,
      ]}
    >
      <Ionicons
        name={icon}
        size={18}
        color={transparent ? Neutral.white : Neutral[700]}
      />
      {showDot ? <View style={styles.notificationDot} /> : null}
    </TouchableOpacity>
  );
}

export function ModernNavBar({
  title,
  showLogo = true,
  showNotifications = true,
  showProfile = true,
  backgroundColor = Brand.canvasStrong,
  transparent = false,
  children,
}: ModernNavBarProps) {
  const router = useRouter();
  const { user } = useAppStore();

  const initials =
    user?.name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  const textPrimary = transparent ? Neutral.white : Neutral[900];
  const textSecondary = transparent ? "rgba(255,255,255,0.84)" : Neutral[500];

  return (
    <>
      <StatusBar
        barStyle={transparent ? "light-content" : "dark-content"}
        backgroundColor={transparent ? "transparent" : backgroundColor}
        translucent={transparent}
      />
      <SafeAreaView
        edges={["top"]}
        style={[
          styles.safeArea,
          { backgroundColor: transparent ? "transparent" : backgroundColor },
        ]}
      >
        <View style={styles.shell}>
          <View style={styles.leftBlock}>
            {showLogo ? (
              <View style={styles.locationRow}>
                <GigzoLogoMark
                  size={34}
                  inverted={transparent}
                  style={styles.logoMark}
                />
                <View style={styles.locationCopy}>
                  <View style={styles.locationLabelRow}>
                    <Ionicons
                      name="location"
                      size={11}
                      color={transparent ? Neutral.white : Brand.primary}
                    />
                    <Text
                      style={[styles.locationLabel, { color: textSecondary }]}
                      numberOfLines={1}
                    >
                      Current location
                    </Text>
                  </View>
                  <View style={styles.locationTitleRow}>
                    <Text
                      style={[styles.locationTitle, { color: textPrimary }]}
                      numberOfLines={1}
                    >
                      {user.zone}
                    </Text>
                    <Ionicons
                      name="chevron-down"
                      size={14}
                      color={transparent ? Neutral.white : Neutral[500]}
                    />
                  </View>
                  <Text
                    style={[styles.locationMeta, { color: textSecondary }]}
                    numberOfLines={1}
                  >
                    {user.city} • {user.platform}
                  </Text>
                </View>
              </View>
            ) : title ? (
              <View style={styles.titleRow}>
                <View style={styles.titleBlock}>
                  <Text
                    style={[styles.title, { color: textPrimary }]}
                    numberOfLines={1}
                  >
                    {title}
                  </Text>
                  <Text
                    style={[styles.titleMeta, { color: textSecondary }]}
                    numberOfLines={1}
                  >
                    {user.zone}, {user.city}
                  </Text>
                </View>
              </View>
            ) : null}
            {children}
          </View>

          <View style={styles.actionsRow}>
            {showNotifications ? (
              <ActionButton
                icon="notifications-outline"
                transparent={transparent}
                showDot
              />
            ) : null}

            {showProfile ? (
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={() => router.push("/(tabs)/profile")}
                style={[
                  styles.profileButton,
                  transparent && styles.profileButtonTransparent,
                ]}
              >
                <Text
                  style={[
                    styles.profileText,
                    transparent && styles.profileTextTransparent,
                  ]}
                >
                  {initials}
                </Text>
                {user?.isProtected ? <View style={styles.profileDot} /> : null}
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    zIndex: 10,
  },
  shell: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: 2,
    paddingBottom: 10,
    gap: Spacing.sm,
  },
  leftBlock: {
    flex: 1,
    minWidth: 0,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoMark: {
    ...Shadow.sm,
  },
  locationCopy: {
    flex: 1,
    minWidth: 0,
  },
  locationLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationLabel: {
    fontFamily: Font.medium,
    fontSize: 10,
    marginBottom: 1,
  },
  locationTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  locationTitle: {
    flexShrink: 1,
    fontFamily: Font.display,
    fontSize: 19,
    letterSpacing: -0.6,
  },
  locationMeta: {
    fontFamily: Font.medium,
    fontSize: 11,
    marginTop: 1,
  },
  titleRow: {
    minWidth: 0,
  },
  titleBlock: {
    minWidth: 0,
  },
  title: {
    fontFamily: Font.display,
    fontSize: 24,
    letterSpacing: -0.9,
  },
  titleMeta: {
    fontFamily: Font.medium,
    fontSize: 12,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Neutral.white,
    borderWidth: 1,
    borderColor: "rgba(2,85,93,0.08)",
    ...Shadow.sm,
  },
  actionButtonTransparent: {
    backgroundColor: "rgba(255,255,255,0.20)",
    borderColor: "rgba(255,255,255,0.18)",
  },
  notificationDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Brand.danger,
    borderWidth: 1.5,
    borderColor: Neutral.white,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Brand.primary,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.82)",
    ...Shadow.md,
  },
  profileButtonTransparent: {
    backgroundColor: "rgba(255,255,255,0.30)",
    borderColor: "rgba(255,255,255,0.92)",
  },
  profileText: {
    fontFamily: Font.bold,
    fontSize: 14,
    color: Neutral.white,
  },
  profileTextTransparent: {
    color: Neutral.white,
  },
  profileDot: {
    position: "absolute",
    right: 3,
    bottom: 3,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: Brand.success,
    borderWidth: 1.5,
    borderColor: Neutral.white,
  },
});
