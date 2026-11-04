import User from "../models/User.js";
import { logger } from "../utils/logger.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function updateUserRole(req, res) {
  const { id } = req.params;
  const { role } = req.body ?? {};

  if (!UUID_PATTERN.test(id)) {
    return res.status(400).json({
      success: false,
      message: "A valid user ID is required.",
      data: null,
    });
  }

  if (!["admin", "superadmin"].includes(role)) {
    return res.status(400).json({
      success: false,
      message: "Role must be admin or superadmin.",
      data: null,
    });
  }

  try {
    if (id === req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You cannot change your own role.",
        data: null,
      });
    }

    const user = await User.updateRole(id, role);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "User role updated successfully",
      data: user,
    });
  } catch (error) {
    if (error.code === "USER_NOT_APPROVED") {
      return res.status(409).json({
        success: false,
        message: error.message,
        data: null,
      });
    }
    if (error.code === "LAST_SUPERADMIN") {
      return res.status(409).json({
        success: false,
        message: error.message,
        data: null,
      });
    }
    logger.error("users.role_update_failed", error, {
      request_id: req.requestId,
    });
    return res.status(500).json({
      success: false,
      message: "An error occurred",
      data: null,
    });
  }
}

export async function getUsers(req, res) {
  try {
    const users = await User.findAll();
    return res.status(200).json({
      success: true,
      message: "Users retrieved successfully.",
      data: { users },
    });
  } catch (error) {
    logger.error("users.list_failed", error, { request_id: req.requestId });
    return res.status(500).json({
      success: false,
      message: "An error occurred.",
      data: null,
    });
  }
}

export async function updateUserApproval(req, res) {
  const { id } = req.params;
  const { approval_status: approvalStatus } = req.body ?? {};

  if (!UUID_PATTERN.test(id)) {
    return res.status(400).json({
      success: false,
      message: "A valid user ID is required.",
      data: null,
    });
  }
  if (!["approved", "pending"].includes(approvalStatus)) {
    return res.status(400).json({
      success: false,
      message: "Approval status must be approved or pending.",
      data: null,
    });
  }
  if (id === req.user.id) {
    return res.status(403).json({
      success: false,
      message: "You cannot change your own approval status.",
      data: null,
    });
  }

  try {
    const user = await User.updateApprovalStatus(id, approvalStatus);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "User approval status updated successfully.",
      data: user,
    });
  } catch (error) {
    if (error.code === "LAST_SUPERADMIN") {
      return res.status(409).json({
        success: false,
        message: error.message,
        data: null,
      });
    }
    logger.error("users.approval_update_failed", error, {
      request_id: req.requestId,
    });
    return res.status(500).json({
      success: false,
      message: "An error occurred.",
      data: null,
    });
  }
}
