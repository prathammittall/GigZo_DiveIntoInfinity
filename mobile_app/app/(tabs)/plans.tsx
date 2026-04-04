import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
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

const RUPEE = "\u20B9";

const PLAN_OPTIONS = [
  {
    id: "basic",
    name: "Basic",
    price: 40,
    period: "week",
    payoutPerDay: 300,
    features: [
      "Rain coverage up to 300/day",
      "AQI alert protection",
      "Weekly auto-renewal",
    ],
    recommended: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: 55,
    period: "week",
    payoutPerDay: 500,
    features: [
      "Rain and flood coverage",
      "AQI and curfew protection",
      "Priority payout processing",
    ],
    recommended: true,
  },
] as const;

function PlanCard({
  plan,
  isSelected,
  onSelect,
  zoneName,
}: {
  plan: (typeof PLAN_OPTIONS)[number];
  isSelected: boolean;
  onSelect: () => void;
  zoneName: string;
}) {
  const isPro = plan.id === "pro";

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onSelect}
      style={[
        styles.planCard,
        isPro ? styles.planCardPro : styles.planCardBasic,
        isSelected && styles.planCardSelected,
      ]}
    >
      <View style={styles.planTop}>
        <View style={styles.planTitleWrap}>
          <View style={[styles.planPill, isPro && styles.planPillPro]}>
            <Text style={[styles.planPillText, isPro && styles.planPillTextPro]}>
              {isPro ? "Recommended" : "Flexible"}
            </Text>
          </View>
          <Text style={[styles.planName, isPro && styles.planNamePro]}>{plan.name}</Text>
          <Text style={[styles.planMeta, isPro && styles.planMetaPro]}>
            {plan.recommended
              ? `Best fit for ${zoneName || "your zone"} risk patterns`
              : "Essential weekly income protection"}
          </Text>
        </View>

        <View
          style={[
            styles.selector,
            isPro && styles.selectorPro,
            isSelected && styles.selectorActive,
          ]}
        >
          {isSelected ? (
            <Ionicons name="checkmark" size={14} color={Neutral.white} />
          ) : null}
        </View>
      </View>

      <View style={styles.priceRow}>
        <Text style={[styles.currency, isPro && styles.currencyPro]}>{RUPEE}</Text>
        <Text style={[styles.price, isPro && styles.pricePro]}>{plan.price}</Text>
        <Text style={[styles.period, isPro && styles.periodPro]}>/week</Text>
      </View>

      <View style={[styles.planHighlight, isPro && styles.planHighlightPro]}>
        <Ionicons
          name="sparkles-outline"
          size={14}
          color={isPro ? Neutral.white : Brand.primary}
        />
        <Text style={[styles.planHighlightText, isPro && styles.planHighlightTextPro]}>
          {RUPEE}
          {plan.payoutPerDay} payout per disruption day
        </Text>
      </View>

      <View style={styles.featureList}>
        {plan.features.map((feature) => (
          <View key={feature} style={styles.featureRow}>
            <View style={[styles.featureDot, isPro && styles.featureDotPro]}>
              <Ionicons
                name="checkmark"
                size={12}
                color={isPro ? Brand.primaryDark : Brand.primary}
              />
            </View>
            <Text style={[styles.featureText, isPro && styles.featureTextPro]}>
              {feature}
            </Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

export default function PlansScreen() {
  const { selectedPlan, setSelectedPlan, user, setUser } = useAppStore();

  const handleActivate = () => {
    if (!selectedPlan) {
      Alert.alert("Select a Plan", "Please choose a plan first.");
      return;
    }

    const selectedOption = PLAN_OPTIONS.find((option) => option.id === selectedPlan);
    if (selectedOption) {
      setUser({
        activePlan: selectedOption.id,
        isProtected: true,
        coveragePerDay: selectedOption.payoutPerDay,
      });
    }

    Alert.alert(
      "Plan Activated",
      `Your ${selectedPlan === "pro" ? "Pro" : "Basic"} plan is now active.`,
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ModernNavBar title="Plans" showLogo={false} backgroundColor={Brand.canvasStrong} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>Tailored for your zone</Text>
          <Text style={styles.heroTitle}>
            Choose cleaner coverage, not more complexity.
          </Text>
          <Text style={styles.heroSub}>
            Pricing and payout logic stay exactly the same. This redesign only improves hierarchy and clarity.
          </Text>

          <View style={styles.zoneBadge}>
            <Ionicons name="location-outline" size={14} color={Brand.primary} />
            <Text style={styles.zoneBadgeText}>
              {user.zone || "Your zone"} {"\u2022"} Live risk based pricing
            </Text>
          </View>
        </View>

        {PLAN_OPTIONS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isSelected={selectedPlan === plan.id}
            onSelect={() => setSelectedPlan(plan.id as "basic" | "pro")}
            zoneName={user.zone}
          />
        ))}

        <View style={styles.noteCard}>
          <View style={styles.noteIcon}>
            <Ionicons name="lock-closed-outline" size={16} color={Brand.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.noteTitle}>What stays the same</Text>
            <Text style={styles.noteSub}>
              Coverage rules, payouts, and plan selection behavior are unchanged.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleActivate}
          style={styles.activateButton}
        >
          <Text style={styles.activateButtonText}>Activate plan</Text>
          <Ionicons name="arrow-forward" size={16} color={Neutral.white} />
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
  heroCard: {
    backgroundColor: Neutral.white,
    borderRadius: Radius.xxl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Brand.line,
    ...Shadow.sm,
  },
  heroEyebrow: {
    fontFamily: Font.semiBold,
    fontSize: 11,
    color: Neutral[500],
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  heroTitle: {
    fontFamily: Font.display,
    fontSize: 28,
    lineHeight: 34,
    color: Neutral[900],
    letterSpacing: -0.9,
    marginBottom: 8,
  },
  heroSub: {
    fontFamily: Font.medium,
    fontSize: 14,
    lineHeight: 21,
    color: Neutral[500],
    marginBottom: Spacing.lg,
  },
  zoneBadge: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    alignSelf: "stretch",
    backgroundColor: Brand.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.full,
  },
  zoneBadgeText: {
    flexShrink: 1,
    fontFamily: Font.semiBold,
    fontSize: 12,
    color: Brand.primaryDark,
  },
  planCard: {
    borderRadius: Radius.xxl,
    padding: Spacing.xl,
    ...Shadow.sm,
  },
  planCardBasic: {
    backgroundColor: Neutral.white,
    borderWidth: 1,
    borderColor: Brand.line,
  },
  planCardPro: {
    backgroundColor: Brand.primaryDark,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  planCardSelected: {
    borderColor: Brand.primary,
    shadowOpacity: 0.14,
  },
  planTop: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  planTitleWrap: {
    flex: 1,
  },
  planPill: {
    alignSelf: "flex-start",
    backgroundColor: Brand.surfaceTint,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    marginBottom: 12,
  },
  planPillPro: {
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  planPillText: {
    fontFamily: Font.semiBold,
    fontSize: 11,
    color: Brand.primary,
  },
  planPillTextPro: {
    color: Neutral.white,
  },
  planName: {
    fontFamily: Font.display,
    fontSize: 28,
    color: Neutral[900],
    letterSpacing: -0.8,
    marginBottom: 4,
  },
  planNamePro: {
    color: Neutral.white,
  },
  planMeta: {
    fontFamily: Font.medium,
    fontSize: 13,
    lineHeight: 20,
    color: Neutral[500],
  },
  planMetaPro: {
    color: "rgba(255,255,255,0.70)",
  },
  selector: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: Neutral[300],
    alignItems: "center",
    justifyContent: "center",
  },
  selectorPro: {
    borderColor: "rgba(255,255,255,0.25)",
  },
  selectorActive: {
    backgroundColor: Brand.success,
    borderColor: Brand.success,
  },
  priceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-end",
    gap: 2,
    marginBottom: Spacing.lg,
  },
  currency: {
    fontFamily: Font.bold,
    fontSize: 18,
    color: Neutral[700],
    paddingBottom: 7,
  },
  currencyPro: {
    color: Neutral.white,
  },
  price: {
    fontFamily: Font.display,
    fontSize: 52,
    lineHeight: 54,
    color: Neutral[900],
    letterSpacing: -1.5,
  },
  pricePro: {
    color: Neutral.white,
  },
  period: {
    fontFamily: Font.medium,
    fontSize: 15,
    color: Neutral[500],
    paddingBottom: 7,
  },
  periodPro: {
    color: "rgba(255,255,255,0.68)",
  },
  planHighlight: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    backgroundColor: Brand.primaryLight,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    marginBottom: Spacing.lg,
  },
  planHighlightPro: {
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  planHighlightText: {
    flexShrink: 1,
    fontFamily: Font.semiBold,
    fontSize: 13,
    color: Brand.primaryDark,
  },
  planHighlightTextPro: {
    color: Neutral.white,
  },
  featureList: {
    gap: 12,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  featureDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Brand.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  featureDotPro: {
    backgroundColor: Neutral.white,
  },
  featureText: {
    flex: 1,
    fontFamily: Font.medium,
    fontSize: 14,
    color: Neutral[700],
  },
  featureTextPro: {
    color: "rgba(255,255,255,0.82)",
  },
  noteCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    backgroundColor: Neutral.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Brand.line,
    ...Shadow.sm,
  },
  noteIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: Brand.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  noteTitle: {
    fontFamily: Font.semiBold,
    fontSize: 15,
    color: Neutral[900],
    marginBottom: 4,
  },
  noteSub: {
    fontFamily: Font.medium,
    fontSize: 12,
    lineHeight: 19,
    color: Neutral[500],
  },
  activateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Brand.primary,
    paddingVertical: 18,
    borderRadius: Radius.xl,
    ...Shadow.lg,
  },
  activateButtonText: {
    fontFamily: Font.bold,
    fontSize: 16,
    color: Neutral.white,
  },
});
