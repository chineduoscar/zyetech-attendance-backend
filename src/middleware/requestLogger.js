import { randomUUID } from "node:crypto";
import { logger } from "../utils/logger.js";

export function requestLogger(req, res, next) {
  const requestId = randomUUID();
  const startedAt = process.hrtime.bigint();
  req.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);

  res.on("finish", () => {
    const status = res.statusCode;
    const fields = {
      request_id: requestId,
      method: req.method,
      path: req.path,
      status,
      duration_ms: Number(process.hrtime.bigint() - startedAt) / 1e6,
      ...(req.user
        ? { user_id: req.user.id, user_role: req.user.role }
        : {}),
    };

    if (status >= 500) logger.error("http.request.failed", fields);
    else if (status >= 400) logger.warn("http.request.rejected", fields);
    else logger.info("http.request.completed", fields);
  });

  next();
}

export function errorLogger(error, req, res, next) {
  if (res.headersSent) {
    next(error);
    return;
  }

  const status =
    Number.isInteger(error.status) && error.status >= 400 && error.status < 600
      ? error.status
      : 500;
  logger.error("http.unhandled_error", error, {
    request_id: req.requestId,
    method: req.method,
    path: req.path,
    status,
  });

  res.status(status).json({
    success: false,
    message:
      status === 413
        ? "The request is too large."
        : status >= 500
          ? "An unexpected server error occurred."
          : "The request could not be processed.",
    data: null,
  });
}
