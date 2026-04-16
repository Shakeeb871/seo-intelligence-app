export type Deliverable = {
  id: number;
  phase: number;
  title: string;
  subtitle: string;
};

export const DELIVERABLES: Deliverable[] = [
  { id: 1, phase: 1, title: "Audience & Tone Profile", subtitle: "Step 1 — sentence/paragraph patterns included" },
  { id: 2, phase: 1, title: "Competitor Heading Hierarchy", subtitle: "Step 2.1 — per-source H1→H3 tree" },
  { id: 3, phase: 1, title: "Section Depth + Quality Score", subtitle: "Steps 2.2 + 2.3" },
  { id: 4, phase: 1, title: "Readability Profile", subtitle: "Step 2.4 — Flesch-Kincaid per source" },
  { id: 5, phase: 1, title: "Content Freshness Report", subtitle: "Step 2.5" },
  { id: 6, phase: 1, title: "NLP Term Frequency Table", subtitle: "Step 3.2 — top 30 terms" },
  { id: 7, phase: 1, title: "Entity Relationship Map", subtitle: "Step 3.4" },
  { id: 8, phase: 1, title: "PAA Question Bank (15+)", subtitle: "Step 3.5" },
  { id: 9, phase: 1, title: "Vocabulary + Power Words Bank", subtitle: "Step 4" },
  { id: 10, phase: 1, title: "Intent-Mapped Keyword Groups", subtitle: "Step 5" },
  { id: 11, phase: 1, title: "SERP + AEO Format Analysis", subtitle: "Step 6" },
  { id: 12, phase: 1, title: "Content Gap + Differentiation Report", subtitle: "Step 7" },
  { id: 13, phase: 2, title: "Example & Case Study Inventory", subtitle: "Step 8" },
  { id: 14, phase: 2, title: "E-E-A-T Signal Report", subtitle: "Step 9" },
  { id: 15, phase: 2, title: "Visual Enhancement Plan", subtitle: "Step 10" },
  { id: 16, phase: 3, title: "Clean Keyword + Entity + Vocab Bank", subtitle: "Step 11" },
  { id: 17, phase: 3, title: "Humanization Layer", subtitle: "Step 12 — hooks, storytelling, analogies" },
  { id: 18, phase: 3, title: "Intro Generation Framework", subtitle: "Step 13 — 2 options + first 100 words" },
  { id: 19, phase: 3, title: "Flow & Transition Map", subtitle: "Step 14" },
  { id: 20, phase: 3, title: "Engagement Optimization Layer", subtitle: "Step 15 — curiosity loops + micro-hooks" },
  { id: 21, phase: 4, title: "Full Intent-Based SEO Outline", subtitle: "Step 16 — MASTER BLUEPRINT" },
  { id: 22, phase: 4, title: "Intro Blueprint", subtitle: "Step 17 — standalone spec" },
  { id: 23, phase: 4, title: "Internal Linking Strategy", subtitle: "Step 18" },
  { id: 24, phase: 4, title: "CTA + Conversion Signal Map", subtitle: "Step 19 — trust signals included" },
  { id: 25, phase: 4, title: "Content Maintenance Plan", subtitle: "Step 20" },
];

export const BATCHES = [
  { index: 0, ids: [1, 2, 3, 4, 5], label: "Audience, structure, readability, freshness" },
  { index: 1, ids: [6, 7, 8], label: "NLP terms, entities, PAA questions" },
  { index: 2, ids: [9, 10, 11, 12], label: "Vocabulary, intent mapping, SERP, gaps" },
  { index: 3, ids: [13, 14, 15], label: "Examples, E-E-A-T, visual plan" },
  { index: 4, ids: [16, 17], label: "Clean banks + humanization layer" },
  { index: 5, ids: [18, 19, 20], label: "Intro framework, flow, engagement" },
  { index: 6, ids: [21], label: "Full SEO outline (master blueprint)" },
  { index: 7, ids: [22, 23, 24, 25], label: "Intro, linking, CTA, maintenance" },
];

export const PHASE_NAMES: Record<number, string> = {
  1: 'Research & Analysis',
  2: 'Content Intelligence',
  3: 'Writing Blueprint',
  4: 'Output Generation',
};
