import { useState } from "react"
import axios from "axios"

type Invoice = {
  invoiceNumber: string
  invoiceDate: string
  vendorName: string

  grossTotal: number
  discountAmount: number
  deliveryFee: number
  taxableAmount: number
  stateSalesTax: number
  netTotalDue: number

  lineItems: {
    description: string
    quantity: number
    unitPrice: number
    lineTotal: number
  }[]
}

type Validation = {
  isDuplicate: boolean
  amountMismatch: boolean
  recalculationMismatch: boolean
  warnings: string[]
  lineItemErrors: string[]
  calculationErrors: string[]
}

function App() {
  const [files, setFiles] = useState<FileList | null>(null)
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [validation, setValidation] = useState<Validation | null>(null)
  const [loading, setLoading] = useState(false)

  const handleUpload = async () => {
    if (!files) return

    const formData = new FormData()
    Array.from(files).forEach(file => {
      formData.append("files", file)
    })

    setLoading(true)

    try {
      const response = await axios.post(
        "http://localhost:3000/upload",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      )

      setInvoice(response.data.invoice)
      setValidation(response.data.validation)

    } catch (err) {
      console.error(err)
      alert("Upload failed")
    }

    setLoading(false)
  }

  return (
    <div style={{ padding: 40, fontFamily: "Arial" }}>
      <h1>AI Invoice Extractor</h1>

      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => setFiles(e.target.files)}
      />

      <button onClick={handleUpload} disabled={loading}>
        {loading ? "Processing..." : "Upload"}
      </button>

      {invoice && (
        <div style={{ marginTop: 40 }}>
          <h2>Invoice Details</h2>

          <p><strong>Vendor:</strong> {invoice.vendorName}</p>
          <p><strong>Invoice #:</strong> {invoice.invoiceNumber}</p>
          <p><strong>Date:</strong> {invoice.invoiceDate}</p>

          <h3>Line Items</h3>

          <table border={1} cellPadding={8}>
            <thead>
              <tr>
                <th>Description</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Line Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((item, index) => {
                const isWrong = validation?.lineItemErrors?.includes(item.description)

                return (
                  <tr key={index}>
                    <td>{item.description}</td>
                    <td>{item.quantity}</td>
                    <td>${item.unitPrice}</td>
                    <td>${item.lineTotal}</td>
                    <td style={{ color: "red", fontWeight: "bold" }}>
                      {isWrong ? "❌" : "✅"}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <h3 style={{ marginTop: 30 }}>Financial Summary</h3>

          <table border={1} cellPadding={8}>
            <tbody>
              <tr>
                <td>Gross Total</td>
                <td>${invoice.grossTotal}</td>
                <td>{validation?.calculationErrors.includes("grossTotal") ? "❌" : "✅"}</td>
              </tr>
              <tr>
                <td>Discount (5%)</td>
                <td>${invoice.discountAmount}</td>
                <td>{validation?.calculationErrors.includes("discountAmount") ? "❌" : "✅"}</td>
              </tr>
              <tr>
                <td>Delivery Fee</td>
                <td>${invoice.deliveryFee}</td>
                <td>{validation?.calculationErrors.includes("deliveryFee") ? "❌" : "✅"}</td>
              </tr>
              <tr>
                <td>Taxable Amount</td>
                <td>${invoice.taxableAmount}</td>
                <td>{validation?.calculationErrors.includes("taxableAmount") ? "❌" : "✅"}</td>
              </tr>
              <tr>
                <td>State Sales Tax (6%)</td>
                <td>${invoice.stateSalesTax}</td>
                <td>{validation?.calculationErrors.includes("stateSalesTax") ? "❌" : "✅"}</td>
              </tr>
              <tr>
                <td><strong>Net Total Due</strong></td>
                <td><strong>${invoice.netTotalDue}</strong></td>
                <td>{validation?.calculationErrors.includes("netTotalDue") ? "❌" : "✅"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {validation && (
        <div style={{ marginTop: 30 }}>
          <h2>Validation Summary</h2>

          {validation.isDuplicate && (
            <div style={{ color: "orange" }}>
              ⚠ Duplicate invoice detected
            </div>
          )}

          {validation.warnings.map((w, i) => (
            <div key={i} style={{ color: "red" }}>
              ❌ {w}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default App