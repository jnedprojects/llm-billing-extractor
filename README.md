# LLM Powered AI Invoice Extractor

A high-precision, full-stack solution designed to automate the extraction of structured data from multi-page invoices.

This project leverages **Gemini 2.5 Flash** with a specialized **Forensic Accounting Prompt** to solve common OCR failures in condensed fonts (such as **3/5** and **8/6** confusion). The system focuses on improving numeric extraction accuracy in financial documents where small typographic differences can cause major accounting discrepancies.

The platform processes invoice images, extracts structured financial data using AI, validates totals, detects duplicates, and stores results in a normalized database.

---

## Getting Started

### Prerequisites

Before running this project, ensure the following are installed:

| Requirement     | Version                      |
| --------------- | ---------------------------- |
| Node.js         | v18.0.0 or higher            |
| Package Manager | npm, yarn, or pnpm           |
| Gemini API Key  | Obtain from Google AI Studio |

---

## Features

* AI-powered invoice data extraction
* Multi-page invoice support
* Optimized prompt engineering for financial documents
* Numeric disambiguation for condensed invoice fonts
* Automatic financial validation checks
* Duplicate invoice detection
* Structured database storage
* Line-item extraction and normalization

---

## Architecture

Processing pipeline:

User Upload
> 
Image Processing API
> 
Gemini Vision Extraction
> 
JSON Repair
> 
Invoice Validation
> 
Duplicate Detection
> 
Database Storage
> 
Structured API Response

---

## Tech Stack

| Component       | Technology        |
| --------------- | ----------------- |
| Backend         | Node.js + Express |
| Language        | TypeScript        |
| AI Model        | Gemini Vision     |
| Database        | SQLite            |
| Upload Handling | Multer            |
| JSON Recovery   | jsonrepair        |

---

## Installation

Clone the repository:

```bash
git clone https://github.com/jnedprojects/llm-billing-extractor.git
```

Navigate to the backend folder:

```bash
cd billing-extractor/backend
```

Install dependencies:

```bash
npm install
npm install @google/generative-ai 
```

Create a `.env` file in the backend folder.
This is where your API key will be stored. Add it into the file following the format below:

```
GEMINI_API_KEY=your_api_key_here
```

Navigate to the frontend folder:

```bash
cd billing-extractor/frontend
```

Install dependencies:

```bash
npm install
```

Navigate back to the root folder:

```bash
cd billing-extractor
```

Install dependencies:

```bash
npm install
```

Start the development server. Make sure you are in the root folder /billing-extractor.
Run the command below. Both the backend and frontend should build.

```bash
npm run dev
```

After the project is built succesfully, you will notice a file labeled invoice.db added to your backend directory. This is where your data is stored for duplication checks and saving the extracted invoices.

Server will run at ports as below based on default configurations.

Backend:
```
http://localhost:3000 
```

Frontend:
```
http://localhost:5173 
```

---

## API Usage

### Upload Invoice

Endpoint:

```
POST /upload
```

Content type:

```
multipart/form-data
```

Field name:

```
files
```

Supported file types:

* JPG
* JPEG
* PNG

---

## Example Response

```json
{
    "invoice": {
        "invoiceNumber": "MY-001",
        "invoiceDate": "29/01/2019",
        "vendorName": "East Asia Trading",
        "lineItems": [
            {
                "description": "Wooden elephant figurine",
                "quantity": 1,
                "unitPrice": 600,
                "lineTotal": 600
            },
            {
                "description": "Large cloth rice bag",
                "quantity": 2,
                "unitPrice": 45,
                "lineTotal": 90
            },
            {
                "description": "Bamboo ladder",
                "quantity": 3,
                "unitPrice": 20,
                "lineTotal": 60
            }
        ],
        "totals": {
            "subtotal": 750,
            "tax": 45,
            "discount": null,
            "shipping": null,
            "grossTotal": null,
            "netTotalDue": 795
        }
    },
    "validation": {
        "isDuplicate": true,
        "amountMismatch": false,
        "recalculationMismatch": false,
        "warnings": [
            "DUPLICATE DETECTED: Invoice MY-001 from East Asia Trading already exists."
        ],
        "lineItemErrors": [],
        "calculationErrors": []
    }
}
```

---

## Database Schema

### invoices

Stores invoice metadata.

| Column        | Type    |
| ------------- | ------- |
| id            | INTEGER |
| invoiceNumber | TEXT    |
| vendorName    | TEXT    |
| invoiceDate   | TEXT    |
| subtotal      | REAL    |
| tax           | REAL    |
| discount      | REAL    |
| shipping      | REAL    |
| grossTotal    | REAL    |
| netTotalDue   | REAL    |

---

### invoice_line_items

Stores each line item belonging to an invoice.

| Column      | Type    |
| ----------- | ------- |
| id          | INTEGER |
| invoice_id  | INTEGER |
| description | TEXT    |
| quantity    | REAL    |
| unitPrice   | REAL    |
| lineTotal   | REAL    |

Relationship:

```
invoices (1) → invoice_line_items (many)
```

---

## Error Handling

The system includes safeguards for common issues:

* AI returning invalid JSON
* Duplicate invoice submissions
* Invalid file types
* Failed extraction attempts

AI responses are automatically repaired using a JSON repair layer before parsing.

---

## Future Improvements

Potential enhancements:

* PDF invoice support
* OCR fallback for low-quality images
* AI confidence scoring
* Vendor-specific parsing rules
* Processing audit logs
* Frontend dashboard for uploaded invoices

---

## Security Notes

The following files are ignored in version control:

```
node_modules
.env
uploads
invoice.db
```

Sensitive credentials and runtime data should never be committed.

---
