import React from "react";
import {
  Dimensions,
  Image,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  Brand,
  Font,
  Neutral,
  Radius,
  Shadow,
  Spacing,
} from "@/constants/theme";

const LOGO = require("../assets/images/logo_2.png");
const { width, height } = Dimensions.get("window");
const GRID_GAP = 34;
const verticalLines = Array.from(
  { length: Math.ceil(width / GRID_GAP) + 3 },
  (_, index) => index,
);
const horizontalLines = Array.from(
  { length: Math.ceil(height / GRID_GAP) + 4 },
  (_, index) => index,
);

type HeaderProps = {
  badge?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  subtitle?: string;
  title: string;
};

type LogoMarkProps = {
  flat?: boolean;
  inverted?: boolean;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

type CardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  tone?: "brand" | "default" | "soft";
};

type ButtonProps = {
  disabled?: boolean;
  icon?: ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress?: () => void;
  secondary?: boolean;
  style?: StyleProp<ViewStyle>;
};

type StepBarProps = {
  step: number;
  total?: number;
};

export function GigzoBackdrop() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={styles.backdropBase} />
      <View style={styles.orbTop} />
      <View style={styles.orbBottom} />
      <View style={styles.gridLayer}>
        {verticalLines.map((line) => (
          <View
            key={`v-${line}`}
            style={[styles.gridLineVertical, { left: line * GRID_GAP }]}
          />
        ))}
        {horizontalLines.map((line) => (
          <View
            key={`h-${line}`}
            style={[styles.gridLineHorizontal, { top: line * GRID_GAP }]}
          />
        ))}
      </View>
    </View>
  );
}

export function GigzoLogoMark({
  flat = false,
  inverted = false,
  size = 48,
  style,
}: LogoMarkProps) {
  return (
    <View
      style={[
        styles.logoBadge,
        {
          width: size,
          height: size,
          borderRadius: Math.max(16, Math.round(size * 0.34)),
        },
        flat && styles.logoBadgeFlat,
        inverted && styles.logoBadgeInverted,
        style,
      ]}
    >
      {!flat ? (
        <View style={[styles.logoAura, inverted && styles.logoAuraInverted]} />
      ) : null}
      <Image
        resizeMode="contain"
        source={LOGO}
        style={{
          width: size * 0.94,
          height: size * 0.7,
        }}
      />
    </View>
  );
}

export function GigzoLockup({
  compact = false,
  inverted = false,
  style,
}: {
  compact?: boolean;
  inverted?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.lockup, compact && styles.lockupCompact, style]}>
      <GigzoLogoMark inverted={inverted} size={compact ? 42 : 52} />
      <View>
        <Text
          style={[styles.lockupTitle, inverted && styles.lockupTitleInverted]}
        >
          GIGZO
        </Text>
        {!compact && (
          <Text
            style={[styles.lockupSub, inverted && styles.lockupSubInverted]}
          >
            Shift protection for every zone
          </Text>
        )}
      </View>
    </View>
  );
}

export function GigzoHeader({
  badge,
  left,
  right,
  subtitle,
  title,
}: HeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        {left ?? <GigzoLockup compact />}
        {right}
      </View>
      {badge ? (
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{badge}</Text>
        </View>
      ) : null}
      <Text style={styles.headerTitle}>{title}</Text>
      {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function GigzoCard({ children, style, tone = "default" }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        tone === "brand" && styles.cardBrand,
        tone === "soft" && styles.cardSoft,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function GigzoButton({
  disabled,
  icon,
  label,
  onPress,
  secondary,
  style,
}: ButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        secondary && styles.buttonSecondary,
        disabled && styles.buttonDisabled,
        style,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          secondary && styles.buttonTextSecondary,
          disabled && styles.buttonTextDisabled,
        ]}
      >
        {label}
      </Text>
      {icon ? (
        <Ionicons
          color={secondary ? Brand.primary : Neutral.white}
          name={icon}
          size={16}
          style={styles.buttonIcon}
        />
      ) : null}
    </TouchableOpacity>
  );
}

export function GigzoStepBar({ step, total = 4 }: StepBarProps) {
  return (
    <View style={styles.stepWrap}>
      {Array.from({ length: total }, (_, index) => (
        <View
          key={index}
          style={[styles.stepBar, index < step && styles.stepBarActive]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  backdropBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Brand.canvas,
  },
  orbTop: {
    position: "absolute",
    top: -120,
    right: -90,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(143, 201, 200, 0.16)",
  },
  orbBottom: {
    position: "absolute",
    bottom: -120,
    left: -80,
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: "rgba(122, 183, 191, 0.12)",
  },
  gridLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLineVertical: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: Brand.line,
  },
  gridLineHorizontal: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Brand.line,
  },
  lockup: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  lockupCompact: {
    gap: Spacing.sm,
  },
  logoBadge: {
    backgroundColor: Brand.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Brand.line,
    overflow: "hidden",
    position: "relative",
    ...Shadow.sm,
  },
  logoBadgeFlat: {
    backgroundColor: "transparent",
    borderWidth: 0,
  },
  logoBadgeInverted: {
    backgroundColor: "rgba(255,255,255,0.16)",
    borderColor: "rgba(255,255,255,0.14)",
  },
  logoAura: {
    position: "absolute",
    width: "78%",
    height: "78%",
    borderRadius: Radius.full,
    backgroundColor: "rgba(143, 201, 200, 0.22)",
  },
  logoAuraInverted: {
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  logo: {
    width: 36,
    height: 36,
  },
  logoCompact: {
    width: 26,
    height: 26,
  },
  lockupTitle: {
    fontFamily: Font.bold,
    fontSize: 21,
    color: Brand.primaryDark,
    letterSpacing: 0.6,
  },
  lockupTitleInverted: {
    color: Neutral.white,
  },
  lockupSub: {
    fontFamily: Font.medium,
    fontSize: 11,
    color: Neutral[500],
    marginTop: 1,
  },
  lockupSubInverted: {
    color: "rgba(255,255,255,0.72)",
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  headerBadge: {
    alignSelf: "flex-start",
    backgroundColor: Brand.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Brand.line,
    marginBottom: Spacing.md,
  },
  headerBadgeText: {
    fontFamily: Font.semiBold,
    fontSize: 11,
    color: Brand.primary,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  headerTitle: {
    fontFamily: Font.bold,
    fontSize: 32,
    lineHeight: 38,
    color: Neutral[900],
    letterSpacing: -0.8,
  },
  headerSubtitle: {
    fontFamily: Font.medium,
    fontSize: 14,
    lineHeight: 22,
    color: Neutral[500],
    marginTop: Spacing.sm,
  },
  card: {
    backgroundColor: Neutral.white,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Brand.line,
    padding: Spacing.xl,
    ...Shadow.md,
  },
  cardBrand: {
    backgroundColor: Brand.primary,
    borderColor: "rgba(255,255,255,0.12)",
    ...Shadow.lg,
  },
  cardSoft: {
    backgroundColor: Brand.surfaceAlt,
    ...Shadow.sm,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Brand.primary,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: Radius.xl,
    ...Shadow.lg,
    minHeight: 56,
  },
  buttonSecondary: {
    backgroundColor: Neutral.white,
    borderWidth: 1.5,
    borderColor: Brand.line,
    ...Shadow.sm,
  },
  buttonDisabled: {
    backgroundColor: Neutral[200],
    borderColor: Neutral[200],
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    fontFamily: Font.bold,
    fontSize: 16,
    color: Neutral.white,
  },
  buttonTextSecondary: {
    color: Brand.primary,
  },
  buttonTextDisabled: {
    color: Neutral[500],
  },
  buttonIcon: {
    marginTop: 1,
  },
  stepWrap: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xxl,
  },
  stepBar: {
    flex: 1,
    height: 4,
    borderRadius: Radius.full,
    backgroundColor: "rgba(3, 87, 94, 0.10)",
  },
  stepBarActive: {
    backgroundColor: Brand.primary,
  },
});
