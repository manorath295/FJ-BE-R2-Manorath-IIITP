import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";
import { PDFParse } from "pdf-parse";
import { parse } from "csv-parse/sync";
import prisma from "../lib/db.js";
import { createWorker } from "tesseract.js";

// Zod schema for transaction extraction
const transactionSchema = z.object({
  date: z.string().describe("Transaction date in YYYY-MM-DD format"),
  description: z.string().describe("Clean merchant or transaction description"),
  amount: z
    .number()
    .describe("Transaction amount (positive for income, negative for expense)"),
  type: z.enum(["INCOME", "EXPENSE"]).describe("Transaction type"),
});

const extractionSchema = z.object({
  transactions: z.array(transactionSchema),
});

// Category keywords for auto-categorization
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Groceries: [
    "walmart",
    "target",
    "kroger",
    "safeway",
    "whole foods",
    "grocery",
    "supermarket",
  ],
  Dining: [
    "restaurant",
    "cafe",
    "pizza",
    "mcdonald",
    "starbucks",
    "chipotle",
    "burger",
    "food",
  ],
  Transport: [
    "uber",
    "lyft",
    "gas",
    "fuel",
    "shell",
    "chevron",
    "parking",
    "transit",
  ],
  Utilities: [
    "electric",
    "water",
    "internet",
    "phone",
    "verizon",
    "at&t",
    "utility",
  ],
  Entertainment: [
    "netflix",
    "spotify",
    "hulu",
    "movie",
    "theater",
    "concert",
    "game",
  ],
  Shopping: ["amazon", "ebay", "best buy", "mall", "store", "shop"],
  Healthcare: ["pharmacy", "doctor", "hospital", "medical", "health"],
  Education: ["school", "university", "course", "tuition", "book"],
};

/**
 * Parse PDF buffer and extract text (with OCR fallback)
 */
export async function parsePDF(buffer: Buffer): Promise<string> {
  try {
    console.log("📄 [PDF PARSE] Starting PDF parsing...");
    console.log("📄 [PDF PARSE] Buffer size:", buffer.length, "bytes");

    // Step 1: Try standard text extraction first
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();

    console.log(
      "✅ [PDF PARSE] Successfully extracted text, length:",
      result.text.length,
      "characters",
    );
    console.log("📄 [PDF PARSE] Preview:", result.text.substring(0, 200));

    // Step 2: Check if we got meaningful text
    if (result.text && result.text.trim().length >= 50) {
      await parser.destroy();
      return result.text;
    }

    // Step 3: Text extraction failed - try OCR
    console.log("⚠️ [PDF PARSE] Insufficient text extracted, trying OCR...");

    // Get screenshots of PDF pages
    const screenshots = await parser.getScreenshot();
    await parser.destroy();

    if (!screenshots || screenshots.pages.length === 0) {
      throw new Error(
        "This PDF appears to be image-based or scanned. " +
          "Please try: 1) Export as text-based PDF from your bank, " +
          "2) Use CSV export instead, or " +
          "3) Copy-paste transactions into a CSV file",
      );
    }

    console.log(
      "🔍 [OCR] Processing",
      screenshots.pages.length,
      "pages with Tesseract...",
    );

    // Import Tesseract dynamically
    const worker = await createWorker("eng");

    let ocrText = "";
    for (let i = 0; i < screenshots.pages.length; i++) {
      const page = screenshots.pages[i] as any; // pdf-parse types may be incomplete
      console.log(
        `🔍 [OCR] Processing page ${i + 1}/${screenshots.pages.length}...`,
      );

      // Extract image buffer (property name may vary)
      const imageBuffer = page.buffer || page.content || page.image;
      if (!imageBuffer) {
        console.warn(
          `⚠️ [OCR] No image buffer found for page ${i + 1}, skipping...`,
        );
        continue;
      }

      const base64 = imageBuffer.toString("base64");
      const dataUrl = `data:image/png;base64,${base64}`;

      const { data } = await worker.recognize(dataUrl);
      ocrText += data.text + "\n\n";
      console.log(
        `✅ [OCR] Page ${i + 1} extracted ${data.text.length} characters`,
      );
    }

    await worker.terminate();

    console.log(
      "✅ [OCR] Total OCR text length:",
      ocrText.length,
      "characters",
    );
    console.log("📄 [OCR] Preview:", ocrText.substring(0, 200));

    if (!ocrText || ocrText.trim().length < 50) {
      throw new Error(
        "OCR failed to extract sufficient text. " +
          "Please use CSV export from your bank instead.",
      );
    }

    return ocrText;
  } catch (error) {
    console.error("❌ [PDF PARSE] Error:", error);
    if (
      error instanceof Error &&
      (error.message.includes("image-based") ||
        error.message.includes("OCR failed"))
    ) {
      throw error; // Re-throw our custom errors
    }
    throw new Error("Failed to parse PDF file. Please try a CSV file instead.");
  }
}

/**
 * Parse CSV buffer and extract text
 */
export async function parseCSV(buffer: Buffer): Promise<string> {
  try {
    console.log("📊 [CSV PARSE] Starting CSV parsing...");
    console.log("📊 [CSV PARSE] Buffer size:", buffer.length, "bytes");

    const text = buffer.toString("utf-8");
    const records = parse(text, {
      columns: false,
      skip_empty_lines: true,
    });

    console.log("✅ [CSV PARSE] Successfully parsed", records.length, "rows");

    // Convert CSV to readable format
    const result = records.map((row: string[]) => row.join(", ")).join("\n");
    console.log("📊 [CSV PARSE] Preview:", result.substring(0, 200));
    return result;
  } catch (error) {
    console.error("❌ [CSV PARSE] Error:", error);
    throw new Error("Failed to parse CSV file");
  }
}

/**
 * Extract transactions using Google Gemini AI
 */
export async function extractTransactionsWithGemini(
  text: string,
): Promise<any[]> {
  console.log("🤖 [GEMINI AI] Starting AI extraction...");
  console.log("🤖 [GEMINI AI] Text length:", text.length, "characters");
  console.log("🤖 [GEMINI AI] API Key present:", !!process.env.GOOGLE_API_KEY);

  console.log("🤖 [GEMINI AI] API Key:", process.env.GOOGLE_API_KEY);
  const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash", // Fast and free
    temperature: 0, // Deterministic
    apiKey: process.env.GOOGLE_API_KEY,
  });

  const structuredModel = model.withStructuredOutput(extractionSchema);

  const prompt = `You are a financial data extraction assistant. Extract ALL transactions from this bank statement.

RULES:
1. Extract EVERY transaction (income and expenses)
2. Format dates as YYYY-MM-DD
3. Use positive numbers for income, negative for expenses
4. Clean up merchant names (remove extra info like store numbers)
5. Ignore headers, footers, and non-transaction text
6. If amount has "+" it's INCOME, if "-" or no sign it's EXPENSE

IMPORTANT - REFUNDS:
- If you see "refund", "credit", "return", or "reversal" → treat as INCOME (positive amount)
- Example: "Amazon Refund $50" → amount: 50, type: INCOME
- Example: "Walmart Return $25" → amount: 25, type: INCOME

Bank Statement Text:
${text}

Extract all transactions now.`;

  try {
    console.log("🤖 [GEMINI AI] Sending request to Gemini...");
    const result = await structuredModel.invoke(prompt);
    console.log(
      "✅ [GEMINI AI] Extracted",
      result.transactions.length,
      "transactions",
    );
    console.log(
      "🤖 [GEMINI AI] Sample transaction:",
      JSON.stringify(result.transactions[0], null, 2),
    );
    return result.transactions;
  } catch (error) {
    console.error("❌ [GEMINI AI] Error:", error);
    throw new Error("Failed to extract transactions with AI");
  }
}

/**
 * Auto-categorize transaction based on description
 */
export async function autoCategorize(
  description: string,
  userId: string,
): Promise<string | null> {
  // Get user's categories
  const userCategories = await prisma.category.findMany({
    where: { userId },
  });

  const descLower = description.toLowerCase();

  // Try keyword matching
  for (const category of userCategories) {
    const keywords = CATEGORY_KEYWORDS[category.name] || [];
    if (keywords.some((kw) => descLower.includes(kw))) {
      console.log(
        "🏷️  [CATEGORIZE] Matched '",
        description,
        "' to category '",
        category.name,
        "'",
      );
      return category.id;
    }
  }
  console.log("🏷️  [CATEGORIZE] No match for '", description, "'");
  // No match found
  return null;
}

/**
 * Detect if transaction is a duplicate
 */
export async function detectDuplicate(
  transaction: any,
  userId: string,
): Promise<boolean> {
  const existingTransaction = await prisma.transaction.findFirst({
    where: {
      userId,
      date: new Date(transaction.date),
      amount: transaction.amount,
      description: {
        startsWith: transaction.description.substring(0, 20), // Fuzzy match
      },
    },
  });

  const isDuplicate = !!existingTransaction;
  if (isDuplicate) {
    console.log("⚠️  [DUPLICATE] Found duplicate:", transaction.description);
  }
  return isDuplicate;
}

/**
 * Main function to process bank statement
 */
export async function processStatement(
  buffer: Buffer,
  fileType: string,
  userId: string,
) {
  console.log(
    "\n🚀 [IMPORT] ========== STARTING BANK STATEMENT IMPORT ==========",
  );
  console.log("🚀 [IMPORT] File type:", fileType);
  console.log("🚀 [IMPORT] User ID:", userId);

  // Step 1: Parse file
  console.log("\n📋 [IMPORT] Step 1: Parsing file...");
  let text: string;
  if (fileType === "application/pdf") {
    text = await parsePDF(buffer);
  } else if (fileType === "text/csv" || fileType === "application/csv") {
    text = await parseCSV(buffer);
  } else {
    console.error("❌ [IMPORT] Unsupported file type:", fileType);
    throw new Error("Unsupported file type");
  }

  // Step 2: Extract transactions with AI
  console.log("\n📋 [IMPORT] Step 2: Extracting transactions with AI...");
  const rawTransactions = await extractTransactionsWithGemini(text);

  // Step 3: Auto-categorize and detect duplicates
  console.log(
    "\n📋 [IMPORT] Step 3: Auto-categorizing and detecting duplicates...",
  );
  const processedTransactions = await Promise.all(
    rawTransactions.map(async (transaction, index) => {
      console.log(
        `\n  Processing transaction ${index + 1}/${rawTransactions.length}:`,
        transaction.description,
      );
      const suggestedCategoryId = await autoCategorize(
        transaction.description,
        userId,
      );
      const isDuplicate = await detectDuplicate(transaction, userId);

      return {
        id: Math.random().toString(36).substring(7), // Temp ID for frontend
        ...transaction,
        suggestedCategoryId,
        isDuplicate,
        confidence: suggestedCategoryId ? "high" : "medium",
      };
    }),
  );

  // Step 4: Calculate summary
  const summary = {
    total: processedTransactions.length,
    categorized: processedTransactions.filter((t) => t.suggestedCategoryId)
      .length,
    uncategorized: processedTransactions.filter((t) => !t.suggestedCategoryId)
      .length,
    duplicates: processedTransactions.filter((t) => t.isDuplicate).length,
  };

  console.log("\n✅ [IMPORT] ========== IMPORT COMPLETE ==========");
  console.log("📊 [IMPORT] Summary:", summary);
  console.log("\n");

  return {
    transactions: processedTransactions,
    summary,
  };
}

/**
 * Save confirmed transactions to database
 */
export async function saveTransactions(
  transactions: Array<{
    date: string;
    description: string;
    amount: number;
    type: "INCOME" | "EXPENSE";
    categoryId?: string;
  }>,
  userId: string,
) {
  const created = await prisma.transaction.createMany({
    data: transactions.map((t) => ({
      userId,
      date: new Date(t.date),
      description: t.description,
      amount: t.amount,
      type: t.type,
      categoryId: t.categoryId || null,
      currency: "USD", // Default currency
    })),
  });

  return created;
}
