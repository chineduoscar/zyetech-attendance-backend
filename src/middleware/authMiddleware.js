import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { getAuthCookie } from "../utils/authCookie.js";

export async function authenticate(req, res, next) {
  const authorization = req.get("authorization");
  const [scheme, bearerToken, ...extraParts] =
    authorization?.trim().split(/\s+/) ?? [];

  const token =
    scheme?.toLowerCase() === "bearer" && bearerToken && extraParts.length === 0
      ? bearerToken
      : getAuthCookie(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication is required.",
      data: null,
    });
  }

  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is required to authenticate requests.");
    return res.status(500).json({
      success: false,
      message: "An error occurred",
      data: null,
    });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token.",
        data: null,
      });
    }

    console.error("Token verification failed:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred",
      data: null,
    });
  }

  if (!payload || typeof payload === "string" || !payload.sub) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
      data: null,
    });
  }

  try {
    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token.",
        data: null,
      });
    }

    req.user = user;
    return next();
  } catch (error) {
    console.error("Failed to authenticate user:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred",
      data: null,
    });
  }
}

export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication is required.",
        data: null,
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this resource.",
        data: null,
      });
    }

    return next();
  };
}
