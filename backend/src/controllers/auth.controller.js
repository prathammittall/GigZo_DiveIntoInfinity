import {
  loginWithFirebaseToken,
  getProfileByUserId,
} from "../modules/auth/auth.service.js";

function getStatusCode(error) {
  return Number(error?.statusCode) || 500;
}

export async function firebaseLoginController(req, res) {
  try {
    const { idToken } = req.body || {};
    const result = await loginWithFirebaseToken(idToken);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    });
  } catch (error) {
    return res.status(getStatusCode(error)).json({
      success: false,
      message: error.message || "Firebase login failed.",
    });
  }
}

export async function profileController(req, res) {
  try {
    const user = await getProfileByUserId(req.user.userId);

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    return res.status(getStatusCode(error)).json({
      success: false,
      message: error.message || "Failed to fetch profile.",
    });
  }
}
