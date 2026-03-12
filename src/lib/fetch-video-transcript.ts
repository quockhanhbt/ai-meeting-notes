import { YoutubeTranscript } from "youtube-transcript";

export interface VideoTranscript {
  videoId: string;
  transcript: string;
}

function extractVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    // youtube.com/watch?v=ID
    if (u.hostname.includes("youtube.com") && u.searchParams.get("v")) {
      return u.searchParams.get("v");
    }
    // youtu.be/ID
    if (u.hostname === "youtu.be") {
      return u.pathname.slice(1).split("?")[0] || null;
    }
    // youtube.com/shorts/ID  or  youtube.com/embed/ID
    const match = u.pathname.match(/\/(shorts|embed|v)\/([^/?#]+)/);
    if (match) return match[2];
  } catch {
    // fall through
  }
  return null;
}

export async function fetchYouTubeTranscript(url: string): Promise<VideoTranscript> {
  const videoId = extractVideoId(url);
  if (!videoId) {
    throw new Error("Could not parse a YouTube video ID from the provided URL.");
  }

  let segments;
  try {
    segments = await YoutubeTranscript.fetchTranscript(videoId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Could not fetch transcript for this video. It may have captions disabled. (${msg})`);
  }

  if (!segments || segments.length === 0) {
    throw new Error("This video has no captions/transcript available.");
  }

  const transcript = segments.map((s) => s.text).join(" ").replace(/\s+/g, " ").trim();
  return { videoId, transcript };
}
