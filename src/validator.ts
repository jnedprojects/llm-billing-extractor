import { InvoiceData, ValidationResult } from "./models"
import { isDuplicate, markAsProcessed } from "./database"

export function validateInvoice(invoice: InvoiceData): ValidationResult {
    const warnings: string[] = []

    // 1️⃣ Duplicate check
    const duplicate = isDuplicate(invoice.invoiceNumber)
    if (duplicate) {
        warnings.push("Duplicate invoice detected.")
    }

    // 2️⃣ Recalculate line items
    let recalculatedSum = 0
    let recalculationMismatch = false

    for (const item of invoice.lineItems) {
        const recalculated = item.quantity * item.unitPrice

        if (Math.abs(recalculated - item.lineTotal) > 0.01) {
            recalculationMismatch = true
            warnings.push(`Line item mismatch: ${item.description}`)
        }

        recalculatedSum += recalculated
    }

    // 3️⃣ Compare to stated total
    const amountMismatch =
        Math.abs(recalculatedSum - invoice.totalAmount) > 0.01

    if (amountMismatch) {
        warnings.push(
            `Total mismatch: calculated ${recalculatedSum}, stated ${invoice.totalAmount}`
        )
    }

    // Mark processed only if not duplicate
    if (!duplicate) {
        markAsProcessed(invoice.invoiceNumber)
    }

    return {
        isDuplicate: duplicate,
        amountMismatch,
        recalculationMismatch,
        warnings,
    }
}