import React, { useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Brand,
  Font,
  Neutral,
  Radius,
  Shadow,
  Spacing,
} from "@/constants/theme";
import { useAppStore } from "@/store/useAppStore";
import { updateMyProfile } from "@/services/userApi";

const PLATFORMS = ["Zomato", "Swiggy", "Zepto", "Blinkit", "Amazon"] as const;
const WORK_TYPES = [
  { label: "Full-time", value: "full-time" },
  { label: "Part-time", value: "part-time" },
] as const;

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, setUser } = useAppStore();

  const [name, setName] = useState(user.name || "");
  const [platform, setPlatform] = useState<(typeof PLATFORMS)[number] | "">(
    (user.platform as (typeof PLATFORMS)[number]) || "",
  );
  const [type, setType] = useState<"full-time" | "part-time" | "">(
    user.type || "",
  );
  const [city, setCity] = useState(user.city || "");
  const [zone, setZone] = useState(user.zone || "");
  const [workerId, setWorkerId] = useState(user.workerId || "");
  const [pincode, setPincode] = useState(user.pincode || "");
  const [workingArea, setWorkingArea] = useState(user.workingArea || "");
  const [age, setAge] = useState(user.age ? String(user.age) : "");
  const [workingHoursPerDay, setWorkingHoursPerDay] = useState(
    user.workingHoursPerDay ? String(user.workingHoursPerDay) : "",
  );
  const [avgDailyEarning, setAvgDailyEarning] = useState(
    user.avgDailyEarning ? String(user.avgDailyEarning) : "",
  );
  const [coveragePerDay, setCoveragePerDay] = useState(
    user.coveragePerDay ? String(user.coveragePerDay) : "",
  );
  const [isSaving, setIsSaving] = useState(false);

  const canSave = useMemo(
    () =>
      name.trim().length > 2 &&
      Boolean(platform) &&
      Boolean(type) &&
      Boolean(city.trim()) &&
      Boolean(zone.trim()),
    [name, platform, type, city, zone],
  );

  const handleSave = async () => {
    if (!canSave || isSaving) {
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
        type: type as "full-time" | "part-time",
        city: city.trim(),
        zone: zone.trim(),
        workerId: workerId.trim() || undefined,
        pincode: pincode.trim() || undefined,
        workingArea: workingArea.trim() || undefined,
        age: age ? Number(age) : undefined,
        workingHoursPerDay: workingHoursPerDay
          ? Number(workingHoursPerDay)
          : undefined,
        avgDailyEarning: avgDailyEarning ? Number(avgDailyEarning) : undefined,
        coveragePerDay: coveragePerDay ? Number(coveragePerDay) : undefined,
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
        pincode: profile.pincode,
        workingArea: profile.workingArea,
        age: profile.age,
        workingHoursPerDay: profile.workingHoursPerDay,
        avgDailyEarning: profile.avgDailyEarning,
      });

      Alert.alert("Profile updated", "Your rider profile has been saved.", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      Alert.alert(
        "Update failed",
        error instanceof Error ? error.message : "Could not update profile.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Neutral[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Rider Identity</Text>

          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Arjun Sharma"
            placeholderTextColor={Neutral[300]}
          />

          <Text style={styles.label}>Delivery Platform</Text>
          <View style={styles.chipRow}>
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

          <Text style={styles.label}>Worker Type</Text>
          <View style={styles.chipRow}>
            {WORK_TYPES.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[styles.chip, type === item.value && styles.chipActive]}
                onPress={() => setType(item.value)}
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
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Work Location and Earnings</Text>

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

          <Text style={styles.label}>Pincode</Text>
          <TextInput
            style={styles.input}
            value={pincode}
            onChangeText={setPincode}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="e.g. 160036"
            placeholderTextColor={Neutral[300]}
          />

          <Text style={styles.label}>Working Area</Text>
          <TextInput
            style={styles.input}
            value={workingArea}
            onChangeText={setWorkingArea}
            placeholder="e.g. Sector 17 - IT Park"
            placeholderTextColor={Neutral[300]}
          />

          <Text style={styles.label}>Age</Text>
          <TextInput
            style={styles.input}
            value={age}
            onChangeText={setAge}
            keyboardType="number-pad"
            placeholder="e.g. 24"
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

          <Text style={styles.label}>Coverage Needed / Day (INR)</Text>
          <TextInput
            style={styles.input}
            value={coveragePerDay}
            onChangeText={setCoveragePerDay}
            keyboardType="number-pad"
            placeholder="e.g. 500"
            placeholderTextColor={Neutral[300]}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.saveBtn,
            (!canSave || isSaving) && styles.saveBtnDisabled,
          ]}
          onPress={handleSave}
          disabled={!canSave || isSaving}
        >
          <Text style={styles.saveText}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Text>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    fontFamily: Font.display,
    fontSize: 26,
    color: Neutral[900],
    letterSpacing: -0.6,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Neutral.white,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: 120,
  },
  card: {
    backgroundColor: Neutral.white,
    borderRadius: Radius.xxl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Brand.line,
    ...Shadow.sm,
  },
  cardTitle: {
    fontFamily: Font.semiBold,
    fontSize: 19,
    color: Neutral[900],
    marginBottom: Spacing.md,
  },
  label: {
    fontFamily: Font.semiBold,
    fontSize: 12,
    color: Neutral[600],
    marginTop: Spacing.sm,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.7,
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
  chipRow: {
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
  saveBtn: {
    backgroundColor: Brand.primary,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: "center",
    ...Shadow.md,
  },
  saveBtnDisabled: {
    backgroundColor: Neutral[300],
  },
  saveText: {
    fontFamily: Font.bold,
    fontSize: 15,
    color: Neutral.white,
  },
});
