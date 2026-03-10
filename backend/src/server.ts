import dotenv from "dotenv"
dotenv.config()
import express from "express"
import cors from "cors"
import multer from "multer"
import fs from "fs"

import { extractInvoiceFromImages } from "./llmservice"
import { validateInvoice } from "./validator"
import { isDuplicate, saveInvoice } from "./database"

const app = express()

app.use(cors())
app.use(express.json())

/*
Only allow image files
*/

const upload = multer({
    dest: "uploads/",
    fileFilter: (req, file, cb) => {

        const allowedTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png"
        ]

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true)
        } else {
            cb(new Error("Only JPG, JPEG, and PNG files are allowed"))
        }
    }
})

/*
UPLOAD ROUTE
*/

app.post("/upload", upload.array("files"), async (req, res) => {

    try {

        const files = req.files as Express.Multer.File[]

        if (!files || files.length === 0) {
            return res.status(400).json({ error: "No files uploaded" })
        }

        /*
        Extract file paths
        */

        const imagePaths = files.map(f => f.path)

        /*
        Ensure correct page order
        */

        imagePaths.sort((a, b) =>
            a.localeCompare(b, undefined, { numeric: true })
        )

        /*
        AI Extraction
        */

        const invoice = await extractInvoiceFromImages(imagePaths)

        /*
        Duplicate check
        */

        const duplicate = await isDuplicate(invoice.invoiceNumber, invoice.vendorName)

        /*
        Validation
        */

        const validation = validateInvoice(invoice)
        validation.isDuplicate = duplicate

        /*
        Clean uploaded files
        */

        files.forEach(f => {
            if (fs.existsSync(f.path)) {
                fs.unlinkSync(f.path)
            }
        })

        /*
        Save only successful invoices
        */

        if (!duplicate) {
            await saveInvoice(invoice)
        }

        /*
        Send response (ONLY ONCE)
        */

        res.json({
            invoice,
            validation
        })

    } catch (error) {

        console.error("Server error:", error)

        res.status(500).json({
            error: "Invoice processing failed"
        })
    }
})

/*
START SERVER
*/

const PORT = 3000

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})