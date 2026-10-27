import { hasAuthCookie } from "../utils/authCookie.js";

const allowedOrigins = () =>
  (process.env.CORS_ORIGINS || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

export function protectCookieRequests(req, res, next) {
  const isMutation = !["GET", "HEAD", "OPTIONS"].includes(req.method);
  const authenticatedByCookie = hasAuthCookie(req);

  if (!isMutation || !authenticatedByCookie) return next();

  const origin = req.get("origin");
  if (!origin || !allowedOrigins().includes(origin)) {
    return res.status(403).json({
      success: false,
      message: "Request origin is not allowed.",
      data: null,
    });
  }

  return next();
}
