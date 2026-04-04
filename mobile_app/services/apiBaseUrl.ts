import { Platform } from "react-native";

export function getApiBaseUrl() {
  const fromSharedEnv = process.env.EXPO_PUBLIC_API_BASE_URL;
  const fromModeEnv = __DEV__
    ? process.env.EXPO_PUBLIC_API_BASE_URL_DEV
    : process.env.EXPO_PUBLIC_API_BASE_URL_PROD;
  const selectedUrl = fromModeEnv || fromSharedEnv;

  if (selectedUrl) {
    const normalized = selectedUrl.replace(/\/$/, "");

    if (
      Platform.OS === "android" &&
      (normalized.startsWith("http://localhost") ||
        normalized.startsWith("http://127.0.0.1"))
    ) {
      return normalized
        .replace("http://localhost", "http://10.0.2.2")
        .replace("http://127.0.0.1", "http://10.0.2.2");
    }

    return normalized;
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:5000";
  }

  return "http://localhost:5000";
}
