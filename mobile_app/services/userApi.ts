import { getApiBaseUrl } from "./apiBaseUrl";
import { getAccessToken } from "./authStorage";

const API_BASE_URL = getApiBaseUrl();

export type BackendUserProfile = {
  id: string;
  phone: string;
  firebaseUid: string | null;
  name: string | null;
  age: number | null;
  platform: "Zomato" | "Swiggy" | "Zepto" | "Blinkit" | "Amazon" | null;
  workerId: string | null;
  type: "full-time" | "part-time" | null;
  city: string | null;
  pincode: string | null;
  workingArea: string | null;
  workingHoursPerDay: number | null;
  avgDailyEarning: number | null;
  zone: string | null;
  coveragePerDay: number | null;
  activePlan: "basic" | "pro" | null;
  isProtected: boolean;
  createdAt: string;
  updatedAt: string;
};

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

export type UpdateUserProfileInput = {
  name?: string;
  age?: number;
  platform?: "Zomato" | "Swiggy" | "Zepto" | "Blinkit" | "Amazon";
  workerId?: string;
  type?: "full-time" | "part-time";
  city?: string;
  pincode?: string;
  workingArea?: string;
  workingHoursPerDay?: number;
  avgDailyEarning?: number;
  zone?: string;
  coveragePerDay?: number;
  activePlan?: "basic" | "pro";
  isProtected?: boolean;
};

async function getAuthHeader() {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error("Missing access token. Please verify OTP again.");
  }

  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
}

export async function getMyProfile() {
  const headers = await getAuthHeader();
  const response = await fetch(`${API_BASE_URL}/api/users/me`, {
    method: "GET",
    headers,
  });

  const payload = (await response.json()) as ApiEnvelope<BackendUserProfile>;

  if (!response.ok || !payload.success || !payload.data) {
    throw new Error(payload.message || "Unable to fetch profile.");
  }

  return payload.data;
}

export async function updateMyProfile(input: UpdateUserProfileInput) {
  const headers = await getAuthHeader();
  const response = await fetch(`${API_BASE_URL}/api/users/me`, {
    method: "PUT",
    headers,
    body: JSON.stringify(input),
  });

  const payload = (await response.json()) as ApiEnvelope<BackendUserProfile>;

  if (!response.ok || !payload.success || !payload.data) {
    throw new Error(payload.message || "Unable to save profile.");
  }

  return payload.data;
}
