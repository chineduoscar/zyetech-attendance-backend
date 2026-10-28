import StudentModel from "../models/studentModel.js";

const COURSES = [
  "AI Automation",
  "Back End Development",
  "Content Creation",
  "Cybersecurity",
  "Data Analysis with AI and Machine Learning",
  "Data Analysis with Python",
  "Data Analytics",
  "Data Science",
  "Digital Marketing",
  "Front End Development",
  "Full Stack Development",
  "Generative AI for Video Animation",
  "Graphics Design",
  "Kiddies Bootcamp",
  "Product Design",
  "UI/UX Design",
  "Video Editing",
  "Virtual Assistance",
];

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isValidDate = (date) => {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsedDate = new Date(`${date}T00:00:00Z`);
  return (
    !Number.isNaN(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === date
  );
};

const validateRegistration = (body) => {
  const errors = {};
  const { name, email, course, receipt } = body;

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

  if (typeof course !== "string" || !COURSES.includes(course)) {
    errors.course = "Select a valid course.";
  }

  let normalizedReceipt;
  if (receipt !== undefined) {
    if (!receipt || typeof receipt !== "object" || Array.isArray(receipt)) {
      errors.receipt = "Receipt must be an object.";
    } else {
      const amountString = String(receipt.amount ?? "");
      const amount = Number(receipt.amount);
      if (
        !/^\d+(?:\.\d{1,2})?$/.test(amountString) ||
        !Number.isFinite(amount) ||
        amount <= 0 ||
        amount > 9999999999.99
      ) {
        errors["receipt.amount"] = "Amount must be a positive number with up to 2 decimal places.";
      }
      if (typeof receipt.purpose !== "string" || !receipt.purpose.trim()) {
        errors["receipt.purpose"] = "Purpose is required.";
      } else if (receipt.purpose.trim().length > 200) {
        errors["receipt.purpose"] = "Purpose must be 200 characters or fewer.";
      }
      if (
        receipt.payment_date !== undefined &&
        !isValidDate(receipt.payment_date)
      ) {
        errors["receipt.payment_date"] = "Payment date must be a valid YYYY-MM-DD date.";
      }
      normalizedReceipt = {
        amount,
        purpose:
          typeof receipt.purpose === "string" ? receipt.purpose.trim() : "",
        paymentDate: receipt.payment_date ?? null,
      };
    }
  }

  return {
    errors,
    student: {
      name: typeof name === "string" ? name.trim() : "",
      email: typeof email === "string" ? email.trim().toLowerCase() : "",
      course,
      receipt: normalizedReceipt,
    },
  };
};

const isValidId = (id) =>
  /^\d+$/.test(id) &&
  BigInt(id) > 0n &&
  BigInt(id) <= 9223372036854775807n;

const sendServerError = (res, error, action) => {
  console.error(`Failed to ${action} student:`, error);
  return res.status(500).json({
    success: false,
    message: "An error occurred.",
  });
};

export async function registerStudent(req, res) {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const { errors, student } = validateRegistration(body);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: "Please correct the highlighted fields.",
      errors,
    });
  }

  try {
    if (await StudentModel.emailExists(student.email)) {
      return res.status(409).json({
        success: false,
        message: "A student with this email already exists.",
        errors: { email: "A student with this email already exists." },
      });
    }
    const created = await StudentModel.create(student);
    return res.status(201).json({
      success: true,
      message: "Student registered successfully.",
      data: { student: created },
    });
  } catch (error) {
    if (error.code === "23505" && error.constraint === "students_email_lower_unique") {
      return res.status(409).json({
        success: false,
        message: "A student with this email already exists.",
        errors: { email: "A student with this email already exists." },
      });
    }
    return sendServerError(res, error, "register");
  }
}

export async function getStudents(_req, res) {
  try {
    const students = await StudentModel.findAll();
    return res.status(200).json({
      success: true,
      message: "Students retrieved successfully.",
      data: { records: students },
    });
  } catch (error) {
    return sendServerError(res, error, "retrieve");
  }
}

export async function getStudent(req, res) {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "A valid student ID is required.",
      errors: { id: "ID must be a positive integer." },
    });
  }
  try {
    const student = await StudentModel.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found." });
    }
    return res.status(200).json({
      success: true,
      message: "Student retrieved successfully.",
      data: { student },
    });
  } catch (error) {
    return sendServerError(res, error, "retrieve");
  }
}

export async function updateStudent(req, res) {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "A valid student ID is required.",
      errors: { id: "ID must be a positive integer." },
    });
  }
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const { errors, student } = validateRegistration(body);
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
    const updated = await StudentModel.update(req.params.id, {
      ...student,
      status: body.status,
    });
    if (!updated) {
      return res.status(404).json({ success: false, message: "Student not found." });
    }
    return res.status(200).json({
      success: true,
      message: "Student updated successfully.",
      data: { student: updated },
    });
  } catch (error) {
    if (error.code === "23505" && error.constraint === "students_email_lower_unique") {
      return res.status(409).json({
        success: false,
        message: "A student with this email already exists.",
        errors: { email: "A student with this email already exists." },
      });
    }
    return sendServerError(res, error, "update");
  }
}

export async function deleteStudent(req, res) {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "A valid student ID is required.",
      errors: { id: "ID must be a positive integer." },
    });
  }
  try {
    const deleted = await StudentModel.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Student not found." });
    }
    return res.status(200).json({
      success: true,
      message: "Student deleted successfully.",
      data: deleted,
    });
  } catch (error) {
    return sendServerError(res, error, "delete");
  }
}
