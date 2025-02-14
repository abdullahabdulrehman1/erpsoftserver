import express from "express";

import { isAuthenticated } from "../middlewares/auth.js";
import {
  createRequisition,
  showRequisition,
  deleteRequisition,
  updateRequisition,
  searchRequisitionByDrNumber,
  generateRequisitionReport,
} from "../controllers/requisitionGeneral.js";
import {
  createRequisitionValidator,
  updateRequisitionValidator,
  validatorHandler,
} from "../libs/validator.js";
const app = express();

app.use(isAuthenticated);

app.post(
  "/createRequisition",
  createRequisitionValidator(),
  validatorHandler,
  createRequisition
);
app.get("/showRequisition", showRequisition);
app.delete("/deleteRequisition", deleteRequisition);
app.put(
  "/updateRequisition",
  updateRequisitionValidator(),
  validatorHandler,
  updateRequisition
);
// app.get("/showRequisition", searchRequisitionByDrNumber);
app.get("/generatePdfReport", generateRequisitionReport);
app.get("/searchRequisitionByDrNumber", searchRequisitionByDrNumber);

export default app;
