import StaffAttendance from "../models/StaffAttendance.js";
import { logger } from "../utils/logger.js";
import { getAttendanceScheduleError } from "../utils/attendanceSchedule.js";

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;
const isValidId = (id) =>
  /^\d+$/.test(id) &&
  BigInt(id) > 0n &&
  BigInt(id) <= 9223372036854775807n;
const isValidStaffNumber = (value) =>
  typeof value === "string" && /^E\d{2}\/\d{3,}$/i.test(value.trim());
const isValidEmail = (value) =>
  typeof value === "string" &&
  value.trim().length <= 255 &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export async function recordStaffAttendance(req, res) {
  const scheduleError = getAttendanceScheduleError("sign-in");
  if (scheduleError) {
    return res.status(403).json({
      success: false,
      message: scheduleError,
      data: null,
    });
  }

  const { identifier, email } = req.body ?? {};

  if (!isValidStaffNumber(identifier)) {
    return res.status(400).json({
      success: false,
      message: "Enter a valid staff number, for example E26/001.",
      data: null,
    });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({
      success: false,
      message: "Enter a valid email address.",
      data: null,
    });
  }

  try {
    const attendance = await StaffAttendance.create({
      staffNumber: identifier.trim(),
      email: email.trim(),
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "No active staff member was found with that staff number and email address.",
        data: null,
      });
    }
    if (attendance.alreadyMarked) {
      return res.status(409).json({
        success: false,
        message: "This staff member has already signed attendance today.",
        data: null,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Attendance recorded successfully",
      data: attendance,
    });
  } catch (error) {
    logger.error("staff_attendance.create_failed", error, {
      request_id: req.requestId,
    });
    return res.status(500).json({
      success: false,
      message: "An error occurred",
      data: null,
    });
  }
}

export async function signOutStaffAttendance(req, res) {
  const scheduleError = getAttendanceScheduleError("sign-out");
  if (scheduleError) {
    return res.status(403).json({
      success: false,
      message: scheduleError,
      data: null,
    });
  }

  const { identifier, email } = req.body ?? {};

  if (!isValidStaffNumber(identifier)) {
    return res.status(400).json({
      success: false,
      message: "Enter a valid staff number, for example E26/001.",
      data: null,
    });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({
      success: false,
      message: "Enter a valid email address.",
      data: null,
    });
  }

  try {
    const result = await StaffAttendance.signOut({
      staffNumber: identifier.trim(),
      email: email.trim(),
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "No attendance record was found for this staff member today.",
        data: null,
      });
    }

    if (result.alreadySignedOut) {
      return res.status(409).json({
        success: false,
        message: "This staff member has already signed out today.",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Staff member signed out successfully.",
      data: result.attendance,
    });
  } catch (error) {
    logger.error("staff_attendance.sign_out_failed", error, {
      request_id: req.requestId,
    });
    return res.status(500).json({
      success: false,
      message: "An error occurred",
      data: null,
    });
  }
}

export async function getStaffAttendance(req, res) {
  try {
    const attendance = await StaffAttendance.findAll();
    return res.status(200).json({
      success: true,
      message: "Attendance retrieved successfully",
      data: attendance,
    });
  } catch (error) {
    logger.error("staff_attendance.list_failed", error, {
      request_id: req.requestId,
    });
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
    logger.error("staff_attendance.update_failed", error, {
      request_id: req.requestId,
    });
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
    logger.error("staff_attendance.delete_failed", error, {
      request_id: req.requestId,
    });
    return res.status(500).json({
      success: false,
      message: "An error occurred",
      data: null,
    });
  }
}
