import jwt from "jsonwebtoken";
import User from "../../models/user.model.js";
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
  });

  if (!user) {
    user = await User.create({
      firebaseUid,
      phone: userIdentifier,
      name: decoded.name || null,
      lastLoginAt: new Date(),
    });
  } else {
    user.firebaseUid = firebaseUid;
    user.phone = userIdentifier;
    if (!user.name && decoded.name) {
      user.name = decoded.name;
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

  return {
    accessToken,
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      platform: user.platform,
      city: user.city,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  };
}

export async function getProfileByUserId(userId) {
  const user = await User.findByPk(userId);
  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  return {
    id: user.id,
    phone: user.phone,
    name: user.name,
    platform: user.platform,
    city: user.city,
    zone: user.zone,
    age: user.age,
    type: user.type,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
