import StaffModel from "../models/staffModel.js";

const STAFF_ROLES = [
  "AI Automation Specialist",
  "Back End Developer",
  "Front End Developer",
  "Full Stack Web Developer",
  "Cybersecurity Specialist",
  "Data Analyst",
  "Data Scientist",
  "Digital Marketer",
  "Content Creator",
  "Graphics Designer",
  "Product / UI/UX Designer",
  "Video Editor",
  "Generative AI / Video Animator",
  "Virtual Assistant",
  "Kiddies Bootcamp Instructor",
  "Receptionist",
  "Administrator",
  "Other",
];

const isValidId = (id) =>
  /^\d+$/.test(id) &&
  BigInt(id) > 0n &&
  BigInt(id) <= 9223372036854775807n;
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const validateRegistration = (body) => {
  const errors = {};
  const { name, email, roles } = body;

  if (typeof name !== "string" || !name.trim()) {
    errors.name = "Name is required.";
  } else if (name.trim().length > 100) {
    errors.name = "Name must be 100 characters or fewer.";
  }

  if (typeof email !== "string" || !email.trim()) {
    errors.email = "Email is required.";
  } else if (email.trim().length > 255 || !isValidEmail(email.trim())) {
    errors.email =
      email.trim().length > 255
        ? "Email must be 255 characters or fewer."
        : "Enter a valid email address.";
  }

  if (!Array.isArray(roles) || roles.length === 0) {
    errors.roles = "Select at least one role.";
  } else if (roles.some((role) => typeof role !== "string" || !STAFF_ROLES.includes(role))) {
    errors.roles = "Select only valid staff roles.";
  }

  return {
    errors,
    staff: {
      name: typeof name === "string" ? name.trim() : "",
      email: typeof email === "string" ? email.trim().toLowerCase() : "",
      roles: Array.isArray(roles) ? [...new Set(roles)] : [],
    },
  };
};

const sendServerError = (res, error, action) => {
  console.error(`Failed to ${action} staff:`, error);
  return res.status(500).json({
    success: false,
    message: "An error occurred.",
  });
};

export async function registerStaff(req, res) {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const { errors, staff } = validateRegistration(body);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: "Please correct the highlighted fields.",
      errors,
    });
  }

  try {
    if (await StaffModel.emailExists(staff.email)) {
      return res.status(409).json({
        success: false,
        message: "A staff member with this email already exists.",
        errors: { email: "A staff member with this email already exists." },
      });
    }
    const created = await StaffModel.create(staff);
    return res.status(201).json({
      success: true,
      message: "Staff registered successfully.",
      data: { staff: created },
    });
  } catch (error) {
    if (error.code === "23505" && error.constraint === "staff_email_lower_unique") {
      return res.status(409).json({
        success: false,
        message: "A staff member with this email already exists.",
        errors: { email: "A staff member with this email already exists." },
      });
    }
    return sendServerError(res, error, "register");
  }
}

export async function getStaff(_req, res) {
  try {
    const staff = await StaffModel.findAll();
    return res.status(200).json({
      success: true,
      message: "Staff retrieved successfully.",
      data: { records: staff },
    });
  } catch (error) {
    return sendServerError(res, error, "retrieve");
  }
}

export async function getStaffMember(req, res) {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "A valid staff ID is required.",
      errors: { id: "ID must be a positive integer." },
    });
  }
  try {
    const staff = await StaffModel.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ success: false, message: "Staff member not found." });
    }
    return res.status(200).json({
      success: true,
      message: "Staff member retrieved successfully.",
      data: { staff },
    });
  } catch (error) {
    return sendServerError(res, error, "retrieve");
  }
}

export async function updateStaff(req, res) {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "A valid staff ID is required.",
      errors: { id: "ID must be a positive integer." },
    });
  }
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const { errors, staff } = validateRegistration(body);
  if (body.status !== "active" && body.status !== "inactive") {
    errors.status = "Status must be active or inactive.";
  }
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: "Please correct the highlighted fields.",
      errors,
    });
  }
  try {
    const updated = await StaffModel.update(req.params.id, {
      ...staff,
      status: body.status,
    });
    if (!updated) {
      return res.status(404).json({ success: false, message: "Staff member not found." });
    }
    return res.status(200).json({
      success: true,
      message: "Staff member updated successfully.",
      data: { staff: updated },
    });
  } catch (error) {
    if (error.code === "23505" && error.constraint === "staff_email_lower_unique") {
      return res.status(409).json({
        success: false,
        message: "A staff member with this email already exists.",
        errors: { email: "A staff member with this email already exists." },
      });
    }
    return sendServerError(res, error, "update");
  }
}

export async function deleteStaff(req, res) {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "A valid staff ID is required.",
      errors: { id: "ID must be a positive integer." },
    });
  }
  try {
    const deleted = await StaffModel.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Staff member not found." });
    }
    return res.status(200).json({
      success: true,
      message: "Staff member deleted successfully.",
      data: deleted,
    });
  } catch (error) {
    return sendServerError(res, error, "delete");
  }
}
