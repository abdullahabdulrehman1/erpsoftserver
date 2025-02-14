import express from "express";
import { isAuthenticated } from "./../middlewares/auth.js";
import { createIssueReturnGeneral, deleteIssueReturnGeneral,searchIssueReturnGeneral, generateIssueReturnGeneralReport, getIssueReturnGeneralIdsByUserId, updateIssueReturnGeneral } from "../controllers/issueReturnGeneral.js";
const app = express();
app.use(isAuthenticated);
app.post("/create-issue-return-general",createIssueReturnGeneral);
app.get("/get-issue-return-general",getIssueReturnGeneralIdsByUserId);
app.delete("/delete-issue-return-general",deleteIssueReturnGeneral);
app.put("/edit-issue-return-general",updateIssueReturnGeneral);

app.get("/generatePdfReport",generateIssueReturnGeneralReport)
app.get('/searchIssueReturnGeneral', searchIssueReturnGeneral) // Add this line for search route

export default app;
