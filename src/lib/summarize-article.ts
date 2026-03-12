import Anthropic from "@anthropic-ai/sdk";
import { ArticleSummaryResult } from "@/lib/types";

const SYSTEM_PROMPT = `You are an expert news article summarizer. Given article content, extract structured information and return it as valid JSON only — no markdown, no explanation, just the JSON object.

Return exactly this shape:
{
  "overview": "2-3 sentence summary of the article",
  "key_points": [{ "text": "important point or fact from the article" }],
  "sentiment": "positive" | "negative" | "neutral"
}

Rules:
- Detect the language of the article and write ALL text values in that same language
- Be concise but capture the most important information
- Include 3-6 key points
- sentiment must be exactly "positive", "negative", or "neutral"
- If a field has no items, return an empty array []`;

export async function summarizeArticle(
  text: string,
  articleTitle: string
): Promise<ArticleSummaryResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY environment variable is not set.");
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Please summarize this article titled "${articleTitle}":\n\n${text}`,
      },
    ],
  });

  const tokens_used = message.usage.input_tokens + message.usage.output_tokens;

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type from AI model");

  const raw = content.text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

  let parsed: Omit<ArticleSummaryResult, "tokens_used">;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Failed to parse AI response as JSON: ${content.text}`);
  }

  return {
    overview: parsed.overview ?? "",
    key_points: parsed.key_points ?? [],
    sentiment: parsed.sentiment ?? null,
    tokens_used,
  };
}
