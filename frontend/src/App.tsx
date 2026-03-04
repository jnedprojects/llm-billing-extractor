import { useState } from "react"
import axios from "axios"
import type { Invoice, Validation } from "./assets/types"
import "./App.css"

function App() {
  const [files, setFiles] = useState<FileList | null>(null)
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [validation, setValidation] = useState<Validation | null>(null)
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
    } catch (err) {
      if (retryCount < 2) {
        console.log(`Retry attempt ${retryCount + 1}...`)
        setTimeout(() => handleUpload(retryCount + 1), 1500)
      } else {
        setLoading(false)
        alert("Upload failed after 3 attempts. Please check your connection.")
      }
    }
  }

  const clearData = () => {
    setInvoice(null)
    setValidation(null)
    setFiles(null)
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    if (fileInput) fileInput.value = ""
  }

  return (
    <div className="app-container">
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <h2>Processing Invoices...</h2>
          <p>Attempt {attempt} of 3</p>
          <small>Invoice data is being processed and validated.</small>
        </div>
      )}

      <h1>LLM Powered Billing Extractor</h1>
      <input type="file" multiple onChange={(e) => setFiles(e.target.files)} />

      <button
        className="primary-button"
        onClick={() => handleUpload(0)}
        disabled={loading}
      >
        Upload
      </button>

      <button className="secondary-button" onClick={clearData}>
        Clear Data
      </button>

      {invoice && (
        <div style={{ marginTop: 30 }}>
          <div className="vendor-header">
            <h2>{invoice.vendorName}</h2>
            <p><strong>Invoice #:</strong> {invoice.invoiceNumber} | <strong>Date:</strong> {invoice.invoiceDate}</p>
          </div>

          {invoice.pages.map((page) => (
            <div key={page.pageNumber} style={{ marginTop: 25 }}>
              <h3>Page {page.pageNumber} Items</h3>
              <table className="invoice-table">
                <thead>
                  <tr>
                    <th>Description</th><th>Qty</th><th>Price</th><th>Total</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {page.lineItems.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.description}</td>
                      <td>{item.quantity}</td>
                      <td>${item.unitPrice.toFixed(2)}</td>
                      <td>${item.lineTotal.toFixed(2)}</td>
                      <td>{validation?.lineItemErrors.includes(`${item.description} (Pg ${page.pageNumber})`) ? "❌" : "✅"}</td>
                    </tr>
                  ))}
                  <tr style={{
                    fontWeight: 'bold',
                    color: '#000000',
                    background: validation?.calculationErrors.includes(`pageSubtotal_pg${page.pageNumber}`) ? '#ffd6d6' : '#d6ffd6'
                  }}>
                    <td colSpan={3} align="right">PAGE {page.pageNumber} SUBTOTAL</td>
                    <td>${page.pageSubtotal.toFixed(2)}</td>
                    <td>{validation?.calculationErrors.includes(`pageSubtotal_pg${page.pageNumber}`) ? "❌" : "✅"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))}

          <h3 style={{ marginTop: 40 }}>Final Payment Summary</h3>
          <table className="invoice-table">
            <tbody>
              <tr><td>Gross Total</td><td>${invoice.grossTotal.toFixed(2)}</td><td>{validation?.calculationErrors.includes("grossTotal") ? "❌" : "✅"}</td></tr>
              <tr><td>Discount (5%)</td><td>${invoice.discountAmount.toFixed(2)}</td><td>{validation?.calculationErrors.includes("discountAmount") ? "❌" : "✅"}</td></tr>
              <tr><td>Delivery Fee</td><td>${invoice.deliveryFee.toFixed(2)}</td><td>{validation?.calculationErrors.includes("deliveryFee") ? "❌" : "✅"}</td></tr>
              <tr><td>Taxable Amount</td><td>${invoice.taxableAmount.toFixed(2)}</td><td>{validation?.calculationErrors.includes("taxableAmount") ? "❌" : "✅"}</td></tr>
              <tr><td>State Sales Tax (6%)</td><td>${invoice.stateSalesTax.toFixed(2)}</td><td>{validation?.calculationErrors.includes("stateSalesTax") ? "❌" : "✅"}</td></tr>
              <tr style={{ fontWeight: 'bold' }}><td>Net Total Due</td><td>${invoice.netTotalDue.toFixed(2)}</td><td>{validation?.calculationErrors.includes("netTotalDue") ? "❌" : "✅"}</td></tr>
            </tbody>
          </table>
        </div>
      )}

      {validation && (
        <div style={{ marginTop: 30 }}>
          {validation.isDuplicate && (
            <div className="duplicate-alert">
              ⚠️ This invoice number is already in the database and has been processed before.
            </div>
          )}

          {validation.warnings.length > 0 && (
            <div className="warning-box">
              <h3 style={{ color: 'red', marginTop: 0 }}>Validation Issues Found:</h3>
              {validation.warnings.map((w, i) => (
                <div key={i} className="warning-item">• {w}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default App