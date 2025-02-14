import GRN from '../models/GRNGeneral.js'
import GRNReturnGeneral from '../models/GRNReturnGeneral.js'
import { User } from '../models/user.js'
import { generatePdfReport } from '../utils/pdfReportUtil.js'
import mongoose from 'mongoose'
import moment from 'moment'

export const createReturnGRN = async (req, res) => {
  const { grnrNumber, grnrDate, grnNumber, grnDate, remarks, rows } = req.body
  const userId = req.user.id

  try {
    // Check if a GRNReturnGeneral with the same grnrNumber already exists
    const existingGRNReturn = await GRNReturnGeneral.findOne({ grnrNumber })
    if (existingGRNReturn) {
      return res
        .status(400)
        .json({ message: 'GRN Return with this number already exists' })
    }

    // Parse and validate date strings using moment
    const parsedGrnrDate = moment(grnrDate, 'DD-MM-YYYY', true)
    const parsedGrnDate = grnDate ? moment(grnDate, 'DD-MM-YYYY', true) : null

    if (!parsedGrnrDate.isValid() || (grnDate && !parsedGrnDate.isValid())) {
      return res.status(400).json({ message: 'Invalid date format' })
    }

    if (grnNumber) {
      const grn = await GRN.findOne({ grnNumber })
      if (!grn) {
        return res.status(404).json({ message: 'GRN not found' })
      }
    }

    // Create a new GRNReturnGeneral document
    const newGRNReturnGeneral = new GRNReturnGeneral({
      userId,
      grnrNumber,
      grnrDate: parsedGrnrDate.toDate(),
      grnNumber,
      grnDate: parsedGrnDate ? parsedGrnDate.toDate() : null,
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
  const { page = 1, limit = 10 } = req.query // Default to page 1 and limit 10 if not provided

  try {
    const user = await User.findById(userId)
    const userRole = user?.role // Assuming role is stored in user.role

    let grnReturns
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10)
    const options = {
      skip,
      limit: parseInt(limit, 10),
      sort: { createdAt: -1 } // Sort by creation date, newest first
    }

    if (userRole === 1 || userRole === 2) {
      // Admin or role 2 can view all GRN Returns
      grnReturns = await GRNReturnGeneral.find({}, null, options)
    } else if (userRole === 0) {
      // Normal user can view only their own GRN Returns
      grnReturns = await GRNReturnGeneral.find({ userId }, null, options)
    } else {
      return res.status(403).json({ message: 'Unauthorized access' })
    }

    // Get the total count for pagination metadata
    const totalCount = await GRNReturnGeneral.countDocuments(
      userRole === 1 || userRole === 2 ? {} : { userId }
    )

    if (!grnReturns || grnReturns.length === 0) {
      return res.status(404).json({ message: 'GRN returns not found' })
    }

    res.status(200).json({
      data: grnReturns,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: parseInt(page, 10)
    })
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
  const { grnrNumber, grnrDate, grnNumber, grnDate, remarks, rows } = req.body
  const userId = req.user.id

  try {
    // Find the GRNReturnGeneral by grnrNumber
    const grnReturn = await GRNReturnGeneral.findOne({ grnrNumber })
    if (!grnReturn) {
      return res.status(404).json({ message: 'GRN Return not found' })
    }

    // Parse and validate date strings using moment
    const parsedGrnrDate = moment(grnrDate, 'DD-MM-YYYY', true)
    const parsedGrnDate = grnDate ? moment(grnDate, 'DD-MM-YYYY', true) : null

    if (!parsedGrnrDate.isValid()) {
      return res.status(400).json({ message: 'Invalid GRNR date format' })
    }

    if (grnDate && !parsedGrnDate.isValid()) {
      return res.status(400).json({ message: 'Invalid GRN date format' })
    }

    if (grnNumber) {
      const grn = await GRN.findOne({ grnNumber })
      if (!grn) {
        return res.status(404).json({ message: 'GRN not found' })
      }
    }

    // Update the GRNReturnGeneral document
    grnReturn.grnrDate = parsedGrnrDate.toDate()
    grnReturn.grnNumber = grnNumber
    grnReturn.grnDate = parsedGrnDate ? parsedGrnDate.toDate() : null
    grnReturn.remarks = remarks
    grnReturn.rows = rows

    // Save the updated document to the database
    const updatedGRNReturnGeneral = await grnReturn.save()

    // Send a success response
    res.status(200).json(updatedGRNReturnGeneral)
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res
        .status(400)
        .json({ message: 'Validation error', details: error.errors })
    }
    if (error.name === 'CastError') {
      return res
        .status(400)
        .json({ message: 'Invalid ID format', details: error.message })
    }
    console.error('Error updating GRN return:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const generateGRNReturnReport = async (req, res) => {
  try {
    const { fromDate, toDate, sortBy, order, columns } = req.query

    // Validate and parse inputs
    if (!fromDate || !toDate) {
      return res.status(400).json({ message: 'Invalid date range' })
    }

    const from = new Date(fromDate)
    const to = new Date(toDate)
    const user = await User.findById(req.user.id)

    const query = {
      grnrDate: { $gte: from, $lte: to }
    }

    if (user.role === 0) {
      query.userId = user._id
    }

    const data = await GRNReturnGeneral.find(query).populate(
      'userId',
      'name emailAddress'
    )

    if (!data || data.length === 0) {
      return res
        .status(404)
        .json({ message: 'No data found for the given range.' })
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
    const reportData = data.map(grn => ({
      grnrNumber: grn.grnrNumber,
      grnrDate: grn.grnrDate.toISOString().split('T')[0],
      grnNumber: grn.grnNumber,
      grnDate: grn.grnDate.toISOString().split('T')[0],
      remarks: grn.remarks,
      items: grn.rows
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
export const searchGRNReturnGeneral = async (req, res) => {
  const { grnrNumber, page = 1, limit = 10 } = req.query

  if (!grnrNumber) {
    return res.status(400).json({ message: 'GRNR Number is required' })
  }

  try {
    // Create a search query object
    const searchQuery = {
      grnrNumber: { $regex: new RegExp(grnrNumber, 'i') }
    }

    // Calculate the number of documents to skip
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10)

    // Find GRN Return Generals with pagination
    const grnReturns = await GRNReturnGeneral.find(searchQuery)
      .populate('userId', 'name email')
      .skip(skip)
      .limit(parseInt(limit, 10))

    // Get the total count of matching documents
    const totalCount = await GRNReturnGeneral.countDocuments(searchQuery)

    if (grnReturns.length === 0) {
      return res.status(404).json({ message: 'No GRN Return Generals found with the provided GRNR Number' })
    }

    res.status(200).json({
      data: grnReturns,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: parseInt(page, 10)
    })
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message })
  }
}