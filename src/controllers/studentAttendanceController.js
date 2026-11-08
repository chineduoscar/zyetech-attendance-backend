import StudentAttendance from "../models/StudentAttendance.js";
import { logger } from "../utils/logger.js";

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;
const isValidId = (id) =>
  /^\d+$/.test(id) &&
  BigInt(id) > 0n &&
  BigInt(id) <= 9223372036854775807n;
const isValidStudentNumber = (value) =>
  typeof value === "string" && /^S\d{2}\/\d{3,}$/i.test(value.trim());

export async function recordStudentAttendance(req, res) {
  const { identifier, session } = req.body ?? {};

  if (!isValidStudentNumber(identifier)) {
    return res.status(400).json({
      success: false,
      message: "Enter a valid student number, for example S26/001.",
      data: null,
    });
  }
  if (session !== undefined && session !== null && typeof session !== "string") {
    return res.status(400).json({
      success: false,
      message: "Session must be a string.",
      data: null,
    });
  }

  try {
    const attendance = await StudentAttendance.create({
      studentNumber: identifier.trim(),
      session: typeof session === "string" ? session.trim() || null : null,
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "No active student was found with that student number.",
        data: null,
      });
    }
    if (attendance.alreadyMarked) {
      return res.status(409).json({
        success: false,
        message: "This student has already signed attendance today.",
        data: null,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Attendance recorded successfully",
      data: attendance,
    });
  } catch (error) {
    logger.error("student_attendance.create_failed", error, {
      request_id: req.requestId,
    });
    return res.status(500).json({
      success: false,
      message: "An error occurred",
      data: null,
    });
  }
}

export async function signOutStudentAttendance(req, res) {
  const { identifier } = req.body ?? {};

  if (!isValidStudentNumber(identifier)) {
    return res.status(400).json({
      success: false,
      message: "Enter a valid student number, for example S26/001.",
      data: null,
    });
  }

  try {
    const result = await StudentAttendance.signOut({
      studentNumber: identifier.trim(),
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "No attendance record was found for this student today.",
        data: null,
      });
    }

    if (result.alreadySignedOut) {
      return res.status(409).json({
        success: false,
        message: "This student has already signed out today.",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Student signed out successfully.",
      data: result.attendance,
    });
  } catch (error) {
    logger.error("student_attendance.sign_out_failed", error, {
      request_id: req.requestId,
    });
    return res.status(500).json({
      success: false,
      message: "An error occurred",
      data: null,
    });
  }
}

export async function getStudentAttendance(req, res) {
  try {
    const attendance = await StudentAttendance.findAll();
    return res.status(200).json({
      success: true,
      message: "Attendance retrieved successfully",
      data: attendance,
    });
  } catch (error) {
    logger.error("student_attendance.list_failed", error, {
      request_id: req.requestId,
    });
    return res.status(500).json({
      success: false,
      message: "An error occurred",
      data: null,
    });
  }
}

export async function updateStudentAttendance(req, res) {
  const { id } = req.params;
  const { name, course, session } = req.body ?? {};

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

  if (session !== undefined && session !== null && typeof session !== "string") {
    return res.status(400).json({
      success: false,
      message: "Session must be a string.",
      data: null,
    });
  }

  try {
    const attendance = await StudentAttendance.update(id, {
      name: name.trim(),
      course: course.trim(),
      session: typeof session === "string" ? session.trim() || null : null,
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Student attendance record not found.",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Attendance updated successfully",
      data: attendance,
    });
  } catch (error) {
    logger.error("student_attendance.update_failed", error, {
      request_id: req.requestId,
    });
    return res.status(500).json({
      success: false,
      message: "An error occurred",
      data: null,
    });
  }
}

export async function deleteStudentAttendance(req, res) {
  const { id } = req.params;
  if (!isValidId(id)) {
    return res.status(400).json({
      success: false,
      message: "A valid attendance ID is required.",
      data: null,
    });
  }

  try {
    const attendance = await StudentAttendance.delete(id);
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Student attendance record not found.",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Attendance deleted successfully",
      data: attendance,
    });
  } catch (error) {
    logger.error("student_attendance.delete_failed", error, {
      request_id: req.requestId,
    });
    return res.status(500).json({
      success: false,
      message: "An error occurred",
      data: null,
    });
  }
}
