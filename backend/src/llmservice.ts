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
### DIGIT DISAMBIGUATION & CONSISTENCY (CRITICAL)
This font is condensed; 3/5 and 8/6 look nearly identical. Follow these forensic steps:

1. **The "White Space" Test (8 vs 6)**:
   - An **8** MUST have a fully enclosed white "eye" in the top half.
   - A **6** has a "hook" or "stem" that is open at the top. If the top-half loop is not 100% closed, it is a **6**.
   - **Verification**: In the Payment Summary, compare the '6' in "$7,726.00" to the '8' in the Invoice Number.

2. **The "Corner" Test (3 vs 5)**:
   - A **5** MUST have a sharp, flat horizontal top bar with a 90-degree corner on the left.
   - A **3** is rounded or open at the top-left.
   - **Reference**: Use the "5" in "5%" or "2025" as your visual legend for all other prices.

3. **Arithmetic Validation (The Final Truth)**:
   - **Line Items**: (Quantity * Unit Price) must equal Line Total.
   - **Payment Summary**: (SUBTOTAL Page 1 + Page 2 + Page 3) MUST equal GROSS TOTAL.
   - **Rule**: If the math fails by a difference that could be explained by a 3/5 or 8/6 swap (e.g., a difference of 2.00 or 20.00), you must re-examine the pixels.
   - **Strict Swap Policy**: Only change a digit if the alternative shape is a visual match. If the pixels are clear but the math is wrong, extract the typo exactly as printed.

4. **Negative Constraint**:
   - NEVER turn a "5" into an "8" or a "0" into an "8" just to make math work if the pixel shapes do not support it.

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