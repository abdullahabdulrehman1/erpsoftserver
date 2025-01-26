import mongoose from "mongoose";

const { Schema } = mongoose;

const rowSchema = new Schema({
  action: { type: String, required: true },
  serialNo: { type: String, required: true },
  level3ItemCategory: { type: String, required: true },
  itemName: { type: String, required: true },
  unit: { type: String, required: true },
  issueQty: { type: Number, required: true },
  previousReturnQty: { type: Number, required: true },
  balanceIssueQty: { type: Number, required: true },
  returnQty: { type: Number, required: true },
  rowRemarks: { type: String, required: true },
});

const issueReturnGeneralSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    irNumber: { type: String, required: true },
    irDate: { type: Date, required: true },
    drNumber: { type: String, required: true },
    drDate: { type: Date, required: true },
    remarks: { type: String },
    rows: [rowSchema],
  },
  { timestamps: true }
);

export default mongoose.model("IssueReturnGeneral", issueReturnGeneralSchema);
