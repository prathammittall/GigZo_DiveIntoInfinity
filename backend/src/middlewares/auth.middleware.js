import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
	try {
		const authHeader = req.headers.authorization || "";
		const token = authHeader.startsWith("Bearer ")
			? authHeader.slice(7)
			: null;

		if (!token) {
			return res.status(401).json({
				success: false,
				message: "Authentication token is missing.",
			});
		}

		const payload = jwt.verify(token, process.env.JWT_SECRET);
		req.user = {
			userId: payload.userId,
			phone: payload.phone,
		};

		return next();
	} catch (_error) {
		return res.status(401).json({
			success: false,
			message: "Invalid or expired authentication token.",
		});
	}
}
