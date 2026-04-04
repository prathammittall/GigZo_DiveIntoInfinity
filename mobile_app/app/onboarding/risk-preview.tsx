import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  Brand,
  Neutral,
  Radius,
  Spacing,
  Font,
  Shadow,
} from "@/constants/theme";
import { useAppStore } from "@/store/useAppStore";
import {
  GigzoBackdrop,
  GigzoButton,
  GigzoLockup,
  GigzoStepBar,
} from "@/components/gigzo-ui";

const RUPEE = "\u20B9";

const FACTORS = [
  {
    icon: "rainy-outline",
    label: "Frequent rainfall zone",
    color: Brand.rain,
    bg: Brand.rainLight,
  },
  {
    icon: "leaf-outline",
    label: "High air pollution index",
    color: Brand.aqi,
    bg: Brand.aqiLight,
  },
  {
    icon: "water-outline",
    label: "Flood-prone sector",
    color: Brand.flood,
    bg: Brand.floodLight,
  },
] as const;

export default function RiskPreviewScreen() {
  const router = useRouter();
  const { setOnboarded } = useAppStore();

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <GigzoBackdrop />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.mainBlock}>
          <View style={styles.header}>
            <TouchableOpacity activeOpacity={0.8} onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={18} color={Neutral[800]} />
            </TouchableOpacity>
            <GigzoLockup compact />
          </View>

          <GigzoStepBar step={4} />

          <View style={styles.heroCard}>
            <View style={styles.scoreWrap}>
              <Text style={styles.scoreValue}>82</Text>
              <Text style={styles.scoreLabel}>Risk score</Text>
            </View>

            <View style={styles.heroCopy}>
              <Text style={styles.eyebrow}>Step 4 of 4</Text>
              <Text style={styles.title}>Your zone needs stronger protection.</Text>
              <Text style={styles.sub}>Sector 35, Chandigarh is currently a high-risk area.</Text>

              <View style={styles.riskBadge}>
                <View style={styles.riskDot} />
                <Text style={styles.riskBadgeText}>High risk</Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Why this score looks high</Text>

            <View style={styles.factorList}>
              {FACTORS.map((factor) => (
                <View key={factor.label} style={styles.factorRow}>
                  <View style={[styles.factorIcon, { backgroundColor: factor.bg }]}>
                    <Ionicons name={factor.icon as any} size={18} color={factor.color} />
                  </View>
                  <Text style={styles.factorLabel}>{factor.label}</Text>
                  <Ionicons name="checkmark-circle" size={18} color={factor.color} />
                </View>
              ))}
            </View>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Estimated monthly income risk</Text>
            <Text style={styles.summaryValue}>{RUPEE}1,200</Text>
            <Text style={styles.summarySub}>Gigzo plan coverage can absorb this exposure.</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <GigzoButton
            label="See plans for my zone"
            icon="arrow-forward"
            onPress={() => {
              setOnboarded(true);
              router.replace("/(tabs)/plans");
            }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.canvas,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.xl,
  },
  mainBlock: {
    gap: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.84)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.90)",
    ...Shadow.sm,
  },
  heroCard: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.lg,
    backgroundColor: Brand.primaryDark,
    borderRadius: Radius.xxl,
    padding: Spacing.xl,
    ...Shadow.lg,
  },
  scoreWrap: {
    width: 92,
    height: 92,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  scoreValue: {
    fontFamily: Font.display,
    fontSize: 32,
    color: Neutral.white,
    letterSpacing: -0.8,
  },
  scoreLabel: {
    fontFamily: Font.medium,
    fontSize: 11,
    color: "rgba(255,255,255,0.66)",
  },
  heroCopy: {
    flex: 1,
  },
  eyebrow: {
    fontFamily: Font.semiBold,
    fontSize: 11,
    color: "rgba(255,255,255,0.62)",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  title: {
    fontFamily: Font.display,
    fontSize: 28,
    lineHeight: 34,
    color: Neutral.white,
    letterSpacing: -1,
    marginBottom: 6,
  },
  sub: {
    fontFamily: Font.medium,
    fontSize: 14,
    lineHeight: 21,
    color: "rgba(255,255,255,0.72)",
    marginBottom: Spacing.md,
  },
  riskBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.10)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
  riskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Brand.danger,
  },
  riskBadgeText: {
    fontFamily: Font.semiBold,
    fontSize: 12,
    color: Neutral.white,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.88)",
    borderRadius: Radius.xxl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.96)",
    ...Shadow.sm,
  },
  cardTitle: {
    fontFamily: Font.semiBold,
    fontSize: 20,
    color: Neutral[900],
    marginBottom: Spacing.lg,
    letterSpacing: -0.4,
  },
  factorList: {
    gap: Spacing.sm,
  },
  factorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Brand.surfaceAlt,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  factorIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  factorLabel: {
    flex: 1,
    fontFamily: Font.semiBold,
    fontSize: 14,
    color: Neutral[900],
  },
  summaryCard: {
    backgroundColor: Brand.dangerLight,
    borderRadius: Radius.xxl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: "#F2C8BF",
    ...Shadow.sm,
  },
  summaryLabel: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: Neutral[600],
    marginBottom: 6,
  },
  summaryValue: {
    fontFamily: Font.display,
    fontSize: 34,
    color: Brand.danger,
    letterSpacing: -1,
    marginBottom: 4,
  },
  summarySub: {
    fontFamily: Font.medium,
    fontSize: 13,
    lineHeight: 20,
    color: Neutral[600],
  },
  footer: {
    marginTop: Spacing.sm,
  },
});
