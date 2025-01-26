import mongoose from "mongoose";
const { Schema } = mongoose;
// Define the schema for the rows
const rowSchema = new Schema({
  action: { type: String, required: true },
  serialNo: { type: String, required: true },
  category: { type: String, required: true },
  name: { type: String, required: true },
  unit: { type: String, required: true },
  grnQty: { type: Number, required: true },
  previousReturnQty: { type: Number, required: true },
  balanceGrnQty: { type: Number, required: true },
  returnQty: { type: Number, required: true },
  rowRemarks: { type: String, maxlength: 150 },
});

// Define the schema for the GRNReturnGeneral
const grnReturnGeneralSchema = new Schema(
  {
    grnrNumber: { type: String, required: true },
    grnrDate: { type: String, required: true },
    grnNumber: { type: String, required: true, ref: "GRN" },
    grnDate: { type: String, required: true },
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
const GRNReturnGeneral = mongoose.model(
  "GRNReturnGeneral",
  grnReturnGeneralSchema
);

export default GRNReturnGeneral;
