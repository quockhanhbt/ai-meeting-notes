import * as cheerio from "cheerio";

export interface ArticleContent {
  title: string;
  text: string;
  source: string;
}

export async function fetchArticleContent(url: string): Promise<ArticleContent> {
  const source = new URL(url).hostname.replace(/^www\./, "");

  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(15_000),
    });
  } catch (err) {
    const cause = err instanceof Error ? err.message : String(err);
    if (cause.includes("timed out") || cause.includes("timeout")) {
      throw new Error("Request timed out while fetching the article URL.");
    }
    throw new Error(`Could not reach the article URL (${cause}). Check that the URL is publicly accessible.`);
  }

  if (!res.ok) {
    throw new Error(`Failed to fetch article: ${res.status} ${res.statusText}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  // Remove non-content nodes
  $("script, style, nav, footer, header, aside, noscript, iframe, form, button").remove();

  // Extract title
  const title =
    $("meta[property='og:title']").attr("content") ||
    $("title").text().trim() ||
    $("h1").first().text().trim() ||
    "Untitled Article";

  // Extract body text: prefer <article> → <main> → <body>
  const contentEl =
    $("article").first().length ? $("article").first() :
    $("main").first().length ? $("main").first() :
    $("body");

  const rawText = contentEl
    .find("p, h1, h2, h3, h4, li")
    .map((_, el) => $(el).text().trim())
    .get()
    .filter((t) => t.length > 20)
    .join("\n\n");

  const text = rawText.slice(0, 15_000).trim();

  if (text.length < 100) {
    throw new Error("Could not extract enough content from this URL. The page may require JavaScript or be behind a paywall.");
  }

  return { title: title.slice(0, 200), text, source };
}
