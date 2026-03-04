# A LLM powered invoice extraction & validation project.

A high-precision, full-stack solution designed to automate the extraction of structured data from multi-page invoices. 
This project leverages Gemini 2.5 Flash with a specialized Forensic Accounting Prompt to solve common OCR failures in condensed fonts (such as 3/5 and 8/6 confusion).


Getting Started

1. Prerequisites:
   
Node.js: v18.0.0 or higher

Package Manager: npm, yarn, or pnpm

Gemini API Key: Obtain a free key from Google AI Studio

2. Configuration
Create a .env file in the project root:
Code snippet: GEMINI_API_KEY=your_api_key_here
(Note: Ensure your llmservice.ts is configured to read the correct environment variable prefix based on your build tool).

3. Build & Run 

Install dependencies

npm install - this has to be done in the directories below:

/billing-extractor

/billing-extractor/backend

/billing-extractor/frontend

# Start development server

Nvaigate back to /billing-extractor and type in terminal the command below:

npm run dev

Both backend should build and be served.

# Highlights 

Specialized OCR Disambiguation

To achieve high accuracy on condensed industrial fonts, the llmservice.ts implements a Visual Legend Protocol:

Comparative Anchoring: The model establishes a "baseline" for digits by locating clear examples (e.g., the "5" in a 5% discount) before interpreting blurry price fields.

Geometric Validation: Instead of relying on probability, the prompt forces the AI to check for Negative Space (the "eye" of an 8 vs. the "hook" of a 6) and Angular Sharpness (the 90-degree corner of a 5 vs. the curve of a 3).

"Nudge" Math Logic: The system uses (Quantity * Unit Price) as a trigger to re-examine pixels, but strictly forbids "hallucinating" numbers to fit the math if the visual evidence is contrary.

Multi-Tier Validation Engine: The validator.ts provides a complete financial audit of the extracted JSON

Hierarchical Summation: Validates that line items equal page subtotals, and page subtotals equal the Gross Total.

Tax & Discount Audit: Re-calculates 5% discounts and 6% state taxes to ensure the vendor's printed totals are logically consistent.

Duplicate Prevention: Integrated with a local database service to flag invoices that have already been processed.

# File Purpose and Structure

llmservice.ts - Gemini 2.5 Flash integration & Forensic Prompt Engineering.

validator.ts - Multi-page financial validation and rounding logic.

database.ts - Local persistence and duplicate detection.

models.ts - TypeScript interfaces defining the strict Invoice schema.

# TroubleshootingExtraction Errors: 

Ensure images are high resolution. Low-DPI images may cause the "top-bar" of the digit 5 to disappear, making it look like a 3

API Rate Limits: If using the Free Tier of Gemini, ensure you do not exceed the requests-per-minute quota.

During development, I identified that standard OCR often fails on condensed sans-serif fonts found on commercial invoices. By moving the "correction" logic into a two-step process—AI visual verification followed by Programmatic math validation—I created a system that is both accurate and resilient to "hallucinations."
