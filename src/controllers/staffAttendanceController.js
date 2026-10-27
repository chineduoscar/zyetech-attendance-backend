import StaffAttendance from "../models/StaffAttendance.js";

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;
const isValidId = (id) =>
  /^\d+$/.test(id) &&
  BigInt(id) > 0n &&
  BigInt(id) <= 9223372036854775807n;

export async function recordStaffAttendance(req, res) {
  const { name, course } = req.body ?? {};

  if (!isNonEmptyString(name) || !isNonEmptyString(course)) {
    return res.status(400).json({
      success: false,
      message: "Name and course are required.",
      data: null,
    });
  }
  if (name.trim().length > 150 || course.trim().length > 100) {
    return res.status(400).json({
      success: false,
      message: "Name must be 150 characters or fewer and course 100 characters or fewer.",
      data: null,
    });
  }

  try {
    const attendance = await StaffAttendance.create({
      name: name.trim(),
      course: course.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Attendance recorded successfully",
      data: attendance,
    });
  } catch (error) {
    console.error("Failed to record staff attendance:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred",
      data: null,
    });
  }
}

export async function getStaffAttendance(_req, res) {
  try {
    const attendance = await StaffAttendance.findAll();
    return res.status(200).json({
      success: true,
      message: "Attendance retrieved successfully",
      data: attendance,
    });
  } catch (error) {
    console.error("Failed to retrieve staff attendance:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred",
      data: null,
    });
  }
}

export async function updateStaffAttendance(req, res) {
  const { id } = req.params;
  const { name, course } = req.body ?? {};

  if (!isValidId(id)) {
    return res.status(400).json({
      success: false,
      message: "A valid attendance ID is required.",
      data: null,
    });
  }

  if (!isNonEmptyString(name) || !isNonEmptyString(course)) {
    return res.status(400).json({
      success: false,
      message: "Name and course are required.",
      data: null,
    });
  }
  if (name.trim().length > 150 || course.trim().length > 100) {
    return res.status(400).json({
      success: false,
      message: "Name must be 150 characters or fewer and course 100 characters or fewer.",
      data: null,
    });
  }

  try {
    const attendance = await StaffAttendance.update(id, {
      name: name.trim(),
      course: course.trim(),
    });
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Staff attendance record not found.",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Attendance updated successfully",
      data: attendance,
    });
  } catch (error) {
    console.error("Failed to update staff attendance:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred",
      data: null,
    });
  }
}

export async function deleteStaffAttendance(req, res) {
  const { id } = req.params;
  if (!isValidId(id)) {
    return res.status(400).json({
      success: false,
      message: "A valid attendance ID is required.",
      data: null,
    });
  }

  try {
    const attendance = await StaffAttendance.delete(id);
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Staff attendance record not found.",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Attendance deleted successfully",
      data: attendance,
    });
  } catch (error) {
    console.error("Failed to delete staff attendance:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred",
      data: null,
    });
  }
}
