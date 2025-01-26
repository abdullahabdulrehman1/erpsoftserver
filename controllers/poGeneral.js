import { PurchaseOrder } from "../models/poGeneral.js";
import { User } from "../models/user.js";

import { generatePdfReport } from "../utils/pdfReportUtil.js";
import { fileURLToPath } from "url";
import { dirname } from "path";

export const createPurchaseOrder = async (req, res) => {
  const {
    userId,
    poNumber,
    date,
    poDelivery,
    requisitionType,
    supplier,
    store,
    payment,
    purchaser,
    remarks,
    rows,
  } = req.body;

  try {
    // Check for duplicate PO number
    const existingPO = await PurchaseOrder.findOne({ poNumber });
    if (existingPO) {
      return res.status(400).json({ message: "PO Number already exists" });
    }

    // Calculate GST and total amounts for each row
    const updatedRows = rows.map((row) => {
      const gstPercent = 18;

      // Ensure necessary values are provided and valid
      const otherChargesAmount = row.otherChargesAmount || 0;
      const discountAmount = row.discountAmount || 0;

      // Calculate excludingTaxAmount if not provided
      let excludingTaxAmount = row.excludingTaxAmount;
      if (!excludingTaxAmount) {
        excludingTaxAmount = row.rate * row.quantity;
      }

      // Ensure excludingTaxAmount is a valid number
      if (isNaN(excludingTaxAmount)) {
        excludingTaxAmount = 0;
      }

      // Round off excludingTaxAmount
      excludingTaxAmount = parseFloat(excludingTaxAmount.toFixed(2));

      // Calculate GST amount
      const gstAmount = parseFloat(
        ((excludingTaxAmount * gstPercent) / 100).toFixed(2)
      );

      // Calculate total amount
      const calculatedTotalAmount = parseFloat(
        (
          excludingTaxAmount +
          gstAmount -
          discountAmount +
          otherChargesAmount
        ).toFixed(2)
      );

      // Ensure gstAmount and totalAmount are valid numbers
      return {
        ...row,
        excludingTaxAmount: isNaN(excludingTaxAmount) ? 0 : excludingTaxAmount,
        gstPercent,
        gstAmount: isNaN(gstAmount) ? 0 : gstAmount,
        totalAmount: isNaN(calculatedTotalAmount) ? 0 : calculatedTotalAmount,
      };
    });

    const newPurchaseOrder = new PurchaseOrder({
      userId,
      poNumber,
      date,
      poDelivery,
      requisitionType,
      supplier,
      store,
      payment,
      purchaser,
      remarks,
      rows: updatedRows,
    });

    const savedPurchaseOrder = await newPurchaseOrder.save();
    res.status(201).json({
      message: "Purchase Order created successfully",
      savedPurchaseOrder,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const showPurchaseOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    const userRole = user?.role; // Assuming role is stored in user.role

    let purchaseOrders;

    if (userRole === 1 || userRole === 2) {
      purchaseOrders = await PurchaseOrder.find().populate(
        "userId",
        "name email"
      );
    } else if (userRole === 0) {
      purchaseOrders = await PurchaseOrder.find({ userId }).populate(
        "userId",
        "name email"
      );
    } else {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    res.status(200).json(purchaseOrders);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const deletePurchaseOrder = async (req, res) => {
  try {
    const { purchaseOrderId } = req.body;

    if (!purchaseOrderId) {
      return res.status(400).json({ message: "Purchase Order ID is required" });
    }

    await PurchaseOrder.findByIdAndDelete(purchaseOrderId);

    res.json({ message: "Purchase Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const editPurchaseOrder = async (req, res) => {
  const { purchaseOrderId, updateData } = req.body;
  const {
    userId,
    poNumber,
    date,
    poDelivery,
    requisitionType,
    supplier,
    store,
    payment,
    purchaser,
    remarks,
    rows,
  } = updateData;

  try {
    // Find the purchase order by ID
    const existingPO = await PurchaseOrder.findById(purchaseOrderId);
    if (!existingPO) {
      return res.status(404).json({ message: "Purchase Order not found" });
    }

    // Calculate GST and total amounts for each row
    const updatedRows = rows.map((row) => {
      const gstPercent = 18;

      // Ensure necessary values are provided and valid
      const otherChargesAmount = row.otherChargesAmount || 0;
      const discountAmount = row.discountAmount || 0;

      // Calculate excludingTaxAmount if not provided
      let excludingTaxAmount = row.excludingTaxAmount;
      if (!excludingTaxAmount) {
        excludingTaxAmount = row.rate * row.quantity;
      }

      // Ensure excludingTaxAmount is a valid number
      if (isNaN(excludingTaxAmount)) {
        excludingTaxAmount = 0;
      }

      // Round off excludingTaxAmount
      excludingTaxAmount = parseFloat(excludingTaxAmount.toFixed(2));

      // Calculate GST amount
      const gstAmount = parseFloat(
        ((excludingTaxAmount * gstPercent) / 100).toFixed(2)
      );

      // Calculate total amount
      const calculatedTotalAmount = parseFloat(
        (
          excludingTaxAmount +
          gstAmount -
          discountAmount +
          otherChargesAmount
        ).toFixed(2)
      );

      // Ensure gstAmount and totalAmount are valid numbers
      return {
        ...row,
        excludingTaxAmount: isNaN(excludingTaxAmount) ? 0 : excludingTaxAmount,
        gstPercent,
        gstAmount: isNaN(gstAmount) ? 0 : gstAmount,
        totalAmount: isNaN(calculatedTotalAmount) ? 0 : calculatedTotalAmount,
      };
    });

    // Update the purchase order fields
    existingPO.userId = userId;
    existingPO.poNumber = poNumber;
    existingPO.date = date;
    existingPO.poDelivery = poDelivery;
    existingPO.requisitionType = requisitionType;
    existingPO.supplier = supplier;
    existingPO.store = store;
    existingPO.payment = payment;
    existingPO.purchaser = purchaser;
    existingPO.remarks = remarks;
    existingPO.rows = updatedRows;

    // Save the updated purchase order
    const updatedPurchaseOrder = await existingPO.save();
    res.status(200).json({
      updatedPurchaseOrder,
      message: "Purchase Order updated successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
// Update the import path as per your project structure
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const generatePurchaseOrderReport = async (req, res) => {
  try {
    const { fromDate, toDate, sortBy, order, columns } = req.query;

    // Validate and parse inputs
    if (!fromDate || !toDate) {
      return res.status(400).json({ message: "Invalid date range" });
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);

    // Fetch the user (assuming user is authenticated and userId is in req.user)
    const user = await User.findById(req.user.id);

    // Fetch purchase orders
    const data = await PurchaseOrder.find({
      userId: user.role === 0 ? user._id : undefined,
      date: { $gte: from, $lte: to },
    }).populate("userId", "name emailAddress");

    if (!data || data.length === 0) {
      return res.status(404).json({ message: "No purchase orders found for the given range." });
    }

    // Define columns for the report
    const columnsArray = columns
      ? columns.split(",").map((col) => ({ property: col, label: col, width: 60 }))
      : [
          { property: "poNumber", label: "PO Number", width: 60 },
          { property: "date", label: "Date", width: 60 },
          { property: "supplier", label: "Supplier", width: 80 },
          { property: "store", label: "Store", width: 80 },
          { property: "requisitionType", label: "Requisition Type", width: 80 },
          { property: "name", label: "Item Name", width: 80 },
          { property: "quantity", label: "Quantity", width: 60 },
          { property: "rate", label: "Rate", width: 60 },
          { property: "amount", label: "Total Amount", width: 80 },
        ];

        const validSortFields = ["date", "poNumber", "supplier", "store", "requisitionType", "quantity","amount", "totalAmount"];
    // Prepare data for the PDF report
    const reportData = data.map((po) => ({
      poNumber: po.poNumber,
      date: po.date.toISOString().split('T')[0],
      supplier: po.supplier,
      store: po.store,
      purchaser: po.purchaser,
      requisitionType: po.requisitionType,
      items: po.rows,
    }));

    // Generate the PDF report
    const report = await generatePdfReport({
      user,
      data: reportData,
      columns: columnsArray,
      sortBy,
      order,
      reportType: "Purchase Order",
      fromDate,
      toDate,
      validSortFields,
    });

    // Generate URL for the report

    res.status(200).json({
      message: "Purchase Order PDF report generated successfully",
      url: report.url,
      totals: report.totals,
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};
