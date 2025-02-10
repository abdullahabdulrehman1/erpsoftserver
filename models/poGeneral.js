import mongoose from "mongoose";

const poItemSchema = new mongoose.Schema({
  prNo: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  uom: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  rate: {
    type: Number,
    required: true,
  },
  excludingTaxAmount: {
    type: Number,
    required: true,
  },
  gstPercent: {
    type: Number,
    required: true,
  },
  gstAmount: {
    type: Number,
    required: true,
  },
  discountAmount: {
    type: Number,
    required: true,
  },
  otherChargesAmount: {
    type: Number,
    required: true,
  },
  requisition:{
    type: String,
    required: false,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  rowRemarks: {
    type: String,
    maxlength: 150,
  },
});

const poSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  poNumber: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  poDelivery: {
    type: String,
    required: true,
  },
  requisitionType: {
    type: String,
    required: true,
  },
  supplier: {
    type: String,
    required: true,
  },
  store: {
    type: String,
    required: true,
  },
  payment: {
    type: String,
    required: true,
  },
  purchaser: {
    type: String,
    required: true,
  },
  remarks: {
    type: String,
    maxlength: 150,
  },

  rows: [poItemSchema],
});

export const PurchaseOrder =
  mongoose.models.PurchaseOrder || mongoose.model("PurchaseOrder", poSchema);
  