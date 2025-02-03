import GRN from '../models/GRNGeneral.js'
import GRNReturnGeneral from '../models/GRNReturnGeneral.js'
import { User } from '../models/user.js'
import { generatePdfReport } from '../utils/pdfReportUtil.js'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

export const createReturnGRN = async (req, res) => {
  const { grnrNumber, grnrDate, grnNumber, grnDate, remarks, rows } = req.body
  const userId = req.user.id
  console.log(grnNumber)
  try {
    // Validate if the GRN exists
    const grn = await GRN.findOne({ grnNumber })
    if (!grn) {
      return res.status(404).json({ message: 'GRN not found' })
    }

    // Check if a GRNReturnGeneral with the same grnrNumber already exists
    const existingGRNReturn = await GRNReturnGeneral.findOne({ grnrNumber })
    if (existingGRNReturn) {
      return res
        .status(400)
        .json({ message: 'GRN Return with this number already exists' })
    }

    // Create a new GRNReturnGeneral document
    const newGRNReturnGeneral = new GRNReturnGeneral({
      userId,
      grnrNumber,
      grnrDate,
      grnNumber,
      grnDate,
      remarks,
      rows
    })

    // Save the document to the database
    const savedGRNReturnGeneral = await newGRNReturnGeneral.save()

    // Send a success response
    res.status(201).json(savedGRNReturnGeneral)
  } catch (error) {
    console.error('Error creating GRN return:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
export const getGRNReturnsByUserId = async (req, res) => {
  const userId = req.user.id

  try {
    const user = await User.findById(userId)
    const userRole = user?.role // Assuming role is stored in user.role

    let grnReturns

    if (userRole === 1 || userRole === 2) {
      grnReturns = await GRNReturnGeneral.find({})
    } else if (userRole === 0) {
      // grnReturns = await GRNReturnGeneral.find({ userId })
      grnReturns = await GRNReturnGeneral.find()
    } else {
      return res.status(403).json({ message: 'Unauthorized access' })
    }

    if (!grnReturns || grnReturns.length === 0) {
      return res.status(404).json({ message: 'GRN returns not found' })
    }

    res.status(200).json(grnReturns)
  } catch (error) {
    console.error('Error fetching GRN returns:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const deleteGRNReturnById = async (req, res) => {
  const { id } = req.body
  const userId = req.user.id

  try {
    const user = await User.findById(userId)
    const userRole = user?.role // Assuming role is stored in user.role

    let grnReturn

    if (userRole === 1) {
      // Admin can delete any GRN return
      grnReturn = await GRNReturnGeneral.findOne({ _id: id })
    } else if (userRole === 0) {
      // Normal user can delete only their own GRN return
      grnReturn = await GRNReturnGeneral.findOne({ _id: id, userId })
    } else {
      // Users with role 2 cannot delete GRN returns
      return res.status(403).json({ message: 'Unauthorized access' })
    }

    if (!grnReturn) {
      return res
        .status(404)
        .json({ message: 'GRN return not found or unauthorized' })
    }

    // Delete the GRN return
    await GRNReturnGeneral.findByIdAndDelete(id)

    res.status(200).json({ message: 'GRN return deleted successfully' })
  } catch (error) {
    console.error('Error deleting GRN return:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const editGRNReturnById = async (req, res) => {
  const updateData = req.body

  try {
    const grn = await GRN.findOne({ grnNumber: updateData.grnNumber })
    if (!grn) {
      return res.status(404).json({ message: 'GRN not found' })
    }
    const grnReturn = await GRNReturnGeneral.findByIdAndUpdate(
      { _id: updateData.id },
      updateData,
      {
        new: true
      }
    )

    if (!grnReturn) {
      return res.status(404).json({ message: 'GRN return not found' })
    }

    res
      .status(200)
      .json({ message: 'GRN return updated successfully', data: grnReturn })
  } catch (error) {
    console.error('Error updating GRN return:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const generateGRNReturnReport = async (req, res) => {
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

    // Fetch GRN return records
    const data = await GRNReturnGeneral.find({
      userId: user.role === 0 ? user._id : undefined
      // grnrDate: { $gte: from, $lte: to },
    }).populate('userId', 'name emailAddress')

    if (!data || data.length === 0) {
      return res
        .status(404)
        .json({ message: 'No GRN return records found for the given range.' })
    }

    // Define columns for the report
    const columnsArray = columns
      ? columns
          .split(',')
          .map(col => ({ property: col, label: col, width: 60 }))
      : [
          { property: 'grnrNumber', label: 'GRNR Number', width: 60 },
          { property: 'grnrDate', label: 'GRNR Date', width: 60 },
          { property: 'grnNumber', label: 'GRN Number', width: 60 },
          { property: 'grnDate', label: 'GRN Date', width: 60 },
          { property: 'remarks', label: 'Remarks', width: 80 },
          { property: 'name', label: 'Item Name', width: 80 },
          { property: 'returnQty', label: 'Return Quantity', width: 60 }
        ]

    const validSortFields = ['grnrDate', 'grnrNumber', 'grnNumber', 'returnQty']

    // Prepare data for the PDF report
    const reportData = data.map(grnReturn => ({
      grnrNumber: grnReturn.grnrNumber,
      grnrDate: grnReturn.grnrDate,
      grnNumber: grnReturn.grnNumber,
      grnDate: grnReturn.grnDate,
      remarks: grnReturn.remarks,
      items: grnReturn.rows
    }))

    // Generate the PDF report
    const report = await generatePdfReport({
      user,
      data: reportData,
      columns: columnsArray,
      sortBy,
      order,
      reportType: 'GRN Return',
      fromDate,
      toDate,
      validSortFields
    })

    res.status(200).json({
      message: 'GRN Return PDF report generated successfully',
      url: report.url,
      totals: report.totals
    })
  } catch (error) {
    console.error('Error:', error.message)
    res.status(500).json({ message: error.message })
  }
}
