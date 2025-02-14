import mongoose from 'mongoose'

const rowSchema = new mongoose.Schema({
  poNo: { type: String, required: false },
  department: { type: String, required: true },
  category: { type: String, required: true },
  name: { type: String, required: true },
  unit: { type: String, required: true },
  poQty: { type: Number, required: true },
  previousQty: { type: Number, required: true },
  balancePoQty: { type: Number, required: true },
  receivedQty: { type: Number, required: true },
  rowRemarks: { type: String }
})

const grnSchema = new mongoose.Schema(
  {
    grnNumber: { type: String, required: true, unique: true },
    date: { type: Date, required: true },
    supplierChallanNumber: { type: String, required: true },
    supplierChallanDate: { type: Date, required: true },
    supplier: { type: String, required: true },
    inwardNumber: { type: String, required: true },
    inwardDate: { type: Date, required: true },
    remarks: { type: String, required: true },
    rows: [rowSchema],
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
)

// Create the model
const GRN = mongoose.model('GRN', grnSchema)

export default GRN