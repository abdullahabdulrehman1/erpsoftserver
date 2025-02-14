import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import {
  createReturnGRN,
  deleteGRNReturnById,
  editGRNReturnById,
  generateGRNReturnReport,
  getGRNReturnsByUserId,
  searchGRNReturnGeneral
} from "../controllers/GRNReturnGeneral.js";
const app = express();
app.use(isAuthenticated);
app.post("/create-return-grn", createReturnGRN);
app.get("/get-grn-returns", getGRNReturnsByUserId);
app.delete("/delete-grn-return-general", deleteGRNReturnById);
app.put("/edit-grn-return-general", editGRNReturnById);

app.get("/generatePdfReport", generateGRNReturnReport);
app.get("/searchGRNReturnGeneral", searchGRNReturnGeneral); // Add this line for search route

export default app;
