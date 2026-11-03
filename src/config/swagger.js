const jsonResponse = (description, schema) => ({
  description,
  headers: {
    "X-Request-Id": {
      description: "Request ID used to correlate this API call with backend logs.",
      schema: { type: "string", format: "uuid" },
    },
  },
  content: {
    "application/json": {
      schema,
    },
  },
});

const requestBody = (schema, description = "Request payload.") => ({
  required: true,
  description,
  content: {
    "application/json": { schema },
  },
});

const successEnvelope = (data = {}) => ({
  type: "object",
  required: ["success", "message", "data"],
  properties: {
    success: { type: "boolean", enum: [true] },
    message: { type: "string" },
    data,
  },
});

const errorEnvelope = {
  type: "object",
  required: ["success", "message", "data"],
  properties: {
    success: { type: "boolean", enum: [false] },
    message: { type: "string" },
    data: { type: "object", nullable: true },
    errors: {
      type: "object",
      additionalProperties: { type: "string" },
    },
    request_id: { type: "string", format: "uuid" },
  },
};

const success = (description, data) =>
  jsonResponse(description, successEnvelope(data));
const failure = (description) => jsonResponse(description, errorEnvelope);
const protectedAdmin = [{ cookieAuth: [] }, { bearerAuth: [] }];
const superadminOnly = [{ cookieAuth: [] }, { bearerAuth: [] }];
const idParameter = {
  name: "id",
  in: "path",
  required: true,
  schema: { type: "integer", format: "int64", minimum: 1 },
};
const userIdParameter = {
  name: "id",
  in: "path",
  required: true,
  schema: { type: "string", format: "uuid" },
};

const attendanceBase = {
  type: "object",
  properties: {
    id: { type: "string", example: "1" },
    name: { type: "string", example: "Jane Doe" },
    created_at: { type: "string", format: "date-time" },
  },
};

const student = {
  type: "object",
  properties: {
    id: { type: "string", example: "1" },
    student_number: { type: "string", example: "S26/001" },
    name: { type: "string", example: "Jane Doe" },
    email: { type: "string", format: "email", example: "jane@example.com" },
    course: { type: "string", example: "AI Automation" },
    status: { type: "string", enum: ["active", "inactive"] },
    created_at: { type: "string", format: "date-time" },
    updated_at: { type: "string", format: "date-time" },
    receipt_count: { type: "integer", example: 1 },
    total_paid: { type: "string", example: "25000.00" },
    receipts: {
      type: "array",
      items: { $ref: "#/components/schemas/Receipt" },
    },
  },
};

const staff = {
  type: "object",
  properties: {
    id: { type: "string", example: "1" },
    staff_number: { type: "string", example: "E26/001" },
    name: { type: "string", example: "Alex Staff" },
    email: { type: "string", format: "email", example: "alex@example.com" },
    roles: { type: "array", items: { type: "string" } },
    status: { type: "string", enum: ["active", "inactive"] },
    created_at: { type: "string", format: "date-time" },
    updated_at: { type: "string", format: "date-time" },
  },
};

const receipt = {
  type: "object",
  properties: {
    id: { type: "string", example: "1" },
    student_id: { type: "string", nullable: true, example: "12" },
    student_number: { type: "string", nullable: true, example: "S26/001" },
    student_name: { type: "string", example: "Jane Doe" },
    course: { type: "string", example: "AI Automation" },
    amount: { type: "string", example: "25000.00" },
    purpose: { type: "string", example: "AI Automation (1st Installment)" },
    payment_date: { type: "string", format: "date" },
    receipt_number: { type: "string", example: "PR-ABC123" },
    payment_method: { type: "string", nullable: true, example: "Bank Transfer" },
    details: { type: "object", additionalProperties: true },
    image_url: {
      type: "string",
      format: "uri",
      nullable: true,
      description: "Cloudinary URL of the saved receipt PDF.",
    },
    created_at: { type: "string", format: "date-time" },
  },
};

const attendanceResponses = {
  "400": failure("Invalid request data or ID."),
  "401": failure("Authentication required for this operation."),
  "403": failure("The authenticated role cannot perform this action."),
  "404": failure("Attendance record or matching active directory entry not found."),
  "409": failure("Attendance was already recorded for today."),
  "500": failure("Unexpected server error."),
};

export const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "Zyetech Attendance Management API",
    version: "1.1.0",
    description:
      "API for user authentication and administration, student/staff directories, attendance, receipt generation, and analytics. Backend request logs include a request ID; use the X-Request-Id response header to correlate API calls with server logs. Request bodies and credentials are not logged.",
  },
  servers: [{ url: "/", description: "Current server" }],
  tags: [
    { name: "Authentication" },
    { name: "Students" },
    { name: "Staff" },
    { name: "Student Attendance" },
    { name: "Staff Attendance" },
    { name: "Receipts" },
    { name: "Users" },
    { name: "Analytics" },
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
        description: "JWT returned by register or login.",
      },
    },
    schemas: {
      Error: errorEnvelope,
      SuccessEnvelope: successEnvelope(),
      AttendanceBase: attendanceBase,
      Student: student,
      Staff: staff,
      Receipt: receipt,
      User: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", example: "Jane Doe" },
          email: { type: "string", format: "email", example: "jane@example.com" },
          role: { type: "string", enum: ["user", "admin", "superadmin"] },
          approval_status: { type: "string", enum: ["pending", "approved"] },
          created_at: { type: "string", format: "date-time" },
        },
      },
      StudentAttendance: {
        allOf: [
          { $ref: "#/components/schemas/AttendanceBase" },
          {
            type: "object",
            properties: {
              student_number: { type: "string", example: "S26/001" },
              course: { type: "string", example: "AI Automation" },
              session: { type: "string", nullable: true, example: "Morning" },
              attendance_date: { type: "string", format: "date" },
            },
          },
        ],
      },
      StaffAttendance: {
        allOf: [
          { $ref: "#/components/schemas/AttendanceBase" },
          {
            type: "object",
            properties: {
              staff_number: { type: "string", example: "E26/001" },
              course: { type: "string", nullable: true },
              attendance_date: { type: "string", format: "date" },
            },
          },
        ],
      },
    },
  },
  paths: {
    "/api/auth/register": {
      post: {
        tags: ["Authentication"],
        summary: "Register a user account",
        description:
          "Creates a pending user account. The role is always user; request-supplied roles are ignored.",
        requestBody: requestBody({
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: { type: "string", maxLength: 100, example: "Jane Doe" },
            email: { type: "string", format: "email", example: "jane@example.com" },
            password: { type: "string", minLength: 6, format: "password" },
          },
        }),
        responses: {
          "201": success("Account created.", {
            type: "object",
            properties: {
              token: { type: "string" },
              user: { $ref: "#/components/schemas/User" },
            },
          }),
          "400": failure("Missing or invalid account fields."),
          "409": failure("Email is already registered."),
          "500": failure("Unexpected server error."),
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "Log in",
        requestBody: requestBody({
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email", example: "jane@example.com" },
            password: { type: "string", format: "password" },
          },
        }),
        responses: {
          "200": success("Login succeeded; response also sets the auth cookie.", {
            type: "object",
            properties: {
              token: { type: "string" },
              user: { $ref: "#/components/schemas/User" },
            },
          }),
          "400": failure("Email and password are required."),
          "401": failure("Credentials are invalid."),
          "500": failure("Unexpected server error."),
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Authentication"],
        summary: "Get the current authenticated user",
        security: protectedAdmin,
        responses: {
          "200": success("Current user profile.", {
            type: "object",
            properties: { user: { $ref: "#/components/schemas/User" } },
          }),
          "401": failure("Authentication required or session expired."),
          "500": failure("Unexpected server error."),
        },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Authentication"],
        summary: "Log out",
        description: "Clears the authentication cookie.",
        responses: {
          "200": success("Session cleared."),
          "403": failure("Request origin is not allowed."),
        },
      },
    },
    "/api/students": {
      get: {
        tags: ["Students"],
        summary: "List students",
        security: protectedAdmin,
        responses: {
          "200": success("Student directory records.", {
            type: "object",
            properties: {
              records: {
                type: "array",
                items: { $ref: "#/components/schemas/Student" },
              },
            },
          }),
          "401": failure("Authentication required."),
          "403": failure("Admin or superadmin role required."),
          "500": failure("Unexpected server error."),
        },
      },
      post: {
        tags: ["Students"],
        summary: "Register a student",
        description:
          "Public student registration. An optional initial receipt can be saved in the same transaction.",
        requestBody: requestBody({
          type: "object",
          required: ["name", "email", "course"],
          properties: {
            name: { type: "string", maxLength: 100, example: "Jane Doe" },
            email: { type: "string", format: "email", example: "jane@example.com" },
            course: { type: "string", example: "AI Automation" },
            receipt: {
              type: "object",
              required: ["amount", "purpose"],
              properties: {
                amount: { type: "number", exclusiveMinimum: 0 },
                purpose: { type: "string", maxLength: 200 },
                payment_date: { type: "string", format: "date" },
              },
            },
          },
        }),
        responses: {
          "201": success("Student registered.", {
            type: "object",
            properties: { student: { $ref: "#/components/schemas/Student" } },
          }),
          "400": failure("Student fields are invalid."),
          "409": failure("A student with this email already exists."),
          "500": failure("Unexpected server error."),
        },
      },
    },
    "/api/students/{id}": {
      parameters: [idParameter],
      get: {
        tags: ["Students"],
        summary: "Get a student and their receipts",
        security: protectedAdmin,
        responses: {
          "200": success("Student profile and receipts.", {
            type: "object",
            properties: { student: { $ref: "#/components/schemas/Student" } },
          }),
          "400": failure("Invalid student ID."),
          "401": failure("Authentication required."),
          "403": failure("Admin or superadmin role required."),
          "404": failure("Student not found."),
          "500": failure("Unexpected server error."),
        },
      },
      put: {
        tags: ["Students"],
        summary: "Update a student",
        description: "Available to superadmin only.",
        security: superadminOnly,
        requestBody: requestBody({
          type: "object",
          required: ["name", "email", "course", "status"],
          properties: {
            name: { type: "string", maxLength: 100 },
            email: { type: "string", format: "email" },
            course: { type: "string" },
            status: { type: "string", enum: ["active", "inactive"] },
          },
        }),
        responses: {
          "200": success("Student updated.", {
            type: "object",
            properties: { student: { $ref: "#/components/schemas/Student" } },
          }),
          "400": failure("Invalid student ID or fields."),
          "401": failure("Authentication required."),
          "403": failure("Superadmin role required."),
          "404": failure("Student not found."),
          "409": failure("A student with this email already exists."),
          "500": failure("Unexpected server error."),
        },
      },
      delete: {
        tags: ["Students"],
        summary: "Delete a student",
        description:
          "Available to superadmin only. Saved receipts are retained and detached from the student.",
        security: superadminOnly,
        responses: {
          "200": success("Student deleted."),
          "400": failure("Invalid student ID."),
          "401": failure("Authentication required."),
          "403": failure("Superadmin role required."),
          "404": failure("Student not found."),
          "500": failure("Unexpected server error."),
        },
      },
    },
    "/api/staff": {
      get: {
        tags: ["Staff"],
        summary: "List staff",
        security: protectedAdmin,
        responses: {
          "200": success("Staff directory records.", {
            type: "object",
            properties: {
              records: {
                type: "array",
                items: { $ref: "#/components/schemas/Staff" },
              },
            },
          }),
          "401": failure("Authentication required."),
          "403": failure("Admin or superadmin role required."),
          "500": failure("Unexpected server error."),
        },
      },
      post: {
        tags: ["Staff"],
        summary: "Register a staff member",
        requestBody: requestBody({
          type: "object",
          required: ["name", "email", "roles"],
          properties: {
            name: { type: "string", maxLength: 100 },
            email: { type: "string", format: "email" },
            roles: { type: "array", minItems: 1, items: { type: "string" } },
          },
        }),
        responses: {
          "201": success("Staff member registered.", {
            type: "object",
            properties: { staff: { $ref: "#/components/schemas/Staff" } },
          }),
          "400": failure("Staff fields are invalid."),
          "409": failure("A staff member with this email already exists."),
          "500": failure("Unexpected server error."),
        },
      },
    },
    "/api/staff/{id}": {
      parameters: [idParameter],
      get: {
        tags: ["Staff"],
        summary: "Get a staff member",
        security: protectedAdmin,
        responses: {
          "200": success("Staff member profile.", {
            type: "object",
            properties: { staff: { $ref: "#/components/schemas/Staff" } },
          }),
          "400": failure("Invalid staff ID."),
          "401": failure("Authentication required."),
          "403": failure("Admin or superadmin role required."),
          "404": failure("Staff member not found."),
          "500": failure("Unexpected server error."),
        },
      },
      put: {
        tags: ["Staff"],
        summary: "Update a staff member",
        description: "Available to superadmin only.",
        security: superadminOnly,
        requestBody: requestBody({
          type: "object",
          required: ["name", "email", "roles", "status"],
          properties: {
            name: { type: "string", maxLength: 100 },
            email: { type: "string", format: "email" },
            roles: { type: "array", minItems: 1, items: { type: "string" } },
            status: { type: "string", enum: ["active", "inactive"] },
          },
        }),
        responses: {
          "200": success("Staff member updated.", {
            type: "object",
            properties: { staff: { $ref: "#/components/schemas/Staff" } },
          }),
          "400": failure("Invalid staff ID or fields."),
          "401": failure("Authentication required."),
          "403": failure("Superadmin role required."),
          "404": failure("Staff member not found."),
          "409": failure("A staff member with this email already exists."),
          "500": failure("Unexpected server error."),
        },
      },
      delete: {
        tags: ["Staff"],
        summary: "Delete a staff member",
        description: "Available to superadmin only.",
        security: superadminOnly,
        responses: {
          "200": success("Staff member deleted."),
          "400": failure("Invalid staff ID."),
          "401": failure("Authentication required."),
          "403": failure("Superadmin role required."),
          "404": failure("Staff member not found."),
          "500": failure("Unexpected server error."),
        },
      },
    },
    "/api/student-attendance": {
      get: {
        tags: ["Student Attendance"],
        summary: "List student attendance",
        security: protectedAdmin,
        responses: {
          "200": success("Student attendance records.", {
            type: "array",
            items: { $ref: "#/components/schemas/StudentAttendance" },
          }),
          "401": failure("Authentication required."),
          "403": failure("Admin or superadmin role required."),
          "500": failure("Unexpected server error."),
        },
      },
      post: {
        tags: ["Student Attendance"],
        summary: "Record student attendance",
        description: "Public endpoint. A student can be marked once per day.",
        requestBody: requestBody({
          type: "object",
          required: ["identifier"],
          properties: {
            identifier: { type: "string", example: "S26/001" },
            session: { type: "string", nullable: true, example: "Morning" },
          },
        }),
        responses: {
          "201": success("Attendance recorded.", {
            $ref: "#/components/schemas/StudentAttendance",
          }),
          "400": failure("Invalid student number or session."),
          "404": failure("No active student was found."),
          "409": failure("Student attendance was already recorded today."),
          "500": failure("Unexpected server error."),
        },
      },
    },
    "/api/student-attendance/{id}": {
      parameters: [idParameter],
      put: {
        tags: ["Student Attendance"],
        summary: "Update student attendance",
        description: "Available to superadmin only.",
        security: superadminOnly,
        requestBody: requestBody({
          type: "object",
          required: ["name", "course"],
          properties: {
            name: { type: "string", maxLength: 150 },
            course: { type: "string", maxLength: 100 },
            session: { type: "string", nullable: true },
          },
        }),
        responses: {
          "200": success("Attendance updated.", {
            $ref: "#/components/schemas/StudentAttendance",
          }),
          ...attendanceResponses,
        },
      },
      delete: {
        tags: ["Student Attendance"],
        summary: "Delete student attendance",
        description: "Available to superadmin only.",
        security: superadminOnly,
        responses: {
          "200": success("Attendance deleted."),
          ...attendanceResponses,
        },
      },
    },
    "/api/staff-attendance": {
      get: {
        tags: ["Staff Attendance"],
        summary: "List staff attendance",
        security: protectedAdmin,
        responses: {
          "200": success("Staff attendance records.", {
            type: "array",
            items: { $ref: "#/components/schemas/StaffAttendance" },
          }),
          "401": failure("Authentication required."),
          "403": failure("Admin or superadmin role required."),
          "500": failure("Unexpected server error."),
        },
      },
      post: {
        tags: ["Staff Attendance"],
        summary: "Record staff attendance",
        description: "Public endpoint. A staff member can be marked once per day.",
        requestBody: requestBody({
          type: "object",
          required: ["identifier"],
          properties: {
            identifier: { type: "string", example: "E26/001" },
          },
        }),
        responses: {
          "201": success("Attendance recorded.", {
            $ref: "#/components/schemas/StaffAttendance",
          }),
          "400": failure("Invalid staff number."),
          "404": failure("No active staff member was found."),
          "409": failure("Staff attendance was already recorded today."),
          "500": failure("Unexpected server error."),
        },
      },
    },
    "/api/staff-attendance/{id}": {
      parameters: [idParameter],
      put: {
        tags: ["Staff Attendance"],
        summary: "Update staff attendance",
        description: "Available to superadmin only.",
        security: superadminOnly,
        requestBody: requestBody({
          type: "object",
          required: ["name", "course"],
          properties: {
            name: { type: "string", maxLength: 150 },
            course: { type: "string", maxLength: 100 },
          },
        }),
        responses: {
          "200": success("Attendance updated.", {
            $ref: "#/components/schemas/StaffAttendance",
          }),
          ...attendanceResponses,
        },
      },
      delete: {
        tags: ["Staff Attendance"],
        summary: "Delete staff attendance",
        description: "Available to superadmin only.",
        security: superadminOnly,
        responses: {
          "200": success("Attendance deleted."),
          ...attendanceResponses,
        },
      },
    },
    "/api/receipts": {
      get: {
        tags: ["Receipts"],
        summary: "List saved receipts",
        security: protectedAdmin,
        responses: {
          "200": success("Saved receipts.", {
            type: "object",
            properties: {
              receipts: {
                type: "array",
                items: { $ref: "#/components/schemas/Receipt" },
              },
            },
          }),
          "401": failure("Authentication required."),
          "403": failure("Admin or superadmin role required."),
          "500": failure("Unexpected server error."),
        },
      },
      post: {
        tags: ["Receipts"],
        summary: "Save a payment receipt and PDF",
        description:
          "Available to admin and superadmin. Receipt PDFs are uploaded to Cloudinary when image_data is supplied. When student_id is omitted, student_name and course are required; an existing profile is linked by exact case-insensitive name when possible. The PDF data URL must contain an application/pdf base64 payload of at most 8 MB.",
        security: protectedAdmin,
        requestBody: requestBody({
          type: "object",
          required: ["amount", "purpose"],
          properties: {
            student_id: {
              type: "string",
              pattern: "^[0-9]+$",
              description: "Existing student database ID. If omitted, student_name and course are required.",
            },
            student_name: { type: "string", maxLength: 150, example: "Jane Doe" },
            course: { type: "string", maxLength: 100, example: "AI Automation" },
            amount: { type: "number", exclusiveMinimum: 0, example: 25000 },
            purpose: { type: "string", maxLength: 200, example: "Course installment" },
            payment_date: { type: "string", format: "date" },
            receipt_number: { type: "string", maxLength: 50, example: "PR-ABC123" },
            payment_method: { type: "string", maxLength: 50, example: "Bank Transfer" },
            details: { type: "object", additionalProperties: true },
            image_data: {
              type: "string",
              format: "data-url",
              pattern: "^data:application/pdf;base64,",
              maxLength: 11184840,
              description: "PDF data URL: data:application/pdf;base64,...",
            },
          },
        }),
        responses: {
          "201": success("Receipt saved.", {
            type: "object",
            properties: { receipt: { $ref: "#/components/schemas/Receipt" } },
          }),
          "400": failure("Receipt data or PDF is invalid."),
          "401": failure("Authentication required."),
          "403": failure("Admin or superadmin role required."),
          "500": failure("Receipt or image could not be saved."),
          "503": failure("Cloudinary is not configured."),
        },
      },
    },
    "/api/users": {
      get: {
        tags: ["Users"],
        summary: "List registered users",
        security: protectedAdmin,
        responses: {
          "200": success("Registered user profiles.", {
            type: "object",
            properties: {
              users: {
                type: "array",
                items: { $ref: "#/components/schemas/User" },
              },
            },
          }),
          "401": failure("Authentication required."),
          "403": failure("Admin or superadmin role required."),
          "500": failure("Unexpected server error."),
        },
      },
    },
    "/api/users/{id}/approval": {
      parameters: [userIdParameter],
      patch: {
        tags: ["Users"],
        summary: "Approve a regular user account",
        description: "Available to superadmin only. Approval does not grant an admin role.",
        security: superadminOnly,
        requestBody: requestBody({
          type: "object",
          required: ["approval_status"],
          properties: {
            approval_status: { type: "string", enum: ["approved"] },
          },
        }),
        responses: {
          "200": success("User approved."),
          "400": failure("Invalid user ID or approval status."),
          "401": failure("Authentication required."),
          "403": failure("Superadmin role required."),
          "404": failure("User not found."),
          "500": failure("Unexpected server error."),
        },
      },
    },
    "/api/users/{id}/role": {
      parameters: [userIdParameter],
      patch: {
        tags: ["Users"],
        summary: "Change a user's role",
        description:
          "Available to superadmin only. Only approved users can be assigned admin or superadmin roles. Users cannot change their own role, and the last superadmin cannot be demoted.",
        security: superadminOnly,
        requestBody: requestBody({
          type: "object",
          required: ["role"],
          properties: {
            role: { type: "string", enum: ["user", "admin", "superadmin"] },
          },
        }),
        responses: {
          "200": success("User role updated."),
          "400": failure("Invalid user ID or role."),
          "401": failure("Authentication required."),
          "403": failure("Superadmin role required."),
          "404": failure("User not found."),
          "409": failure("The target is not approved or is the last superadmin."),
          "500": failure("Unexpected server error."),
        },
      },
    },
    "/api/analytics": {
      get: {
        tags: ["Analytics"],
        summary: "Get dashboard analytics",
        description:
          "Available to admin and superadmin accounts. Student/staff totals count directory profiles; attendance values count today's attendance submissions.",
        security: protectedAdmin,
        responses: {
          "200": success("Dashboard totals.", {
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
              receipts_today: { type: "integer", example: 4 },
              receipts_this_month: { type: "integer", example: 50 },
            },
          }),
          "401": failure("Authentication required."),
          "403": failure("Admin or superadmin role required."),
          "500": failure("Unexpected server error."),
        },
      },
    },
  },
};
