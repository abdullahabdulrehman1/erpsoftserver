import { User } from "./../models/user.js";
import bcrypt, { compare } from "bcrypt";
import express from "express";
import { ErrorHandler } from "../utils/utility.js";
import { sendToken, uploadFilesToCloudinary } from "../utils/features.js";
import { TryCatch } from "../middlewares/error.js";
import { v2 as cloudinary } from "cloudinary";

//User Controllers
export const newUser = TryCatch(async (req, res, next) => {
  const {
    emailAddress,
    contactNumber,
    address,
    name,
    password,
    confirmPassword,
  } = req.body;
  const file = req.file;

  // Check if all required fields are provided
  if (
    !emailAddress ||
    !contactNumber ||
    !name ||
    !address ||
    !password ||
    !confirmPassword
  ) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });
  }

  // Check if passwords match
  if (password !== confirmPassword) {
    return res
      .status(400)
      .json({ success: false, message: "Passwords do not match" });
  }

  // Check if file is uploaded
  if (!file) {
    return res
      .status(400)
      .json({ success: false, message: "Please upload an image" });
  }

  // Check if user already exists
  const existingUser = await User.findOne({ emailAddress });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: "User with this email address already exists",
    });
  }

  // Upload file to Cloudinary
  const uploadToCloudinary = (fileBuffer) => {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: "image" },
        (error, result) => {
          if (error) reject(new Error("Image upload failed"));
          resolve(result);
        }
      );
      stream.end(fileBuffer);
    });
  };

  let result;
  try {
    result = await uploadToCloudinary(file.buffer);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }

  const avatar = {
    public_id: result.public_id,
    url: result.secure_url,
  };

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create new user
  let user;
  try {
    user = await User.create({
      emailAddress,
      contactNumber,
      address,
      password,
      status: "pending",
      name,
      avatar,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }

  // Send token
  sendToken(res, 201, user, "User created successfully");
});
export const login = TryCatch(async (req, res, next) => {
  const { emailAddress, password } = req.body;

  // Check if email and password are provided
  if (!emailAddress || !password) {
    return res.status(400).json({
      success: false,
      message: "Please provide correct email and password",
    });
  }

  // Check if user exists
  const user = await User.findOne({ emailAddress }).select("+password");
  if (!user) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid Username" });
  }

  // Compare passwords
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid Password" });
  }

  // Send token
  sendToken(res, 200, user, "Login successful");
  console.log("login successful");
});
export const getMyProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }
    res.status(200).json({
      success: true,
      user: user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};

// Admin Controllers
export const assignRole = TryCatch(async (req, res, next) => {
  const { userId, role } = req.body;

  // Log the received userId and role
  console.log("Received userId:", userId);
  console.log("Received role:", role);

  // Check if userId and role are provided
  if (!userId || role === undefined) {
    return res
      .status(400)
      .json({ success: false, message: "User ID and role are required" });
  }

  // Check if role is valid
  if (![0, 1, 2].includes(role)) {
    return res.status(400).json({ success: false, message: "Invalid role" });
  }

  // Find user and update role
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  user.role = role;
  user.status = "approved";
  await user.save();

  res
    .status(200)
    .json({ success: true, message: "Role assigned successfully" });
});

export const getUsers = TryCatch(async (req, res, next) => {
  const users = await User.find({ status: "approved" });
  res.status(200).json({ success: true, users });
});

export const deleteUser = TryCatch(async (req, res, next) => {
  const { userId } = req.body;

  // Log the received userId
  console.log("Received userId:", userId);

  // Check if userId is provided
  if (!userId) {
    return res
      .status(400)
      .json({ success: false, message: "User ID is required" });
  }

  // Find and delete user
  const user = await User.findByIdAndDelete(userId);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  res.status(200).json({ success: true, message: "User deleted successfully" });
});
export const getPendingUsers = TryCatch(async (req, res, next) => {
  try {
    const pendingUsers = await User.find({ status: "pending" });
    res.status(200).json({ success: true, users: pendingUsers });
  } catch (error) {
    console.error("Error fetching pending users:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
