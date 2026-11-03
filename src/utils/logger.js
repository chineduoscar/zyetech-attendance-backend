import winston from "winston";

const serializeError = (error) => {
  if (!(error instanceof Error)) return error;
  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
    code: error.code,
  };
};

const winstonLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  defaultMeta: { service: "zyetech-attendance-api" },
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  transports: [new winston.transports.Console()],
  exceptionHandlers: [new winston.transports.Console()],
  rejectionHandlers: [new winston.transports.Console()],
});

const write = (level, event, fields = {}) =>
  winstonLogger.log({ level, event, ...fields });

export const logger = {
  info: (event, fields) => write("info", event, fields),
  warn: (event, fields) => write("warn", event, fields),
  error: (event, errorOrFields, fields = {}) => {
    if (errorOrFields instanceof Error) {
      write("error", event, {
        ...fields,
        error: serializeError(errorOrFields),
      });
      return;
    }

    write("error", event, {
      ...(errorOrFields && typeof errorOrFields === "object"
        ? errorOrFields
        : {}),
      ...fields,
    });
  },
};
