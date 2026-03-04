
type LineItem = {
    description: string
    quantity: number
    unitPrice: number
    lineTotal: number
}

type InvoicePage = {
    pageNumber: number
    pageSubtotal: number
    lineItems: LineItem[]
}

export type Invoice = {
    invoiceNumber: string
    invoiceDate: string
    vendorName: string
    grossTotal: number
    discountAmount: number
    deliveryFee: number
    taxableAmount: number
    stateSalesTax: number
    netTotalDue: number
    pages: InvoicePage[]
}

export type Validation = {
    isDuplicate: boolean
    amountMismatch: boolean
    recalculationMismatch: boolean
    warnings: string[]
    lineItemErrors: string[]
    calculationErrors: string[]
}