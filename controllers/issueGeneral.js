import GRN from '../models/GRNGeneral.js'
import IssueGeneral from '../models/issueGeneral.js'
import { User } from '../models/user.js'
import { generatePdfReport } from '../utils/pdfReportUtil.js'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

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
    rows
  } = req.body

  try {
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Validate GRN number if it exists in the request body
    if (grnNumber) {
      const grn = await GRN.findOne({ grnNumber })
      if (!grn) {
        return res.status(404).json({ message: 'GRN number not found' })
      }
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
      rows
    })

    await newIssueGeneral.save()
    res.status(201).json(newIssueGeneral)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Update an Issue General by ID
export const updateIssueGeneral = async (req, res) => {
  const updateData = req.body
  const id = updateData.id
  const grnNumber = updateData.grnNumber

  try {
    // Validate GRN number
    if (grnNumber) {
      const grn = await GRN.findOne({ grnNumber })
      if (!grn) {
        return res.status(404).json({ message: 'GRN number not found' })
      }
    }

    const updatedIssueGeneral = await IssueGeneral.findByIdAndUpdate(
      id,

      { userId: req.user.id, ...updateData }, // Spread the updateData object to update the fields correctly
      { new: true }
    )

    if (!updatedIssueGeneral) {
      return res.status(404).json({ message: 'Issue General not found' })
    }

    res.status(200).json(updatedIssueGeneral)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
// Delete an Issue General by ID
export const deleteIssueGeneral = async (req, res) => {
  const { id } = req.body

  try {
    const deletedIssueGeneral = await IssueGeneral.findByIdAndDelete(id)
    if (!deletedIssueGeneral) {
      return res.status(404).json({ message: 'Issue General not found' })
    }
    res.status(200).json({ message: 'Issue General deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getIssueGeneralsByGrnNumber = async (req, res) => {
  const userId = req.user.id;
  // const { grnNumber } = req.params; // Assuming grnNumber is passed as a URL parameter

  try {
    const user = await User.findById(userId);
    const userRole = user?.role; // Assuming role is stored in user.role

    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let issueGenerals;
    let totalRecords;

    if (userRole === 1 || userRole === 2) {
      totalRecords = await IssueGeneral.countDocuments();
      issueGenerals = await IssueGeneral.find()
        .populate('userId', 'name emailAddress')
        .skip(skip)
        .limit(limit);
    } else if (userRole === 0) {
      totalRecords = await IssueGeneral.countDocuments({ userId });
      issueGenerals = await IssueGeneral.find({ userId })
        .populate('userId', 'name emailAddress')
        .skip(skip)
        .limit(limit);
    } else {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const totalPages = totalRecords > 0 ? Math.ceil(totalRecords / limit) : 1;

    res.status(200).json({
      data: issueGenerals,
      totalRecords,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const generateIssueGeneralReport = async (req, res) => {
  try {
    const { fromDate, toDate, sortBy, order, columns } = req.query

    // Validate and parse inputs
    if (!fromDate || !toDate) {
      return res.status(400).json({ message: 'Invalid date range' })
    }

    const from = new Date(fromDate)
    const to = new Date(toDate)

    // Fetch the user (assuming user is authenticated and userId is in req.user)
    const user = await User.findById(req.user.id)

    // Fetch issue general records
    const data = await IssueGeneral.find({
      userId: user.role === 0 ? user._id : undefined,
      issueDate: { $gte: from, $lte: to }
    }).populate('userId', 'name emailAddress')

    if (!data || data.length === 0) {
      return res.status(404).json({
        message: 'No issue general records found for the given range.'
      })
    }

    // Define columns for the report
    const columnsArray = columns
      ? columns
          .split(',')
          .map(col => ({ property: col, label: col, width: 60 }))
      : [
          { property: 'grnNumber', label: 'GRN Number', width: 60 },
          { property: 'issueDate', label: 'Issue Date', width: 60 },
          { property: 'store', label: 'Store', width: 80 },
          { property: 'requisitionType', label: 'Requisition Type', width: 80 },
          { property: 'issueToUnit', label: 'Issue To Unit', width: 80 },
          { property: 'demandNo', label: 'Demand No', width: 60 },
          { property: 'vehicleType', label: 'Vehicle Type', width: 60 },
          {
            property: 'issueToDepartment',
            label: 'Issue To Department',
            width: 80
          },
          { property: 'vehicleNo', label: 'Vehicle No', width: 60 },
          { property: 'driver', label: 'Driver', width: 60 },
          { property: 'remarks', label: 'Remarks', width: 80 }
        ]

    const validSortFields = [
      'issueDate',
      'grnNumber',
      'grnQty',
      'store',
      'requisitionType',
      'issueToUnit',
      'demandNo',
      'vehicleType',
      'issueToDepartment',
      'vehicleNo',
      'driver',
      'remarks'
    ]

    // Prepare data for the PDF report
    const reportData = data.map(issue => ({
      grnNumber: issue.grnNumber,
      issueDate: issue.issueDate.toISOString().split('T')[0],
      store: issue.store,
      requisitionType: issue.requisitionType,
      issueToUnit: issue.issueToUnit,
      demandNo: issue.demandNo,
      vehicleType: issue.vehicleType,
      issueToDepartment: issue.issueToDepartment,
      vehicleNo: issue.vehicleNo,
      driver: issue.driver,
      remarks: issue.remarks,
      items: issue.rows
    }))

    // Generate the PDF report
    const report = await generatePdfReport({
      user,
      data: reportData,
      columns: columnsArray,
      sortBy,
      order,
      reportType: 'Issue General',
      fromDate,
      toDate,
      validSortFields
    })

    res.status(200).json({
      message: 'Issue General PDF report generated successfully',
      url: report.url,
      totals: report.totals
    })
  } catch (error) {
    console.error('Error:', error.message)
    res.status(500).json({ message: error.message })
  }
}
