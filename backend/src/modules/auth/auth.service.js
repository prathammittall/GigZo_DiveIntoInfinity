import jwt from "jsonwebtoken";
import { User, WorkerProfile } from "../../models/index.js";
import { verifyFirebaseIdToken } from "../../config/firebase.js";
import { Op } from "sequelize";

function normalizeIndianPhone(phoneNumber) {
  if (!phoneNumber || typeof phoneNumber !== "string") {
    return null;
  }

  const digits = phoneNumber.replace(/\D/g, "");
  if (digits.length === 10) {
    return `+91${digits}`;
  }

  if (digits.length === 12 && digits.startsWith("91")) {
    return `+${digits}`;
  }

  if (phoneNumber.startsWith("+")) {
    return phoneNumber;
  }

  return null;
}

function getUserIdentifier(decodedToken) {
  const normalizedPhone = normalizeIndianPhone(decodedToken.phone_number);
  if (normalizedPhone) {
    return normalizedPhone;
  }

  if (decodedToken.email && typeof decodedToken.email === "string") {
    return `email:${decodedToken.email.toLowerCase()}`;
  }

  return null;
}

export async function loginWithFirebaseToken(idToken) {
  if (!idToken || typeof idToken !== "string") {
    const error = new Error("Firebase idToken is required.");
    error.statusCode = 400;
    throw error;
  }

  const decoded = await verifyFirebaseIdToken(idToken);
  const firebaseUid = decoded.uid;
  const userIdentifier = getUserIdentifier(decoded);

  if (!userIdentifier) {
    const error = new Error(
      "Phone number or email is missing in Firebase token.",
    );
    error.statusCode = 400;
    throw error;
  }

  let user = await User.findOne({
    where: {
      [Op.or]: [{ firebaseUid }, { phone: userIdentifier }],
    },
    include: [{ model: WorkerProfile, as: "workerProfile" }],
  });

  if (!user) {
    user = await User.create({
      firebaseUid,
      phone: userIdentifier,
      name: decoded.name || null,
      email: decoded.email || null,
      lastLoginAt: new Date(),
    });

    // Create an empty worker profile for the new user
    await WorkerProfile.create({ userId: user.id });

    // Reload with association
    user = await User.findByPk(user.id, {
      include: [{ model: WorkerProfile, as: "workerProfile" }],
    });
  } else {
    user.firebaseUid = firebaseUid;
    user.phone = userIdentifier;
    if (!user.name && decoded.name) {
      user.name = decoded.name;
    }
    if (!user.email && decoded.email) {
      user.email = decoded.email;
    }
    user.lastLoginAt = new Date();
    await user.save();
  }

  const accessToken = jwt.sign(
    {
      userId: user.id,
      phone: user.phone,
      firebaseUid: user.firebaseUid,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
  );

  const profile = user.workerProfile || {};

  return {
    accessToken,
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      email: user.email,
      platform: profile.platform || null,
      city: profile.city || null,
      zone: profile.zone || null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  };
}

export async function getProfileByUserId(userId) {
  const user = await User.findByPk(userId, {
    include: [{ model: WorkerProfile, as: "workerProfile" }],
  });

  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  const profile = user.workerProfile || {};

  return {
    id: user.id,
    phone: user.phone,
    name: user.name,
    email: user.email,
    firebaseUid: user.firebaseUid,
    age: profile.age || null,
    platform: profile.platform || null,
    workerId: profile.workerId || null,
    type: profile.type || null,
    city: profile.city || null,
    zone: profile.zone || null,
    pincode: profile.pincode || null,
    workingArea: profile.workingArea || null,
    workingHoursPerDay: profile.workingHoursPerDay || null,
    avgDailyEarning: profile.avgDailyEarning || 0,
    riskScore: profile.riskScore || 0,
    isProtected: profile.isProtected || false,
    activePlan: profile.activePlan || "basic",
    coveragePerDay: profile.coveragePerDay || 0,
    deviceFingerprint: profile.deviceFingerprint || null,
    lastLocation: profile.lastLocation || null,
    lastActivityAt: profile.lastActivityAt || null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
