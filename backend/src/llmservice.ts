import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import { jsonrepair } from "jsonrepair"

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
You are a financial document AI specialized in parsing invoices.

The invoice may come from ANY vendor and ANY layout.

Your task is to extract structured invoice data from the provided images.

-----------------------------------------------------

DIGIT DISAMBIGUATION (CRITICAL)

Invoice fonts are often condensed and digits such as 3, 5, 6, 8, and 9 may look similar.

Before finalizing any number you MUST verify the digit using these visual rules.

3 vs 5
- A 5 has a flat horizontal top bar and a sharp corner on the top-left.
- A 3 is fully curved with no flat horizontal top line.

6 vs 8
- An 8 contains TWO fully closed loops (top and bottom).
- A 6 has a closed bottom loop but the top is open like a hook.

8 vs 9
- A 9 has a closed top loop and a downward tail.
- An 8 has two balanced loops with no tail.

Cross-reference rule
Before finalizing numbers:
Compare the digit shape with other clearly printed digits elsewhere on the invoice such as:
- Invoice numbers
- Percentages (5%, 8%, etc)
- Dates (2025, 2023, etc)

Arithmetic validation
Always verify calculations:

Line item rule
quantity × unitPrice = lineTotal

Subtotal rule
sum(lineItems) = subtotal

Final total rule
subtotal - discount + shipping + tax = netTotalDue

If calculations fail and the difference could be explained by confusing digits
(3, 5, 6, 8, or 9), re-examine the digit shape before finalizing.

Never change digits purely to force the math to work unless the visual shape supports it.

-----------------------------------------------------

RETURN JSON WITH THIS EXACT STRUCTURE

{
  "invoiceNumber": string | null,
  "invoiceDate": string | null,
  "vendorName": string | null,

  "lineItems": [
    {
      "description": string,
      "quantity": number | null,
      "unitPrice": number | null,
      "lineTotal": number | null
    }
  ],

  "totals": {
    "subtotal": number | null,
    "tax": number | null,
    "discount": number | null,
    "shipping": number | null,
    "grossTotal": number | null,
    "netTotalDue": number | null
  }
}

-----------------------------------------------------

EXTRACTION GUIDELINES

Vendor name
Use the company name printed in the header.

Invoice number
Look for labels like:
Invoice No
Invoice #
Bill No
Reference No

Invoice date
Extract the main billing date.

Line items
Extract every row in the invoice table.

Common column names include:
Item
Description
Product
Qty
Quantity
Units
Price
Unit price
Rate
Amount
Total

Totals
Map common financial labels:

Subtotal
Total before tax
Net amount

Tax
VAT
GST
Sales tax

Discount
Promo discount
Rebate

Shipping
Delivery
Freight
Handling

Net Total
Grand Total
Total Due
Amount Payable

If multiple pages exist:
Combine line items across pages.

-----------------------------------------------------

OUTPUT RULES

Return ONLY valid JSON
Remove currency symbols
Convert numbers to floats
If a value cannot be found return null
`

    try {
        const result = await model.generateContent([prompt, ...imageParts])
        let responseText = result.response.text()

        // remove markdown code blocks if AI added them
        responseText = responseText
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim()

        try {

            // attempt normal parsing first
            return JSON.parse(responseText)

        } catch {

            console.warn("Invalid JSON detected, attempting repair...")

            const repaired = jsonrepair(responseText)

            return JSON.parse(repaired)

        }
    } catch (error) {
        console.error("AI Extraction Error:", error)
        throw error
    }
}