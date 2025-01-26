import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import {
  createGRN,
  deleteGRN,
  getGRNById,
  updateGRN,
} from "../controllers/GRNGeneral.js";
import { editGRNReturnById } from "../controllers/GRNReturnGeneral.js";
import { createGRNValidator, validatorHandler } from "../libs/validator.js";
const app = express();

app.use(isAuthenticated);
app.post("/createGRN",createGRNValidator(),validatorHandler, createGRN);
app.get("/get-grn", getGRNById);
app.delete("/delete-grn", deleteGRN);
app.put("/update-grn", updateGRN);

export default app;
