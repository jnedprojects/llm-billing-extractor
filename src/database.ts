const processedInvoices = new Set<string>()

export function isDuplicate(invoiceNumber: string): boolean {
    return processedInvoices.has(invoiceNumber)
}

export function markAsProcessed(invoiceNumber: string): void {
    processedInvoices.add(invoiceNumber)
}