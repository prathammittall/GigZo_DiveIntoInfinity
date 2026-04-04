import React, { useMemo, useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
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
import { GigzoLockup } from "@/components/gigzo-ui";
import { updateMyProfile } from "@/services/userApi";
import { useAppStore } from "@/store/useAppStore";

const PLATFORMS = ["Zomato", "Swiggy", "Zepto", "Blinkit", "Amazon"] as const;

export default function ProfileOnboardingScreen() {
  const router = useRouter();
  const { user, setUser, setOnboarded } = useAppStore();

  const [name, setName] = useState(user.name || "");
  const [platform, setPlatform] = useState<(typeof PLATFORMS)[number] | "">(
    (user.platform as (typeof PLATFORMS)[number]) || "",
  );
  const [city, setCity] = useState(user.city || "");
  const [zone, setZone] = useState(user.zone || "");

  const [showMore, setShowMore] = useState(false);
  const [type, setType] = useState<"full-time" | "part-time" | "">(
    user.type || "",
  );
  const [workerId, setWorkerId] = useState(user.workerId || "");
  const [workingHoursPerDay, setWorkingHoursPerDay] = useState(
    user.workingHoursPerDay ? String(user.workingHoursPerDay) : "",
  );
  const [avgDailyEarning, setAvgDailyEarning] = useState(
    user.avgDailyEarning ? String(user.avgDailyEarning) : "",
  );

  const [isSaving, setIsSaving] = useState(false);

  const canContinue = useMemo(
    () =>
      name.trim().length > 2 &&
      Boolean(platform) &&
      city.trim().length > 1 &&
      zone.trim().length > 1,
    [name, platform, city, zone],
  );

  const handleSave = async () => {
    if (!canContinue || isSaving) {
      return;
    }

    try {
      setIsSaving(true);
      const profile = await updateMyProfile({
        name: name.trim(),
        platform: platform as
          | "Zomato"
          | "Swiggy"
          | "Zepto"
          | "Blinkit"
          | "Amazon",
        city: city.trim(),
        zone: zone.trim(),
        type: type || undefined,
        workerId: workerId.trim() || undefined,
        workingHoursPerDay: workingHoursPerDay
          ? Number(workingHoursPerDay)
          : undefined,
        avgDailyEarning: avgDailyEarning ? Number(avgDailyEarning) : undefined,
      });

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
        workingHoursPerDay: profile.workingHoursPerDay,
        avgDailyEarning: profile.avgDailyEarning,
      });

      setOnboarded(true);
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert(
        "Save profile failed",
        error instanceof Error ? error.message : "Unable to save profile.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    setOnboarded(true);
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color={Neutral[700]} />
          </TouchableOpacity>
          <GigzoLockup compact />
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.stepLabel}>STEP 2 OF 3</Text>
          <Text style={styles.title}>Quick profile setup</Text>
          <Text style={styles.sub}>
            Only important fields now. You can edit the full profile later.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Arjun Sharma"
            placeholderTextColor={Neutral[300]}
          />

          <Text style={styles.label}>Delivery Platform</Text>
          <View style={styles.chips}>
            {PLATFORMS.map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.chip, platform === item && styles.chipActive]}
                onPress={() => setPlatform(item)}
              >
                <Text
                  style={[
                    styles.chipText,
                    platform === item && styles.chipTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>City</Text>
          <TextInput
            style={styles.input}
            value={city}
            onChangeText={setCity}
            placeholder="e.g. Chandigarh"
            placeholderTextColor={Neutral[300]}
          />

          <Text style={styles.label}>Zone</Text>
          <TextInput
            style={styles.input}
            value={zone}
            onChangeText={setZone}
            placeholder="e.g. Sector 35"
            placeholderTextColor={Neutral[300]}
          />

          <TouchableOpacity
            style={styles.moreToggle}
            onPress={() => setShowMore((value) => !value)}
          >
            <Text style={styles.moreToggleText}>
              {showMore ? "Hide optional fields" : "Add optional work details"}
            </Text>
            <Ionicons
              name={showMore ? "chevron-up" : "chevron-down"}
              size={16}
              color={Brand.primary}
            />
          </TouchableOpacity>

          {showMore ? (
            <View style={styles.optionalWrap}>
              <Text style={styles.label}>Worker Type</Text>
              <View style={styles.chips}>
                {[
                  { label: "Full-time", value: "full-time" },
                  { label: "Part-time", value: "part-time" },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      styles.chip,
                      type === item.value && styles.chipActive,
                    ]}
                    onPress={() =>
                      setType(item.value as "full-time" | "part-time")
                    }
                  >
                    <Text
                      style={[
                        styles.chipText,
                        type === item.value && styles.chipTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Delivery Partner ID</Text>
              <TextInput
                style={styles.input}
                value={workerId}
                onChangeText={setWorkerId}
                placeholder="e.g. SW-204512"
                placeholderTextColor={Neutral[300]}
              />

              <Text style={styles.label}>Working Hours / Day</Text>
              <TextInput
                style={styles.input}
                value={workingHoursPerDay}
                onChangeText={setWorkingHoursPerDay}
                keyboardType="number-pad"
                placeholder="e.g. 10"
                placeholderTextColor={Neutral[300]}
              />

              <Text style={styles.label}>Average Daily Earning (INR)</Text>
              <TextInput
                style={styles.input}
                value={avgDailyEarning}
                onChangeText={setAvgDailyEarning}
                keyboardType="number-pad"
                placeholder="e.g. 1200"
                placeholderTextColor={Neutral[300]}
              />
            </View>
          ) : null}
        </View>

        <View style={styles.footerRow}>
          <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.saveBtn,
              (!canContinue || isSaving) && styles.saveBtnDisabled,
            ]}
            onPress={handleSave}
            disabled={!canContinue || isSaving}
          >
            <Text style={styles.saveText}>
              {isSaving ? "Saving..." : "Save and Continue"}
            </Text>
          </TouchableOpacity>
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
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Neutral.white,
    alignItems: "center",
    justifyContent: "center",
  },
  heroCard: {
    backgroundColor: Brand.primaryDark,
    borderRadius: Radius.xxl,
    padding: Spacing.xl,
    ...Shadow.md,
  },
  stepLabel: {
    fontFamily: Font.semiBold,
    fontSize: 11,
    color: "rgba(255,255,255,0.64)",
    letterSpacing: 1.1,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  title: {
    fontFamily: Font.display,
    fontSize: 30,
    color: Neutral.white,
    letterSpacing: -0.8,
    marginBottom: 6,
  },
  sub: {
    fontFamily: Font.medium,
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(255,255,255,0.75)",
  },
  card: {
    backgroundColor: Neutral.white,
    borderRadius: Radius.xxl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Brand.line,
    ...Shadow.sm,
  },
  label: {
    fontFamily: Font.semiBold,
    fontSize: 12,
    color: Neutral[600],
    marginBottom: 6,
    marginTop: Spacing.sm,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  input: {
    borderWidth: 1.5,
    borderColor: Neutral[200],
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontFamily: Font.medium,
    fontSize: 15,
    color: Neutral[900],
    backgroundColor: Neutral.white,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Neutral[200],
  },
  chipActive: {
    backgroundColor: Brand.primary,
    borderColor: Brand.primary,
  },
  chipText: {
    fontFamily: Font.medium,
    fontSize: 13,
    color: Neutral[600],
  },
  chipTextActive: {
    color: Neutral.white,
  },
  moreToggle: {
    marginTop: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  moreToggleText: {
    fontFamily: Font.semiBold,
    fontSize: 13,
    color: Brand.primary,
  },
  optionalWrap: {
    marginTop: Spacing.sm,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  skipBtn: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: Radius.lg,
    backgroundColor: Neutral.white,
    borderWidth: 1,
    borderColor: Neutral[200],
  },
  skipText: {
    fontFamily: Font.semiBold,
    fontSize: 13,
    color: Neutral[600],
  },
  saveBtn: {
    flex: 1,
    backgroundColor: Brand.primary,
    borderRadius: Radius.lg,
    alignItems: "center",
    paddingVertical: 14,
    ...Shadow.md,
  },
  saveBtnDisabled: {
    backgroundColor: Neutral[300],
  },
  saveText: {
    fontFamily: Font.bold,
    fontSize: 14,
    color: Neutral.white,
  },
});
