import express from "express"
import dotenv from "dotenv"
import multer from "multer"
import path from "path"
import { validateInvoice } from "./validator"

dotenv.config()

const app = express()
const PORT = 3000

// Middleware
app.use(express.json())

// Configure multer storage
const upload = multer({
    dest: path.join(__dirname, "../uploads"),
})

// Health check route
app.get("/", (req, res) => {
    res.send("Billing Extractor Backend Running")
})

// Upload endpoint
app.post("/upload", upload.array("invoices"), async (req, res) => {
    try {
        const files = req.files as Express.Multer.File[]

        if (!files || files.length === 0) {
            return res.status(400).json({ error: "No files uploaded" })
        }

        console.log("Uploaded files:", files.map(f => f.originalname))

        // TEMPORARY MOCK (we replace this with Gemini next)
        const mockInvoice = {
            invoiceNumber: "INV-2025-8892",
            invoiceDate: "2025-12-09",
            vendorName: "FreshHarvest Wholesale Distributors",
            totalAmount: 12219.33,
            lineItems: [
                {
                    description: "Test Item",
                    quantity: 1,
                    unitPrice: 12219.33,
                    lineTotal: 12219.33,
                },
            ],
        }

        const validation = validateInvoice(mockInvoice)

        res.json({
            invoice: mockInvoice,
            validation,
        })

    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Internal server error" })
    }
})

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`)
})