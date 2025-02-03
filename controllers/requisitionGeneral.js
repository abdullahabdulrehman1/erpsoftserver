import { validationResult } from 'express-validator'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { Requisition } from '../models/requisitionGeneral.js'
import { User } from '../models/user.js'

import { generatePdfReport } from '../utils/pdfReportUtil.js'

export const createRequisition = async (req, res) => {
  // Validate request
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const {
    userId,
    drNumber,
    date,
    requisitionType,
    department,
    headerRemarks,
    items
  } = req.body

  try {
    // Check if drNumber already exists
    const existingRequisition = await Requisition.findOne({ drNumber })
    if (existingRequisition) {
      return res.status(400).json({ message: 'DR Number already exists' })
    }

    // Create a new requisition instance
    const newRequisition = new Requisition({
      userId,
      drNumber,
      date,
      requisitionType,
      department,
      headerRemarks,
      items
    })

    // Save the requisition to the database
    await newRequisition.save()

    // Send a success response
    res.status(201).json({
      message: 'Requisition created successfully',
      requisition: newRequisition
    })
  } catch (error) {
    // Handle any errors
    res
      .status(500)
      .json({ message: 'Error creating requisition', error: error.message })
  }
}
export const showRequisition = async (req, res) => {
  try {
    const userId = req?.user?.id
    const user = await User.findById(userId)
    const userRole = user?.role
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    let requisitions
    let totalRecords

    if (userRole === 1 || userRole === 2) {
      totalRecords = await Requisition.countDocuments()
      requisitions = await Requisition.find()
        .populate('userId', 'name email')
        .skip(skip)
        .limit(limit)
    } else if (userRole === 0) {
      totalRecords = await Requisition.countDocuments({ userId })
      // requisitions = await Requisition.find({ userId })
      requisitions = await Requisition.find()
        .populate('userId', 'name email')
        .skip(skip)
        .limit(limit)
    } else {
      return res.status(403).json({ message: 'Unauthorized access' })
    }

    res.status(200).json({
      data: requisitions,
      totalRecords,
      currentPage: page,
      totalPages: Math.ceil(totalRecords / limit)
    })
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message })
  }
}

export const deleteRequisition = async (req, res) => {
  try {
    // Retrieve requisitionId from request parameters or query
    const { requisitionId } = req.body

    // Validate requisitionId
    if (!requisitionId) {
      return res.status(400).json({ message: 'Requisition ID is required' })
    }

    // Find the requisition by ID and delete it
    const deletedRequisition = await Requisition.findByIdAndDelete({
      _id: requisitionId
    })

    // Check if the requisition was found and deleted
    if (!deletedRequisition) {
      return res.status(404).json({ message: 'Requisition not found' })
    }

    // Send a success response
    res.json({ message: 'Requisition deleted successfully' })
  } catch (error) {
    // Handle any errors that occur during the delete
    res.status(500).json({ message: 'Server Error', error: error.message })
  }
}

export const updateRequisition = async (req, res) => {
  // Validate request
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { requisitionId, updateData } = req.body

  try {
    // Validate requisition ID
    if (!requisitionId) {
      return res.status(400).json({ message: 'Requisition ID is required' })
    }

    // Validate update data
    if (!updateData) {
      return res.status(400).json({ message: 'Update data is required' })
    }

    // Find the requisition by ID and update it with the new data
    const updatedRequisition = await Requisition.findByIdAndUpdate(
      requisitionId,
      { $set: updateData },
      { new: true, runValidators: true }
    )

    // Check if the requisition was found and updated
    if (!updatedRequisition) {
      return res.status(404).json({ message: 'Requisition not found' })
    }

    // Send the updated requisition as a response
    res.json(updatedRequisition)
  } catch (error) {
    // Handle any errors that occur during the update
    res.status(500).json({ message: 'Server Error', error: error.message })
  }
}
export const searchRequisitionByDrNumber = async (req, res) => {
  const { drNumber } = req.query

  if (!drNumber) {
    return res.status(400).json({ message: 'DR Number is required' })
  }

  try {
    const requisitions = await Requisition.find({ drNumber }).populate(
      'userId',
      'name email'
    )

    if (requisitions.length === 0) {
      return res
        .status(404)
        .json({ message: 'No requisitions found with the provided DR Number' })
    }

    res.status(200).json(requisitions)
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message })
  }
}
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const generateRequisitionReport = async (req, res) => {
  try {
    const { fromDate, toDate, sortBy, order, columns } = req.query

    // Validate and parse inputs
    if (!fromDate || !toDate) {
      return res.status(400).json({ message: 'Invalid date range' })
    }

    const from = new Date(fromDate)
    const to = new Date(toDate)
    const user = await User.findById(req.user.id)

    const data = await Requisition.find({
      userId: user.role === 0 ? user._id : undefined,
      date: { $gte: from, $lte: to }
    }).populate('userId', 'name emailAddress')

    if (!data || data.length === 0) {
      return res
        .status(404)
        .json({ message: 'No data found for the given range.' })
    }

    // Call utility function
    const columnsArray = columns
      ? columns
          .split(',')
          .map(col => ({ property: col, label: col, width: 60 }))
      : [
          { property: 'drNumber', label: 'DR Number', width: 60 },
          { property: 'date', label: 'Date', width: 60 },
          { property: 'department', label: 'Department', width: 80 },
          { property: 'amount', label: 'Amount', width: 60 }
        ]
    const validSortFields = [
      'date',
      'poNumber',
      'supplier',
      'store',
      'requisitionType',
      'quantity',
      'amount',
      'totalAmount'
    ]
    const report = await generatePdfReport({
      user,
      data,
      columns: columnsArray,
      sortBy,
      order,
      reportType: 'Requisition',
      fromDate,
      toDate,
      validSortFields
    })

    res.status(200).json({
      message: 'PDF report generated successfully',
      url: report.url,
      totals: report.totals
    })
  } catch (error) {
    console.error('Error:', error.message)
    res.status(500).json({ message: error.message })
  }
}
