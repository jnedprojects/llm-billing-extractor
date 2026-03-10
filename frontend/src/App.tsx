import { useState } from "react"
import axios from "axios"
import type { InvoiceData, ValidationResult } from "./assets/types"
import "./App.css"

function App() {
  const [files, setFiles] = useState<FileList | null>(null)
  const [invoice, setInvoice] = useState<InvoiceData | null>(null)
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [attempt, setAttempt] = useState(0)

  const handleUpload = async (retryCount = 0) => {
    if (!files) return

    setLoading(true)
    setAttempt(retryCount + 1)

    const formData = new FormData()
    Array.from(files).forEach(f => formData.append("files", f))

    try {
      const res = await axios.post("http://localhost:3000/upload", formData)

      setInvoice(res.data.invoice)
      setValidation(res.data.validation)

      setLoading(false)

    } catch (err: any) {
      if (err.response?.data?.duplicate) {
        alert("Invoice already processed")
        setLoading(false)
        return
      }

      if (retryCount < 2) {
        console.log(`Retry attempt ${retryCount + 1}`)
        setTimeout(() => handleUpload(retryCount + 1), 1500)
      } else {
        setLoading(false)
        alert("Upload failed after 3 attempts.")
      }
    }
  }

  const clearData = () => {
    setInvoice(null)
    setValidation(null)
    setFiles(null)

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement

    if (fileInput) fileInput.value = ""
  }

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "-"
    return `$${value.toFixed(2)}`
  }

  return (
    <div className="app-container">

      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <h2>Processing Invoice...</h2>
          <p>Attempt {attempt} of 3</p>
          <small>Extracting and validating invoice data</small>
        </div>
      )}

      <h1>LLM Powered Billing Extractor</h1>

      <input
        type="file"
        multiple
        onChange={(e) => setFiles(e.target.files)}
      />

      <button
        className="primary-button"
        onClick={() => handleUpload(0)}
        disabled={loading}
      >
        Upload
      </button>

      <button
        className="secondary-button"
        onClick={clearData}
      >
        Clear Data
      </button>

      {invoice && (
        <div style={{ marginTop: 30 }}>

          {/* HEADER */}
          <div className="vendor-header">
            <h2>{invoice.vendorName ?? "Unknown Vendor"}</h2>
            <p>
              <strong>Invoice #:</strong> {invoice.invoiceNumber ?? "-"} |{" "}
              <strong>Date:</strong> {invoice.invoiceDate ?? "-"}
            </p>
          </div>

          {/* LINE ITEMS */}
          <h3 style={{ marginTop: 25 }}>Line Items</h3>

          <table className="invoice-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {invoice.lineItems.map((item, idx) => {

                const hasError =
                  validation?.lineItemErrors.includes(idx.toString())

                return (
                  <tr
                    key={idx}
                    style={{
                      backgroundColor: validation?.lineItemErrors.includes(idx.toString())
                        ? "#ffd6d6"
                        : "transparent"
                    }}
                  >
                    <td>{item.description}</td>

                    <td>{item.quantity ?? "-"}</td>

                    <td>{formatCurrency(item.unitPrice)}</td>

                    <td>{formatCurrency(item.lineTotal)}</td>

                    <td>{hasError ? "❌" : "✅"}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* TOTALS */}
          <h3 style={{ marginTop: 40 }}>Totals</h3>

          <table className="invoice-table">
            <tbody>

              <tr>
                <td>Subtotal</td>
                <td>{formatCurrency(invoice.totals?.subtotal)}</td>
              </tr>

              <tr>
                <td>Tax</td>
                <td>{formatCurrency(invoice.totals?.tax)}</td>
              </tr>

              <tr>
                <td>Discount</td>
                <td>{formatCurrency(invoice.totals?.discount)}</td>
              </tr>

              <tr>
                <td>Shipping</td>
                <td>{formatCurrency(invoice.totals?.shipping)}</td>
              </tr>

              <tr>
                <td>Gross Total</td>
                <td>{formatCurrency(invoice.totals?.grossTotal)}</td>
              </tr>

              <tr style={{ fontWeight: "bold" }}>
                <td>Net Total Due</td>
                <td>{formatCurrency(invoice.totals?.netTotalDue)}</td>
              </tr>

            </tbody>
          </table>

        </div>
      )}

      {validation && (
        <div style={{ marginTop: 30 }}>

          {validation.isDuplicate && (
            <div className="duplicate-alert">
              ⚠️ This invoice has already been processed.
            </div>
          )}

          {validation.warnings.length > 0 && (
            <div className="warning-box">

              <h3 style={{ color: "red", marginTop: 0 }}>
                Validation Issues Found
              </h3>

              {validation.warnings.map((w, i) => (
                <div key={i} className="warning-item">
                  • {w}
                </div>
              ))}

            </div>
          )}

        </div>
      )}

    </div>
  )
}

export default App