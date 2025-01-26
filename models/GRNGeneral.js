import mongoose from "mongoose";

const { Schema } = mongoose;

// Define the schema for the rows
const rowSchema = new Schema({
  poNo: { type: String, required: true },
  department: { type: String, required: true },
  category: { type: String, required: true },
  name: { type: String, required: true },
  unit: { type: String, required: true },
  poQty: { type: Number, required: true },
  previousQty: { type: Number, required: true },
  balancePoQty: { type: Number, required: true },
  receivedQty: { type: Number, required: true },
  rowRemarks: { type: String, maxlength: 150 },
});

// Define the schema for the GRN
const grnSchema = new Schema(
  {
    grnNumber: { type: String, required: true },
    date: { type: String, required: true },
    supplierChallanNumber: { type: String, required: true },
    supplierChallanDate: { type: String, required: true },
    supplier: { type: String, required: true },
    inwardNumber: { type: String, required: true },
    inwardDate: { type: String, required: true },
    remarks: { type: String, required: true },
    rows: [rowSchema],

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Create the model
const GRN = mongoose.model("GRN", grnSchema);

export default GRN;
