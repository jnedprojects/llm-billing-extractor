export interface LineItem {
    description: string
    quantity: number
    unitPrice: number
    lineTotal: number
}

export interface InvoiceData {
    invoiceNumber: string
    invoiceDate: string
    vendorName: string
    totalAmount: number
    lineItems: LineItem[]
}

export interface ValidationResult {
    isDuplicate: boolean
    amountMismatch: boolean
    recalculationMismatch: boolean
    warnings: string[]
}