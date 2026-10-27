import AttendanceAnalytics from "../models/AttendanceAnalytics.js";

export async function getAttendanceAnalytics(_req, res) {
  try {
    const summary = await AttendanceAnalytics.getSummary();
    return res.status(200).json({
      success: true,
      message: "Attendance analytics retrieved successfully",
      data: summary,
    });
  } catch (error) {
    console.error("Failed to retrieve attendance analytics:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred",
      data: null,
    });
  }
}
