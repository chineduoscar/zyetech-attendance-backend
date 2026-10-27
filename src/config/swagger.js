const attendanceRecord = {
  type: "object",
  properties: {
    id: { type: "string", example: "1" },
    name: { type: "string", example: "Jane Doe" },
    created_at: { type: "string", format: "date-time" },
  },
};

const response = (description, schema) => ({
  description,
  content: {
    "application/json": {
      schema,
    },
  },
});

const successResponse = {
  type: "object",
  required: ["success", "message", "data"],
  properties: {
    success: { type: "boolean", example: true },
    message: { type: "string" },
    data: {},
  },
};

const errorResponse = {
  type: "object",
  required: ["success", "message", "data"],
  properties: {
    success: { type: "boolean", example: false },
    message: { type: "string", example: "An error occurred" },
    data: { type: "object", nullable: true, example: null },
  },
};

const attendanceResponses = {
  "400": response("Invalid request body or record ID.", errorResponse),
  "401": response("Missing, invalid, or expired bearer token.", errorResponse),
  "403": response("The authenticated role cannot perform this action.", errorResponse),
  "404": response("Attendance record not found.", errorResponse),
  "500": response("Unexpected server error.", errorResponse),
};

const protectedAdmin = [{ cookieAuth: [] }, { bearerAuth: [] }];
const superadminOnly = [{ cookieAuth: [] }, { bearerAuth: [] }];

export const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "Zyetech Attendance Management API",
    version: "1.0.0",
    description:
      "Attendance recording, role-based account management, and attendance analytics. New registrations receive the user role automatically.",
  },
  servers: [
    {
      url: "/",
      description: "Current server",
    },
  ],
  tags: [
    { name: "Authentication" },
    { name: "Student Attendance" },
    { name: "Staff Attendance" },
    { name: "Analytics" },
    { name: "Users" },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "zyetech_auth",
        description: "HttpOnly authentication cookie set by register or login.",
      },
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Paste the JWT returned by register or login.",
      },
    },
    schemas: {
      Error: errorResponse,
      SuccessEnvelope: successResponse,
      StudentAttendance: {
        allOf: [
          { $ref: "#/components/schemas/AttendanceBase" },
          {
            type: "object",
            properties: {
              course: { type: "string", example: "Computer Science" },
              session: { type: "string", nullable: true, example: "Morning" },
            },
          },
        ],
      },
      StaffAttendance: { $ref: "#/components/schemas/AttendanceBase" },
      AttendanceBase: attendanceRecord,
    },
  },
  paths: {
    "/api/auth/register": {
      post: {
        tags: ["Authentication"],
        summary: "Register a user account",
        description:
          "Creates a user account. The role is always set to user; any role in the request is ignored.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string", example: "Jane Doe" },
                  email: { type: "string", format: "email", example: "jane@example.com" },
                  password: { type: "string", minLength: 6, example: "secure-password" },
                },
              },
            },
          },
        },
        responses: {
          "201": response("Account created with user role.", successResponse),
          "400": response("Missing fields or invalid password.", errorResponse),
          "409": response("Email is already registered.", errorResponse),
          "500": response("Unexpected server error.", errorResponse),
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "Log in",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email", example: "jane@example.com" },
                  password: { type: "string", example: "secure-password" },
                },
              },
              "/api/auth/me": {
                get: {
                  tags: ["Authentication"],
                  summary: "Get the current authenticated user",
                  security: protectedAdmin,
                  responses: {
                    "200": response("Current user profile and role.", successResponse),
                    "401": response("Authentication required or session expired.", errorResponse),
                  },
                },
              },
              "/api/auth/logout": {
                post: {
                  tags: ["Authentication"],
                  summary: "Clear the authentication cookie",
                  responses: {
                    "200": response("Session cleared.", successResponse),
                    "403": response("Request origin is not allowed.", errorResponse),
                  },
                },
              },
              "/api/users": {
                get: {
                  tags: ["Users"],
                  summary: "List registered users",
                  description: "Available to admin and superadmin accounts.",
                  security: protectedAdmin,
                  responses: {
                    "200": response("Registered user profiles.", successResponse),
                    "401": response("Authentication required.", errorResponse),
                    "403": response("Admin or superadmin role required.", errorResponse),
                  },
                },
              },
              "/api/users/{id}/approval": {
                patch: {
                  tags: ["Users"],
                  summary: "Approve a regular user account",
                  description: "Available to superadmin only. Approval does not grant an admin role.",
                  security: superadminOnly,
                  parameters: [
                    {
                      name: "id",
                      in: "path",
                      required: true,
                      schema: { type: "string", format: "uuid" },
                    },
                  ],
                  requestBody: {
                    required: true,
                    content: {
                      "application/json": {
                        schema: {
                          type: "object",
                          required: ["approval_status"],
                          properties: {
                            approval_status: { type: "string", enum: ["approved"] },
                          },
                        },
                      },
                    },
                  },
                  responses: {
                    "200": response("User approved.", successResponse),
                    "400": response("Invalid user ID or approval status.", errorResponse),
                    "401": response("Authentication required.", errorResponse),
                    "403": response("Superadmin role required.", errorResponse),
                    "404": response("User not found.", errorResponse),
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": response("Login succeeded; response includes a JWT.", successResponse),
          "400": response("Email and password are required.", errorResponse),
          "401": response("Invalid credentials.", errorResponse),
          "500": response("Unexpected server error.", errorResponse),
        },
      },
    },
    "/api/student-attendance": {
      get: {
        tags: ["Student Attendance"],
        summary: "List student attendance records",
        description: "Available to admin and superadmin accounts.",
        security: protectedAdmin,
        responses: {
          "200": response("Student attendance records.", successResponse),
          "401": response("Authentication required.", errorResponse),
          "403": response("Admin or superadmin role required.", errorResponse),
          "500": response("Unexpected server error.", errorResponse),
        },
      },
      post: {
        tags: ["Student Attendance"],
        summary: "Record student attendance",
        security: protectedAdmin,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "course"],
                properties: {
                  name: { type: "string", example: "Jane Doe" },
                  course: { type: "string", example: "Computer Science" },
                  session: { type: "string", nullable: true, example: "Morning" },
                },
              },
            },
          },
        },
        responses: {
          "201": response("Attendance recorded.", successResponse),
          ...attendanceResponses,
        },
      },
    },
    "/api/student-attendance/{id}": {
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "integer", format: "int64", minimum: 1 },
        },
      ],
      put: {
        tags: ["Student Attendance"],
        summary: "Edit a student attendance record",
        description: "Available to superadmin only.",
        security: superadminOnly,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "course"],
                properties: {
                  name: { type: "string", example: "Jane Doe" },
                  course: { type: "string", example: "Computer Science" },
                  session: { type: "string", nullable: true, example: "Morning" },
                },
              },
            },
          },
        },
        responses: {
          "200": response("Attendance updated.", successResponse),
          ...attendanceResponses,
        },
      },
      delete: {
        tags: ["Student Attendance"],
        summary: "Delete a student attendance record",
        description: "Available to superadmin only.",
        security: superadminOnly,
        responses: {
          "200": response("Attendance deleted.", successResponse),
          ...attendanceResponses,
        },
      },
    },
    "/api/staff-attendance": {
      get: {
        tags: ["Staff Attendance"],
        summary: "List staff attendance records",
        description: "Available to admin and superadmin accounts.",
        security: protectedAdmin,
        responses: {
          "200": response("Staff attendance records.", successResponse),
          "401": response("Authentication required.", errorResponse),
          "403": response("Admin or superadmin role required.", errorResponse),
          "500": response("Unexpected server error.", errorResponse),
        },
      },
      post: {
        tags: ["Staff Attendance"],
        summary: "Record staff attendance",
        security: protectedAdmin,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string", example: "Alex Staff" },
                },
              },
            },
          },
        },
        responses: {
          "201": response("Attendance recorded.", successResponse),
          ...attendanceResponses,
        },
      },
    },
    "/api/staff-attendance/{id}": {
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "integer", format: "int64", minimum: 1 },
        },
      ],
      put: {
        tags: ["Staff Attendance"],
        summary: "Edit a staff attendance record",
        description: "Available to superadmin only.",
        security: superadminOnly,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string", example: "Alex Staff" },
                },
              },
            },
          },
        },
        responses: {
          "200": response("Attendance updated.", successResponse),
          ...attendanceResponses,
        },
      },
      delete: {
        tags: ["Staff Attendance"],
        summary: "Delete a staff attendance record",
        description: "Available to superadmin only.",
        security: superadminOnly,
        responses: {
          "200": response("Attendance deleted.", successResponse),
          ...attendanceResponses,
        },
      },
    },
    "/api/analytics": {
      get: {
        tags: ["Analytics"],
        summary: "Get attendance analytics",
        description:
          "Available to admin and superadmin accounts. Student and staff totals count attendance records, not unique people.",
        security: protectedAdmin,
        responses: {
          "200": response(
            "Attendance totals and today's attendance breakdown.",
            {
              allOf: [
                { $ref: "#/components/schemas/SuccessEnvelope" },
                {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                      properties: {
                        total_students: { type: "integer", example: 120 },
                        total_staff: { type: "integer", example: 35 },
                        today: {
                          type: "object",
                          properties: {
                            student_attendance: { type: "integer", example: 20 },
                            staff_attendance: { type: "integer", example: 8 },
                            total_attendance: { type: "integer", example: 28 },
                          },
                        },
                      },
                    },
                  },
                },
              ],
            },
          ),
          "401": response("Authentication required.", errorResponse),
          "403": response("Admin or superadmin role required.", errorResponse),
          "500": response("Unexpected server error.", errorResponse),
        },
      },
    },
    "/api/users/{id}/role": {
      patch: {
        tags: ["Users"],
        summary: "Change a user's role",
        description:
          "Available to superadmin only. Only approved users can be assigned admin or superadmin roles. Users cannot change their own role, and the last superadmin cannot be demoted.",
        security: superadminOnly,
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["role"],
                properties: {
                  role: { type: "string", enum: ["user", "admin", "superadmin"] },
                },
              },
            },
          },
        },
        responses: {
          "200": response("User role updated.", successResponse),
          "400": response("Invalid user ID or role.", errorResponse),
          "401": response("Authentication required.", errorResponse),
          "403": response("Superadmin role required.", errorResponse),
          "404": response("User not found.", errorResponse),
          "409": response("The user must be approved first or the last superadmin cannot be demoted.", errorResponse),
          "500": response("Unexpected server error.", errorResponse),
        },
      },
    },
  },
};
