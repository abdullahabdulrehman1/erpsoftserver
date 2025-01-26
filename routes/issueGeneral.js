import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import {
  createIssueGeneral,
  deleteIssueGeneral,
  getIssueGeneralsByGrnNumber,
  updateIssueGeneral,
} from "../controllers/issueGeneral.js";

const app = express();
app.use(isAuthenticated);
app.post("/create-issue-general", createIssueGeneral);
app.get("/get-issue-general", getIssueGeneralsByGrnNumber);
app.put("/update-issue-general", updateIssueGeneral);
app.delete("/delete-issue-general", deleteIssueGeneral);
export default app;
