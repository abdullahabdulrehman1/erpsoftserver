import { PurchaseOrder } from '../models/poGeneral.js'
import { User } from '../models/user.js'

import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { generatePdfReport } from '../utils/pdfReportUtil.js'

export const createPurchaseOrder = async (req, res) => {
  const {
    userId,
    poNumber,
    date,
    poDelivery,
    requisitionType,
    supplier,
    store,
    payment,
    purchaser,
    remarks,
    rows
  } = req.body

  try {
    // Check for duplicate PO number
    const existingPO = await PurchaseOrder.findOne({ poNumber })
    if (existingPO) {
      return res.status(400).json({ message: 'PO Number already exists' })
    }

    // Calculate GST and total amounts for each row
    const updatedRows = rows.map(row => {
      const gstPercent = 18

      // Ensure necessary values are provided and valid
      const otherChargesAmount = row.otherChargesAmount || 0
      const discountAmount = row.discountAmount || 0

      // Calculate excludingTaxAmount if not provided
      let excludingTaxAmount = row.excludingTaxAmount
      if (!excludingTaxAmount) {
        excludingTaxAmount = row.rate * row.quantity
      }

      // Ensure excludingTaxAmount is a valid number
      if (isNaN(excludingTaxAmount)) {
        excludingTaxAmount = 0
      }

      // Round off excludingTaxAmount
      excludingTaxAmount = parseFloat(excludingTaxAmount.toFixed(2))

      // Calculate GST amount
      const gstAmount = parseFloat(
        ((excludingTaxAmount * gstPercent) / 100).toFixed(2)
      )

      // Calculate total amount
      const calculatedTotalAmount = parseFloat(
        (
          excludingTaxAmount +
          gstAmount -
          discountAmount +
          otherChargesAmount
        ).toFixed(2)
      )

      // Ensure gstAmount and totalAmount are valid numbers
      return {
        ...row,
        excludingTaxAmount: isNaN(excludingTaxAmount) ? 0 : excludingTaxAmount,
        gstPercent,
        gstAmount: isNaN(gstAmount) ? 0 : gstAmount,
        totalAmount: isNaN(calculatedTotalAmount) ? 0 : calculatedTotalAmount
      }
    })

    const newPurchaseOrder = new PurchaseOrder({
      userId,
      poNumber,
      date,
      poDelivery,
      requisitionType,
      supplier,
      store,
      payment,
      purchaser,
      remarks,
      rows: updatedRows
    })

    const savedPurchaseOrder = await newPurchaseOrder.save()
    res.status(201).json({
      message: 'Purchase Order created successfully',
      savedPurchaseOrder
    })
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message })
  }
}

export const showPurchaseOrders = async (req, res) => {
  try {
    const userId = req.user.id
    const user = await User.findById(userId)
    const userRole = user?.role // Assuming role is stored in user.role
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    let purchaseOrders
    let totalRecords

    if (userRole === 1 || userRole === 2) {
      totalRecords = await PurchaseOrder.countDocuments()
      purchaseOrders = await PurchaseOrder.find()
        .populate('userId', 'name email')
        .skip(skip)
        .limit(limit)
    } else if (userRole === 0) {
      totalRecords = await PurchaseOrder.countDocuments({ userId })
      purchaseOrders = await PurchaseOrder.find({ userId })
        .populate('userId', 'name email')
        .skip(skip)
        .limit(limit)
    } else {
      return res.status(403).json({ message: 'Unauthorized access' })
    }
    const totalPages = totalRecords > 0 ? Math.ceil(totalRecords / limit) : 1

    res.status(200).json({
      data: purchaseOrders,
      totalRecords,
      currentPage: page,
      totalPages
    })
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message })
  }
}

export const deletePurchaseOrder = async (req, res) => {
  try {
    const { purchaseOrderId } = req.body

    if (!purchaseOrderId) {
      return res.status(400).json({ message: 'Purchase Order ID is required' })
    }

    await PurchaseOrder.findByIdAndDelete(purchaseOrderId)

    res.json({ message: 'Purchase Order deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message })
  }
}
export const editPurchaseOrder = async (req, res) => {
  const { purchaseOrderId, updateData } = req.body

  if (!purchaseOrderId) {
    return res.status(400).json({ message: 'Purchase Order ID is required' })
  }

  if (!updateData) {
    return res.status(400).json({ message: 'Update data is required' })
  }

  const {
    userId,
    poNumber,
    date,
    poDelivery,
    requisitionType,
    supplier,
    store,
    payment,
    purchaser,
    remarks,
    rows
  } = updateData

  try {
    // Find the purchase order by ID
    const existingPO = await PurchaseOrder.findById(purchaseOrderId)
    if (!existingPO) {
      return res.status(404).json({ message: 'Purchase Order not found' })
    }

    // Validate userId
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Calculate GST and total amounts for each row
    const updatedRows = rows.map(row => {
      const gstPercent = 18

      // Ensure necessary values are provided and valid
      const otherChargesAmount = row.otherChargesAmount || 0
      const discountAmount = row.discountAmount || 0

      // Calculate excludingTaxAmount if not provided
      let excludingTaxAmount = row.rate * row.quantity

      // Ensure excludingTaxAmount is a valid number
      if (isNaN(excludingTaxAmount)) {
        excludingTaxAmount = 0
      }

      // Round off excludingTaxAmount
      excludingTaxAmount = parseFloat(excludingTaxAmount.toFixed(2))

      // Calculate GST amount
      const gstAmount = parseFloat(
        ((excludingTaxAmount * gstPercent) / 100).toFixed(2)
      )

      // Calculate total amount
      const calculatedTotalAmount = parseFloat(
        (
          excludingTaxAmount +
          gstAmount -
          discountAmount +
          otherChargesAmount
        ).toFixed(2)
      )

      // Ensure gstAmount and totalAmount are valid numbers
      return {
        ...row,
        excludingTaxAmount: isNaN(excludingTaxAmount) ? 0 : excludingTaxAmount,
        gstPercent,
        gstAmount: isNaN(gstAmount) ? 0 : gstAmount,
        totalAmount: isNaN(calculatedTotalAmount) ? 0 : calculatedTotalAmount
      }
    })

    // Update the purchase order fields
    existingPO.userId = userId
    existingPO.poNumber = poNumber
    existingPO.date = date
    existingPO.poDelivery = poDelivery
    existingPO.requisitionType = requisitionType
    existingPO.supplier = supplier
    existingPO.store = store
    existingPO.payment = payment
    existingPO.purchaser = purchaser
    existingPO.remarks = remarks
    existingPO.rows = updatedRows

    // Save the updated purchase order
    const updatedPurchaseOrder = await existingPO.save()
    res.status(200).json({
      updatedPurchaseOrder,
      message: 'Purchase Order updated successfully'
    })
  } catch (error) {
    console.error('Error updating Purchase Order:', error)
    res.status(500).json({ message: 'Server Error', error: error.message })
  }
}
// Update the import path as per your project structure
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
export const generatePurchaseOrderReport = async (req, res) => {
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

    // Validate sorting parameters
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
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'date'
    const sortOrder = order === 'desc' ? -1 : 1

    // Fetch purchase orders with sorting
    const query = {
      date: { $gte: from, $lte: to }
    }

    if (user.role === 0) {
      query.userId = user._id
    } else if (user.role === 1) {
      delete query.userId // Fetch all records if user role is 1
    }

    const data = await PurchaseOrder.find(query)
      .populate('userId', 'name emailAddress')
      .sort({ [sortField]: sortOrder })

    if (!data || data.length === 0) {
      return res
        .status(404)
        .json({ message: 'No purchase orders found for the given range.' })
    }

    // Define columns for the report
    const columnsArray = columns
      ? columns
          .split(',')
          .map(col => ({ property: col, label: col, width: 60 }))
      : [
          { property: 'poNumber', label: 'PO Number', width: 60 },
          { property: 'date', label: 'Date', width: 60 },
          { property: 'supplier', label: 'Supplier', width: 80 },
          { property: 'store', label: 'Store', width: 80 },
          { property: 'requisitionType', label: 'Requisition Type', width: 80 },
          { property: 'name', label: 'Item Name', width: 80 },
          { property: 'quantity', label: 'Quantity', width: 60 },
          { property: 'rate', label: 'Rate', width: 60 },
          { property: 'amount', label: 'Total Amount', width: 80 }
        ]

    // Prepare data for the PDF report
    const reportData = data.map(po => ({
      poNumber: po.poNumber,
      date: po.date.toISOString().split('T')[0],
      supplier: po.supplier,
      store: po.store,
      purchaser: po.purchaser,
      requisitionType: po.requisitionType,
      items: po.rows
    }))

    // Generate the PDF report
    const report = await generatePdfReport({
      user,
      data: reportData,
      columns: columnsArray,
      sortBy,
      order,
      reportType: 'Purchase Order',
      fromDate,
      toDate,
      validSortFields
    })

    // Generate URL for the report
    res.status(200).json({
      message: 'Purchase Order PDF report generated successfully',
      url: report.url,
      totals: report.totals
    })
  } catch (error) {
    console.error('Error:', error.message)
    res.status(500).json({ message: error.message })
  }
}
export const searchPurchaseOrder = async (req, res) => {
  const { poNumber, page = 1, limit = 10 } = req.query

  if (!poNumber) {
    return res.status(400).json({ message: 'PO Number is required' })
  }

  try {
    // Use a regular expression to perform a case-insensitive search
    const regex = new RegExp(poNumber, 'i')

    // Calculate the number of documents to skip
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10)

    // Find purchase orders with pagination
    const purchaseOrders = await PurchaseOrder.find({ poNumber: { $regex: regex } })
      .populate('userId', 'name email')
      .skip(skip)
      .limit(parseInt(limit, 10))

    // Get the total count of matching documents
    const totalCount = await PurchaseOrder.countDocuments({ poNumber: { $regex: regex } })

    if (purchaseOrders.length === 0) {
      return res.status(404).json({ message: 'No purchase orders found with the provided PO Number' })
    }

    res.status(200).json({
      data: purchaseOrders,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: parseInt(page, 10)
    })
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message })
  }
}