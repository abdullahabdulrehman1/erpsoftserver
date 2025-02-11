import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import {
  createReturnGRN,
  deleteGRNReturnById,
  editGRNReturnById,
  generateGRNReturnReport,
  getGRNReturnsByUserId,
} from "../controllers/GRNReturnGeneral.js";
const app = express();
app.use(isAuthenticated);
app.post("/create-return-grn", createReturnGRN);
app.get("/get-grn-returns", getGRNReturnsByUserId);
app.delete("/delete-grn-return-general", deleteGRNReturnById);
app.put("/edit-grn-return-general", editGRNReturnById);

app.get("/generatePdfReport", generateGRNReturnReport);
export default app;
