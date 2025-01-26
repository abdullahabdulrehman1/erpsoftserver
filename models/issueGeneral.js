import mongoose from "mongoose";

const issueGeneralRowSchema = new mongoose.Schema({
  action: { type: String, required: true },
  serialNo: { type: String, required: true },
  level3ItemCategory: { type: String, required: true },
  itemName: { type: String, required: true },
  uom: { type: String, required: true },
  grnQty: { type: Number, required: true },
  previousIssueQty: { type: Number, required: true },
  balanceQty: { type: Number, required: true },
  issueQty: { type: Number, required: true },
  rowRemarks: { type: String, maxlength: 150 },
});

const issueGeneralSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    grnNumber: { type: String, required: true },
    issueDate: { type: Date, required: true },
    store: { type: String, required: true },
    requisitionType: { type: String, required: true },
    issueToUnit: { type: String, required: true },
    demandNo: { type: String, required: true },
    vehicleType: { type: String, required: true },
    issueToDepartment: { type: String, required: true },
    vehicleNo: { type: String, required: true },
    driver: { type: String, required: true },
    remarks: { type: String, maxlength: 150 },
    rows: [issueGeneralRowSchema],
  },
  { timestamps: true }
);

const IssueGeneral = mongoose.model("IssueGeneral", issueGeneralSchema);

export default IssueGeneral;
