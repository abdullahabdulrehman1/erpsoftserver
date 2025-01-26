  import mongoose from "mongoose";

  const requisitionItemSchema = new mongoose.Schema({
    level3ItemCategory: {
      type: String,
      required: true,
    },
    itemName: {
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
    amount: {
      type: Number,
      required: true,
    },
    remarks: {
      type: String,
      maxlength: 150,
    },
  });

  const requisitionSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    drNumber: {
      type: String,
      required: true,
      maxlength: 10,
    },
    date: {
      type: Date,
      required: true,
    },
    department: {
      type: String,
      required: true,
      maxlength: 150,
    },
    headerRemarks: {
      type: String,
      maxlength: 150,
    },
    requisitionType: {
      type: String,
      required: true,
      maxlength: 150,
    },
    items: [requisitionItemSchema],
  });

  export const Requisition =
    mongoose.models.Requisition ||
    mongoose.model("Requisition", requisitionSchema);
