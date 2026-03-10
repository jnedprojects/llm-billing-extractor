export type LineItem = {
    description: string
    quantity: number | null
    unitPrice: number | null
    lineTotal: number | null
}

export type InvoiceTotals = {
    subtotal: number | null
    tax: number | null
    discount: number | null
    shipping: number | null
    grossTotal: number | null
    netTotalDue: number | null
}

export type InvoiceData = {
    invoiceNumber: string | null
    invoiceDate: string | null
    vendorName: string | null

    lineItems: LineItem[]

    totals: InvoiceTotals
}

export type ValidationResult = {
    isDuplicate: boolean
    amountMismatch: boolean
    recalculationMismatch: boolean
    warnings: string[]
    lineItemErrors: string[]
    calculationErrors: string[]
}