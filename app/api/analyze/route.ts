import Anthropic from "@anthropic-ai/sdk";
import Firecrawl from "@mendable/firecrawl-js";
import { shouldUseMock } from "../_lib/mock-guard";

// Vision + 4 Firecrawl scrapes can blow past 60s on heavy SaaS pages.
// Use Vercel's 300s ceiling and rely on per-stage timing logs to find the long pole.
export const maxDuration = 300;

type Competitor = { name: string; domain: string };

const MOCK_ANALYSIS = {
  scores: {
    hero_clarity: 7,
    cta_strength: 6,
    social_proof: 5,
  },
  recommendations: [
    {
      dimension: "hero_clarity",
      competitor: "Linear",
      yourEvidence:
        "Your headline states the feature, not the outcome — it reads as a product description rather than a benefit the user walks away with.",
      competitorEvidence:
        "Linear's hero leads with a measurable benefit and pairs it with a visual proof point above the fold.",
      action:
        "Rewrite the hero to lead with the user outcome in 6–8 words; move the feature description to the sub-headline.",
    },
    {
      dimension: "cta_strength",
      competitor: "ClickUp",
      yourEvidence:
        "Single CTA is visible but lacks urgency framing or first-person microcopy.",
      competitorEvidence:
        "ClickUp repeats the CTA after each value section and uses first-person microcopy ('Start my workspace').",
      action:
        "Add a secondary CTA after the social-proof block and rewrite the primary CTA in first-person voice.",
    },
    {
      dimension: "social_proof",
      competitor: "Asana",
      yourEvidence:
        "Logos are present but there are no customer quotes or outcome numbers near the hero.",
      competitorEvidence:
        "Asana anchors its hero with 2 quantified proof points ('4.5M+ teams', '45% faster').",
      action:
        "Add 1–2 quantified proof points within the first viewport and a short customer quote near the primary CTA.",
    },
  ],
};

const ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    scores: {
      type: "object",
      properties: {
        hero_clarity: { type: "integer" },
        cta_strength: { type: "integer" },
        social_proof: { type: "integer" },
        visual_hierarchy: { type: "integer" },
        pricing_transparency: { type: "integer" },
        mobile_readiness: { type: "integer" },
      },
      required: [
        "hero_clarity",
        "cta_strength",
        "social_proof",
        "visual_hierarchy",
        "pricing_transparency",
        "mobile_readiness",
      ],
      additionalProperties: false,
    },
    insights: {
      type: "array",
      items: {
        type: "object",
        properties: {
          dimension: { type: "string" },
          competitor_name: { type: "string" },
          your_score: { type: "integer" },
          competitor_score: { type: "integer" },
          your_evidence: { type: "string" },
          competitor_evidence: { type: "string" },
          recommendation: { type: "string" },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
        },
        required: [
          "dimension",
          "competitor_name",
          "your_score",
          "competitor_score",
          "your_evidence",
          "competitor_evidence",
          "recommendation",
          "confidence",
        ],
        additionalProperties: false,
      },
    },
  },
  required: ["scores", "insights"],
  additionalProperties: false,
} as const;

type Insight = {
  dimension: string;
  competitor_name: string;
  your_score: number;
  competitor_score: number;
  your_evidence: string;
  competitor_evidence: string;
  recommendation: string;
  confidence: "high" | "medium" | "low";
};

type ScrapedPage = {
  label: string;
  url: string;
  markdown: string;
  screenshotUrl?: string;
  screenshotBase64?: string;
  screenshotMediaType?: "image/png" | "image/jpeg" | "image/webp" | "image/gif";
};

async function scrapePage(
  firecrawl: Firecrawl,
  label: string,
  url: string,
  withScreenshot: boolean,
  embedScreenshot: boolean,
): Promise<ScrapedPage> {
  const tStart = Date.now();
  const doc = await firecrawl.scrape(url, {
    formats: withScreenshot
      ? ["markdown", { type: "screenshot", fullPage: false }]
      : ["markdown"],
    onlyMainContent: true,
    waitFor: withScreenshot ? 2000 : 1000,
  });
  const tFirecrawl = Date.now() - tStart;
  console.log(
    `[analyze] firecrawl ${label} (${url}) → markdown=${(doc.markdown ?? "").length} chars, screenshotUrl=${doc.screenshot ?? "<none>"} (${tFirecrawl}ms)`,
  );
  const markdown = (doc.markdown ?? "").slice(0, 6000);

  let screenshotBase64: string | undefined;
  let screenshotMediaType: ScrapedPage["screenshotMediaType"] = "image/png";
  if (doc.screenshot && embedScreenshot) {
    const tDl = Date.now();
    const res = await fetch(doc.screenshot);
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      screenshotBase64 = buf.toString("base64");
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("jpeg")) screenshotMediaType = "image/jpeg";
      else if (ct.includes("webp")) screenshotMediaType = "image/webp";
      else if (ct.includes("gif")) screenshotMediaType = "image/gif";
      console.log(
        `[analyze] downloaded ${label} screenshot → ${buf.length} bytes, ${screenshotMediaType} (${Date.now() - tDl}ms)`,
      );
    } else {
      console.error(
        `[analyze] failed to fetch ${label} screenshot: ${res.status}`,
      );
    }
  }
  console.log(`[analyze] scrape ${label} total ${Date.now() - tStart}ms`);
  return {
    label,
    url,
    markdown,
    screenshotUrl: doc.screenshot,
    screenshotBase64,
    screenshotMediaType,
  };
}

export async function POST(request: Request) {
  if (shouldUseMock(request)) {
    return Response.json(MOCK_ANALYSIS);
  }
  const tRequestStart = Date.now();

  const body = await request.json().catch(() => null);
  const url = typeof body?.url === "string" ? body.url.trim() : "";
  const competitors: Competitor[] = Array.isArray(body?.competitors)
    ? body.competitors
    : [];
  if (!url) {
    return Response.json({ error: "Missing 'url' in request body" }, { status: 400 });
  }
  if (competitors.length === 0) {
    return Response.json({ error: "Missing 'competitors' array" }, { status: 400 });
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

  const normalize = (u: string) =>
    /^https?:\/\//i.test(u) ? u : `https://${u}`;

  // User page: markdown + screenshot embedded for Claude (the page being scored).
  // Competitor pages: screenshot URL captured for UI thumbnails, but bytes are
  // NOT embedded for Claude — vision-on-3-images was the 45s long pole.
  // Competitor evidence comes from markdown; visual claims about competitors
  // must be grounded in markdown structure or tagged confidence:"low".
  const targets = [
    {
      label: "your_page",
      url: normalize(url),
      withScreenshot: true,
      embedScreenshot: true,
    },
    ...competitors.slice(0, 3).map((c) => ({
      label: c.name,
      url: normalize(c.domain),
      withScreenshot: true,
      embedScreenshot: false,
    })),
  ];

  // Tolerant parallelism: one failed scrape shouldn't tank the whole request.
  const tScrapeStart = Date.now();
  const settled = await Promise.allSettled(
    targets.map((t) =>
      scrapePage(firecrawl, t.label, t.url, t.withScreenshot, t.embedScreenshot),
    ),
  );
  console.log(
    `[analyze] all scrapes settled in ${Date.now() - tScrapeStart}ms`,
  );

  const pages: ScrapedPage[] = [];
  for (let i = 0; i < settled.length; i++) {
    const r = settled[i];
    if (r.status === "fulfilled") {
      pages.push(r.value);
    } else {
      const msg = r.reason instanceof Error ? r.reason.message : String(r.reason);
      console.error(
        `[analyze] scrape failed for ${targets[i].label} (${targets[i].url}):`,
        msg,
      );
    }
  }

  const userPage = pages.find((p) => p.label === "your_page");
  const competitorPages = pages.filter((p) => p.label !== "your_page");

  if (!userPage) {
    const userFailure = settled[0];
    const detail =
      userFailure.status === "rejected"
        ? userFailure.reason instanceof Error
          ? userFailure.reason.message
          : String(userFailure.reason)
        : "Unknown";
    return Response.json(
      {
        error: "Could not scrape your page",
        detail,
      },
      { status: 502 },
    );
  }

  if (competitorPages.length === 0) {
    return Response.json(
      {
        error: "Could not scrape any competitor",
        detail: "All competitor pages failed to load. Try different competitors.",
      },
      { status: 502 },
    );
  }

  type ContentBlock =
    | { type: "text"; text: string }
    | {
        type: "image";
        source: {
          type: "base64";
          media_type: "image/png" | "image/jpeg" | "image/webp" | "image/gif";
          data: string;
        };
      };

  const competitorNames = competitorPages.map((p) => p.label).join(", ");
  const systemPrompt = `You are a senior conversion designer analyzing a SaaS landing page.
Score these 6 dimensions 1-10 and provide specific evidence:
- hero_clarity: headline clarity and outcome focus
- cta_strength: CTA specificity and urgency
- social_proof: trust signals quantity and quality
- visual_hierarchy: layout guiding eye to key actions
- pricing_transparency: pricing clarity
- mobile_readiness: mobile optimization signals

You will receive the USER's page as markdown AND a screenshot. You will
receive each COMPETITOR as markdown ONLY (no screenshot). Cite the actual
copy you can read, and — for the user's page — the visual elements you
can see. Never say "improve your CTA" without quoting the specific CTA text.

"scores" describes the USER's page. For each dimension produce ONE insight
comparing the user against whichever competitor contrasts most strongly on
that dimension. Use the user's screenshot to describe their page's visual
hierarchy, imagery, and layout concretely. For COMPETITORS, ground claims
in their markdown — quoted copy, heading structure, presence/absence of
sections. Do NOT invent visual details about competitors you cannot see;
if a comparison would require seeing a competitor's layout or imagery,
either reframe it around copy/structure or set "confidence":"low".
**Spread the comparisons across competitors — don't pick the same
competitor for every insight.** Different competitors are usually strongest
at different things, so vary your picks. Set "competitor_name" to the exact
competitor you picked — it MUST be one of: ${competitorNames}. Return ONLY
the JSON the schema demands.`;

  const content: ContentBlock[] = [
    {
      type: "text",
      text: `=== USER PAGE (${userPage.url}) — markdown + screenshot ===\n${userPage.markdown}`,
    },
  ];
  if (userPage.screenshotBase64 && userPage.screenshotMediaType) {
    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: userPage.screenshotMediaType,
        data: userPage.screenshotBase64,
      },
    });
  }

  for (const p of competitorPages) {
    content.push({
      type: "text",
      text: `\n=== COMPETITOR: ${p.label} (${p.url}) — markdown only ===\n${p.markdown}`,
    });
  }

  try {
    const tClaude = Date.now();
    const imageCount = content.filter((b) => b.type === "image").length;
    console.log(
      `[analyze] claude.messages.create … (${imageCount} images, ${competitorPages.length} competitors)`,
    );
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 4096,
      system: systemPrompt,
      output_config: {
        format: { type: "json_schema", schema: ANALYSIS_SCHEMA },
      },
      messages: [{ role: "user", content }],
    });
    console.log(`[analyze] claude done (${Date.now() - tClaude}ms)`);

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      console.error("[analyze] no text block:", response.content);
      return Response.json(
        { error: "Empty response from analyzer" },
        { status: 502 },
      );
    }

    const parsed = JSON.parse(textBlock.text) as {
      scores: Record<string, number>;
      insights: Insight[];
    };

    // Top 3 insights by score gap, but prefer variety in competitor names so
    // each card cites a different competitor (and shows a different screenshot).
    const sortedByGap = [...parsed.insights].sort(
      (a, b) =>
        Math.abs(b.competitor_score - b.your_score) -
        Math.abs(a.competitor_score - a.your_score),
    );
    const topInsights: Insight[] = [];
    const usedCompetitors = new Set<string>();
    // Pass 1: take the highest-gap insight per unique competitor.
    for (const insight of sortedByGap) {
      if (topInsights.length >= 3) break;
      if (!usedCompetitors.has(insight.competitor_name)) {
        topInsights.push(insight);
        usedCompetitors.add(insight.competitor_name);
      }
    }
    // Pass 2: if we have fewer than 3 unique competitors, fill the rest with
    // the next highest-gap insights regardless of duplicate competitor.
    for (const insight of sortedByGap) {
      if (topInsights.length >= 3) break;
      if (!topInsights.includes(insight)) topInsights.push(insight);
    }

    // Screenshots keyed by label (user's page as "your_page", each
    // competitor by the exact name identify returned) so the frontend
    // can render the real Firecrawl capture per card.
    const screenshots: Record<string, string> = {};
    for (const p of pages) {
      if (p.screenshotUrl) screenshots[p.label] = p.screenshotUrl;
    }

    console.log(`[analyze] request total ${Date.now() - tRequestStart}ms`);
    return Response.json({
      scores: parsed.scores,
      recommendations: topInsights.map((i) => ({
        dimension: i.dimension,
        yourEvidence: i.your_evidence,
        competitorEvidence: i.competitor_evidence,
        action: i.recommendation,
        competitor: i.competitor_name,
      })),
      screenshots,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error("[analyze] claude call failed:", message, stack);
    return Response.json(
      { error: "analyze failed", detail: message },
      { status: 500 },
    );
  }
}
