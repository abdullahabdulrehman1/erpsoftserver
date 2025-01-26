import GRN from "../models/GRNGeneral.js";
import IssueGeneral from "../models/issueGeneral.js";
import { User } from "../models/user.js";

// Create a new Issue General
export const createIssueGeneral = async (req, res) => {
  const {
    userId,
    grnNumber,
    issueDate,
    store,
    requisitionType,
    issueToUnit,
    demandNo,
    vehicleType,
    issueToDepartment,
    vehicleNo,
    driver,
    remarks,
    rows,
  } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Validate GRN number
    const grn = await GRN.findOne({ grnNumber });
    if (!grn) {
      return res.status(404).json({ message: "GRN number not found" });
    }

    const newIssueGeneral = new IssueGeneral({
      userId,
      grnNumber,
      issueDate,
      store,
      requisitionType,
      issueToUnit,
      demandNo,
      vehicleType,
      issueToDepartment,
      vehicleNo,
      driver,
      remarks,
      rows,
    });

    await newIssueGeneral.save();
    res.status(201).json(newIssueGeneral);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update an Issue General by ID
export const updateIssueGeneral = async (req, res) => {
  const updateData = req.body;
  const id = updateData.id;
  const grNumber = updateData.grnNumber;

  try {
    // Validate GRN number
    const grn = await GRN.findOne({ grnNumber: grNumber });
    if (!grn) {
      return res.status(404).json({ message: "GRN number not found" });
    }

    const updatedIssueGeneral = await IssueGeneral.findByIdAndUpdate(
      id,
      { ...updateData }, // Spread the updateData object to update the fields correctly
      { new: true }
    );

    if (!updatedIssueGeneral) {
      return res.status(404).json({ message: "Issue General not found" });
    }

    res.status(200).json(updatedIssueGeneral);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Delete an Issue General by ID
export const deleteIssueGeneral = async (req, res) => {
  const { id } = req.body;

  try {
    const deletedIssueGeneral = await IssueGeneral.findByIdAndDelete(id);
    if (!deletedIssueGeneral) {
      return res.status(404).json({ message: "Issue General not found" });
    }
    res.status(200).json({ message: "Issue General deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



export const getIssueGeneralsByGrnNumber = async (req, res) => {
  const userId = req.user.id;
  // const { grnNumber } = req.params; // Assuming grnNumber is passed as a URL parameter

  try {
    const user = await User.findById(userId);
    const userRole = user?.role; // Assuming role is stored in user.role

    let issueGenerals;

    if (userRole === 1 || userRole === 2) {
      // Admin can view all Issue Generals
      issueGenerals = await IssueGeneral.find({  }).populate(
        "userId",
        "name emailAddress"
      );
    } else if (userRole === 0) {
      // Normal user can view only their own Issue Generals
      issueGenerals = await IssueGeneral.find({ userId }).populate(
        "userId",
        "name emailAddress"
      );
    } else {
      return res.status(403).json({ message: "Unauthorized access" });
    }

 
    res.status(200).json(issueGenerals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
