import mongoose, { Schema, model } from "mongoose";
import bcrypt from "bcrypt";
const schema = new Schema(
  {
    emailAddress: {
      type: String,
      required: true,
    },
    contactNumber: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    role: {
      type: Number,
      required: false,
    },
    address: {
      type: String,
    },
    password: {
      type: String,
      select: false,
      required: true,
    },
    status: {
      type: String,
      default: "pending", // Default status is pending
    },

    avatar: {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
  },
  { timestamps: true }
);
schema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  return next();
});
export const User = mongoose.models.User || model("User", schema);
