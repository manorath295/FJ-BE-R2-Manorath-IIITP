import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";

// Initialize Gemini model
const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  maxOutputTokens: 2048,
  apiKey: process.env.GOOGLE_API_KEY,
});

export async function analyzeReceipt(imageUrl: string) {
  try {
    console.log("🔍 [AI] Analyzing receipt:", imageUrl);

    // Fetch image and convert to base64
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }
    const arrayBuffer = await imageResponse.arrayBuffer();
    const base64String = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = imageResponse.headers.get("content-type") || "image/jpeg";
    const dataUrl = `data:${mimeType};base64,${base64String}`;

    const message = new HumanMessage({
      content: [
        {
          type: "text",
          text: `Analyze this receipt image and extract the following details in JSON format:
          - merchantName (string): The name of the store or merchant.
          - date (string, ISO 8601 format YYYY-MM-DD): The date of the transaction.
          - amount (number): The total amount paid.
          - currency (string, 3-letter code, default USD): The currency.
          - category (string): A suggested category (e.g., Food, Transport, Utilities, Shopping, Health, Entertainment, Education).
          - description (string): A brief description of the items purchased.
          
          If any field is missing or unclear, make a best guess or return null.
          Return ONLY the raw JSON object, no markdown formatting.`,
        },
        {
          type: "image_url",
          image_url: {
            url: dataUrl,
          },
        },
      ],
    });

    const result = await model.invoke([message]);
    const responseText = result.content as string;

    console.log("🤖 [AI] Raw Gemini Response:", responseText);

    // Clean up response (remove markdown code blocks if present)
    const cleanedResponse = responseText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    console.log("✅ [AI] Analysis complete (Parsed):", cleanedResponse);

    return JSON.parse(cleanedResponse);
  } catch (error) {
    console.error("❌ [AI] Receipt Analysis Error:", error);
    throw new Error("Failed to analyze receipt image");
  }
}

export async function analyzeBankStatement(
  fileBuffer: Buffer,
  mimeType: string,
) {
  try {
    console.log(
      `🔍 [AI] Analyzing bank statement (${mimeType}, ${fileBuffer.length} bytes)`,
    );

    // Convert buffer to base64
    const base64String = fileBuffer.toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64String}`;

    const message = new HumanMessage({
      content: [
        {
          type: "text",
          text: `Analyze this bank statement and extract ALL transactions in a JSON array format.
          
          For each transaction, extract:
          - date (string, ISO 8601 format YYYY-MM-DD): The date of the transaction.
          - description (string): The merchant name or transaction description. Clean it up (remove codes/ref numbers).
          - amount (number): The amount. Use POSITIVE for income/deposits, NEGATIVE for expenses/withdrawals.
          - type (string): "INCOME" or "EXPENSE" based on the amount direction.
          
          Important:
          - Valid transaction rows only. Ignore headers, balances, and summaries.
          - If a row has "Credit" or "Deposit" column, it's INCOME. "Debit" or "Withdrawal" is EXPENSE.
          - Ensure amount sign matches type (Income = +, Expense = -).

          Return ONLY the raw JSON object with a "transactions" key containing the array, no markdown formatting.
          Example: { "transactions": [{ "date": "2023-01-01", "description": "Grocery Store", "amount": -50.25, "type": "EXPENSE" }] }`,
        },
        {
          type: "image_url",
          image_url: {
            url: dataUrl,
          },
        },
      ],
    });

    const result = await model.invoke([message]);
    const responseText = result.content as string;

    // Clean up response
    const cleanedResponse = responseText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    console.log(
      "✅ [AI] Statement Analysis complete:",
      cleanedResponse.substring(0, 200) + "...",
    );

    const parsed = JSON.parse(cleanedResponse);
    return parsed.transactions || [];
  } catch (error) {
    console.error("❌ [AI] Statement Analysis Error:", error);
    throw new Error("Failed to analyze bank statement");
  }
}
