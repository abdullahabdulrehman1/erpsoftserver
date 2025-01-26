import jwt from "jsonwebtoken";
import { ErrorHandler } from "../utils/utility.js";
import { User } from "../models/user.js";

export const isAuthenticated = async (req, res, next) => {
  let token =  req.headers['authorization'];

  if (token && token.startsWith('Bearer ')) {
    token = token.split(' ')[1];
  }

  if (!token) {
    return res.status(401).send("Access Denied. No token provided.");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    console.log(req.user);
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ success: false, message: "Token expired. User not found." });
    }
    return next(new ErrorHandler("Invalid token, please login again", 401));
  }
};
export const checkAdmin = async (req, res, next) => {
  try {
    const userId = req?.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "User ID not found in request" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const userRole = user?.role;
    console.log("User ID:", userId);
    console.log("User Role:", userRole);

    if (userRole !== 1) {
      return res
        .status(403)
        .json({ success: false, message: "Access denied. Admins only." });
    }

    next();
  } catch (error) {
    console.error("Error in checkAdmin middleware:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
