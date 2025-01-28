import GRN from "../models/GRNGeneral.js";
import { PurchaseOrder } from "../models/poGeneral.js";
import { User } from "../models/user.js";
import { generatePdfReport } from "../utils/pdfReportUtil.js";
import { fileURLToPath } from "url";
import { dirname } from "path";
import moment from 'moment'
export const createGRN = async (req, res) => {
  const {
    grnNumber,
    date,
    supplierChallanNumber,
    supplierChallanDate,
    supplier,
    inwardNumber,
    inwardDate,
    remarks,
    rows,
    userId,
  } = req.body;

  // Validate the input data
  if (
    !grnNumber ||
    !date ||
    !supplierChallanNumber ||
    !supplierChallanDate ||
    !supplier ||
    !inwardNumber ||
    !inwardDate ||
    !remarks ||
    !rows ||
    !userId
  ) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Validate date format
  const validateDate = (date) => {
    const regex = /^\d{2}-\d{2}-\d{4}$/;
    return regex.test(date);
  };

  if (
    !validateDate(date) ||
    !validateDate(supplierChallanDate) ||
    !validateDate(inwardDate)
  ) {
    return res
      .status(400)
      .json({ message: "Invalid date format. Use DD-MM-YYYY." });
  }

  // Validate rows
  for (let row of rows) {
    if (
      !row.poNo ||
      !row.department ||
      !row.category ||
      !row.name ||
      !row.unit ||
      isNaN(row.poQty) ||
      isNaN(row.previousQty) ||
      isNaN(row.balancePoQty) ||
      isNaN(row.receivedQty)
    ) {
      return res.status(400).json({ message: "Invalid row data" });
    }
    if (row.rowRemarks && row.rowRemarks.length > 150) {
      return res
        .status(400)
        .json({ message: "Row remarks cannot exceed 150 characters" });
    }
  }

  try {
    // Check if a GRN with the same grnNumber already exists
    const existingGRN = await GRN.findOne({ grnNumber });
    if (existingGRN) {
      return res
        .status(400)
        .json({ message: "GRN with this number already exists" });
    }

    // Check if PO numbers exist
    const poNumbers = rows.map((row) => row.poNo);
    const existingPOs = await PurchaseOrder.find({
      poNumber: { $in: poNumbers },
    });

    // Validate that the number of rows in GRN does not exceed the number of rows in the corresponding PO
    for (let po of existingPOs) {
      const poRowCount = po.rows.length;
      const grnRowCount = rows.filter((row) => row.poNo === po.poNumber).length;
      if (grnRowCount > poRowCount) {
        return res.status(400).json({
          message: `GRN cannot have more rows than the corresponding PO (PO Number: ${po.poNumber})`,
        });
      }

      // Check for missing rows in the existing GRN
      const existingGRNRows = await GRN.find({ "rows.poNo": po.poNumber });
      const existingGRNRowCount = existingGRNRows.length;
      if (existingGRNRowCount + grnRowCount > poRowCount) {
        return res.status(400).json({
          message: `Cannot add more rows than the total number of rows in the corresponding PO (PO Number: ${po.poNumber})`,
        });
      }
    }

    // Fetch user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newGRN = new GRN({
      grnNumber,
      date,
      supplierChallanNumber,
      supplierChallanDate,
      supplier,
      inwardNumber,
      inwardDate,
      remarks,
      rows,
      userId,
    });

    const savedGRN = await newGRN.save();
    res.status(201).json({
      message: "GRN created successfully",
      grn: savedGRN,
      userName: user.name,
    });
  } catch (error) {
    console.error("Error creating GRN:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
export const getGRNById = async (req, res) => {
  const userId = req.user.id;

  try {
    // Fetch the GRN details by ID
    const user = await User.findById(userId);
    const userRole = user?.role; // Assuming role is stored in user.role

    let grns;

    if (userRole === 1 || userRole === 2) {
      grns = await GRN.find().populate("userId", "name");
    } else if (userRole === 0) {
      grns = await GRN.find({ userId }).populate("userId", "name");
    } else {
      return res.status(403).json({ message: "Unauthorized access" });
    }
    if (!grns) {
      return res.status(404).json({ message: "GRN not found" });
    }

    res.status(200).json({
      message: "GRN fetched successfully",
      grn: grns,
    });
  } catch (error) {
    console.error("Error fetching GRN:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
export const deleteGRN = async (req, res) => {
  const { grnId } = req.body;

  if (!grnId) {
    return res.status(400).json({ message: "GRN ID is required" });
  }

  try {
    const grn = await GRN.findByIdAndDelete(grnId);

    if (!grn) {
      return res.status(404).json({ message: "GRN not found" });
    }

    res.status(200).json({ message: "GRN deleted successfully" });
  } catch (error) {
    console.error("Error deleting GRN:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
export const updateGRN = async (req, res) => {
  const {
    id,
    grnNumber,
    date,
    supplierChallanNumber,
    supplierChallanDate,
    supplier,
    inwardNumber,
    inwardDate,
    remarks,
    rows,
    userId,
  } = req.body;

  // Validate the input data
  if (
    !grnNumber ||
    !date ||
    !supplierChallanNumber ||
    !supplierChallanDate ||
    !supplier ||
    !inwardNumber ||
    !inwardDate ||
    !remarks ||
    !rows ||
    !userId
  ) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Validate rows
  for (let row of rows) {
    if (
      !row.poNo ||
      !row.department ||
      !row.category ||
      !row.name ||
      !row.unit ||
      isNaN(row.poQty) ||
      isNaN(row.previousQty) ||
      isNaN(row.balancePoQty) ||
      isNaN(row.receivedQty)
    ) {
      return res.status(400).json({ message: "Invalid row data" });
    }
    if (row.rowRemarks && row.rowRemarks.length > 150) {
      return res
        .status(400)
        .json({ message: "Row remarks cannot exceed 150 characters" });
    }
  }

  // Additional PO general validation
  if (!isValidPONumber(grnNumber)) {
    return res.status(400).json({ message: "Invalid PO number" });
  }

  try {
    const grn = await GRN.findById(id);

    if (!grn) {
      return res.status(404).json({ message: "GRN not found" });
    }

    grn.grnNumber = grnNumber;
    grn.date = date;
    grn.supplierChallanNumber = supplierChallanNumber;
    grn.supplierChallanDate = supplierChallanDate;
    grn.supplier = supplier;
    grn.inwardNumber = inwardNumber;
    grn.inwardDate = inwardDate;
    grn.remarks = remarks;
    grn.rows = rows;
    grn.userId = userId;

    const updatedGRN = await grn.save();
    res.status(200).json({
      message: "GRN updated successfully",
      grn: updatedGRN,
    });
  } catch (error) {
    console.error("Error updating GRN:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Example PO number validation function
const isValidPONumber = (poNumber) => {
  // Add your PO number validation logic here
  return true; // Placeholder, replace with actual validation logic
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const generateGRNReport = async (req, res) => {
  try {
    const { fromDate, toDate, sortBy, order, columns } = req.query;

    // Validate and parse inputs
    if (!fromDate || !toDate) {
      return res.status(400).json({ message: "Invalid date range" });
    }

    const from = moment(fromDate, "DD-MM-YYYY").startOf('day').toDate();
    const to = moment(toDate, "DD-MM-YYYY").endOf('day').toDate();

    console.log("From Date:", from);
    console.log("To Date:", to);

    // Fetch the user (assuming user is authenticated and userId is in req.user)
    const user = await User.findById(req.user.id);

    // Fetch GRN records
    const data = await GRN.find().populate("userId", "name emailAddress");

    // Filter out records with invalid dates and ensure dates are within the range
    const validData = data.filter(grn => {
      const dateFormats = ["DD-MM-YYYY", "YYYY-MM-DD"];
      const grnDate = moment(grn.date, dateFormats, true);
      return grnDate.isValid() && grnDate.isBetween(from, to, null, '[]');
    });

    console.log("Fetched Data:", validData);

    if (!validData || validData.length === 0) {
      return res.status(404).json({ message: "No GRN records found for the given range." });
    }

    // Define columns for the report
    const columnsArray = columns
      ? columns.split(",").map((col) => ({ property: col, label: col, width: 60 }))
      : [
          { property: "grnNumber", label: "GRN Number", width: 60 },
          { property: "date", label: "Date", width: 60 },
          { property: "supplierChallanNumber", label: "Supplier Challan Number", width: 80 },
          { property: "supplierChallanDate", label: "Supplier Challan Date", width: 80 },
          { property: "supplier", label: "Supplier", width: 80 },
          { property: "inwardNumber", label: "Inward Number", width: 80 },
          { property: "inwardDate", label: "Inward Date", width: 80 },
          { property: "remarks", label: "Remarks", width: 80 },
        ];

    const validSortFields = ["date", "grnNumber", "supplier", "inwardNumber", "remarks"];

    // Prepare data for the PDF report
    const reportData = validData.map((grn) => ({
      grnNumber: grn.grnNumber,
      date: grn.date,
      supplierChallanNumber: grn.supplierChallanNumber,
      supplierChallanDate: grn.supplierChallanDate,
      supplier: grn.supplier,
      inwardNumber: grn.inwardNumber,
      inwardDate: grn.inwardDate,
      remarks: grn.remarks,
      items: grn.rows,
    }));

    // Generate the PDF report
    const report = await generatePdfReport({
      user,
      data: reportData,
      columns: columnsArray,
      sortBy,
      order,
      reportType: "GRN",
      fromDate,
      toDate,
      validSortFields,
    });

    res.status(200).json({
      message: "GRN PDF report generated successfully",
      url: report.url,
      totals: report.totals,
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};