import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createJSONStorage, persist } from "zustand/middleware";

type Plan = "basic" | "pro" | null;
type HistoryFilter = "ALL" | "RAIN" | "AQI" | "FLOOD";
type RiskLevel = "HIGH" | "MEDIUM" | "LOW";

type AppUser = {
  id: string;
  name: string;
  phone: string;
  platform: string;
  city: string;
  zone: string;
  isProtected: boolean;
  activePlan: Plan;
  coveragePerDay: number;
  daysLeft: number;
  planExpiry?: string | null;
  riskLevel?: RiskLevel | null;
  riskScore?: number | null;
  workerId?: string | null;
  type?: "full-time" | "part-time" | null;
  pincode?: string | null;
  workingArea?: string | null;
  workingHoursPerDay?: number | null;
  avgDailyEarning?: number | null;
  age?: number | null;
};

type ConditionMetric = {
  value: number;
  unit: string;
  threshold: number;
  triggered: boolean;
};

type LiveConditions = {
  rainfall: ConditionMetric;
  aqi: ConditionMetric;
  temperature: ConditionMetric;
  windSpeed: ConditionMetric;
  overallRisk: RiskLevel;
  status: string;
  isLive: boolean;
};

type Earnings = {
  thisWeek: number;
  weeklyMax: number;
  totalProtected: number;
};

type AlertData = {
  title: string;
  subtitle: string;
  type: "rain" | "aqi" | "flood" | "curfew";
};

type ActiveClaimStep = {
  label: string;
  icon: string;
  done: boolean;
};

type ActiveClaim = {
  id: string;
  type: "RAIN" | "AQI" | "FLOOD";
  reason: string;
  amount: number;
  status: "in_progress" | "verified" | "paid";
  steps: ActiveClaimStep[];
};

type PayoutHistoryItem = {
  id: string;
  type: "RAIN" | "AQI" | "FLOOD";
  title: string;
  date: string;
  amount: number;
  status: "PAID" | "VERIFIED" | "PENDING";
};

type HistoryStats = {
  totalReceived: number;
  claimsPaid: number;
  pending: number;
};

const initialUser: AppUser = {
  id: "",
  name: "",
  phone: "",
  platform: "",
  city: "",
  zone: "",
  isProtected: false,
  activePlan: null,
  coveragePerDay: 0,
  daysLeft: 0,
};

const initialConditions: LiveConditions = {
  rainfall: { value: 0, unit: "mm", threshold: 0, triggered: false },
  aqi: { value: 0, unit: "", threshold: 0, triggered: false },
  temperature: { value: 0, unit: "°C", threshold: 0, triggered: false },
  windSpeed: { value: 0, unit: "km/h", threshold: 0, triggered: false },
  overallRisk: "LOW",
  status: "Live condition sync pending.",
  isLive: false,
};

const initialEarnings: Earnings = {
  thisWeek: 0,
  weeklyMax: 0,
  totalProtected: 0,
};

const initialHistoryStats: HistoryStats = {
  totalReceived: 0,
  claimsPaid: 0,
  pending: 0,
};

function sanitizePhoneForUi(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  if (value.startsWith("email:")) {
    return value.slice("email:".length);
  }

  return value;
}

interface AppState {
  // User
  user: AppUser;
  isOnboarded: boolean;
  hasHydrated: boolean;

  // Live data
  conditions: LiveConditions;
  earnings: Earnings;
  alert: AlertData | null;

  // Plan
  selectedPlan: Plan;

  // Claims
  activeClaim: ActiveClaim | null;
  historyFilter: HistoryFilter;
  payoutHistory: PayoutHistoryItem[];
  historyStats: HistoryStats;

  // Actions
  setSelectedPlan: (plan: Plan) => void;
  setHistoryFilter: (filter: HistoryFilter) => void;
  setOnboarded: (val: boolean) => void;
  setUser: (user: Partial<AppUser>) => void;
  setConditions: (conditions: Partial<LiveConditions>) => void;
  resetSession: () => void;
  setHasHydrated: (value: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: initialUser,
      isOnboarded: false,
      hasHydrated: false,
      conditions: initialConditions,
      earnings: initialEarnings,
      alert: null,
      selectedPlan: null,
      activeClaim: null,
      historyFilter: "ALL" as HistoryFilter,
      payoutHistory: [],
      historyStats: initialHistoryStats,

      setSelectedPlan: (plan) => set({ selectedPlan: plan }),
      setHistoryFilter: (filter) => set({ historyFilter: filter }),
      setOnboarded: (val) => set({ isOnboarded: val }),
      setUser: (user) =>
        set((state) => ({
          user: {
            ...state.user,
            ...user,
            phone: sanitizePhoneForUi(user.phone) || state.user.phone,
          },
        })),
      setConditions: (conditions) =>
        set((state) => ({
          conditions: {
            ...state.conditions,
            ...conditions,
          },
        })),
      resetSession: () =>
        set({
          user: initialUser,
          isOnboarded: false,
          conditions: initialConditions,
          earnings: initialEarnings,
          alert: null,
          selectedPlan: null,
          activeClaim: null,
          historyFilter: "ALL",
          payoutHistory: [],
          historyStats: initialHistoryStats,
        }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "gigzo-app-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isOnboarded: state.isOnboarded,
        selectedPlan: state.selectedPlan,
        historyFilter: state.historyFilter,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
