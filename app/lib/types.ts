export type Competitor = { name: string; domain: string };

export type Recommendation = {
  dimension: string;
  /** Evidence about the user's page. */
  yourEvidence: string;
  /** Evidence about the competitor's page. */
  competitorEvidence: string;
  /** What the user should do. */
  action: string;
  /** Name of the competitor this insight compared against. */
  competitor?: string;
};

export type AnalysisData = {
  scores: Record<string, number>;
  recommendations: Recommendation[];
  url?: string;
  /** Map of label → Firecrawl screenshot URL. Keys: "your_page" or competitor name. */
  screenshots?: Record<string, string>;
};
