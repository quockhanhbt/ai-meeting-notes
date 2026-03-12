import Anthropic from "@anthropic-ai/sdk";

export interface SummaryResult {
  overview: string;
  decisions: Array<{ text: string; owner?: string }>;
  action_items: Array<{ text: string; assignee?: string; due_date?: string }>;
  open_questions: Array<{ text: string }>;
  tokens_used: number;
}

const SYSTEM_PROMPT = `You are an expert meeting note summarizer. Given a meeting transcript, extract structured information and return it as valid JSON only — no markdown, no explanation, just the JSON object.

Return exactly this shape:
{
  "overview": "2-3 sentence TL;DR of the meeting",
  "decisions": [{ "text": "decision made", "owner": "person name or null" }],
  "action_items": [{ "text": "what needs to be done", "assignee": "person name or null", "due_date": "YYYY-MM-DD or null" }],
  "open_questions": [{ "text": "unresolved question" }]
}

Rules:
- Be concise but complete
- If a field has no items, return an empty array []
- Extract owner/assignee from context if mentioned
- Parse dates mentioned in transcript to ISO format (YYYY-MM-DD) when possible`;

export async function summarizeTranscript(
  transcript: string
): Promise<SummaryResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY environment variable is not set.");
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Please summarize this meeting transcript:\n\n${transcript}`,
      },
    ],
    system: SYSTEM_PROMPT,
  });

  const tokens_used =
    message.usage.input_tokens + message.usage.output_tokens;

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from AI model");
  }

  let parsed: Omit<SummaryResult, "tokens_used">;
  try {
    parsed = JSON.parse(content.text);
  } catch {
    throw new Error(`Failed to parse AI response as JSON: ${content.text}`);
  }

  return {
    overview: parsed.overview ?? "",
    decisions: parsed.decisions ?? [],
    action_items: parsed.action_items ?? [],
    open_questions: parsed.open_questions ?? [],
    tokens_used,
  };
}
