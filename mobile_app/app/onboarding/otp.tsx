import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import { PhoneAuthProvider, signInWithCredential } from "firebase/auth";
import {
  Brand,
  Neutral,
  Radius,
  Spacing,
  Font,
  Shadow,
} from "@/constants/theme";
import { GigzoLockup } from "@/components/gigzo-ui";
import { auth, firebaseConfig } from "@/services/firebaseAuth";
import { firebaseLogin } from "@/services/authApi";
import { setAccessToken } from "@/services/authStorage";
import { getMyProfile } from "@/services/userApi";
import { useAppStore } from "@/store/useAppStore";

export default function OTPScreen() {
  const router = useRouter();
  const { setUser, setOnboarded } = useAppStore();
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [verificationId, setVerificationId] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const refs = useRef<(TextInput | null)[]>([]);
  const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal>(null);

  const normalizedPhone = useMemo(() => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10) {
      return "";
    }

    return `+91${digits}`;
  }, [phone]);

  const handleOtpChange = (text: string, idx: number) => {
    const newOtp = [...otp];
    newOtp[idx] = text;
    setOtp(newOtp);
    if (text && idx < 5) refs.current[idx + 1]?.focus();
  };

  const handleSendOtp = async () => {
    if (!normalizedPhone || !recaptchaVerifier.current) {
      Alert.alert("Invalid phone", "Enter a valid 10 digit phone number.");
      return;
    }

    try {
      setIsSendingOtp(true);
      const provider = new PhoneAuthProvider(auth);
      const newVerificationId = await provider.verifyPhoneNumber(
        normalizedPhone,
        recaptchaVerifier.current,
      );
      setVerificationId(newVerificationId);
      setOtpSent(true);
      Alert.alert("OTP sent", `Code sent to ${normalizedPhone}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to send OTP.";
      Alert.alert("Send OTP failed", message);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    const code = otp.join("");
    if (!verificationId || code.length !== 6) {
      Alert.alert("Invalid OTP", "Enter the 6 digit OTP sent to your phone.");
      return;
    }

    try {
      setIsVerifyingOtp(true);
      const credential = PhoneAuthProvider.credential(verificationId, code);
      const userCredential = await signInWithCredential(auth, credential);
      const idToken = await userCredential.user.getIdToken();
      const loginResult = await firebaseLogin(idToken);
      await setAccessToken(loginResult.accessToken);
      setUser({
        id: loginResult.user.id,
        phone: loginResult.user.phone,
        name: loginResult.user.name || "",
        platform: loginResult.user.platform || "Zomato",
        city: loginResult.user.city || "",
      });

      try {
        const profile = await getMyProfile();
        if (profile.name && profile.platform && profile.city && profile.zone) {
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
          setOnboarded(true);
          router.replace("/(tabs)");
        } else {
          router.push("/onboarding/profile");
        }
      } catch (error) {
        router.push("/onboarding/profile");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to verify OTP.";
      Alert.alert("Verify OTP failed", message);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    setOtp(["", "", "", "", "", ""]);
    await handleSendOtp();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={firebaseConfig}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity style={styles.back} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color={Neutral[700]} />
            </TouchableOpacity>
            <GigzoLockup compact />
          </View>

          
          <View style={styles.stepRow}>
            {[1, 2, 3, 4].map((s) => (
              <View
                key={s}
                style={[styles.step, s <= 1 && styles.stepActive]}
              />
            ))}
          </View>

          <View style={styles.content}>
            <Text style={styles.label}>STEP 1 OF 4</Text>
            <Text style={styles.title}>
              {otpSent ? "Enter OTP" : "Phone Number"}
            </Text>
            <Text style={styles.sub}>
              {otpSent
                ? `Code sent to +91 ${phone}`
                : "We will send a verification code"}
            </Text>

            {!otpSent ? (
              <>
                <View style={styles.phoneInput}>
                  <Text style={styles.prefix}>+91</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="98765 43210"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                    maxLength={10}
                    placeholderTextColor={Neutral[300]}
                  />
                </View>
                <TouchableOpacity
                  style={[
                    styles.cta,
                    (!normalizedPhone || isSendingOtp) && styles.ctaDisabled,
                  ]}
                  onPress={handleSendOtp}
                  disabled={!normalizedPhone || isSendingOtp}
                >
                  <Text style={styles.ctaText}>
                    {isSendingOtp ? "Sending..." : "Send OTP"}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.otpRow}>
                  {otp.map((d, idx) => (
                    <TextInput
                      key={idx}
                      ref={(r) => {
                        refs.current[idx] = r;
                      }}
                      style={[styles.otpBox, d && styles.otpBoxFilled]}
                      maxLength={1}
                      keyboardType="number-pad"
                      value={d}
                      onChangeText={(t) => handleOtpChange(t, idx)}
                    />
                  ))}
                </View>
                <TouchableOpacity
                  style={[styles.cta, isVerifyingOtp && styles.ctaDisabled]}
                  onPress={handleVerifyOtp}
                  disabled={isVerifyingOtp}
                >
                  <Text style={styles.ctaText}>
                    {isVerifyingOtp ? "Verifying..." : "Verify and Continue"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleResendOtp}
                  style={styles.resend}
                >
                  <Text style={styles.resendText}>Resend code</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Neutral.white },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  back: { padding: Spacing.sm },
  stepRow: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xxl,
  },
  step: { flex: 1, height: 3, borderRadius: 2, backgroundColor: Neutral[100] },
  stepActive: { backgroundColor: Brand.primary },
  content: { paddingHorizontal: Spacing.xl },
  label: {
    fontFamily: Font.bold,
    fontSize: 10,
    color: Brand.primary,
    letterSpacing: 1.5,
    marginBottom: Spacing.sm,
  },
  title: {
    fontFamily: Font.bold,
    fontSize: 28,
    color: Neutral[900],
    letterSpacing: -0.4,
    marginBottom: Spacing.sm,
  },
  sub: {
    fontFamily: Font.regular,
    fontSize: 14,
    color: Neutral[500],
    marginBottom: Spacing.xxxl,
  },
  phoneInput: {
    flexDirection: "row",
    borderWidth: 1.5,
    borderColor: Neutral[200],
    borderRadius: Radius.lg,
    overflow: "hidden",
    marginBottom: Spacing.xl,
  },
  prefix: {
    fontFamily: Font.semiBold,
    fontSize: 15,
    color: Neutral[700],
    paddingHorizontal: 14,
    paddingVertical: 15,
    backgroundColor: Neutral[50],
    borderRightWidth: 1,
    borderRightColor: Neutral[200],
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 15,
    fontFamily: Font.semiBold,
    fontSize: 16,
    color: Neutral[900],
  },
  otpRow: { flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.xl },
  otpBox: {
    flex: 1,
    height: 54,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Neutral[200],
    textAlign: "center",
    fontFamily: Font.bold,
    fontSize: 22,
    color: Neutral[900],
    backgroundColor: Neutral[50],
  },
  otpBoxFilled: {
    borderColor: Brand.primary,
    backgroundColor: Brand.primaryLight,
  },
  cta: {
    backgroundColor: Brand.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: Radius.lg,
    ...Shadow.md,
  },
  ctaDisabled: { backgroundColor: Neutral[200] },
  ctaText: { fontFamily: Font.bold, fontSize: 16, color: Neutral.white },
  resend: { alignItems: "center", marginTop: Spacing.lg },
  resendText: { fontFamily: Font.medium, fontSize: 13, color: Brand.primary },
});
