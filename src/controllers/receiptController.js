import Receipt from "../models/Receipt.js";
import { randomUUID } from "node:crypto";
import { v2 as cloudinary } from "cloudinary";
import { logger } from "../utils/logger.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const isValidId = (id) =>
  /^\d+$/.test(String(id)) &&
  BigInt(id) > 0n &&
  BigInt(id) <= 9223372036854775807n;

const uploadReceipt = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "zyetech/receipts",
        public_id: `${randomUUID()}.pdf`,
        resource_type: "raw",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        if (!result?.secure_url || !result.public_id) {
          reject(new Error("Cloudinary did not return a receipt asset."));
          return;
        }
        resolve(result);
      },
    );
    stream.end(buffer);
  });

const removeUploadedReceipt = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
  } catch (error) {
    logger.error("receipts.image_cleanup_failed", error);
  }
};

export async function createReceipt(req, res) {
  const {
    student_id: studentId,
    student_name: studentName,
    course,
    amount,
    purpose,
    payment_date: paymentDate,
    receipt_number: receiptNumber,
    payment_method: paymentMethod,
    details,
    image_data: imageData,
  } = req.body ?? {};
  const amountString = String(amount ?? "");
  const parsedAmount = Number(amount);
  const normalizedName =
    typeof studentName === "string" ? studentName.trim() : "";

  if (
    (studentId !== undefined && !isValidId(String(studentId))) ||
    (studentId === undefined &&
      (!normalizedName ||
        normalizedName.length > 150 ||
        typeof course !== "string" ||
        !course.trim() ||
        course.trim().length > 100)) ||
    !/^\d+(?:\.\d{1,2})?$/.test(amountString) ||
    !Number.isFinite(parsedAmount) ||
    parsedAmount <= 0 ||
    parsedAmount > 9999999999.99 ||
    typeof purpose !== "string" ||
    !purpose.trim() ||
    purpose.trim().length > 200 ||
    (receiptNumber !== undefined &&
      (typeof receiptNumber !== "string" || receiptNumber.length > 50)) ||
    (paymentMethod !== undefined &&
      (typeof paymentMethod !== "string" || paymentMethod.length > 50)) ||
    (details !== undefined &&
      (!details || typeof details !== "object" || Array.isArray(details)))
  ) {
    return res.status(400).json({
      success: false,
      message: "A student name, course, positive amount, and payment purpose are required.",
      data: null,
    });
  }
  if (
    imageData !== undefined &&
    (typeof imageData !== "string" ||
      !/^data:application\/pdf;base64,[A-Za-z0-9+/]+={0,2}$/.test(imageData))
  ) {
    return res.status(400).json({
      success: false,
      message: "A PDF receipt image is required.",
      data: null,
    });
  }
  const imageBuffer = imageData
    ? Buffer.from(imageData.slice(imageData.indexOf(",") + 1), "base64")
    : null;
  if (imageBuffer) {
    if (
      imageBuffer.length === 0 ||
      imageBuffer.length > 8 * 1024 * 1024 ||
      imageBuffer.subarray(0, 5).toString() !== "%PDF-"
    ) {
      return res.status(400).json({
        success: false,
        message: "The receipt PDF is invalid or exceeds the 8 MB limit.",
        data: null,
      });
    }
  }
  if (
    paymentDate !== undefined &&
    (typeof paymentDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(paymentDate))
  ) {
    return res.status(400).json({
      success: false,
      message: "Payment date must be a valid YYYY-MM-DD date.",
      data: null,
    });
  }
  if (paymentDate) {
    const parsedDate = new Date(`${paymentDate}T00:00:00Z`);
    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== paymentDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment date must be a valid YYYY-MM-DD date.",
        data: null,
      });
    }
  }

  if (imageBuffer) {
    const cloudinaryConfig = cloudinary.config();
    if (
      !cloudinaryConfig.cloud_name ||
      !cloudinaryConfig.api_key ||
      !cloudinaryConfig.api_secret
    ) {
      return res.status(503).json({
        success: false,
        message: "Cloudinary receipt storage is not configured on the server.",
        data: null,
      });
    }
  }

  let uploadedImage;
  try {
    if (imageBuffer) uploadedImage = await uploadReceipt(imageBuffer);
    const receipt = await Receipt.create({
      studentId,
      studentName: normalizedName || undefined,
      course: typeof course === "string" ? course.trim() : undefined,
      amount: parsedAmount,
      purpose: purpose.trim(),
      paymentDate: paymentDate || new Date().toISOString().slice(0, 10),
      receiptNumber: receiptNumber?.trim() || null,
      paymentMethod: paymentMethod?.trim() || null,
      details: details ?? {},
      imageUrl: uploadedImage?.secure_url ?? null,
    });
    if (!receipt) {
      if (uploadedImage?.public_id)
        await removeUploadedReceipt(uploadedImage.public_id);
      return res.status(404).json({
        success: false,
        message: "Student not found.",
        data: null,
      });
    }
    return res.status(201).json({
      success: true,
      message: "Receipt generated successfully.",
      data: { receipt },
    });
  } catch (error) {
    if (uploadedImage?.public_id) {
      await removeUploadedReceipt(uploadedImage.public_id);
    }
    logger.error("receipts.create_failed", error, { request_id: req.requestId });
    return res.status(500).json({
      success: false,
      message: "Unable to save the receipt and its image.",
      data: null,
    });
  }
}

export async function getReceipts(req, res) {
  try {
    const receipts = await Receipt.findAll();
    return res.status(200).json({
      success: true,
      message: "Receipts retrieved successfully.",
      data: { receipts },
    });
  } catch (error) {
    logger.error("receipts.list_failed", error, { request_id: req.requestId });
    return res.status(500).json({
      success: false,
      message: "An error occurred.",
      data: null,
    });
  }
}
