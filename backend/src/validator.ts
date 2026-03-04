import { InvoiceData, ValidationResult } from "./models"
import { isDuplicate, markAsProcessed } from "./database"

export function validateInvoice(invoice: InvoiceData): ValidationResult {
    const warnings: string[] = []
    const lineItemErrors: string[] = []
    const calculationErrors: string[] = []

    // 1. Duplicate check
    const duplicate = isDuplicate(invoice.invoiceNumber)
    if (duplicate) {
        warnings.push(`DUPLICATE DETECTED: Invoice #${invoice.invoiceNumber} has already been processed.`);
    }

    // 2. Hierarchical Page & Line Item Validation
    let totalCalculatedFromPages = 0

    invoice.pages.forEach(page => {
        let pageCalculatedSum = 0

        page.lineItems.forEach(item => {
            // Digit Check: Qty * Price = Total (catches 3 vs 5 errors)
            const expectedLineTotal = Number((item.quantity * item.unitPrice).toFixed(2))

            if (Math.abs(expectedLineTotal - item.lineTotal) > 0.01) {
                lineItemErrors.push(`${item.description} (Pg ${page.pageNumber})`)
                warnings.push(`⚠️ Recalculation Error: ${item.description} (Pg ${page.pageNumber}). Extracted Unit Price: ${item.unitPrice}, Qty: ${item.quantity}, but Total: ${item.lineTotal}. Validated data suggests ${expectedLineTotal}.`);
            }
            pageCalculatedSum += item.lineTotal
        })

        // Cross-check: Do items on this page match the printed Page Subtotal?
        if (Math.abs(pageCalculatedSum - page.pageSubtotal) > 0.01) {
            calculationErrors.push(`pageSubtotal_pg${page.pageNumber}`)
            warnings.push(`Page ${page.pageNumber} mismatch: Items sum to ${pageCalculatedSum.toFixed(2)}, but subtotal says ${page.pageSubtotal.toFixed(2)}`)
        }
        totalCalculatedFromPages += page.pageSubtotal
    })

    // 3. Summary Validation
    // Check if total of all pages equals the Gross Total
    if (Math.abs(totalCalculatedFromPages - invoice.grossTotal) > 0.01) {
        calculationErrors.push("grossTotal")
        warnings.push("Gross total does not match the sum of page subtotals")
    }

    // Discount (5%)
    const expectedDiscount = Number((invoice.grossTotal * 0.05).toFixed(2))
    if (Math.abs(expectedDiscount - invoice.discountAmount) > 0.01) {
        calculationErrors.push("discountAmount")
        warnings.push("Discount calculation incorrect")
    }

    // Delivery Fee (Fixed 150)
    if (Math.abs(invoice.deliveryFee - 150) > 0.01) {
        calculationErrors.push("deliveryFee")
        warnings.push("Delivery fee should be 150")
    }

    // Taxable Amount (Gross - Discount + Delivery)
    const expectedTaxable = invoice.grossTotal - invoice.discountAmount + invoice.deliveryFee
    if (Math.abs(expectedTaxable - invoice.taxableAmount) > 0.01) {
        calculationErrors.push("taxableAmount")
        warnings.push("Taxable amount incorrect")
    }

    // State Sales Tax (6%)
    const expectedTax = Number((expectedTaxable * 0.06).toFixed(2))
    if (Math.abs(expectedTax - invoice.stateSalesTax) > 0.01) {
        calculationErrors.push("stateSalesTax")
        warnings.push(`State sales tax incorrect (Expected 6%: ${expectedTax})`)
    }

    // Net Total Due (Taxable + Tax)
    const expectedNet = Number((expectedTaxable + invoice.stateSalesTax).toFixed(2))
    const amountMismatch = Math.abs(expectedNet - invoice.netTotalDue) > 0.01

    if (amountMismatch) {
        calculationErrors.push("netTotalDue")
        warnings.push("Net total due calculation incorrect")
    }

    if (!duplicate && invoice.invoiceNumber) {
        markAsProcessed(invoice.invoiceNumber);
    }

    return {
        isDuplicate: duplicate,
        amountMismatch,
        recalculationMismatch: lineItemErrors.length > 0 || calculationErrors.length > 0,
        warnings,
        lineItemErrors,
        calculationErrors
    }
}