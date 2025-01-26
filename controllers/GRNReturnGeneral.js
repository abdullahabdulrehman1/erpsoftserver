import GRN from "../models/GRNGeneral.js";
import GRNReturnGeneral from "../models/GRNReturnGeneral.js";
import { User } from "../models/user.js";

export const createReturnGRN = async (req, res) => {
  const { grnrNumber, grnrDate, grnNumber, grnDate, remarks, rows } = req.body;
  const userId = req.user.id;
  console.log(grnNumber);
  try {
    // Validate if the GRN exists
    const grn = await GRN.findOne({ grnNumber });
    if (!grn) {
      return res.status(404).json({ message: "GRN not found" });
    }

    // Check if a GRNReturnGeneral with the same grnrNumber already exists
    const existingGRNReturn = await GRNReturnGeneral.findOne({ grnrNumber });
    if (existingGRNReturn) {
      return res
        .status(400)
        .json({ message: "GRN Return with this number already exists" });
    }

    // Create a new GRNReturnGeneral document
    const newGRNReturnGeneral = new GRNReturnGeneral({
      userId,
      grnrNumber,
      grnrDate,
      grnNumber,
      grnDate,
      remarks,
      rows,
    });

    // Save the document to the database
    const savedGRNReturnGeneral = await newGRNReturnGeneral.save();

    // Send a success response
    res.status(201).json(savedGRNReturnGeneral);
  } catch (error) {
    console.error("Error creating GRN return:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const getGRNReturnsByUserId = async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    const userRole = user?.role; // Assuming role is stored in user.role

    let grnReturns;

    if (userRole === 1 || userRole === 2) {
      grnReturns = await GRNReturnGeneral.find({});
    } else if (userRole === 0) {
      grnReturns = await GRNReturnGeneral.find({ userId });
    } else {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    if (!grnReturns || grnReturns.length === 0) {
      return res.status(404).json({ message: "GRN returns not found" });
    }

    res.status(200).json(grnReturns);
  } catch (error) {
    console.error("Error fetching GRN returns:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteGRNReturnById = async (req, res) => {
  const { id } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    const userRole = user?.role; // Assuming role is stored in user.role

    let grnReturn;

    if (userRole === 1) {
      // Admin can delete any GRN return
      grnReturn = await GRNReturnGeneral.findOne({ _id: id });
    } else if (userRole === 0) {
      // Normal user can delete only their own GRN return
      grnReturn = await GRNReturnGeneral.findOne({ _id: id, userId });
    } else {
      // Users with role 2 cannot delete GRN returns
      return res.status(403).json({ message: "Unauthorized access" });
    }

    if (!grnReturn) {
      return res
        .status(404)
        .json({ message: "GRN return not found or unauthorized" });
    }

    // Delete the GRN return
    await GRNReturnGeneral.findByIdAndDelete(id);

    res.status(200).json({ message: "GRN return deleted successfully" });
  } catch (error) {
    console.error("Error deleting GRN return:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const editGRNReturnById = async (req, res) => {
  const updateData = req.body;

  try {
    const grn = await GRN.findOne({ grnNumber: updateData.grnNumber });
    if (!grn) {
      return res.status(404).json({ message: "GRN not found" });
    }
    const grnReturn = await GRNReturnGeneral.findByIdAndUpdate(
      { _id: updateData.id },
      updateData,
      {
        new: true,
      }
    );

    if (!grnReturn) {
      return res.status(404).json({ message: "GRN return not found" });
    }

    res
      .status(200)
      .json({ message: "GRN return updated successfully", data: grnReturn });
  } catch (error) {
    console.error("Error updating GRN return:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

