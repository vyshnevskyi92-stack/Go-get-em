import Anthropic from "@anthropic-ai/sdk";
import Firecrawl from "@mendable/firecrawl-js";
import { shouldUseMock } from "../_lib/mock-guard";

type Competitor = { name: string; domain: string };

const MOCK_COMPETITORS: Competitor[] = [
  { name: "Linear", domain: "linear.app" },
  { name: "Asana", domain: "asana.com" },
  { name: "ClickUp", domain: "clickup.com" },
];

function extractJSON(text: string) {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("No JSON array found in response");
  return JSON.parse(match[0]);
}

export async function POST(request: Request) {
  if (shouldUseMock(request)) {
    return Response.json({ competitors: MOCK_COMPETITORS });
  }

  const body = await request.json().catch(() => null);
  const url = typeof body?.url === "string" ? body.url.trim() : "";
  if (!url) {
    return Response.json({ error: "Missing 'url' in request body" }, { status: 400 });
  }

  if (!process.env.FIRECRAWL_API_KEY) {
    return Response.json(
      { error: "FIRECRAWL_API_KEY is not set on the server" },
      { status: 500 },
    );
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY is not set on the server" },
      { status: 500 },
    );
  }

  const firecrawl = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY });
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const normalizedUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;

  const start = Date.now();
  console.log(`[identify] start url=${normalizedUrl}`);

  try {
    // Single-page scrape only — never crawl the whole site. Markdown-only
    // here: identify doesn't need a screenshot, saves Firecrawl credits.
    console.log("[identify] firecrawl.scrape …");
    const scraped = await firecrawl.scrape(normalizedUrl, {
      formats: ["markdown"],
      onlyMainContent: true,
    });
    console.log(
      `[identify] firecrawl done (${Date.now() - start}ms) markdown=${(scraped.markdown ?? "").length} chars`,
    );
    // Keep token usage tight — first 3K chars is enough for positioning signals.
    const pageContent = (scraped.markdown ?? "").slice(0, 3000);
    if (!pageContent) {
      console.error("[identify] no markdown returned for", normalizedUrl, scraped);
      return Response.json(
        { error: "Firecrawl returned no markdown for this URL" },
        { status: 502 },
      );
    }

    console.log("[identify] anthropic.messages.create …");
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Based on this landing page content, identify the top 3 direct SaaS competitors. Return ONLY a JSON array: [{ name, domain }]. No other text.\n\nSource URL: ${url}\n\nLanding page content:\n\n${pageContent}`,
        },
      ],
    });
    console.log(
      `[identify] anthropic done (${Date.now() - start}ms) stop_reason=${response.stop_reason}`,
    );

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      console.error("[identify] no text block in response:", response.content);
      return Response.json({ error: "Empty response from model" }, { status: 502 });
    }

    const competitors = extractJSON(textBlock.text) as Competitor[];
    console.log(
      `[identify] ok (${Date.now() - start}ms) competitors=${competitors.length}`,
    );
    return Response.json({ competitors });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error("[identify] failed:", message, stack);
    return Response.json(
      { error: "identify failed", detail: message },
      { status: 500 },
    );
  }
}
