import AttendanceAnalytics from "../models/AttendanceAnalytics.js";
import { logger } from "../utils/logger.js";

export async function getAttendanceAnalytics(_req, res) {
  try {
    const summary = await AttendanceAnalytics.getSummary();
    return res.status(200).json({
      success: true,
      message: "Attendance analytics retrieved successfully",
      data: summary,
    });
  } catch (error) {
    logger.error("analytics.retrieve_failed", error, {
      request_id: _req.requestId,
    });
    return res.status(500).json({
      success: false,
      message: "An error occurred",
      data: null,
    });
  }
}
