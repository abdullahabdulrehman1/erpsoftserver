import IssueReturnGeneral from "../models/issueReturnGeneral.js";
import { User } from "../models/user.js";

// Controller to create a new IssueReturnGeneral
export const createIssueReturnGeneral = async (req, res) => {
  const userId = req.user.id;
  const { irNumber, irDate, drNumber, drDate, remarks, rows } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const existingIssueReturnGeneral = await IssueReturnGeneral.findOne({
      irNumber,
    });
    if (existingIssueReturnGeneral) {
      return res.status(400).json({ message: "IR number already exists" });
    }

    const newIssueReturnGeneral = new IssueReturnGeneral({
      userId,
      irNumber,
      irDate,
      drNumber,
      drDate,
      remarks,
      rows,
    });

    await newIssueReturnGeneral.save();
    res.status(201).json(newIssueReturnGeneral);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Controller to get all IssueReturnGeneral IDs by userId

export const getIssueReturnGeneralIdsByUserId = async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    const userRole = user?.role; // Assuming role is stored in user.role

    let issueReturnGenerals;

    if (userRole === 1 || userRole === 2) {
      // Admin or role 2 can view all Issue Return Generals
      issueReturnGenerals = await IssueReturnGeneral.find({});
    } else if (userRole === 0) {
      // Normal user can view only their own Issue Return Generals
      issueReturnGenerals = await IssueReturnGeneral.find({ userId });
    } else {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    res.status(200).json(issueReturnGenerals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Controller to update an IssueReturnGeneral by ID
export const updateIssueReturnGeneral = async (req, res) => {
  const updateData = req.body;
  const id = updateData.id;

  try {
    const updatedIssueReturnGeneral =
      await IssueReturnGeneral.findByIdAndUpdate(
        id,
        { ...updateData },
        { new: true }
      );

    if (!updatedIssueReturnGeneral) {
      return res.status(404).json({ message: "IssueReturnGeneral not found" });
    }

    res.status(200).json(updatedIssueReturnGeneral);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Controller to delete an IssueReturnGeneral by ID
export const deleteIssueReturnGeneral = async (req, res) => {
  const { id } = req.body;

  try {
    const deletedIssueReturnGeneral =
      await IssueReturnGeneral.findByIdAndDelete(id);
    if (!deletedIssueReturnGeneral) {
      return res.status(404).json({ message: "IssueReturnGeneral not found" });
    }
    res
      .status(200)
      .json({ message: "IssueReturnGeneral deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
