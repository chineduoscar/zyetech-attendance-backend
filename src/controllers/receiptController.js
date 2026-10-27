import Receipt from "../models/Receipt.js";

const isValidId = (id) =>
  /^\d+$/.test(String(id)) &&
  BigInt(id) > 0n &&
  BigInt(id) <= 9223372036854775807n;

export async function createReceipt(req, res) {
  const { student_id: studentId, amount, purpose, payment_date: paymentDate } =
    req.body ?? {};
  const amountString = String(amount ?? "");
  const parsedAmount = Number(amount);

  if (
    !isValidId(String(studentId ?? "")) ||
    !/^\d+(?:\.\d{1,2})?$/.test(amountString) ||
    !Number.isFinite(parsedAmount) ||
    parsedAmount <= 0 ||
    parsedAmount > 9999999999.99 ||
    typeof purpose !== "string" ||
    !purpose.trim()
  ) {
    return res.status(400).json({
      success: false,
      message: "A student, positive amount, and payment purpose are required.",
      data: null,
    });
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

  try {
    const receipt = await Receipt.create({
      studentId,
      amount: parsedAmount,
      purpose: purpose.trim(),
      paymentDate: paymentDate || new Date().toISOString().slice(0, 10),
    });
    if (!receipt) {
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
    console.error("Failed to generate receipt:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred.",
      data: null,
    });
  }
}

export async function getReceipts(_req, res) {
  try {
    const receipts = await Receipt.findAll();
    return res.status(200).json({
      success: true,
      message: "Receipts retrieved successfully.",
      data: { receipts },
    });
  } catch (error) {
    console.error("Failed to retrieve receipts:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred.",
      data: null,
    });
  }
}
