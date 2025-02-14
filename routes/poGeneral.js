import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import {
  createPurchaseOrder,
  deletePurchaseOrder,
  editPurchaseOrder,
  generatePurchaseOrderReport,
  searchPurchaseOrder,
  showPurchaseOrders,
} from "../controllers/poGeneral.js";
import {
  createPurchaseOrderValidator,
  
  validatorHandler,
} from "../libs/validator.js";

const app = express();
app.use(isAuthenticated);
app.post(
  "/createPO",
  createPurchaseOrderValidator(),
  validatorHandler,
  createPurchaseOrder
);
app.get("/showPO", showPurchaseOrders);
app.delete("/deletePO", deletePurchaseOrder);
app.put(
  "/editPurchaseOrder",
  
  
  editPurchaseOrder
);
app.get("/generatePdfReport",generatePurchaseOrderReport)
app.get("/searchPO", searchPurchaseOrder); // Add this line for search route

export default app;
