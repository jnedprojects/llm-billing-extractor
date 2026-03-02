import { useState } from "react"
import axios from "axios"

type Invoice = {
  invoiceNumber: string
  invoiceDate: string
  vendorName: string
  totalAmount: number
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
          <p><strong>Total:</strong> ${invoice.totalAmount}</p>

          <h3>Line Items</h3>

          <table border={1} cellPadding={8}>
            <thead>
              <tr>
                <th>Description</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Line Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((item, index) => (
                <tr key={index}>
                  <td>{item.description}</td>
                  <td>{item.quantity}</td>
                  <td>${item.unitPrice}</td>
                  <td>${item.lineTotal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {validation && (
        <div style={{ marginTop: 30 }}>
          <h2>Validation</h2>

          {validation.amountMismatch && (
            <div style={{ color: "red" }}>
              ⚠ Amount mismatch detected
            </div>
          )}

          {validation.isDuplicate && (
            <div style={{ color: "orange" }}>
              ⚠ Duplicate invoice detected
            </div>
          )}

          {validation.warnings.map((w, i) => (
            <div key={i}>{w}</div>
          ))}
        </div>
      )}
    </div>
  )
}

export default App