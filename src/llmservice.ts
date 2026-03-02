import { GoogleGenAI } from "@google/genai"
import fs from "fs"

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!
})

export async function extractInvoiceFromImages(imagePaths: string[]) {

    const imageParts = imagePaths.map(path => {
        const imageBuffer = fs.readFileSync(path)

        return {
            inlineData: {
                mimeType: "image/png",
                data: imageBuffer.toString("base64")
            }
        }
    })

    const prompt = `
You are an invoice extraction system.

The invoice is split across multiple pages.
Treat all images as ONE invoice.

Return STRICT JSON:

{
  "invoiceNumber": string,
  "invoiceDate": string,
  "vendorName": string,
  "totalAmount": number,
  "lineItems": [
    {
      "description": string,
      "quantity": number,
      "unitPrice": number,
      "lineTotal": number
    }
  ]
}

Rules:
- Combine line items from all pages
- Use NET TOTAL DUE from final page as totalAmount
- Return only JSON
- No explanation
`

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
            { role: "user", parts: [{ text: prompt }, ...imageParts] }
        ]
    })

    let text = response.text ?? ""

    text = text.replace(/```json/g, "").replace(/```/g, "").trim()

    return JSON.parse(text)
}