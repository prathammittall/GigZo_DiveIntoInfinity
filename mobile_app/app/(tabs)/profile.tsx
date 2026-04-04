import React from "react";
import {
  Alert,
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  Brand,
  Neutral,
  Shadow,
  Radius,
  Spacing,
  Font,
} from "@/constants/theme";
import { useAppStore } from "@/store/useAppStore";
import { ModernNavBar } from "@/components/ModernNavBar";
import { useRouter } from "expo-router";
import { clearAccessToken } from "@/services/authStorage";
import { auth } from "@/services/firebaseAuth";
import { signOut as firebaseSignOut } from "firebase/auth";

type HistoryFilter = "ALL" | "RAIN" | "AQI" | "FLOOD";
type PayoutType = "RAIN" | "AQI" | "FLOOD";
type PayoutStatus = "PAID" | "VERIFIED" | "PENDING";

const FILTERS: HistoryFilter[] = ["ALL", "RAIN", "AQI", "FLOOD"];
const RUPEE = "\u20B9";

const SETTINGS = [
  {
    icon: "notifications-outline",
    label: "Notifications",
    sub: "Alert preferences",
  },
  {
    icon: "shield-outline",
    label: "Fraud Transparency",
    sub: "How we verify claims",
  },
  {
    icon: "help-circle-outline",
    label: "Help & Support",
    sub: "FAQs and contact",
  },
  {
    icon: "document-text-outline",
    label: "Policy Documents",
    sub: "Terms and coverage details",
  },
] as const;

const TYPE_ICONS: Record<
  PayoutType,
  React.ComponentProps<typeof Ionicons>["name"]
> = {
  RAIN: "rainy",
  AQI: "leaf",
  FLOOD: "water",
};

const typeIcon = (
  type: PayoutType,
): React.ComponentProps<typeof Ionicons>["name"] => TYPE_ICONS[type];

const statusColor = (status: PayoutStatus) => {
  switch (status) {
    case "PAID":
      return { text: Brand.primary, bg: Brand.primaryLight };
    case "VERIFIED":
      return { text: Brand.warning, bg: Brand.warningLight };
    case "PENDING":
      return { text: Brand.primaryDark, bg: Brand.surfaceTint };
    default:
      return { text: Neutral[500], bg: Neutral[100] };
  }
};

function HistoryItem({
  item,
}: {
  item: {
    id: string;
    type: PayoutType;
    title: string;
    date: string;
    amount: number;
    status: PayoutStatus;
  };
}) {
  const state = statusColor(item.status);

  return (
    <View style={styles.historyRow}>
      <View style={styles.historyIcon}>
        <Ionicons name={typeIcon(item.type)} size={18} color={Brand.primary} />
      </View>

      <View style={styles.historyBody}>
        <Text style={styles.historyTitle}>{item.title}</Text>
        <View style={styles.historyMetaRow}>
          <Text style={styles.historyDate}>{item.date}</Text>
          <View style={[styles.historyStatus, { backgroundColor: state.bg }]}>
            <Text style={[styles.historyStatusText, { color: state.text }]}>
              {item.status}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.historyRight}>
        <Text style={styles.historyAmount}>
          {item.status === "PAID" ? "+" : ""}
          {RUPEE}
          {item.amount}
        </Text>
        <Text style={styles.historyType}>{item.type}</Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const {
    user,
    historyFilter,
    setHistoryFilter,
    payoutHistory,
    historyStats,
    resetSession,
  } = useAppStore();

  const handleSignOut = () => {
    Alert.alert("Sign out", "Do you want to sign out from this device?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          try {
            await clearAccessToken();
            await firebaseSignOut(auth);
          } catch (_error) {
            // Ignore provider sign-out errors and still reset local session.
          } finally {
            resetSession();
            router.replace("/onboarding/welcome");
          }
        },
      },
    ]);
  };

  const filtered =
    historyFilter === "ALL"
      ? payoutHistory
      : payoutHistory.filter((item) => item.type === historyFilter);

  const initials = (user.name || "Gig Worker")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ModernNavBar
        title="Profile"
        showLogo={false}
        showProfile={false}
        backgroundColor={Brand.canvasStrong}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.profileHero}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarWrap}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>

            <View style={styles.profileCopy}>
              <Text style={styles.profileName}>
                {user.name || "Gig Worker"}
              </Text>
              <Text style={styles.profileSub}>
                {(user.platform || "Gig") + " rider"} {"\u2022"}{" "}
                {user.zone || "No zone"}
              </Text>
              <Text style={styles.profilePhone}>{user.phone}</Text>
            </View>
          </View>

          <View style={styles.profilePlanStrip}>
            <View>
              <Text style={styles.profilePlanLabel}>Active plan</Text>
              <Text style={styles.profilePlanValue}>
                Pro {"\u2022"} {RUPEE}
                {user.coveragePerDay}/day
              </Text>
            </View>
            <TouchableOpacity activeOpacity={0.85} style={styles.renewButton}>
              <Text style={styles.renewButtonText}>Renew</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsRow}>
          {[
            {
              label: "Total received",
              value: `${RUPEE}${historyStats.totalReceived.toLocaleString()}`,
            },
            { label: "Claims paid", value: `${historyStats.claimsPaid}` },
            { label: "Pending", value: `${historyStats.pending}` },
          ].map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionEyebrow}>Payout history</Text>
          <Text style={styles.sectionTitle}>
            Clean record of every protection event
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {FILTERS.map((filter) => (
              <TouchableOpacity
                key={filter}
                activeOpacity={0.85}
                onPress={() => setHistoryFilter(filter)}
                style={[
                  styles.filterChip,
                  historyFilter === filter && styles.filterChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    historyFilter === filter && styles.filterChipTextActive,
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.historyList}>
            {filtered.map((item) => (
              <HistoryItem key={item.id} item={item as any} />
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionEyebrow}>Settings</Text>
          <Text style={styles.sectionTitle}>Account tools and support</Text>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.editProfileCta}
            onPress={() => router.push("/(tabs)/edit-profile")}
          >
            <View style={styles.editProfileLeft}>
              <View style={styles.editProfileIcon}>
                <Ionicons
                  name="create-outline"
                  size={18}
                  color={Neutral.white}
                />
              </View>
              <View>
                <Text style={styles.editProfileTitle}>Edit profile</Text>
                <Text style={styles.editProfileSub}>
                  Update rider details and work info
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Neutral.white} />
          </TouchableOpacity>

          <View style={styles.settingList}>
            {SETTINGS.map((setting) => (
              <TouchableOpacity
                key={setting.label}
                activeOpacity={0.85}
                style={styles.settingRow}
              >
                <View style={styles.settingIcon}>
                  <Ionicons
                    name={setting.icon}
                    size={18}
                    color={Brand.primary}
                  />
                </View>
                <View style={styles.settingCopy}>
                  <Text style={styles.settingLabel}>{setting.label}</Text>
                  <Text style={styles.settingSub}>{setting.sub}</Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={Neutral[400]}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.86}
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <Ionicons name="log-out-outline" size={16} color={Brand.danger} />
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.canvas,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: 140,
    gap: Spacing.lg,
  },
  profileHero: {
    backgroundColor: Brand.primaryDark,
    borderRadius: Radius.xxl,
    padding: Spacing.xl,
    ...Shadow.lg,
  },
  profileHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  avatarWrap: {
    width: 74,
    height: 74,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  avatarText: {
    fontFamily: Font.display,
    fontSize: 24,
    color: Neutral.white,
    letterSpacing: -0.4,
  },
  profileCopy: {
    flex: 1,
  },
  profileName: {
    fontFamily: Font.display,
    fontSize: 28,
    color: Neutral.white,
    letterSpacing: -0.9,
    marginBottom: 4,
  },
  profileSub: {
    fontFamily: Font.medium,
    fontSize: 14,
    color: "rgba(255,255,255,0.72)",
    marginBottom: 3,
  },
  profilePhone: {
    fontFamily: Font.medium,
    fontSize: 13,
    color: "rgba(255,255,255,0.58)",
  },
  profilePlanStrip: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  profilePlanLabel: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: "rgba(255,255,255,0.60)",
    marginBottom: 4,
  },
  profilePlanValue: {
    fontFamily: Font.semiBold,
    fontSize: 16,
    color: Neutral.white,
  },
  renewButton: {
    backgroundColor: Neutral.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: Radius.full,
  },
  renewButtonText: {
    fontFamily: Font.semiBold,
    fontSize: 13,
    color: Brand.primaryDark,
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  statCard: {
    minWidth: 96,
    flexGrow: 1,
    backgroundColor: Neutral.white,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Brand.line,
    ...Shadow.sm,
  },
  statValue: {
    fontFamily: Font.display,
    fontSize: 18,
    color: Neutral[900],
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: Font.medium,
    fontSize: 11,
    color: Neutral[500],
    lineHeight: 16,
  },
  card: {
    backgroundColor: Neutral.white,
    borderRadius: Radius.xxl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Brand.line,
    ...Shadow.sm,
  },
  sectionEyebrow: {
    fontFamily: Font.semiBold,
    fontSize: 11,
    color: Neutral[500],
    letterSpacing: 1.1,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  sectionTitle: {
    fontFamily: Font.semiBold,
    fontSize: 22,
    color: Neutral[900],
    letterSpacing: -0.6,
    marginBottom: Spacing.lg,
  },
  editProfileCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Brand.primary,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
  },
  editProfileLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  editProfileIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  editProfileTitle: {
    fontFamily: Font.semiBold,
    fontSize: 14,
    color: Neutral.white,
  },
  editProfileSub: {
    fontFamily: Font.medium,
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    marginTop: 1,
  },
  filterRow: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  filterChip: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: Radius.full,
    backgroundColor: Brand.surfaceAlt,
  },
  filterChipActive: {
    backgroundColor: Brand.primary,
  },
  filterChipText: {
    fontFamily: Font.semiBold,
    fontSize: 12,
    color: Neutral[600],
  },
  filterChipTextActive: {
    color: Neutral.white,
  },
  historyList: {
    gap: 10,
  },
  historyRow: {
    flexDirection: "row",
    gap: Spacing.md,
    alignItems: "flex-start",
    backgroundColor: Brand.surfaceAlt,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  historyIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: Brand.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  historyBody: {
    flex: 1,
    minWidth: 0,
  },
  historyTitle: {
    fontFamily: Font.semiBold,
    fontSize: 14,
    color: Neutral[900],
    marginBottom: 5,
  },
  historyMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  historyDate: {
    fontFamily: Font.medium,
    fontSize: 11,
    color: Neutral[500],
  },
  historyStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  historyStatusText: {
    fontFamily: Font.semiBold,
    fontSize: 10,
  },
  historyRight: {
    alignItems: "flex-end",
    gap: 3,
    minWidth: 64,
  },
  historyAmount: {
    fontFamily: Font.display,
    fontSize: 15,
    color: Neutral[900],
  },
  historyType: {
    fontFamily: Font.semiBold,
    fontSize: 10,
    color: Neutral[500],
    letterSpacing: 0.6,
  },
  settingList: {
    gap: 10,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    backgroundColor: Brand.surfaceAlt,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  settingIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: Brand.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  settingCopy: {
    flex: 1,
  },
  settingLabel: {
    fontFamily: Font.semiBold,
    fontSize: 14,
    color: Neutral[900],
    marginBottom: 3,
  },
  settingSub: {
    fontFamily: Font.medium,
    fontSize: 11,
    color: Neutral[500],
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Neutral.white,
    borderRadius: Radius.xl,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "#F2C8BF",
    ...Shadow.sm,
  },
  signOutText: {
    fontFamily: Font.semiBold,
    fontSize: 14,
    color: Brand.danger,
  },
});
