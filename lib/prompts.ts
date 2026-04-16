import { BATCHES, DELIVERABLES } from './deliverables';

export function buildSourceBlock(
  keyword: string,
  competitors: string[],
  externals: string[]
): string {
  let block = `## TARGET KEYWORD\n${keyword}\n\n## COMPETITOR CONTENT\n\n`;
  competitors.forEach((c, i) => {
    if (c && c.trim()) block += `### Source ${i + 1} (Competitor)\n${c}\n\n---\n\n`;
  });
  const hasExt = externals.some((e) => e && e.trim());
  if (hasExt) {
    block += `## EXTERNAL HIGH-QUALITY REFERENCE CONTENT\n\n`;
    externals.forEach((e, i) => {
      if (e && e.trim()) block += `### External Ref ${i + 1}\n${e}\n\n---\n\n`;
    });
  }
  return block;
}

export const BATCH_SPECS: Record<number, string> = {
  0: `Spec for this batch:

**Deliverable 1 — Audience & Tone Profile:**
Include: Audience type (Beginner/Intermediate/Expert/Business/Local), education level, dominant audience signals with evidence phrases, search intent per source with conflict flags, tone per source with 2-3 evidence phrases, sentence length patterns (short/medium/long), avg paragraph size, bullet vs prose ratio, power word frequency. End with a RECOMMENDED profile: writing tone, complexity level, content angle, sentence pattern, paragraph density.

**Deliverable 2 — Competitor Heading Hierarchy:**
Per source, extract exact H1 → H2 → H3 tree using indented bullet format.

**Deliverable 3 — Section Depth + Quality Score:**
Table per source with columns: Section (H2), Word count est., Answers "what" (Y/N), Answers "how" (Y/N), Numbered steps (Y/N), Real example (Y/N), Practical takeaway (Y/N), Depth Score (0-5). Flag any section scoring ≤2 as "Shallow — Opportunity Target".

**Deliverable 4 — Readability Profile:**
Per source: estimated Flesch-Kincaid grade level with evidence (sentence length, vocab complexity, passive voice usage). Flag if above/below target audience level.

**Deliverable 5 — Content Freshness Report:**
Per source: last updated date if visible, year-specific mentions, outdated stats/tools/references flagged, freshness score [Fresh/Stale/Unknown].`,

  1: `Spec for this batch:

**Deliverable 6 — NLP Term Frequency Table:**
Top 30 terms across all sources. Columns: Term, Frequency Count, Source(s). Flag terms appearing in 3+ sources as HIGH SEMANTIC WEIGHT.

**Deliverable 7 — Entity Relationship Map:**
Table with columns: Entity Name, Entity Type (Tool/Brand/Concept/Person/Location), Related Entities, Related Concepts, Source(s).

**Deliverable 8 — PAA Question Bank:**
Minimum 15 questions. Numbered list. Each entry labeled: [Extracted from heading / body / implied].`,

  2: `Spec for this batch:

**Deliverable 9 — Vocabulary + Power Words Bank:**
5-column categorized table: Informational words, Technical words, Emotional trigger words (with 1-sentence context), Conversion words, Power words (min 20 with category tag: Trust/Urgency/Curiosity/Clarity and frequency).

**Deliverable 10 — Intent-Mapped Keyword Groups:**
4 buckets: Informational, Commercial, Transactional, Navigational. Flag mixed-intent keywords. End with section-level intent map.

**Deliverable 11 — SERP + AEO Format Analysis:**
Featured snippet patterns found (classify: Paragraph/Numbered/Bulleted/Table/Code). FAQ patterns (explicit + implicit). Content format per source (How-to/Listicle/Definition/Comparison/Service/Mixed). GEO/local signals.

**Deliverable 12 — Content Gap + Differentiation Report:**
Missing subtopics, shallow coverage areas, outdated flags, differentiation opportunities (contrarian points, under-served angles, depth gaps, format gaps). End with opportunity points table: Gap Type | What's Missing | Why It Matters | Priority.`,

  3: `Spec for this batch:

**Deliverable 13 — Example & Case Study Inventory:**
Real-world examples (description, topic, source, type). Case studies. Use-case scenarios per user type. Before/after patterns. EXAMPLE GAPS flagged as "High insertion value".

**Deliverable 14 — E-E-A-T Signal Report:**
Per source — Experience signals, Expertise (credentials, citations, stats), Authority (brand mentions, external credible links), Trust (guarantees, testimonials, dates). End with E-E-A-T GAP TABLE: which signals are missing across ALL sources.

**Deliverable 15 — Visual Enhancement Plan:**
Table opportunities (data currently in prose), list opportunities (steps buried in paragraphs), diagram/infographic suggestions, screenshot/visual proof points, current visual usage assessment per source.`,

  4: `Spec for this batch:

**Deliverable 16 — Clean Keyword + Entity + Vocabulary + Example Bank:**
Deduplicated, filtered, high-value only. Four clearly-labeled banks:
- Clean Keyword Bank (primary/secondary/LSI/semantic)
- Clean Entity Bank (tools/brands/concepts/people)
- Clean Vocabulary Bank (informational/technical/emotional/conversion/power)
- Clean Example Bank (ready-to-reference)

**Deliverable 17 — Humanization Layer:**
12.1 Hook type analysis (Question/Pain/Stat/Story/Contrarian/Imagine) — which used in which source + effectiveness. Recommended hook for target content. 12.2 Storytelling insertion points + gaps. 12.3 Analogy opportunities. 12.4 Sentence rhythm guidance. 12.5 Reader psychology + emotional journey map (Awareness→Problem→Hope→Solution→Action) mapped to proposed H2s.`,

  5: `Spec for this batch:

**Deliverable 18 — Intro Generation Framework:**
13.1 Intro pattern per source, label framework (AIDA/PAS/Problem-Promise/Direct). 13.2 TWO recommended intro framework options with: framework name, opening sentence pattern, word count target, keywords to include, emotional trigger words to inject. 13.3 First 100 words strategy checklist. 13.4 Intro anti-patterns to avoid.

**Deliverable 19 — Flow & Transition Map:**
14.1 Transition phrase extraction table (Type | Phrase | Source | Where Used). 14.2 Section-to-section connection map. 14.3 Flow quality assessment per source. 14.4 Micro-transition opportunities within sections.

**Deliverable 20 — Engagement Optimization Layer:**
15.1 Curiosity loops extracted. 15.2 Open loop plant→close positions. 15.3 Scroll triggers / pattern interrupts. 15.4 Micro-hook inventory with recommended type per H2. 15.5 Curiosity question bank (section → implied reader question).`,

  6: `Spec for this batch — THE MASTER DELIVERABLE:

**Deliverable 21 — Full Intent-Based SEO Outline:**
Produce a complete hierarchical outline (H1 → H2 → H3) for the TARGET KEYWORD article.

Rules:
- Logical flow: broad → specific → action
- Matches audience complexity
- No intent mixing within a section
- Writing layer fully integrated

For EACH heading (H1, every H2, every H3) include a full metadata table with ALL these fields:
- Heading text
- Heading level (H1/H2/H3)
- Target intent (Informational/Commercial/Transactional)
- Primary keyword
- Secondary keywords
- LSI keywords
- Entities to reference
- Informational vocabulary
- Technical vocabulary
- Emotional trigger words
- Conversion vocabulary (if applicable)
- Power words
- PAA question(s) this section answers
- Recommended word count range
- Recommended content format (Paragraph/List/Table/Steps)
- Featured snippet opportunity (Yes/No/Type)
- Depth Quality targets
- Example/case study to insert
- E-E-A-T signal to include
- Visual enhancement opportunity
- Micro-hook type for section opening
- Storytelling opportunity
- Transition to next section
- Reader psychology moment (Awareness→Action position)

Make this comprehensive. This is the blueprint the writer will follow.`,

  7: `Spec for this batch:

**Deliverable 22 — Intro Blueprint:**
Standalone spec: selected intro framework, hook type, emotional trigger words for intro, primary keyword placement, reader psychology target, word count range, anti-patterns to avoid, open loop to plant.

**Deliverable 23 — Internal Linking Strategy:**
18.1 Internal linking opportunities table: Topic in Article | Suggested Internal Page Type | Rationale. 18.2 Anchor text suggestions table: Anchor Text | Target Page Type | Source Keyword.

**Deliverable 24 — CTA + Conversion Signal Map:**
19.1 CTA placement map: Position | Section | Trigger Phrase | Intent Served. 19.2 Trust signal inventory with "Missing across all sources?" column. 19.3 Priority trust signals to add. 19.4 Persuasion layer map.

**Deliverable 25 — Content Maintenance Plan:**
20.1 Evergreen vs time-sensitive classification table per H2. 20.2 Update triggers. 20.3 Annual review checklist.`,
};

export function buildBatchPrompt(
  batchIndex: number,
  sourceBlock: string
): string {
  const batch = BATCHES[batchIndex];
  const deliverables = batch.ids.map((id) => DELIVERABLES.find((d) => d.id === id)!);
  const tasks = deliverables.map((d) => `### Deliverable ${d.id}: ${d.title} (${d.subtitle})`).join('\n');

  return `You are an expert SEO + content intelligence analyst operating under this strict system:

OPERATING RULES:
- Job is DATA EXTRACTION + ORGANIZATION + WRITING INTELLIGENCE only
- Do NOT generate new content or rephrase competitor content
- Do NOT add unsupported opinions beyond extracted data
- Output must be structured, clean, and logically organized
- Every extracted item must be traceable to its source (label sources S1, S2, S3, S4, S5)
- Use markdown tables where the framework asks for them
- Use bullet points and clear headings
- No fluff, no repetition, no keyword stuffing

${sourceBlock}

## YOUR TASK
Generate the following deliverables from the Master SEO + AEO + Content Writing Intelligence System v2.0. Follow the exact specification for each. Use markdown formatting throughout.

${tasks}

## FORMAT RULES
- Start each deliverable with a level-2 heading: "## Deliverable [N]: [Title]"
- Use tables (markdown format with pipes) wherever the spec calls for tabular data
- Cite sources as (S1), (S2) etc.
- If a source has no data for a given field, write "Not found in sources"
- Be thorough but concise

## DETAILED SPEC
${BATCH_SPECS[batchIndex]}

Begin now. Generate all ${batch.ids.length} deliverable(s) in sequence.`;
}

export function parseBatchResponse(
  responseText: string,
  batchIds: number[]
): Record<number, string> {
  const parsed: Record<number, string> = {};
  batchIds.forEach((id, idx) => {
    const nextId = batchIds[idx + 1];
    const startPattern = new RegExp(`##\\s*Deliverable\\s*${id}[:\\s]`, 'i');
    const startMatch = responseText.match(startPattern);
    if (!startMatch || startMatch.index === undefined) {
      parsed[id] = `*Could not parse deliverable ${id} from response. Raw output:*\n\n${responseText}`;
      return;
    }
    const startIdx = startMatch.index;
    let endIdx = responseText.length;
    if (nextId !== undefined) {
      const endPattern = new RegExp(`##\\s*Deliverable\\s*${nextId}[:\\s]`, 'i');
      const endMatch = responseText.match(endPattern);
      if (endMatch && endMatch.index !== undefined) endIdx = endMatch.index;
    }
    parsed[id] = responseText.slice(startIdx, endIdx).trim();
  });
  return parsed;
}
