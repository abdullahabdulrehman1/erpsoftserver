import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import moment from "moment";
import path, { dirname } from "path";
import pdfTable from "pdfkit-table";
import { pipeline } from "stream";
import { fileURLToPath } from "url";
import { promisify } from "util";
const streamPipeline = promisify(pipeline);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const generatePdfReport = async ({
  user,
  data,
  columns,
  sortBy,
  order,
  reportType,
  fromDate,
  toDate,
  validSortFields,
}) => {
  try {
    // Validate and sort data
    if (sortBy && !validSortFields.includes(sortBy)) {
      throw new Error(`Invalid sort field: ${sortBy}`);
    }

    const sortedData = data.sort((a, b) => {
      if (sortBy === "amount" ) {
        const totalA = a.items ? a.items.reduce((sum, item) => sum + item.amount, 0) : a.amount;
        const totalB = b.items ? b.items.reduce((sum, item) => sum + item.amount, 0) : b.amount;
        return order === "asc" ? totalA - totalB : totalB - totalA;
      } else {
        const valueA = a[sortBy];
        const valueB = b[sortBy];
        return order === "asc"
          ? valueA > valueB
            ? 1
            : -1
          : valueA < valueB
          ? 1
          : -1;
      }
    });

    // Define directories and file names
    const reportsDir = path.join(__dirname, "reports");
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const today = moment().format("YYYY-MM-DD");
    const reportId = `RP-${Date.now()}`;
    const fileName = `${reportType}_report_${today}.pdf`;
    const filePath = path.join(reportsDir, fileName);

    // Prepare PDF document
    const doc = new pdfTable({ margin: 30 });
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // Add title and user details
    doc.fontSize(24).text("Inventory Pro", 110, 57);
    doc.fontSize(20).text(`${reportType} Report`, { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Report-ID: ${reportId}`, 110, 140);
    doc.fontSize(12).text(`Requester: ${user.name}`, 110, 160);
    doc.fontSize(12).text(`Email: ${user.emailAddress}`, 110, 180);
    doc.fontSize(12).text(`Report Date: ${today}`, 110, 200);
    doc.fontSize(12).text(`From: ${fromDate} To: ${toDate}`, 110, 220);
    doc.moveDown();

    // Add Serial Column
    const serialColumn = { property: "serial", label: "S.No", width: 40 };
    columns.unshift(serialColumn);

    // Prepare table headers and rows
    const table = {
      headers: columns,
      rows: [],
    };

    let totals = {
      quantity: 0,
      amount: 0,
    };

    let serialNumber = 1; // Start serial number
    sortedData.forEach((entry) => {
      const items = entry.items || entry.rows || [];
      items.forEach((item) => {
        const row = columns.map((col) => {
          if (col.property === "serial") {
            return serialNumber++; // Increment serial number
          } else if (col.property === "date" || col.property === "irDate") {
            return moment(entry.date || entry.irDate).format("YYYY-MM-DD");
          } else if (col.property === "quantity") {
            totals.quantity += item.quantity;
            return item.quantity;
          } else if (col.property === "amount" || col.property === "totalAmount") {
            const amount = item.amount || item.totalAmount;
            totals.amount += amount;
            return amount;
          } else if (col.property in item) {
            return item[col.property];
          } else {
            return entry[col.property] || "";
          }
        });
        table.rows.push(row);
      });
    });

    // Add totals row
    const totalsRow = columns.map((col) => {
      if (col.property === "serial") {
        return ""; // No total for serial column
      } else if (col.property === "quantity") {
        return totals.quantity;
      } else if (col.property === "amount" || col.property === "totalAmount") {
        return totals.amount;
      } else {
        return ""; // No totals for other columns
      }
    });
    table.rows.push(totalsRow);

    // Generate table in PDF
    doc.table(table, {
      prepareHeader: () => {
        doc.font("Helvetica-Bold").fontSize(10);
      },
      prepareRow: (row, i) => {
        doc.font("Helvetica").fontSize(8);
      },
      columnSpacing: 5,
      padding: 5,
      width: 500,
      x: 50,
      y: 280,
    });

    doc.end();

    // Wait for the file to finish writing
    await new Promise((resolve, reject) => {
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
    });

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: "raw",
      public_id: `reports/${fileName}`,
      overwrite: true,
    });

    // Remove the local file after uploading
    fs.unlinkSync(filePath);

    return {
      url: result.secure_url,
      totals,
    };
  } catch (error) {
    throw new Error(`Error generating PDF: ${error.message}`);
  }
};