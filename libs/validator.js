import { body, validationResult } from "express-validator";
import { ErrorHandler } from "../utils/utility.js";

export const validatorHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const registerValidator = () => [
  body("emailAddress")
    .notEmpty()
    .withMessage("Email address is required")
    .isEmail()
    .withMessage("Invalid email address"),
  body("contactNumber").notEmpty().withMessage("Contact number is required"),
  body("password").notEmpty().withMessage("Password is required"),
  body("confirmPassword")
    .notEmpty()
    .withMessage("Confirm password is required")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
  body("address").notEmpty().withMessage("Address is required"),
];

export const loginValidator = () => [
  body("emailAddress")
    .notEmpty()
    .withMessage("Email address is required")
    .isEmail()
    .withMessage("Invalid email address"),
  body("password").notEmpty().withMessage("Password is required"),
];

export const createRequisitionValidator = () => [
  body("userId")
    .notEmpty()
    .withMessage("User ID is required")
    .isMongoId()
    .withMessage("Invalid User ID"),
  body("drNumber")
    .notEmpty()
    .withMessage("DR Number is required")
    .isLength({ max: 10 })
    .withMessage("DR Number cannot exceed 10 characters"),
  body("date").notEmpty().withMessage("Date is required"),
  body("requisitionType")
    .notEmpty()
    .withMessage("Requisition Type is required")
    .isLength({ max: 150 })
    .withMessage("Requisition Type cannot exceed 150 characters"),
  body("department")
    .notEmpty()
    .withMessage("Department is required")
    .isLength({ max: 150 })
    .withMessage("Department cannot exceed 150 characters"),
  body("headerRemarks")
    .optional()
    .isLength({ max: 150 })
    .withMessage("Header Remarks cannot exceed 150 characters"),
  body("items")
    .isArray({ min: 1 })
    .withMessage("At least one item is required"),
  body("items.*.level3ItemCategory")
    .notEmpty()
    .withMessage("Level 3 Item Category is required"),
  body("items.*.itemName").notEmpty().withMessage("Item Name is required"),
  body("items.*.uom").notEmpty().withMessage("UOM is required"),
  body("items.*.quantity")
    .notEmpty()
    .withMessage("Quantity is required")
    .isNumeric()
    .withMessage("Quantity must be a number"),
  body("items.*.rate")
    .notEmpty()
    .withMessage("Rate is required")
    .isNumeric()
    .withMessage("Rate must be a number"),
  body("items.*.amount")
    .notEmpty()
    .withMessage("Amount is required")
    .isNumeric()
    .withMessage("Amount must be a number"),
  body("items.*.remarks")
    .optional()
    .isLength({ max: 150 })
    .withMessage("Remarks cannot exceed 150 characters"),
];

export const updateRequisitionValidator = () => [
  body("requisitionId")
    .notEmpty()
    .withMessage("Requisition ID is required")
    .isMongoId()
    .withMessage("Invalid Requisition ID"),
  body("updateData.userId")
    .optional()
    .isMongoId()
    .withMessage("Invalid User ID"),
  body("updateData.drNumber")
    .optional()
    .isLength({ max: 10 })
    .withMessage("DR Number cannot exceed 10 characters"),
  body("updateData.date").optional(),
  body("updateData.requisitionType")
    .optional()
    .isLength({ max: 150 })
    .withMessage("Requisition Type cannot exceed 150 characters"),
  body("updateData.department")
    .optional()
    .isLength({ max: 150 })
    .withMessage("Department cannot exceed 150 characters"),
  body("updateData.headerRemarks")
    .optional()
    .isLength({ max: 150 })
    .withMessage("Header Remarks cannot exceed 150 characters"),
  body("updateData.items")
    .optional()
    .isArray({ min: 1 })
    .withMessage("At least one item is required"),
  body("updateData.items.*.level3ItemCategory")
    .optional()
    .notEmpty()
    .withMessage("Level 3 Item Category is required"),
  body("updateData.items.*.itemName")
    .optional()
    .notEmpty()
    .withMessage("Item Name is required"),
  body("updateData.items.*.uom")
    .optional()
    .notEmpty()
    .withMessage("UOM is required"),
  body("updateData.items.*.quantity")
    .optional()
    .notEmpty()
    .withMessage("Quantity is required")
    .isNumeric()
    .withMessage("Quantity must be a number"),
  body("updateData.items.*.rate")
    .optional()
    .notEmpty()
    .withMessage("Rate is required")
    .isNumeric()
    .withMessage("Rate must be a number"),
  body("updateData.items.*.amount")
    .optional()
    .notEmpty()
    .withMessage("Amount is required")
    .isNumeric()
    .withMessage("Amount must be a number"),
  body("updateData.items.*.remarks")
    .optional()
    .isLength({ max: 150 })
    .withMessage("Remarks cannot exceed 150 characters"),
];

export const createGRNValidator = () => [
  body("grnNumber").notEmpty().withMessage("GRN Number is required"),
  body("date")
    .notEmpty()
    .withMessage("Date is required")
    .matches(/^\d{2}-\d{2}-\d{4}$/)
    .withMessage("Invalid date format. Use DD-MM-YYYY."),
  body("supplierChallanNumber")
    .notEmpty()
    .withMessage("Supplier Challan Number is required"),
  body("supplierChallanDate")
    .notEmpty()
    .withMessage("Supplier Challan Date is required")
    .matches(/^\d{2}-\d{2}-\d{4}$/)
    .withMessage("Invalid date format. Use DD-MM-YYYY."),
  body("supplier").notEmpty().withMessage("Supplier is required"),
  body("inwardNumber").notEmpty().withMessage("Inward Number is required"),
  body("inwardDate")
    .notEmpty()
    .withMessage("Inward Date is required")
    .matches(/^\d{2}-\d{2}-\d{4}$/)
    .withMessage("Invalid date format. Use DD-MM-YYYY."),
  body("remarks").notEmpty().withMessage("Remarks are required"),
  body("rows").isArray({ min: 1 }).withMessage("At least one row is required"),
  body("rows.*.poNo").notEmpty().withMessage("PO Number is required"),
  body("rows.*.department").notEmpty().withMessage("Department is required"),
  body("rows.*.category").notEmpty().withMessage("Category is required"),
  body("rows.*.name").notEmpty().withMessage("Name is required"),
  body("rows.*.unit").notEmpty().withMessage("Unit is required"),
  body("rows.*.poQty")
    .notEmpty()
    .withMessage("PO Quantity is required")
    .isNumeric()
    .withMessage("PO Quantity must be a number"),
  body("rows.*.previousQty")
    .notEmpty()
    .withMessage("Previous Quantity is required")
    .isNumeric()
    .withMessage("Previous Quantity must be a number"),
  body("rows.*.balancePoQty")
    .notEmpty()
    .withMessage("Balance PO Quantity is required")
    .isNumeric()
    .withMessage("Balance PO Quantity must be a number"),
  body("rows.*.receivedQty")
    .notEmpty()
    .withMessage("Received Quantity is required")
    .isNumeric()
    .withMessage("Received Quantity must be a number"),
  body("rows.*.rowRemarks")
    .optional()
    .isLength({ max: 150 })
    .withMessage("Row remarks cannot exceed 150 characters"),
  body("userId")
    .notEmpty()
    .withMessage("User ID is required")
    .isMongoId()
    .withMessage("Invalid User ID"),
];

export const createPurchaseOrderValidator = () => [
  body("userId")
    .notEmpty()
    .withMessage("User ID is required")
    .isMongoId()
    .withMessage("Invalid User ID"),
  body("poNumber")
    .notEmpty()
    .withMessage("PO Number is required")
    .isLength({ max: 10 })
    .withMessage("PO Number cannot exceed 10 characters"),
  body("date")
    .notEmpty()
    .withMessage("Date is required")
    
    .withMessage("Invalid date format. Use DD-MM-YYYY."),
  body("poDelivery").notEmpty().withMessage("PO Delivery is required"),
  body("requisitionType")
    .notEmpty()
    .withMessage("Requisition Type is required"),
  body("supplier").notEmpty().withMessage("Supplier is required"),
  body("store").notEmpty().withMessage("Store is required"),
  body("payment").notEmpty().withMessage("Payment is required"),
  body("purchaser").notEmpty().withMessage("Purchaser is required"),
  body("remarks")
    .optional()
    .isLength({ max: 150 })
    .withMessage("Remarks cannot exceed 150 characters"),
  body("rows").isArray({ min: 1 }).withMessage("At least one item is required"),
  body("rows.*.prNo").notEmpty().withMessage("PR Number is required"),
  body("rows.*.department").notEmpty().withMessage("Department is required"),
  body("rows.*.category").notEmpty().withMessage("Category is required"),
  body("rows.*.name").notEmpty().withMessage("Name is required"),
  body("rows.*.uom").notEmpty().withMessage("UOM is required"),
  body("rows.*.quantity")
    .notEmpty()
    .withMessage("Quantity is required")
    .isNumeric()
    .withMessage("Quantity must be a number"),
  body("rows.*.rate")
    .notEmpty()
    .withMessage("Rate is required")
    .isNumeric()
    .withMessage("Rate must be a number"),
 
  
  body("rows.*.discountAmount")
    .notEmpty()
    .withMessage("Discount Amount is required")
    .isNumeric()
    .withMessage("Discount Amount must be a number"),

  body("rows.*.rowRemarks")
    .optional()
    .isLength({ max: 150 })
    .withMessage("Row Remarks cannot exceed 150 characters"),
];


