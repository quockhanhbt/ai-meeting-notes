import * as cheerio from "cheerio";

export interface ArticleContent {
  title: string;
  text: string;
  source: string;
}

// Try real browser UAs first — many sites block bots but serve content to browsers.
// Googlebot is kept as last resort because some sites whitelist it.
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
];

// Ordered list of semantic selectors used by common CMSes / news sites.
// We stop at the first match that yields enough text.
const CONTENT_SELECTORS = [
  "[itemprop='articleBody']",
  "[class*='article-body']",
  "[class*='article_body']",
  "[class*='articleBody']",
  "[class*='post-content']",
  "[class*='post_content']",
  "[class*='entry-content']",
  "[class*='entry_content']",
  "[class*='story-body']",
  "[class*='story_body']",
  "[class*='content-body']",
  "article",
  "main",
];

function extractText($: ReturnType<typeof cheerio.load>, container: ReturnType<typeof $>): string {
  // Prefer structured block-level elements — gives cleaner output.
  const structured = container
    .find("p, h1, h2, h3, h4, h5, li, blockquote, td")
    .map((_, el) => $(el).text().trim())
    .get()
    .filter((t) => t.length > 20)
    .join("\n\n");

  if (structured.length >= 100) return structured;

  // Fallback: full text of the container, collapsing excess whitespace.
  return container.text().replace(/\s{3,}/g, "\n\n").trim();
}

export async function fetchArticleContent(url: string): Promise<ArticleContent> {
  const source = new URL(url).hostname.replace(/^www\./, "");

  let html = "";
  let fetchError: Error | null = null;

  for (const ua of USER_AGENTS) {
    let res: Response;
    try {
      res = await fetch(url, {
        headers: {
          "User-Agent": ua,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        signal: AbortSignal.timeout(15_000),
      });
    } catch (err) {
      const cause = err instanceof Error ? err.message : String(err);
      if (cause.includes("timed out") || cause.includes("timeout")) {
        throw new Error("Request timed out while fetching the article URL.");
      }
      throw new Error(
        `Could not reach the article URL (${cause}). Check that the URL is publicly accessible.`
      );
    }

    if (!res.ok) {
      fetchError = new Error(`Failed to fetch article: ${res.status} ${res.statusText}`);
      continue;
    }

    html = await res.text();
    break;
  }

  if (!html) {
    throw fetchError ?? new Error("Failed to fetch article.");
  }

  const $ = cheerio.load(html);

  // Strip non-content nodes
  $(
    "script, style, nav, footer, header, aside, noscript, iframe, form, button, " +
    "[class*='ad-'], [class*='advertisement'], [id*='ad-'], [class*='cookie'], [class*='popup']"
  ).remove();

  // Extract title
  const title =
    $("meta[property='og:title']").attr("content") ||
    $("title").text().trim() ||
    $("h1").first().text().trim() ||
    "Untitled Article";

  // Try each content selector in order
  let text = "";
  for (const selector of CONTENT_SELECTORS) {
    const el = $(selector).first();
    if (el.length) {
      text = extractText($, el);
      if (text.length >= 100) break;
    }
  }

  // Last resort: full body
  if (text.length < 100) {
    text = extractText($, $("body"));
  }

  text = text.slice(0, 15_000).trim();

  if (text.length < 100) {
    throw new Error(
      "Could not extract enough content from this URL. The page may require JavaScript or be behind a paywall."
    );
  }

  return { title: title.slice(0, 200), text, source };
}
