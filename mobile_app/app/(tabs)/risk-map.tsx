import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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

type RiskLevel = "HIGH" | "MEDIUM" | "LOW";

const RUPEE = "\u20B9";

const riskColor = (risk: RiskLevel) =>
  ({ HIGH: Brand.danger, MEDIUM: Brand.warning, LOW: Brand.success })[risk];

const riskBg = (risk: RiskLevel) =>
  ({
    HIGH: Brand.dangerLight,
    MEDIUM: Brand.warningLight,
    LOW: Brand.successLight,
  })[risk];

function MapView({
  zones,
  selectedZone,
  onSelect,
}: {
  zones: { id: string; name: string; risk: RiskLevel }[];
  selectedZone: string | null;
  onSelect: (id: string) => void;
}) {
  const positions = [
    { x: 0.24, y: 0.42 },
    { x: 0.54, y: 0.2 },
    { x: 0.68, y: 0.36 },
    { x: 0.4, y: 0.72 },
    { x: 0.8, y: 0.54 },
  ];

  return (
    <View style={styles.mapCard}>
      <View style={styles.mapGlowOne} />
      <View style={styles.mapGlowTwo} />

      {[0, 1, 2, 3, 4].map((line) => (
        <View key={`h-${line}`} style={[styles.mapLineH, { top: 32 + line * 42 }]} />
      ))}
      {[0, 1, 2, 3].map((line) => (
        <View key={`v-${line}`} style={[styles.mapLineV, { left: 44 + line * 72 }]} />
      ))}

      <View style={[styles.mapRoad, { top: 84, left: 18, right: 24, height: 2 }]} />
      <View style={[styles.mapRoad, { top: 46, bottom: 28, left: "45%", width: 2 }]} />

      {zones.map((zone, index) => {
        const pos = positions[index % positions.length];
        const selected = selectedZone === zone.id;

        return (
          <TouchableOpacity
            key={zone.id}
            activeOpacity={0.9}
            onPress={() => onSelect(zone.id)}
            style={[
              styles.pin,
              {
                left: `${pos.x * 100}%`,
                top: `${pos.y * 100}%`,
                backgroundColor: riskColor(zone.risk),
                transform: [{ scale: selected ? 1.2 : 1 }],
                borderWidth: selected ? 4 : 0,
              },
            ]}
          >
            <Text style={styles.pinText}>{zone.risk[0]}</Text>
          </TouchableOpacity>
        );
      })}

      <View style={styles.legend}>
        {(["HIGH", "MEDIUM", "LOW"] as RiskLevel[]).map((risk) => (
          <View key={risk} style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: riskColor(risk) }]} />
            <Text style={styles.legendText}>{risk}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function RiskMapScreen() {
  const { user, conditions, earnings } = useAppStore();

  const riskZones = useMemo(
    () =>
      user.zone
        ? [
            {
              id: "current-zone",
              name: user.zone,
              risk: conditions.overallRisk,
            },
          ]
        : [],
    [conditions.overallRisk, user.zone],
  );
  const [selected, setSelected] = useState<string | null>(riskZones[0]?.id || null);

  useEffect(() => {
    if (!riskZones.length) {
      setSelected(null);
      return;
    }

    if (!selected || !riskZones.some((entry) => entry.id === selected)) {
      setSelected(riskZones[0].id);
    }
  }, [riskZones, selected]);

  const zone = riskZones.find((entry) => entry.id === selected);

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ModernNavBar title="Risk Map" showLogo={false} backgroundColor={Brand.canvasStrong} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>Zone intelligence</Text>
          <Text style={styles.heroTitle}>Live weather conditions & risk signals.</Text>
          <Text style={styles.heroSub}>
            Real-time weather data for your zone, powered by the GigZo AI engine.
          </Text>
        </View>

        <MapView zones={riskZones} selectedZone={selected} onSelect={setSelected} />


        {zone ? (
          <View style={styles.card}>
            <View style={styles.zoneHeader}>
              <View>
                <Text style={styles.sectionEyebrow}>Selected zone</Text>
                <Text style={styles.zoneTitle}>{zone.name}</Text>
              </View>
              <View style={[styles.riskPill, { backgroundColor: riskBg(zone.risk) }]}>
                <Text style={[styles.riskPillText, { color: riskColor(zone.risk) }]}>
                  {zone.risk} risk
                </Text>
              </View>
            </View>

            <View style={styles.zoneStats}>
              {[
                {
                  icon: "rainy-outline",
                  title: "Rain exposure",
                  value:
                    `${conditions.rainfall.value}${conditions.rainfall.unit} current ` +
                    `(threshold ${conditions.rainfall.threshold}${conditions.rainfall.unit})`,
                  color: Brand.rain,
                  triggered: conditions.rainfall.triggered,
                },
                {
                  icon: "leaf-outline",
                  title: "Air quality",
                  value: `AQI ${conditions.aqi.value} (threshold ${conditions.aqi.threshold})`,
                  color: Brand.aqi,
                  triggered: conditions.aqi.triggered,
                },
                {
                  icon: "thermometer-outline",
                  title: "Temperature",
                  value:
                    `${conditions.temperature.value}${conditions.temperature.unit} current ` +
                    `(threshold ${conditions.temperature.threshold}${conditions.temperature.unit})`,
                  color: Brand.primaryMid,
                  triggered: conditions.temperature.triggered,
                },
                {
                  icon: "speedometer-outline",
                  title: "Wind speed",
                  value:
                    `${conditions.windSpeed.value}${conditions.windSpeed.unit} current ` +
                    `(threshold ${conditions.windSpeed.threshold}${conditions.windSpeed.unit})`,
                  color: Brand.flood,
                  triggered: conditions.windSpeed.triggered,
                },
                {
                  icon: "cash-outline",
                  title: "Protected earnings",
                  value: `${RUPEE}${earnings.totalProtected.toLocaleString()} this week`,
                  color: Brand.success,
                  triggered: false,
                },
              ].map((item) => (
                <View
                  key={item.title}
                  style={[
                    styles.statCard,
                    item.triggered && styles.statCardTriggered,
                  ]}
                >
                  <View
                    style={[
                      styles.statIcon,
                      {
                        backgroundColor: item.triggered
                          ? `${Brand.danger}20`
                          : `${item.color}16`,
                      },
                    ]}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={18}
                      color={item.triggered ? Brand.danger : item.color}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.statTitleRow}>
                      <Text style={styles.statTitle}>{item.title}</Text>
                      {item.triggered && (
                        <View style={styles.triggeredBadge}>
                          <Text style={styles.triggeredBadgeText}>TRIGGERED</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.statValue}>{item.value}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* ── All Zones List ── */}
        <View style={styles.card}>
          <Text style={styles.sectionEyebrow}>All zones</Text>
          <Text style={styles.sectionTitle}>Browse available disruption zones</Text>

          <View style={styles.zoneList}>
            {riskZones.map((riskZone) => (
              <TouchableOpacity
                key={riskZone.id}
                activeOpacity={0.85}
                onPress={() => setSelected(riskZone.id)}
                style={[
                  styles.zoneRow,
                  selected === riskZone.id && styles.zoneRowSelected,
                ]}
              >
                <View style={[styles.zoneDot, { backgroundColor: riskColor(riskZone.risk) }]} />
                <Text style={styles.zoneName}>{riskZone.name}</Text>
                <View
                  style={[
                    styles.rowRiskPill,
                    { backgroundColor: riskBg(riskZone.risk) },
                  ]}
                >
                  <Text
                    style={[
                      styles.rowRiskText,
                      { color: riskColor(riskZone.risk) },
                    ]}
                  >
                    {riskZone.risk}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            {!riskZones.length ? (
              <View style={styles.emptyZoneState}>
                <Text style={styles.emptyZoneText}>
                  Set your work zone in profile to enable live risk map insights.
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.infoStrip}>
            <Ionicons name="information-circle-outline" size={16} color={Brand.primary} />
            <Text style={styles.infoText}>{conditions.status}</Text>
          </View>
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

  /* ── Map ─────────────────────────── */
  mapCard: {
    height: 286,
    backgroundColor: "#DCEEEF",
    borderRadius: Radius.xxl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(14,94,103,0.08)",
    ...Shadow.md,
  },
  mapGlowOne: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(255,255,255,0.32)",
    top: -80,
    right: -50,
  },
  mapGlowTwo: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(14,94,103,0.08)",
    bottom: -50,
    left: -30,
  },
  mapLineH: {
    position: "absolute",
    left: 20,
    right: 20,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(14,94,103,0.10)",
  },
  mapLineV: {
    position: "absolute",
    top: 20,
    bottom: 20,
    width: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(14,94,103,0.10)",
  },
  mapRoad: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.55)",
    borderRadius: Radius.full,
  },
  pin: {
    position: "absolute",
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -15,
    marginTop: -15,
    borderColor: Neutral.white,
    ...Shadow.md,
  },
  pinText: {
    fontFamily: Font.bold,
    fontSize: 11,
    color: Neutral.white,
  },
  legend: {
    position: "absolute",
    right: 14,
    bottom: 14,
    backgroundColor: "rgba(255,255,255,0.82)",
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    gap: 6,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontFamily: Font.semiBold,
    fontSize: 10,
    color: Neutral[700],
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
  zoneHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  zoneTitle: {
    fontFamily: Font.display,
    fontSize: 26,
    color: Neutral[900],
    letterSpacing: -0.8,
  },
  riskPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
  riskPillText: {
    fontFamily: Font.semiBold,
    fontSize: 12,
  },
  zoneStats: {
    gap: Spacing.sm,
  },
  statCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Brand.surfaceAlt,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  statCardTriggered: {
    backgroundColor: Brand.dangerLight,
    borderWidth: 1,
    borderColor: `${Brand.danger}30`,
  },
  statIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  statTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statTitle: {
    fontFamily: Font.semiBold,
    fontSize: 13,
    color: Neutral[900],
    marginBottom: 2,
  },
  statValue: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: Neutral[500],
  },
  triggeredBadge: {
    backgroundColor: Brand.danger,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  triggeredBadgeText: {
    fontFamily: Font.bold,
    fontSize: 9,
    color: Neutral.white,
    letterSpacing: 0.5,
  },

  /* ── Zone list ─────────────────────────── */
  zoneList: {
    gap: 10,
  },
  zoneRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    backgroundColor: Brand.surfaceAlt,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  zoneRowSelected: {
    backgroundColor: Brand.primaryLight,
  },
  zoneDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  zoneName: {
    flex: 1,
    minWidth: 0,
    fontFamily: Font.semiBold,
    fontSize: 14,
    color: Neutral[900],
  },
  rowRiskPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  rowRiskText: {
    fontFamily: Font.semiBold,
    fontSize: 11,
  },
  infoStrip: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: Brand.surfaceTint,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
  infoText: {
    flex: 1,
    fontFamily: Font.medium,
    fontSize: 12,
    lineHeight: 19,
    color: Brand.primaryDark,
  },
  emptyZoneState: {
    backgroundColor: Brand.surfaceAlt,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Brand.line,
  },
  emptyZoneText: {
    fontFamily: Font.medium,
    fontSize: 13,
    lineHeight: 20,
    color: Neutral[500],
    textAlign: "center",
  },
});
