import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
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

function ThresholdRow({
  label,
  icon,
  current,
  threshold,
  unit,
  triggered,
  color,
}: {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  current: number;
  threshold: number;
  unit: string;
  triggered: boolean;
  color: string;
}) {
  const ratio = Math.min(current / (threshold * 1.4), 1);

  return (
    <View style={styles.thresholdRow}>
      <View style={[styles.thresholdIcon, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>

      <View style={styles.thresholdBody}>
        <View style={styles.thresholdHeader}>
          <Text style={styles.thresholdLabel}>{label}</Text>
          <Text
            style={[styles.thresholdValue, { color: triggered ? color : Neutral[700] }]}
          >
            {current}
            {unit}
          </Text>
        </View>

        <View style={styles.thresholdTrack}>
          <View
            style={[
              styles.thresholdFill,
              {
                width: `${Math.round(ratio * 100)}%`,
                backgroundColor: triggered ? color : Neutral[300],
              },
            ]}
          />
          <View style={styles.thresholdMarker} />
        </View>

        <View style={styles.thresholdFoot}>
          <Text style={styles.thresholdLimit}>
            Trigger at {threshold}
            {unit}
          </Text>
          {triggered ? (
            <View style={[styles.triggerPill, { backgroundColor: `${color}16` }]}>
              <Text style={[styles.triggerPillText, { color }]}>Triggered</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function TimelineCard() {
  const { activeClaim } = useAppStore();

  if (!activeClaim) return null;

  return (
    <View style={styles.card}>
      <View style={styles.timelineHeader}>
        <View>
          <Text style={styles.sectionEyebrow}>Processing now</Text>
          <Text style={styles.timelineTitle}>
            Claim #{activeClaim.id} is moving through verification
          </Text>
        </View>
        <View style={styles.claimTypePill}>
          <Text style={styles.claimTypeText}>{activeClaim.type}</Text>
        </View>
      </View>

      <Text style={styles.timelineReason}>{activeClaim.reason}</Text>

      <View style={styles.stepsWrap}>
        {activeClaim.steps.map((step, index) => {
          const isLast = index === activeClaim.steps.length - 1;
          return (
            <View key={step.label} style={styles.stepRow}>
              <View style={styles.stepRail}>
                <View
                  style={[
                    styles.stepDot,
                    step.done ? styles.stepDotDone : styles.stepDotPending,
                  ]}
                />
                {!isLast ? (
                  <View
                    style={[
                      styles.stepLine,
                      step.done && styles.stepLineDone,
                    ]}
                  />
                ) : null}
              </View>
              <View style={styles.stepCopy}>
                <Text style={[styles.stepLabel, !step.done && styles.stepLabelPending]}>
                  {step.label}
                </Text>
                <Text style={styles.stepMeta}>
                  {step.done ? "Completed" : "Waiting for next action"}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function ClaimsScreen() {
  const { activeClaim, conditions } = useAppStore();
  const thresholds = [
    {
      id: "rain",
      label: "Rainfall",
      icon: "rainy",
      current: conditions.rainfall.value,
      threshold: conditions.rainfall.threshold,
      unit: conditions.rainfall.unit,
      triggered: conditions.rainfall.triggered,
      color: Brand.rain,
    },
    {
      id: "aqi",
      label: "AQI",
      icon: "leaf",
      current: conditions.aqi.value,
      threshold: conditions.aqi.threshold,
      unit: conditions.aqi.unit,
      triggered: conditions.aqi.triggered,
      color: Brand.aqi,
    },
    {
      id: "wind",
      label: "Wind Speed",
      icon: "speedometer",
      current: conditions.windSpeed.value,
      threshold: conditions.windSpeed.threshold,
      unit: conditions.windSpeed.unit,
      triggered: conditions.windSpeed.triggered,
      color: Brand.primary,
    },
  ] as const;

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ModernNavBar title="Claims" showLogo={false} backgroundColor={Brand.canvasStrong} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>Auto payouts</Text>
          <Text style={styles.heroTitle}>
            No forms. No back-and-forth. Just status you can understand.
          </Text>
          <Text style={styles.heroSub}>
            The claim engine behavior is unchanged. This screen only improves clarity and layout.
          </Text>
        </View>

        {activeClaim ? (
          <View style={styles.activeBanner}>
            <View style={styles.activeBannerIcon}>
              <Ionicons name="flash" size={18} color={Brand.warning} />
            </View>
            <View style={styles.activeBannerCopy}>
              <Text style={styles.activeBannerTitle}>1 active claim detected</Text>
              <Text style={styles.activeBannerSub}>
                Pending payout of {RUPEE}
                {activeClaim.amount}
              </Text>
            </View>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.sectionEyebrow}>Thresholds</Text>
          <Text style={styles.sectionTitle}>Live triggers across your zone</Text>
          <Text style={styles.sectionSub}>
            Claims still trigger automatically once a reading crosses its configured limit.
          </Text>

          <View style={styles.thresholdList}>
            {thresholds.map((threshold) => (
              <ThresholdRow
                key={threshold.id}
                label={threshold.label}
                icon={threshold.icon as React.ComponentProps<typeof Ionicons>["name"]}
                current={threshold.current}
                threshold={threshold.threshold}
                unit={threshold.unit}
                triggered={threshold.triggered}
                color={threshold.color}
              />
            ))}
          </View>
        </View>

        <TimelineCard />
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
  },
  activeBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: Spacing.md,
    backgroundColor: Brand.warningLight,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: "#F2D49B",
  },
  activeBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  activeBannerCopy: {
    flex: 1,
    gap: 4,
  },
  activeBannerTitle: {
    fontFamily: Font.semiBold,
    fontSize: 15,
    color: "#724508",
  },
  activeBannerSub: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: "#8B5A0C",
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
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  sectionTitle: {
    fontFamily: Font.semiBold,
    fontSize: 22,
    color: Neutral[900],
    letterSpacing: -0.6,
    marginBottom: 6,
  },
  sectionSub: {
    fontFamily: Font.medium,
    fontSize: 13,
    lineHeight: 20,
    color: Neutral[500],
  },
  thresholdList: {
    marginTop: Spacing.lg,
    gap: Spacing.lg,
  },
  thresholdRow: {
    flexDirection: "row",
    gap: Spacing.md,
    alignItems: "flex-start",
  },
  thresholdIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  thresholdBody: {
    flex: 1,
    gap: 10,
  },
  thresholdHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.md,
  },
  thresholdLabel: {
    fontFamily: Font.semiBold,
    fontSize: 15,
    color: Neutral[900],
  },
  thresholdValue: {
    fontFamily: Font.display,
    fontSize: 16,
  },
  thresholdTrack: {
    height: 10,
    borderRadius: Radius.full,
    backgroundColor: Neutral[100],
    overflow: "hidden",
    position: "relative",
  },
  thresholdFill: {
    height: "100%",
    borderRadius: Radius.full,
  },
  thresholdMarker: {
    position: "absolute",
    left: "71%",
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: Neutral[400],
  },
  thresholdFoot: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.md,
  },
  thresholdLimit: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: Neutral[500],
  },
  triggerPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  triggerPillText: {
    fontFamily: Font.semiBold,
    fontSize: 11,
  },
  timelineHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  timelineTitle: {
    fontFamily: Font.semiBold,
    fontSize: 20,
    lineHeight: 25,
    color: Neutral[900],
    letterSpacing: -0.5,
  },
  claimTypePill: {
    alignSelf: "flex-start",
    backgroundColor: Brand.aqiLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
  claimTypeText: {
    fontFamily: Font.semiBold,
    fontSize: 11,
    color: Brand.aqi,
  },
  timelineReason: {
    fontFamily: Font.medium,
    fontSize: 13,
    lineHeight: 20,
    color: Neutral[500],
    marginBottom: Spacing.lg,
  },
  stepsWrap: {
    gap: 4,
  },
  stepRow: {
    flexDirection: "row",
    gap: Spacing.md,
    minHeight: 56,
  },
  stepRail: {
    alignItems: "center",
    width: 18,
  },
  stepDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginTop: 2,
  },
  stepDotDone: {
    backgroundColor: Brand.primary,
  },
  stepDotPending: {
    backgroundColor: Neutral[100],
    borderWidth: 2,
    borderColor: Neutral[300],
  },
  stepLine: {
    flex: 1,
    width: 2,
    backgroundColor: Neutral[200],
    marginTop: 6,
  },
  stepLineDone: {
    backgroundColor: Brand.primary,
  },
  stepCopy: {
    flex: 1,
    paddingBottom: Spacing.md,
  },
  stepLabel: {
    fontFamily: Font.semiBold,
    fontSize: 15,
    color: Neutral[900],
    marginBottom: 4,
  },
  stepLabelPending: {
    color: Neutral[500],
  },
  stepMeta: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: Neutral[500],
  },
});
