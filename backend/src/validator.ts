import { InvoiceData, ValidationResult } from "./models"
import { isDuplicate, saveInvoice } from "./database"

export function validateInvoice(invoice: InvoiceData): ValidationResult {

    const warnings: string[] = []
    const lineItemErrors: string[] = []
    const calculationErrors: string[] = []

    const duplicate = isDuplicate(invoice.invoiceNumber, invoice.vendorName)

    if (duplicate) {
        warnings.push(`DUPLICATE DETECTED: Invoice ${invoice.invoiceNumber} from ${invoice.vendorName} already exists.`)
    }

    // LINE ITEM VALIDATION

    let calculatedSubtotal = 0

    invoice.lineItems.forEach((item, index) => {

        if (
            item.quantity !== null &&
            item.unitPrice !== null &&
            item.lineTotal !== null
        ) {

            const expectedLineTotal =
                Number((item.quantity * item.unitPrice).toFixed(2))

            if (Math.abs(expectedLineTotal - item.lineTotal) > 0.01) {

                lineItemErrors.push(index.toString())

                warnings.push(
                    `Line item mismatch for "${item.description}". ` +
                    `Expected ${expectedLineTotal} but found ${item.lineTotal}`
                )
            }
        }

        if (item.lineTotal !== null) {
            calculatedSubtotal += item.lineTotal
        }

    })

    calculatedSubtotal = Number(calculatedSubtotal.toFixed(2))

    // SUBTOTAL VALIDATION

    const extractedSubtotal = invoice.totals?.subtotal

    if (extractedSubtotal !== null && extractedSubtotal !== undefined) {

        if (Math.abs(calculatedSubtotal - extractedSubtotal) > 0.01) {

            calculationErrors.push("subtotal")

            warnings.push(
                `Subtotal mismatch. Line items sum to ${calculatedSubtotal} but subtotal shows ${extractedSubtotal}`
            )
        }
    }

    // FINAL TOTAL VALIDATION

    const subtotal = invoice.totals?.subtotal ?? calculatedSubtotal
    const tax = invoice.totals?.tax ?? 0
    const discount = invoice.totals?.discount ?? 0
    const shipping = invoice.totals?.shipping ?? 0
    const extractedNetTotal = invoice.totals?.netTotalDue

    const expectedNetTotal =
        Number((subtotal - discount + tax + shipping).toFixed(2))

    let amountMismatch = false

    if (extractedNetTotal !== null && extractedNetTotal !== undefined) {

        if (Math.abs(expectedNetTotal - extractedNetTotal) > 0.01) {

            amountMismatch = true

            calculationErrors.push("netTotalDue")

            warnings.push(
                `Total mismatch. Expected ${expectedNetTotal} but found ${extractedNetTotal}`
            )
        }
    }

    // SAVE TO DATABASE

    if (!duplicate && invoice.invoiceNumber) {
        saveInvoice(invoice)
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