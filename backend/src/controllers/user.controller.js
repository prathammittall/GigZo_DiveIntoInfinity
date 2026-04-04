import { User, WorkerProfile } from "../models/index.js";

const ALLOWED_PLATFORMS = ["Zomato", "Swiggy", "Zepto", "Blinkit", "Amazon"];
const ALLOWED_TYPES = ["full-time", "part-time"];
const ALLOWED_PLANS = ["basic", "pro"];

// Fields that belong to the users table
const USER_FIELDS = new Set(["name", "email"]);

// Fields that belong to the worker_profiles table
const WORKER_FIELDS = new Set([
  "age",
  "platform",
  "workerId",
  "type",
  "city",
  "zone",
  "pincode",
  "workingArea",
  "workingHoursPerDay",
  "avgDailyEarning",
  "coveragePerDay",
  "activePlan",
  "isProtected",
  "deviceFingerprint",
  "lastLocation",
]);

function asOptionalString(value) {
  if (value === undefined || value === null) {
    return undefined;
  }
  const normalized = String(value).trim();
  return normalized.length ? normalized : null;
}

function asOptionalInteger(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return null;
  }
  return Math.trunc(num);
}

function asOptionalFloat(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return null;
  }
  return num;
}

function normalizeProfilePayload(body) {
  const raw = {
    // User fields
    name: asOptionalString(body.name),
    email: asOptionalString(body.email),

    // Worker profile fields
    platform: asOptionalString(body.platform),
    city: asOptionalString(body.city),
    zone: asOptionalString(body.zone),
    workerId: asOptionalString(body.workerId),
    workingArea: asOptionalString(body.workingArea),
    pincode: asOptionalString(body.pincode),
    type: asOptionalString(body.type),
    age: asOptionalInteger(body.age),
    workingHoursPerDay: asOptionalInteger(body.workingHoursPerDay),
    avgDailyEarning: asOptionalFloat(body.avgDailyEarning),
    coveragePerDay: asOptionalFloat(body.coveragePerDay),
    activePlan: asOptionalString(body.activePlan),
    isProtected:
      body.isProtected === undefined || body.isProtected === null
        ? undefined
        : Boolean(body.isProtected),
    deviceFingerprint:
      body.deviceFingerprint === undefined ? undefined : body.deviceFingerprint,
    lastLocation:
      body.lastLocation === undefined ? undefined : body.lastLocation,
  };

  if (raw.platform && !ALLOWED_PLATFORMS.includes(raw.platform)) {
    const error = new Error("Invalid platform.");
    error.statusCode = 400;
    throw error;
  }

  if (raw.type && !ALLOWED_TYPES.includes(raw.type)) {
    const error = new Error("Invalid worker type.");
    error.statusCode = 400;
    throw error;
  }

  if (raw.activePlan && !ALLOWED_PLANS.includes(raw.activePlan)) {
    const error = new Error("Invalid active plan.");
    error.statusCode = 400;
    throw error;
  }

  // Split into user vs worker payloads
  const userPayload = {};
  const workerPayload = {};

  for (const [key, value] of Object.entries(raw)) {
    if (value === undefined) continue;

    if (USER_FIELDS.has(key)) {
      userPayload[key] = value;
    } else if (WORKER_FIELDS.has(key)) {
      workerPayload[key] = value;
    }
  }

  return { userPayload, workerPayload };
}

function formatUser(user) {
  const profile = user.workerProfile || {};

  return {
    id: user.id,
    phone: user.phone,
    firebaseUid: user.firebaseUid,
    name: user.name,
    email: user.email,
    age: profile.age ?? null,
    platform: profile.platform ?? null,
    workerId: profile.workerId ?? null,
    type: profile.type ?? null,
    city: profile.city ?? null,
    zone: profile.zone ?? null,
    pincode: profile.pincode ?? null,
    workingArea: profile.workingArea ?? null,
    workingHoursPerDay: profile.workingHoursPerDay ?? null,
    avgDailyEarning: profile.avgDailyEarning ?? 0,
    riskScore: profile.riskScore ?? 0,
    isProtected: profile.isProtected ?? false,
    activePlan: profile.activePlan ?? "basic",
    coveragePerDay: profile.coveragePerDay ?? 0,
    deviceFingerprint: profile.deviceFingerprint ?? null,
    lastLocation: profile.lastLocation ?? null,
    lastActivityAt: profile.lastActivityAt ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function getStatusCode(error) {
  return Number(error?.statusCode) || 500;
}

export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId, {
      include: [{ model: WorkerProfile, as: "workerProfile" }],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: formatUser(user),
    });
  } catch (error) {
    return res.status(getStatusCode(error)).json({
      success: false,
      message: error.message || "Failed to load profile.",
    });
  }
};

export const updateMyProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId, {
      include: [{ model: WorkerProfile, as: "workerProfile" }],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const { userPayload, workerPayload } = normalizeProfilePayload(
      req.body || {},
    );

    const hasUserUpdates = Object.keys(userPayload).length > 0;
    const hasWorkerUpdates = Object.keys(workerPayload).length > 0;

    if (!hasUserUpdates && !hasWorkerUpdates) {
      return res.status(400).json({
        success: false,
        message: "No profile fields provided.",
      });
    }

    // Update user table fields
    if (hasUserUpdates) {
      await user.update(userPayload);
    }

    // Update or create worker_profiles row
    if (hasWorkerUpdates) {
      if (user.workerProfile) {
        await user.workerProfile.update(workerPayload);
      } else {
        await WorkerProfile.create({
          userId: user.id,
          ...workerPayload,
        });
      }
    }

    // Reload with fresh data
    const updatedUser = await User.findByPk(user.id, {
      include: [{ model: WorkerProfile, as: "workerProfile" }],
    });

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: formatUser(updatedUser),
    });
  } catch (error) {
    return res.status(getStatusCode(error)).json({
      success: false,
      message: error.message || "Failed to update profile.",
    });
  }
};
