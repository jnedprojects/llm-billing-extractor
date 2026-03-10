export interface LineItem {
    description: string
    quantity: number | null
    unitPrice: number | null
    lineTotal: number | null
}

export interface InvoiceTotals {
    subtotal: number | null
    tax: number | null
    discount: number | null
    shipping: number | null
    grossTotal: number | null
    netTotalDue: number | null
}

export interface InvoiceData {
    invoiceNumber: string | null
    invoiceDate: string | null
    vendorName: string | null

    lineItems: LineItem[]

    totals: InvoiceTotals
}

export interface ValidationResult {
    isDuplicate: boolean
    amountMismatch: boolean
    recalculationMismatch: boolean
    warnings: string[]
    lineItemErrors: string[]
    calculationErrors: string[]
}