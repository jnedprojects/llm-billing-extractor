import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function extractInvoiceFromImages(imagePaths: string[]) {
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.0
        }
    })

    const imageParts = imagePaths.map(path => ({
        inlineData: {
            mimeType: path.split('.').pop()?.toLowerCase() === 'png' ? 'image/png' : 'image/jpeg',
            data: fs.readFileSync(path).toString("base64")
        }
    }))

    const prompt = `
Act as a professional forensic accountant. Extract data from this multi-page invoice into JSON.

### MULTI-PAGE CROSS-REFERENCE RULE:
1. Locate the Invoice Number on EVERY page. 
   - Page 1: Check top right.
   - Subsequent Pages: Check the TOP LEFT.
2. If the numbers appear different due to legibility, the version that matches the most pages or follows the "INV-202X-XXXX" pattern is correct.

### DIGIT DISAMBIGUATION (3 vs 5, 8 vs 6):
This is CRITICAL for Dates, Invoice Numbers, and Amounts:
- **3 vs 5**: A '5' has a perfectly flat horizontal top bar. A '3' has a rounded/curved top.
- **8 vs 6**: An '8' consists of TWO fully closed loops. A '6' has only ONE closed loop at the bottom and an open curve at the top.
- **Year Check**: For years (e.g., 2025, 2026), ensure an '8' isn't being mistaken for a '6' or vice versa by checking the clarity of the top loop.
- **Math-Check**: For all currency amounts, calculate (Quantity * Unit Price). If the result matches the Line Total using an '8' instead of a '6' (or 5 instead of 3), trust the math and use the digit that makes the equation true.

JSON STRUCTURE:
{
  "invoiceNumber": "string",
  "invoiceDate": "string",
  "vendorName": "string",
  "pages": [
    {
      "pageNumber": number,
      "pageSubtotal": number,
      "lineItems": [
        { "description": "string", "quantity": number, "unitPrice": number, "lineTotal": number }
      ]
    }
  ],
  subtotalPage1: number
  subtotalpage2: number
  subtotalPage3: number
  "grossTotal": number,
  "discountPercent": number,
  "discountAmount": number,
  "deliveryFee": number,
  "taxableAmount": number,
  "stateSalesTax": number,
  "netTotalDue": number
}

### EXTRACTION RULES:
1. PAGE SUBTOTALS: On the final page summary, match "SUBTOTAL (Page X)" to the correct page object.
2. DISCOUNTS: If "Discount 5%" is seen, ensure the discountAmount is exactly 5% of the grossTotal. If your OCR sees 3%, but the math shows 5%, correct it to 5%.
3. RAW DATA: Return numbers as floats. Remove "$" and ",".
4. ABSOLUTELY NO prose or markdown. Return only the JSON object.
`

    try {
        const result = await model.generateContent([prompt, ...imageParts])
        const responseText = result.response.text()
        return JSON.parse(responseText)
    } catch (error) {
        console.error("AI Extraction Error:", error)
        throw error
    }
}