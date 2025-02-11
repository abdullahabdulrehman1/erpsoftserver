import mongoose from "mongoose";
import jwt from "jsonwebtoken";
export const cookieOption = {
  maxAge: "60",
  httpOnly: true,
  secure: true, // Set to true if using HTTPS
  sameSite: "None",
};
const connectDB = (uri) => {
  mongoose
    .connect(uri, {
      dbName: "inventoryPro",
      connectTimeoutMS: 30000,
    })
    .then((data) => {
      console.log(`Connected to MongoDB: ${data.connection.host}`);
    })
    .catch((err) => {
      throw err;
    });
};
const sendToken = (res, code, user, message) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
  return res.status(code).cookie("inventoryPro", token, cookieOption).json({
    success: true,
    user,
    token,
    message,
  });
};
const uploadFilesToCloudinary = async (files = []) => {
  const uploadPromises = files.map((file) => {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        getBase64(file),
        {
          resourse_type: "auto",
          public_id: uuid(),
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
    });
  });
  try {
    const results = await Promise.all(uploadPromises);
    const formatedResults = results.map((result) => {
      return {
        public_id: result.public_id,
        url: result.secure_url,
      };
    });
    return formatedResults;
  } catch (error) {
    throw new Error("error while uploading file", error);
  }
};
export { connectDB, sendToken, uploadFilesToCloudinary };
