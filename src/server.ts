import dotenv from "dotenv"
dotenv.config()
import express from "express"
import multer from "multer"
import { extractInvoiceFromImages } from "./llmservice"
import { validateInvoice } from "./validator"
import cors from "cors"

const app = express()
const PORT = 3000

const upload = multer({
    dest: "uploads/"
})

app.use(cors())

app.get("/", (req, res) => {
    res.send("Billing Extractor Backend Running")
})

app.post("/upload", upload.array("files", 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: "No files uploaded" })
        }

        const files = req.files as Express.Multer.File[]

        const filePaths = files.map(file => file.path)

        const extractedInvoice = await extractInvoiceFromImages(filePaths)

        const validationResult = validateInvoice(extractedInvoice)

        res.json({
            invoice: extractedInvoice,
            validation: validationResult
        })

    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Extraction failed" })
    }
})

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`)
})