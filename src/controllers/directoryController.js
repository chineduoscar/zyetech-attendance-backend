import DirectoryRecord from "../models/DirectoryRecord.js";

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;
const isOptionalString = (value) =>
  value === undefined || value === null || typeof value === "string";
const isValidId = (id) =>
  /^\d+$/.test(id) &&
  BigInt(id) > 0n &&
  BigInt(id) <= 9223372036854775807n;
const isValidEmail = (email) =>
  !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const validateRecord = (kind, body) => {
  const { name, email = "", phone = "", course = "", status = "active" } = body ?? {};
  const emailValue = typeof email === "string" ? email : "";
  const phoneValue = typeof phone === "string" ? phone : "";
  if (!isNonEmptyString(name)) return "Name is required.";
  if (name.trim().length > 150) return "Name must be 150 characters or fewer.";
  if (!isOptionalString(email) || !isValidEmail(emailValue.trim())) {
    return "Enter a valid email address.";
  }
  if (emailValue.length > 255) return "Email must be 255 characters or fewer.";
  if (!isOptionalString(phone)) return "Phone must be a string.";
  if (phoneValue.length > 50) return "Phone must be 50 characters or fewer.";
  if (kind === "students" && !isNonEmptyString(course)) {
    return "Course is required for students.";
  }
  if (kind === "students" && course.trim().length > 100) {
    return "Course must be 100 characters or fewer.";
  }
  if (status !== "active" && status !== "inactive") {
    return "Status must be active or inactive.";
  }
  return null;
};

const normalizeRecord = (kind, body) => ({
  name: body.name.trim(),
  email: typeof body.email === "string" ? body.email.trim() || null : null,
  phone: typeof body.phone === "string" ? body.phone.trim() || null : null,
  course: kind === "students" ? body.course.trim() : null,
  status: body.status ?? "active",
});

export const createDirectoryController = (kind) => ({
  async list(_req, res) {
    try {
      const records = await DirectoryRecord.findAll(kind);
      return res.status(200).json({
        success: true,
        message: "Directory records retrieved successfully.",
        data: { records },
      });
    } catch (error) {
      console.error(`Failed to retrieve ${kind}:`, error);
      return res.status(500).json({
        success: false,
        message: "An error occurred.",
        data: null,
      });
    }
  },

  async create(req, res) {
    const validationError = validateRecord(kind, req.body);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
        data: null,
      });
    }

    try {
      const record = await DirectoryRecord.create(
        kind,
        normalizeRecord(kind, req.body),
      );
      return res.status(201).json({
        success: true,
        message: "Directory record created successfully.",
        data: { record },
      });
    } catch (error) {
      console.error(`Failed to create ${kind} record:`, error);
      return res.status(500).json({
        success: false,
        message: "An error occurred.",
        data: null,
      });
    }
  },

  async update(req, res) {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "A valid record ID is required.",
        data: null,
      });
    }
    const validationError = validateRecord(kind, req.body);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
        data: null,
      });
    }

    try {
      const record = await DirectoryRecord.update(
        kind,
        req.params.id,
        normalizeRecord(kind, req.body),
      );
      if (!record) {
        return res.status(404).json({
          success: false,
          message: "Directory record not found.",
          data: null,
        });
      }
      return res.status(200).json({
        success: true,
        message: "Directory record updated successfully.",
        data: { record },
      });
    } catch (error) {
      console.error(`Failed to update ${kind} record:`, error);
      return res.status(500).json({
        success: false,
        message: "An error occurred.",
        data: null,
      });
    }
  },

  async remove(req, res) {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "A valid record ID is required.",
        data: null,
      });
    }
    try {
      const deleted = await DirectoryRecord.delete(kind, req.params.id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Directory record not found.",
          data: null,
        });
      }
      return res.status(200).json({
        success: true,
        message: "Directory record deleted successfully.",
        data: deleted,
      });
    } catch (error) {
      if (error.code === "23503") {
        return res.status(409).json({
          success: false,
          message: "This student has payment records and cannot be deleted.",
          data: null,
        });
      }
      console.error(`Failed to delete ${kind} record:`, error);
      return res.status(500).json({
        success: false,
        message: "An error occurred.",
        data: null,
      });
    }
  },
});
