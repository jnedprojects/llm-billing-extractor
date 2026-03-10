import Database from "better-sqlite3"

const db = new Database("invoice.db")

/*
Enable foreign key support
*/
db.exec("PRAGMA foreign_keys = ON")

/*
Create tables if they don't exist
*/

db.exec(`
CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    invoiceNumber TEXT,
    vendorName TEXT,
    invoiceDate TEXT,

    subtotal REAL,
    tax REAL,
    discount REAL,
    shipping REAL,
    grossTotal REAL,
    netTotalDue REAL,

    UNIQUE(invoiceNumber, vendorName)
);

CREATE TABLE IF NOT EXISTS invoice_line_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    invoice_id INTEGER,
    description TEXT,
    quantity REAL,
    unitPrice REAL,
    lineTotal REAL,

    FOREIGN KEY(invoice_id) REFERENCES invoices(id)
);
`)

/*
Check if invoice already exists
*/

export function isDuplicate(invoiceNumber: string | null, vendorName: string | null) {

    const row = db.prepare(`
        SELECT id
        FROM invoices
        WHERE invoiceNumber = ?
        AND vendorName = ?
    `).get(invoiceNumber, vendorName)

    return !!row
}

/*
Save invoice and line items
*/

export function saveInvoice(invoice: any) {

    const insertInvoice = db.prepare(`
        INSERT OR IGNORE INTO invoices (
            invoiceNumber,
            vendorName,
            invoiceDate,
            subtotal,
            tax,
            discount,
            shipping,
            grossTotal,
            netTotalDue
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const result = insertInvoice.run(
        invoice.invoiceNumber,
        invoice.vendorName ?? null,
        invoice.invoiceDate ?? null,
        invoice.totals?.subtotal ?? null,
        invoice.totals?.tax ?? null,
        invoice.totals?.discount ?? null,
        invoice.totals?.shipping ?? null,
        invoice.totals?.grossTotal ?? null,
        invoice.totals?.netTotalDue ?? null
    )

    /*
    If duplicate invoice detected, stop
    */

    if (result.changes === 0) {
        return
    }

    const invoiceId = result.lastInsertRowid

    const insertLineItem = db.prepare(`
        INSERT INTO invoice_line_items (
            invoice_id,
            description,
            quantity,
            unitPrice,
            lineTotal
        ) VALUES (?, ?, ?, ?, ?)
    `)

    for (const item of invoice.lineItems || []) {

        insertLineItem.run(
            invoiceId,
            item.description ?? null,
            item.quantity ?? null,
            item.unitPrice ?? null,
            item.lineTotal ?? null
        )
    }
}