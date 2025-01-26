import express from "express";
import { singleAvatar } from "../middlewares/multer.js";
import {
  loginValidator,
  registerValidator,
  validatorHandler,
} from "../libs/validator.js";
import {
  assignRole,
  deleteUser,
  getMyProfile,
  getPendingUsers,
  getUsers,
  login,
  newUser,
} from "../controllers/user.js";
import { checkAdmin, isAuthenticated } from "../middlewares/auth.js";
const app = express();
app.post("/login", loginValidator(), validatorHandler, login);
app.post(
  "/newUser",
  singleAvatar,
  registerValidator(),
  validatorHandler,
  newUser
);
app.post("/assign-role", isAuthenticated, checkAdmin, assignRole);
app.get("/get-users", isAuthenticated, checkAdmin, getUsers);
app.delete("/delete-users", isAuthenticated, checkAdmin, deleteUser);
app.get("/pending-users", isAuthenticated, checkAdmin, getPendingUsers); // Add this line

app.use(isAuthenticated);
app.post("/my", getMyProfile);
export default app;
