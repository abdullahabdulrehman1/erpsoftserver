import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectDB } from "./utils/features.js";
import { v2 as cloudinary } from "cloudinary";
import userRoutes from "./routes/user.js";
import cookieParser from "cookie-parser";
import requisitionRoutes from "./routes/requisitionGeneral.js";
import poRoutes from "./routes/poGeneral.js";
import grnRoutes from "./routes/GRNGeneral.js";
import grnReturnRoutes from "./routes/GRNReturnGeneral.js";
import issueGeneralRoutes from "./routes/issueGeneral.js";
import issueReturnGeneralRoutes from "./routes/issueReturnGeneral.js";
dotenv.config();
const app = express();
const MONGO_URI = process.env.MONGO_URI;
app.use(
  cors({
    credentials: true,
    origin: true,
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

connectDB(MONGO_URI);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/requisition", requisitionRoutes);
app.use("/api/v1/poGeneral", poRoutes);
app.use("/api/v1/grnGeneral", grnRoutes);
app.use("/api/v1/grnReturnGeneral", grnReturnRoutes);
app.use("/api/v1/issueGeneral", issueGeneralRoutes);
app.use("/api/v1/issueReturnGeneral", issueReturnGeneralRoutes);

app.listen(5000, () => {
  console.log("Server is running on port 5000");
});
app.get("/", (req, res) => {
  res.send("Hello World");
});
