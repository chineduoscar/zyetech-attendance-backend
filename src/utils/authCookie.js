const COOKIE_NAME = "zyetech_auth";
const TOKEN_MAX_AGE_SECONDS = 24 * 60 * 60;

const cookieOptions = () => {
  const sameSite = (process.env.AUTH_COOKIE_SAME_SITE || "Lax").toLowerCase();
  const secure =
    process.env.NODE_ENV === "production" ||
    process.env.AUTH_COOKIE_SECURE === "true";

  if (!["lax", "strict", "none"].includes(sameSite)) {
    throw new Error("AUTH_COOKIE_SAME_SITE must be Lax, Strict, or None.");
  }
  if (sameSite === "none" && !secure) {
    throw new Error("SameSite=None authentication cookies require Secure.");
  }

  return { sameSite, secure };
};

export function getAuthCookie(req) {
  const cookieHeader = req.get("cookie") || "";
  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`));

  return cookie ? cookie.slice(COOKIE_NAME.length + 1) : null;
}

export function hasAuthCookie(req) {
  return Boolean(getAuthCookie(req));
}

export function setAuthCookie(res, token) {
  const { sameSite, secure } = cookieOptions();
  const attributes = [
    `${COOKIE_NAME}=${token}`,
    "Path=/",
    `Max-Age=${TOKEN_MAX_AGE_SECONDS}`,
    "HttpOnly",
    `SameSite=${sameSite}`,
  ];
  if (secure) attributes.push("Secure");
  res.append("Set-Cookie", attributes.join("; "));
}

export function clearAuthCookie(res) {
  const { sameSite, secure } = cookieOptions();
  const attributes = [
    `${COOKIE_NAME}=`,
    "Path=/",
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    "HttpOnly",
    `SameSite=${sameSite}`,
  ];
  if (secure) attributes.push("Secure");
  res.append("Set-Cookie", attributes.join("; "));
}

export const authCookieName = COOKIE_NAME;
