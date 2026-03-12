import Anthropic from "@anthropic-ai/sdk";
import { VideoSummaryResult } from "@/lib/types";

const SYSTEM_PROMPT = `You are an expert video content summarizer. Given a video transcript, extract structured information and return it as valid JSON only — no markdown, no explanation, just the JSON object.

Return exactly this shape:
{
  "overview": "2-3 sentence summary of the video's main topic and value",
  "highlights": [{ "text": "key moment, insight, or quote from the video", "timestamp": "approximate position like 'early', 'mid', 'late' or null" }],
  "key_topics": [{ "text": "main topic or theme covered" }]
}

Rules:
- Detect the language of the transcript and write ALL text values in that same language
- Be concise but capture the most valuable content
- Include 3-7 highlights of the most interesting or useful moments
- Include 2-5 key topics/themes
- If a field has no items, return an empty array []`;

export async function summarizeVideo(transcript: string): Promise<VideoSummaryResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY environment variable is not set.");
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Please summarize this video transcript:\n\n${transcript}`,
      },
    ],
  });

  const tokens_used = message.usage.input_tokens + message.usage.output_tokens;

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type from AI model");

  const raw = content.text.replace(/^```(?:json)?\r?\n?/im, "").replace(/\r?\n?```\s*$/m, "").trim();

  let parsed: Omit<VideoSummaryResult, "tokens_used">;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Failed to parse AI response as JSON: ${content.text}`);
  }

  return {
    overview: parsed.overview ?? "",
    highlights: parsed.highlights ?? [],
    key_topics: parsed.key_topics ?? [],
    tokens_used,
  };
}
