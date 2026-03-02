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

    grossTotal: number
    discountPercent: number
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

export interface ValidationResult {
    isDuplicate: boolean
    amountMismatch: boolean
    recalculationMismatch: boolean
    warnings: string[]
    lineItemErrors: string[]
    calculationErrors: string[]
}