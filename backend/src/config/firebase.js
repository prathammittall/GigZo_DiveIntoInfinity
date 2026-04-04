import admin from "firebase-admin";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

let initialized = false;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "../../");

function resolveServiceAccountPath(serviceAccountFile) {
  if (path.isAbsolute(serviceAccountFile)) {
    return serviceAccountFile;
  }

  const fromCwd = path.resolve(process.cwd(), serviceAccountFile);
  if (fs.existsSync(fromCwd)) {
    return fromCwd;
  }

  return path.resolve(backendRoot, serviceAccountFile);
}

function parseServiceAccount() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw =
    process.env.FIREBASE_PRIVATE_KEY ||
    (process.env.FIREBASE_PRIVATE_KEY_BASE64
      ? Buffer.from(process.env.FIREBASE_PRIVATE_KEY_BASE64, "base64").toString(
          "utf-8",
        )
      : undefined);

  if (projectId && clientEmail && privateKeyRaw) {
    return {
      project_id: projectId,
      client_email: clientEmail,
      private_key: privateKeyRaw.replace(/\\n/g, "\n"),
    };
  }

  const serviceAccountFile = process.env.FIREBASE_SERVICE_ACCOUNT_FILE;
  if (serviceAccountFile) {
    const filePath = resolveServiceAccountPath(serviceAccountFile);
    const json = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(json);
  }

  const inlineJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (inlineJson) {
    try {
      return JSON.parse(inlineJson);
    } catch {
      // Supports Base64-encoded JSON for hosts where raw JSON env values are hard to manage.
      const decoded = Buffer.from(inlineJson, "base64").toString("utf-8");
      return JSON.parse(decoded);
    }
  }

  throw new Error(
    "Firebase Admin credentials are missing. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY (or FIREBASE_PRIVATE_KEY_BASE64). Optional fallback: FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_SERVICE_ACCOUNT_FILE.",
  );
}

export function initializeFirebaseAdmin() {
  if (initialized && admin.apps.length) {
    return admin.app();
  }

  if (!admin.apps.length) {
    const serviceAccount = parseServiceAccount();
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  initialized = true;
  return admin.app();
}

export async function verifyFirebaseIdToken(idToken) {
  initializeFirebaseAdmin();
  return admin.auth().verifyIdToken(idToken);
}
