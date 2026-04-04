import React, { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "@/services/firebaseAuth";
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
import { GigzoBackdrop, GigzoLockup } from "@/components/gigzo-ui";

WebBrowser.maybeCompleteAuthSession();

function AuthOptionCard({
  icon,
  title,
  subtitle,
  onPress,
  disabled = false,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  subtitle: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.86}
      style={[styles.optionCard, disabled && styles.optionCardDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.optionIconWrap}>
        <Ionicons name={icon} size={20} color={Brand.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Neutral[400]} />
    </TouchableOpacity>
  );
}

export default function AuthOptionsScreen() {
  const router = useRouter();
  const { setUser } = useAppStore();
  const [isGoogleBusy, setIsGoogleBusy] = useState(false);

  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "";
  const androidClientId =
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || webClientId;
  const iosClientId =
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || webClientId;

  const googleAuthConfig: any = {
    clientId: webClientId,
    webClientId,
    iosClientId,
    androidClientId,
  };

  const [request, response, promptAsync] =
    Google.useAuthRequest(googleAuthConfig);

  useEffect(() => {
    const syncGoogleUser = async () => {
      if (!response) {
        return;
      }

      if (response.type !== "success") {
        if (response.type !== "dismiss") {
          const responseAny = response as unknown as {
            params?: { error?: string; error_description?: string };
          };
          const errorCode = responseAny.params?.error || "authorization_error";
          const errorDescription =
            responseAny.params?.error_description ||
            "Google authorization failed. Check OAuth client configuration and SHA-1.";
          Alert.alert(
            "Google sign-in failed",
            `${errorCode}: ${errorDescription}`,
          );
        }
        return;
      }

      try {
        setIsGoogleBusy(true);
        const responseAny = response as unknown as {
          params?: { id_token?: string };
          authentication?: { idToken?: string };
        };

        const idToken =
          responseAny.params?.id_token || responseAny.authentication?.idToken;

        if (!idToken) {
          throw new Error(
            "Google ID token missing. Check Google client IDs in .env.",
          );
        }

        const credential = GoogleAuthProvider.credential(idToken);
        const firebaseUser = await signInWithCredential(auth, credential);
        const firebaseToken = await firebaseUser.user.getIdToken();
        const loginResult = await firebaseLogin(firebaseToken);

        await setAccessToken(loginResult.accessToken);
        setUser({
          id: loginResult.user.id,
          phone: loginResult.user.phone,
          name: loginResult.user.name || firebaseUser.user.displayName || "",
          platform: loginResult.user.platform || "Zomato",
          city: loginResult.user.city || "",
        });

        router.push("/onboarding/profile");
      } catch (error) {
        Alert.alert(
          "Google sign-in failed",
          error instanceof Error
            ? error.message
            : "Unable to continue with Google.",
        );
      } finally {
        setIsGoogleBusy(false);
      }
    };

    void syncGoogleUser();
  }, [response, router, setUser]);

  const handleGooglePress = async () => {
    if (isGoogleBusy) {
      return;
    }

    if (!request) {
      Alert.alert("Google not ready", "Please wait and try again.");
      return;
    }

    const hasClientId = webClientId || androidClientId || iosClientId;

    if (!hasClientId) {
      Alert.alert(
        "Google config missing",
        "Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID / ANDROID / IOS in mobile_app/.env.",
      );
      return;
    }

    await promptAsync();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <GigzoBackdrop />

      <View style={styles.content}>
        <View style={styles.top}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color={Neutral[700]} />
          </TouchableOpacity>
          <GigzoLockup compact />
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.stepLabel}>STEP 1 OF 3</Text>
          <Text style={styles.title}>Choose sign-in method</Text>
          <Text style={styles.subtitle}>
            Continue with Google, phone OTP, or email/password. All methods save
            to the same backend profile.
          </Text>
        </View>

        <View style={styles.optionsWrap}>
          <AuthOptionCard
            icon="logo-google"
            title={
              isGoogleBusy ? "Connecting Google..." : "Continue with Google"
            }
            subtitle="Fast sign-in with your Google account"
            onPress={handleGooglePress}
            disabled={isGoogleBusy}
          />
          <AuthOptionCard
            icon="call-outline"
            title="Continue with phone"
            subtitle="Verify with OTP and proceed"
            onPress={() => router.push("/onboarding/otp")}
          />
          <AuthOptionCard
            icon="mail-outline"
            title="Continue with email"
            subtitle="Use email and password"
            onPress={() => router.push("/onboarding/email")}
          />
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
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.md,
  },
  backBtn: {
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
    fontSize: 31,
    color: Neutral.white,
    letterSpacing: -0.9,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: Font.medium,
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(255,255,255,0.75)",
  },
  optionsWrap: {
    gap: Spacing.md,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Neutral.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Brand.line,
    ...Shadow.sm,
  },
  optionCardDisabled: {
    opacity: 0.75,
  },
  optionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Brand.primaryLight,
  },
  optionTitle: {
    fontFamily: Font.semiBold,
    fontSize: 15,
    color: Neutral[900],
    marginBottom: 2,
  },
  optionSubtitle: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: Neutral[500],
  },
});
