import { InvoiceData, ValidationResult } from "./models"
import { isDuplicate, markAsProcessed } from "./database"

export function validateInvoice(invoice: InvoiceData): ValidationResult {
    const warnings: string[] = []
    const lineItemErrors: string[] = []
    const calculationErrors: string[] = []

    // Duplicate check
    const duplicate = isDuplicate(invoice.invoiceNumber)
    // if (duplicate) {
    //     warnings.push("Duplicate invoice detected.")
    // }

    // Recalculate line items
    let grossCalculated = 0

    for (const item of invoice.lineItems) {
        const expectedLineTotal = item.quantity * item.unitPrice

        if (Math.abs(expectedLineTotal - item.lineTotal) > 0.01) {
            lineItemErrors.push(item.description)
            warnings.push(`Line item mismatch: ${item.description}`)
        }

        grossCalculated += expectedLineTotal
    }

    // Gross Total
    if (Math.abs(grossCalculated - invoice.grossTotal) > 0.01) {
        calculationErrors.push("grossTotal")
        warnings.push("Gross total incorrect")
    }

    // Discount (5%)
    const expectedDiscount = grossCalculated * 0.05
    if (Math.abs(expectedDiscount - invoice.discountAmount) > 0.01) {
        calculationErrors.push("discountAmount")
        warnings.push("Discount calculation incorrect")
    }

    // 5Delivery Fee (fixed 150)
    if (Math.abs(invoice.deliveryFee - 150) > 0.01) {
        calculationErrors.push("deliveryFee")
        warnings.push("Delivery fee should be 150")
    }

    // Taxable Amount
    const expectedTaxable =
        grossCalculated - expectedDiscount + 150

    if (Math.abs(expectedTaxable - invoice.taxableAmount) > 0.01) {
        calculationErrors.push("taxableAmount")
        warnings.push("Taxable amount incorrect")
    }

    // State Sales Tax (6%)
    const expectedTax = expectedTaxable * 0.06

    if (Math.abs(expectedTax - invoice.stateSalesTax) > 0.01) {
        calculationErrors.push("stateSalesTax")
        warnings.push("State sales tax incorrect")
    }

    // Net Total Due
    const expectedNet = expectedTaxable + expectedTax

    const amountMismatch =
        Math.abs(expectedNet - invoice.netTotalDue) > 0.01

    if (amountMismatch) {
        calculationErrors.push("netTotalDue")
        warnings.push("Net total due incorrect")
    }

    if (!duplicate) {
        markAsProcessed(invoice.invoiceNumber)
    }

    return {
        isDuplicate: duplicate,
        amountMismatch,
        recalculationMismatch: lineItemErrors.length > 0,
        warnings,
        lineItemErrors,
        calculationErrors
    }
}