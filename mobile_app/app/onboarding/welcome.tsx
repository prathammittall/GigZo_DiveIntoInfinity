import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  Brand,
  Font,
  Neutral,
  Radius,
  Shadow,
  Spacing,
} from "@/constants/theme";
import { GigzoBackdrop, GigzoButton, GigzoLockup } from "@/components/gigzo-ui";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <GigzoBackdrop />

      <View style={styles.content}>
        <View style={styles.topBrand}>
          <GigzoLockup />
        </View>

        <View style={styles.heroCard}>
          <View style={styles.badge}>
            <Ionicons name="sparkles-outline" size={14} color={Neutral.white} />
            <Text style={styles.badgeText}>Gig worker protection</Text>
          </View>

          <Text style={styles.title}>
            Protect each shift, not just the month.
          </Text>
          <Text style={styles.sub}>
            Fast onboarding, trusted payouts, and profile-first protection for
            Zomato, Swiggy, and more.
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>50K+</Text>
              <Text style={styles.statLabel}>Workers covered</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>2 hrs</Text>
              <Text style={styles.statLabel}>Payout promise</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <GigzoButton
            label="Get started"
            icon="arrow-forward"
            onPress={() => router.push("/onboarding/auth-options")}
          />
          <Text style={styles.note}>
            No long forms here. You can fill extra details later.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.canvas,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    justifyContent: "space-between",
    gap: Spacing.lg,
  },
  topBrand: {
    alignSelf: "flex-start",
    marginTop: Spacing.sm,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: Radius.xxl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.96)",
    ...Shadow.sm,
  },
  heroCard: {
    backgroundColor: Brand.primaryDark,
    borderRadius: Radius.xxl,
    padding: Spacing.xl,
    ...Shadow.md,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: Spacing.lg,
  },
  badgeText: {
    fontFamily: Font.semiBold,
    fontSize: 12,
    color: Neutral.white,
  },
  title: {
    fontFamily: Font.display,
    fontSize: 33,
    lineHeight: 39,
    color: Neutral.white,
    letterSpacing: -1,
    marginBottom: Spacing.sm,
  },
  sub: {
    fontFamily: Font.medium,
    fontSize: 14,
    lineHeight: 21,
    color: "rgba(255,255,255,0.75)",
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  statValue: {
    fontFamily: Font.display,
    fontSize: 24,
    color: Neutral.white,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },
  footer: {
    gap: Spacing.sm,
  },
  note: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: Neutral[500],
    textAlign: "center",
  },
});
