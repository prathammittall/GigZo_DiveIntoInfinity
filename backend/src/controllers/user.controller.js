import User from "../models/user.model.js";

const ALLOWED_PLATFORMS = ["Zomato", "Swiggy", "Zepto", "Blinkit", "Amazon"];
const ALLOWED_TYPES = ["full-time", "part-time"];
const ALLOWED_PLANS = ["basic", "pro"];

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
  const payload = {
    name: asOptionalString(body.name),
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
  };

  if (payload.platform && !ALLOWED_PLATFORMS.includes(payload.platform)) {
    const error = new Error("Invalid platform.");
    error.statusCode = 400;
    throw error;
  }

  if (payload.type && !ALLOWED_TYPES.includes(payload.type)) {
    const error = new Error("Invalid worker type.");
    error.statusCode = 400;
    throw error;
  }

  if (payload.activePlan && !ALLOWED_PLANS.includes(payload.activePlan)) {
    const error = new Error("Invalid active plan.");
    error.statusCode = 400;
    throw error;
  }

  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined) {
      delete payload[key];
    }
  }

  return payload;
}

function formatUser(user) {
  return {
    id: user.id,
    phone: user.phone,
    firebaseUid: user.firebaseUid,
    name: user.name,
    age: user.age,
    platform: user.platform,
    workerId: user.workerId,
    type: user.type,
    city: user.city,
    pincode: user.pincode,
    workingArea: user.workingArea,
    workingHoursPerDay: user.workingHoursPerDay,
    avgDailyEarning: user.avgDailyEarning,
    zone: user.zone,
    coveragePerDay: user.coveragePerDay,
    activePlan: user.activePlan,
    isProtected: user.isProtected,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function getStatusCode(error) {
  return Number(error?.statusCode) || 500;
}

export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId);
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
    const user = await User.findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const payload = normalizeProfilePayload(req.body || {});

    if (!Object.keys(payload).length) {
      return res.status(400).json({
        success: false,
        message: "No profile fields provided.",
      });
    }

    await user.update(payload);

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: formatUser(user),
    });
  } catch (error) {
    return res.status(getStatusCode(error)).json({
      success: false,
      message: error.message || "Failed to update profile.",
    });
  }
};
