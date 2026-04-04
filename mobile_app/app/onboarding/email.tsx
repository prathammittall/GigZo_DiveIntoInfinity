import React, { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import { auth } from "@/services/firebaseAuth";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { firebaseLogin } from "@/services/authApi";
import { setAccessToken } from "@/services/authStorage";
import { useAppStore } from "@/store/useAppStore";
import {
  Brand,
  Font,
  Neutral,
  Radius,
  Shadow,
  Spacing,
} from "@/constants/theme";
import { GigzoLockup } from "@/components/gigzo-ui";

export default function EmailAuthScreen() {
  const router = useRouter();
  const { setUser } = useAppStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const canSubmit = useMemo(
    () => email.trim().length > 4 && password.length >= 6,
    [email, password],
  );

  const handleEmailAuth = async () => {
    if (!canSubmit || isLoading) {
      return;
    }

    try {
      setIsLoading(true);

      let userCredential;
      if (isCreating) {
        userCredential = await createUserWithEmailAndPassword(
          auth,
          email.trim().toLowerCase(),
          password,
        );

        if (name.trim().length > 1) {
          await updateProfile(userCredential.user, {
            displayName: name.trim(),
          });
        }
      } else {
        userCredential = await signInWithEmailAndPassword(
          auth,
          email.trim().toLowerCase(),
          password,
        );
      }

      const idToken = await userCredential.user.getIdToken();
      const loginResult = await firebaseLogin(idToken);
      await setAccessToken(loginResult.accessToken);

      setUser({
        id: loginResult.user.id,
        phone: loginResult.user.phone,
        name: loginResult.user.name || userCredential.user.displayName || "",
        platform: loginResult.user.platform || "Zomato",
        city: loginResult.user.city || "",
      });

      router.push("/onboarding/profile");
    } catch (error) {
      Alert.alert(
        isCreating ? "Sign up failed" : "Sign in failed",
        error instanceof Error ? error.message : "Authentication failed.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={20} color={Neutral[700]} />
            </TouchableOpacity>
            <GigzoLockup compact />
          </View>

          <View style={styles.heroCard}>
            <Text style={styles.stepLabel}>AUTH OPTION</Text>
            <Text style={styles.title}>
              {isCreating ? "Create account" : "Sign in with email"}
            </Text>
            <Text style={styles.sub}>
              Use email/password auth from Firebase and continue with the same
              backend profile flow.
            </Text>
          </View>

          <View style={styles.formCard}>
            {isCreating ? (
              <>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Arjun Sharma"
                  placeholderTextColor={Neutral[300]}
                />
              </>
            ) : null}

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={Neutral[300]}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              placeholder="Minimum 6 characters"
              placeholderTextColor={Neutral[300]}
            />

            <TouchableOpacity
              style={[
                styles.submitBtn,
                (!canSubmit || isLoading) && styles.submitBtnDisabled,
              ]}
              onPress={handleEmailAuth}
              disabled={!canSubmit || isLoading}
            >
              <Text style={styles.submitText}>
                {isLoading
                  ? "Please wait..."
                  : isCreating
                    ? "Create and Continue"
                    : "Sign in and Continue"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsCreating((value) => !value)}
              style={styles.switchMode}
            >
              <Text style={styles.switchModeText}>
                {isCreating
                  ? "Already have an account? Sign in"
                  : "New here? Create account"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/onboarding/otp")}>
              <Text style={styles.phoneFallback}>Use phone OTP instead</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Neutral.white,
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
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.62)",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  title: {
    fontFamily: Font.display,
    fontSize: 30,
    letterSpacing: -0.8,
    color: Neutral.white,
    marginBottom: 6,
  },
  sub: {
    fontFamily: Font.medium,
    fontSize: 14,
    lineHeight: 21,
    color: "rgba(255,255,255,0.75)",
  },
  formCard: {
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
  submitBtn: {
    marginTop: Spacing.lg,
    backgroundColor: Brand.primary,
    borderRadius: Radius.lg,
    alignItems: "center",
    paddingVertical: 15,
    ...Shadow.md,
  },
  submitBtnDisabled: {
    backgroundColor: Neutral[300],
  },
  submitText: {
    fontFamily: Font.bold,
    fontSize: 15,
    color: Neutral.white,
  },
  switchMode: {
    marginTop: Spacing.md,
    alignItems: "center",
  },
  switchModeText: {
    fontFamily: Font.semiBold,
    fontSize: 13,
    color: Brand.primary,
  },
  phoneFallback: {
    marginTop: Spacing.sm,
    textAlign: "center",
    fontFamily: Font.medium,
    fontSize: 12,
    color: Neutral[500],
  },
});
