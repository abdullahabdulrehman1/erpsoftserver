import IssueReturnGeneral from '../models/issueReturnGeneral.js'
import { User } from '../models/user.js'
import { generatePdfReport } from '../utils/pdfReportUtil.js'
import mongoose from 'mongoose'
// Controller to create a new IssueReturnGeneral
export const createIssueReturnGeneral = async (req, res) => {
  const userId = req.user.id
  const { irNumber, irDate, drNumber, drDate, remarks, rows } = req.body

  try {
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const existingIssueReturnGeneral = await IssueReturnGeneral.findOne({
      irNumber
    })
    if (existingIssueReturnGeneral) {
      return res.status(400).json({ message: 'IR number already exists' })
    }

    const newIssueReturnGeneral = new IssueReturnGeneral({
      userId,
      irNumber,
      irDate,
      drNumber,
      drDate,
      remarks,
      rows
    })

    await newIssueReturnGeneral.save()
    res.status(201).json(newIssueReturnGeneral)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Controller to get all IssueReturnGeneral IDs by userId


export const getIssueReturnGeneralIdsByUserId = async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 10 } = req.query; // Default to page 1 and limit 10 if not provided

  try {
    const user = await User.findById(userId);
    const userRole = user?.role; // Assuming role is stored in user.role

    let issueReturnGenerals;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const options = {
      skip,
      limit: parseInt(limit, 10),
      sort: { createdAt: -1 } // Sort by creation date, newest first
    };

    if (userRole === 1 || userRole === 2) {
      // Admin or role 2 can view all Issue Return Generals
      issueReturnGenerals = await IssueReturnGeneral.find({}, null, options);
    } else if (userRole === 0) {
      // Normal user can view only their own Issue Return Generals
      issueReturnGenerals = await IssueReturnGeneral.find({  }, null, options);
    } else {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    // Get the total count for pagination metadata
    const totalCount = await IssueReturnGeneral.countDocuments(userRole === 1 || userRole === 2 ? {} : { userId });

    res.status(200).json({
      data: issueReturnGenerals,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: parseInt(page, 10)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Controller to update an IssueReturnGeneral by ID
export const updateIssueReturnGeneral = async (req, res) => {
  const updateData = req.body
  const id = updateData.id

  try {
    const updatedIssueReturnGeneral =
      await IssueReturnGeneral.findByIdAndUpdate(
        id,
        { ...updateData },
        { new: true }
      )

    if (!updatedIssueReturnGeneral) {
      return res.status(404).json({ message: 'IssueReturnGeneral not found' })
    }

    res.status(200).json(updatedIssueReturnGeneral)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Controller to delete an IssueReturnGeneral by ID
export const deleteIssueReturnGeneral = async (req, res) => {
  const { id } = req.body

  try {
    const deletedIssueReturnGeneral =
      await IssueReturnGeneral.findByIdAndDelete(id)
    if (!deletedIssueReturnGeneral) {
      return res.status(404).json({ message: 'IssueReturnGeneral not found' })
    }
    res.status(200).json({ message: 'IssueReturnGeneral deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Controller to generate IssueReturnGeneral PDF report
export const generateIssueReturnGeneralReport = async (req, res) => {
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

    // Fetch issue return general records
    const data = await IssueReturnGeneral.find({
      userId: user.role === 0 ? user._id : undefined,
      irDate: { $gte: from, $lte: to }
    }).populate('userId', 'name emailAddress')

    if (!data || data.length === 0) {
      return res
        .status(404)
        .json({ message: 'No records found for the given range.' })
    }

    // Define columns for the report
    const columnsArray = columns
      ? columns
          .split(',')
          .map(col => ({ property: col, label: col, width: 60 }))
      : [
          { property: 'irNumber', label: 'IR Number', width: 60 },
          { property: 'irDate', label: 'IR Date', width: 60 },
          { property: 'drNumber', label: 'DR Number', width: 60 },
          { property: 'drDate', label: 'DR Date', width: 60 },
          { property: 'remarks', label: 'Remarks', width: 80 },
          { property: 'itemName', label: 'Item Name', width: 80 },
          { property: 'issueQty', label: 'Quantity', width: 60 },
          { property: 'returnQty', label: 'Return Quantity', width: 60 }
        ]
    const validSortFields = [
      'irDate',
      'drDate',
      'irNumber',
      'drNumber',
      'issueQty',
      'returnQty'
    ]
    // Prepare data for the PDF report
    const reportData = data.map(ir => ({
      irNumber: ir.irNumber,
      irDate: ir.irDate.toISOString().split('T')[0],
      drNumber: ir.drNumber,
      drDate: ir.drDate.toISOString().split('T')[0],
      remarks: ir.remarks,
      items: ir.rows
    }))

    // Generate the PDF report
    const report = await generatePdfReport({
      user,
      data: reportData,
      columns: columnsArray,
      sortBy,
      order,
      reportType: 'Issue Return General',
      fromDate,
      toDate,
      validSortFields
    })

    res.status(200).json({
      message: 'Issue Return General PDF report generated successfully',
      url: report.url,
      totals: report.totals
    })
  } catch (error) {
    console.error('Error:', error.message)
    res.status(500).json({ message: error.message })
  }
}


export const searchIssueReturnGeneral = async (req, res) => {
  const { irNumber, page = 1, limit = 10 } = req.query

  if (!irNumber) {
    return res.status(400).json({ message: 'IR Number is required' })
  }

  try {
    // Create a search query object
    const searchQuery = {
      irNumber: { $regex: new RegExp(irNumber, 'i') }
    }

    // Calculate the number of documents to skip
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10)

    // Find Issue Return Generals with pagination
    const issueReturns = await IssueReturnGeneral.find(searchQuery)
      .populate('userId', 'name email')
      .skip(skip)
      .limit(parseInt(limit, 10))

    // Get the total count of matching documents
    const totalCount = await IssueReturnGeneral.countDocuments(searchQuery)

    if (issueReturns.length === 0) {
      return res.status(404).json({ message: 'No Issue Return Generals found with the provided IR Number' })
    }

    res.status(200).json({
      data: issueReturns,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: parseInt(page, 10)
    })
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message })
  }
}