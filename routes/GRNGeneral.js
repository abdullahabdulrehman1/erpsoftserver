import express from 'express'
import {
  createGRN,
  deleteGRN,
  generateGRNReport,
  getGRNById,
  searchGRN,
  updateGRN
} from '../controllers/GRNGeneral.js'
import { isAuthenticated } from '../middlewares/auth.js'
const app = express()

app.use(isAuthenticated)
app.post('/createGRN', createGRN)
app.get('/get-grn', getGRNById)
app.delete('/delete-grn/:grnId', deleteGRN)
app.put('/update-grn', updateGRN)

app.get('/generatePdfReport', generateGRNReport)
app.get('/searchGRN', searchGRN) // Add this line for search route


export default app
