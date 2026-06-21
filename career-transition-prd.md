# Product Requirements Document
## PivotPath — Career Transition Intelligence Platform
**Version:** 1.0 (MVP)
**Status:** Draft
**Author:** [Your Name]
**Date:** June 2026

---

## 1. Overview

### Problem Statement
Job seekers changing careers face a structural mismatch: job platforms are built for lateral movers. ATS systems reject career changers on title/keyword filters before a human ever reviews them. There is no tooling that helps a person translate their existing experience into the language of a new field, identify *what actually matters* to close the gap, and position themselves to get hired.

### Vision
PivotPath is the first end-to-end platform built specifically for career changers. It takes a user's existing background, maps it onto their target role, scores gap closability, and produces a repositioned profile and application strategy — turning "I don't qualify" into "I'm a non-obvious strong fit."

### MVP Goal
Validate the core value loop: **Skills Translation → Gap Scoring → Repositioned Résumé** in a single, focused web experience. Target 500 active users in the first 60 days with a 40%+ return rate.

---

## 2. Target Users

### Primary Persona — "The Mid-Career Pivoter"
- Age 28–45, 5–15 years in one field
- Clear on what they're leaving, fuzzy on exactly where they're landing
- Has tried applying, been rejected or ignored, and is now stuck
- Willing to invest time in a tool that explains *why* they're stuck
- Pain: "I know I can do this job. I can't get anyone to look at me."

### Secondary Persona — "The Forced Pivoter"
- Recently laid off, previous industry contracting (media, finance, tech)
- Needs to move fast, less emotionally attached to their old identity
- More willing to accept a repositioning if it leads to interviews
- Pain: "I need income within 3 months and my old field is gone."

### Out of Scope for MVP
- Students / first-job seekers (no experience to translate)
- Credential-locked pivots (medicine, law, licensed engineering)
- International credential recognition

---

## 3. Success Metrics

| Metric | MVP Target | Measurement |
|---|---|---|
| Users who complete the full skills assessment | >60% of signups | Funnel analytics |
| Users who generate a repositioned résumé | >40% of signups | Feature usage |
| Résumé download / copy rate | >70% of generated résumés | Action tracking |
| 7-day return rate | >35% | Session analytics |
| NPS score at end of onboarding | >45 | In-app survey |
| Users who report getting an interview | >15% within 30 days | Email follow-up survey |

---

## 4. MVP Scope

### In Scope
1. Onboarding & skills extraction from existing résumé / LinkedIn
2. Target role selection and job description analysis
3. Skills translation map (old skills → new domain vocabulary)
4. Gap scoring — ranked, prioritized, honest
5. Repositioned résumé generator
6. Basic application strategy output (job types, company signals, entry points)

### Out of Scope for MVP
- Portfolio / proof-of-work builder
- Warm network matching
- Job board integration
- Employer-facing product
- Mobile app
- Community / cohort features

---

## 5. User Flow

```
ONBOARDING
│
├── Step 1: Upload résumé or paste LinkedIn URL
│   └── Extract: titles, tenures, skills, accomplishments
│
├── Step 2: Select target role / field
│   ├── Guided selector (broad → specific)
│   └── Optionally paste a job description they're targeting
│
├── Step 3: Skills Translation Map is generated
│   ├── "Here's what you already have in the new language"
│   ├── "Here's what's directly transferable (high confidence)"
│   └── "Here's what's partial / needs framing"
│
├── Step 4: Gap Scorecard
│   ├── Disqualifying gaps (hard blockers)
│   ├── Closable gaps (learnable in <3 months)
│   └── Nice-to-haves (won't cost you the job)
│
├── Step 5: Repositioned Résumé
│   ├── Rewritten experience bullets in target field language
│   ├── Skills section reconfigured
│   └── Summary / headline rewritten for pivot
│
└── Step 6: Application Strategy Brief
    ├── Company types most likely to hire career changers
    ├── Roles that are bridge-friendly (adjacent entries)
    └── 3 immediate action items
```

---

## 6. Feature Specifications

### F1 — Résumé / Profile Ingestion

**Description:** Accept a résumé (PDF/DOCX) or LinkedIn profile URL. Parse and extract structured data.

**Acceptance Criteria:**
- Accepts PDF and DOCX up to 5MB
- Extracts: job titles, companies, dates, bullet points, skills section, education
- Handles messy formatting (non-standard résumés, functional formats)
- Shows parsed preview before proceeding; user can edit
- LinkedIn URL ingestion: scrape public profile or prompt user to paste text if blocked

**Edge Cases:**
- Résumé with no quantified accomplishments → prompt user to add 2–3 before continuing
- Employment gaps > 2 years → flag for user to optionally explain (return from caregiving, etc.)
- Freelance / non-linear career history → group by skillset, not employer

---

### F2 — Target Role Selection

**Description:** Let users define their destination with enough specificity to do meaningful translation.

**Acceptance Criteria:**
- Tiered selector: Industry → Function → Role (e.g., Tech → Product → Product Manager)
- Free-text fallback: "Describe the role you're targeting in your own words"
- Option to paste a specific job description (highest signal input)
- Show 2–3 representative job titles to confirm alignment before proceeding

**Edge Cases:**
- User doesn't know their target role → offer a "Help me figure this out" path that asks 5 diagnostic questions and suggests 3 role options
- User selects a credential-locked role → surface a warning: "This role typically requires [License/Degree]. We'll still show you the gap, but factor this in."

---

### F3 — Skills Translation Map

**Description:** The core intelligence feature. Map the user's actual skills onto the vocabulary, frameworks, and requirements of the target role.

**Acceptance Criteria:**
- Produce a two-column visual: "Your experience" | "What it means in [Target Field]"
- Group into: Direct transfers, Partial transfers (needs reframing), Missing entirely
- Each mapped skill has a confidence score (High / Medium / Low)
- Explanatory copy for each mapping — not just labels
- Exportable as a reference card

**Example:**
| Your Background | In Product Management |
|---|---|
| Managed ICU patient triage | Prioritization under constraint, stakeholder urgency |
| Documented treatment protocols | Process documentation, SOP writing |
| Coordinated multi-department rounds | Cross-functional collaboration |
| Tracked patient outcomes over time | Metrics ownership, longitudinal thinking |

**Edge Cases:**
- Very niche previous role (e.g., submarine sonar operator) → fall back to generic skill cluster extraction before mapping
- User's experience is heavily domain-specific with few generalizable skills → be honest, surface this clearly, suggest bridge roles rather than direct target

---

### F4 — Gap Scorecard

**Description:** Ranked, honest assessment of what the user is missing — and what it costs them.

**Acceptance Criteria:**
- Three tiers: 🔴 Disqualifying | 🟡 Closable | 🟢 Nice-to-have
- Each gap includes: What it is, Why it matters, How to close it (specific resource/action), Time to close estimate
- Overall "Pivot Readiness Score" (0–100) with plain-language explanation
- Readiness score must include a confidence band — not false precision

**Scoring Logic:**
- Disqualifying: Required by >70% of job descriptions for this role AND not translatable from existing experience
- Closable: Required by 30–70% of JDs OR translatable with reframing
- Nice-to-have: <30% of JDs or commonly listed but rarely filtered on

**Edge Cases:**
- User has 0 transferable skills for target role → don't hide it. Show the score, explain it clearly, and surface 2 adjacent roles where they'd score much higher
- User disagrees with a gap assessment → allow "I have this skill, here's why" override, which re-runs the analysis

---

### F5 — Repositioned Résumé Generator

**Description:** Rewrite the user's experience in the language of their target field, without fabricating anything.

**Acceptance Criteria:**
- Every rewritten bullet is traceable to the original — no invented facts
- Rewrites use the vocabulary, action verbs, and frameworks of the target industry
- Skills section reordered and renamed to match target role expectations
- Professional summary / headline rewritten for pivot narrative
- User can toggle between "Original" and "Repositioned" for each section
- Download as PDF and DOCX
- Explicit callout: "This is a reframe of your real experience, not embellishment. Review before sending."

**Edge Cases:**
- Thin résumé (< 3 roles, < 5 years experience) → flag that the résumé alone may not carry the pivot; suggest supplementing with project work or case studies
- User's accomplishments are vague ("responsible for X") → prompt to sharpen before rewriting ("Did you improve, create, reduce, or manage X? Roughly what scale?")
- Target role requires specific tools (e.g. SQL, Figma) that user hasn't listed → don't invent proficiency, but add to gap scorecard

---

### F6 — Application Strategy Brief

**Description:** A 1-page brief telling the user *where and how* to apply given their specific pivot profile.

**Acceptance Criteria:**
- Company types most likely to hire their profile (startups vs. enterprise, growth stage, mission-driven)
- 3 bridge role titles they should apply to as entry points (not just end target)
- 2–3 industries where their origin experience is a differentiator
- 3 immediate action items with time estimates
- Honest expectation setting: likely timeline, likely salary range impact

---

## 7. Technical Architecture (MVP)

```
Frontend: React (Next.js)
├── Onboarding multi-step wizard
├── Results dashboard (Translation Map, Scorecard, Résumé, Brief)
└── Résumé editor (diff view: original vs repositioned)

Backend: Node.js / Python FastAPI
├── File parsing service (PDF/DOCX → structured JSON)
├── LinkedIn scraper (or manual paste fallback)
├── Job description scraper & normalizer
└── Auth (email + OAuth via Clerk or Supabase Auth)

AI Layer: Anthropic Claude API (claude-sonnet-4-6)
├── Skills extraction prompt chain
├── Translation mapping prompt
├── Gap scoring prompt with JD context
├── Résumé rewriting prompt
└── Strategy brief prompt

Data
├── PostgreSQL (user profiles, sessions, résumé versions)
├── Redis (session state during onboarding)
└── S3 / Cloudflare R2 (file storage)

Job Description Intelligence
├── On paste: parse provided JD directly
├── On role selection: pull from curated JD corpus (scraped + normalized)
└── Skill taxonomy: O*NET API or custom maintained taxonomy
```

---

## 8. Design Principles

- **Honest over optimistic.** The product's credibility comes from telling people hard truths clearly. Never sugarcoat a low readiness score.
- **Progress over paralysis.** Every screen should end with a clear next action. The user should never stare at a result and not know what to do.
- **Show the reasoning.** Don't just output conclusions — show why a skill maps, why a gap is disqualifying. Transparency builds trust.
- **Non-judgmental tone.** Career changers are often anxious about being perceived as underqualified. The copy should feel like a skilled career coach, not a gatekeeper.

---

## 9. Claude Design Prompts

Use these prompts to generate UI designs for each screen.

---

### Prompt 1 — Overall Design System & Landing Page

```
You are designing the landing page and visual identity for PivotPath, a
career transition intelligence platform. The product is used by mid-career
professionals (28–45) who are changing fields and feeling stuck.

The brand should feel: credible and direct (not cheerful SaaS), intelligent
(not intimidating), and grounded in motion and progress. Think the visual
register of a serious editorial product, not a job board.

Design a full landing page with:
- Hero: A strong thesis headline about career transitions (not generic).
  The single most honest thing the product does: it translates who you
  already are into language the new field recognises.
- A "how it works" section showing the 5-step flow (Ingest → Translate →
  Score → Rewrite → Apply)
- A sample Skills Translation Map showing a nurse → product manager pivot
- Social proof section (testimonial style)
- CTA to start free

Visual direction:
- Color palette: Deep navy (#0F1923) primary, warm off-white (#F2EDE4) for
  surfaces, amber (#E8A838) as the single accent. One secondary muted teal
  (#2E6B6B) for success states.
- Typography: A geometric sans-serif for body (Inter or DM Sans), a
  higher-contrast display face for headlines (something with character —
  not Helvetica)
- Layout: Structured, information-dense but not cluttered. Respect
  whitespace. The Translation Map section should feel like a well-designed
  data table, not an infographic.
- No stock photo people. Use abstract structural motifs — grids, connectors,
  translation arrows — to imply movement between two states.
- Signature element: A "translation arrow" motif that appears throughout
  the product connecting old identity to new one.

Produce a complete, responsive HTML/CSS single-page design with real copy.
```

---

### Prompt 2 — Onboarding Wizard (Steps 1–3)

```
Design a multi-step onboarding wizard for PivotPath, a career transition
platform. The wizard has 5 steps; design steps 1–3.

Step 1 — Upload Your Background
- File upload zone for PDF/DOCX résumé (drag + drop)
- OR paste LinkedIn URL
- OR paste résumé text manually
- Show a "what we extract" explainer below (titles, skills, accomplishments)
- Progress bar: Step 1 of 5

Step 2 — Where Are You Heading?
- Tiered dropdown: Industry → Function → Role
- Large free-text field: "Or describe the role you're targeting"
- Option to paste a job description with a toggle
- Show 2–3 representative job title chips to confirm alignment
- Progress bar: Step 2 of 5

Step 3 — Confirm Your Extracted Profile
- Two-column card layout showing extracted: Job History | Skills
- Each item is editable inline
- Flagged items (gaps, vague bullets) shown with yellow highlights and edit prompts
- CTA: "This looks right — run my analysis"
- Progress bar: Step 3 of 5

Design system: Deep navy (#0F1923) background, off-white (#F2EDE4) cards,
amber (#E8A838) accent for CTAs and progress, teal (#2E6B6B) for
confirmed/success states. Inter for body, a display serif for section
headings. Clean, generous padding, no decorative gradients.

The wizard should feel focused and calm — a smart form, not a product tour.
Produce responsive HTML/CSS with real placeholder content.
```

---

### Prompt 3 — Skills Translation Map Screen

```
Design the Skills Translation Map results screen for PivotPath.

This is the first "wow" moment in the product. The user sees their old
experience mapped onto the vocabulary of their new field for the first time.

Layout: Full-width results page with a sticky left sidebar showing pivot
summary (From: ICU Nurse → To: Product Manager, Readiness Score: 67/100).

Main content: A structured two-column translation table:
Left column — "Your Experience" (original language, neutral typography)
Right column — "In Product Management" (target field vocabulary,
  highlighted in amber)

Each row includes:
- Original skill / experience description
- Arrow connector (the signature motif)
- Translated equivalent
- Confidence badge: HIGH / PARTIAL / NEEDS FRAMING

Below the table: A summary callout card:
"You have 8 of 12 core PM competencies — more than you think."

Color-code the rows:
- Green-tinted row: direct, high-confidence transfer
- Amber-tinted row: partial, needs reframing
- Neutral row: adjacent, worth mentioning

Below the table, a sectioned Gap Scorecard with 3 tier cards:
🔴 Disqualifying (1–2 items max), 🟡 Closable (3–4 items), 🟢 Nice-to-have

Design system: Same as above. The table should feel like a well-designed
intelligence report. Data-first, no decoration that doesn't serve the
content.

Include a sticky bottom action bar: "Generate My Repositioned Résumé →"

Produce responsive HTML/CSS with a real nurse → PM example populated.
```

---

### Prompt 4 — Repositioned Résumé Editor

```
Design the Repositioned Résumé screen for PivotPath.

Layout: Split-pane editor.
Left pane (40%): The user's original résumé in plain text — read-only,
  with sections labeled: Summary, Experience, Skills, Education.
Right pane (60%): The AI-repositioned version, fully editable.

Interaction:
- Each rewritten bullet is highlighted in amber on first load (shows what changed)
- Clicking a rewritten bullet shows a tooltip: "Original: [text]. Reframe
  rationale: [why this was changed for PM roles]"
- Inline editing on the right pane
- A "Diff mode" toggle shows a clean red/green diff view between versions
- Skills section at bottom: shows original skills greyed out, new priority
  skills at top in the target field vocabulary

Top bar:
- Pivot label: "ICU Nurse → Product Manager"
- Readiness score chip
- Download as PDF | Download as DOCX | Copy to Clipboard

Bottom section: "What's still missing" — 2–3 short callouts linking back
to gap items that the résumé can't fix alone (e.g., "No SQL listed —
add a course to your Skills or close this gap before applying")

Design system: Same as above. The editor should feel like a premium
writing tool — clean, minimal chrome, content-forward. Use monospace
or a document-style font for the résumé panes to signal "this is a
real document, not a summary card."

Produce responsive HTML/CSS with a complete nurse → PM résumé example.
```

---

### Prompt 5 — Application Strategy Brief

```
Design the Application Strategy Brief screen for PivotPath — the final
output after résumé generation.

This is a 1-page strategy document the user can reference while applying.
It should feel like a personalised career coach memo, not a generic tips list.

Sections:

1. Your Pivot Profile (top summary card)
   From: ICU Nurse (8 years) → To: Product Manager
   Readiness: 67/100 | Strongest asset: Process thinking under pressure
   Biggest gap: No shipped product / technical exposure

2. Where to Apply (company targeting)
   - Best fits: Health-tech startups, mission-driven SaaS, Series A–B
   - Why: Your domain expertise is a differentiator in health-tech; startups
     weight adaptability over credentials
   - Avoid for now: Enterprise tech PMs, FAANG APM programs (credential-heavy)

3. Bridge Role Titles (apply to these first)
   - Associate Product Manager (APM)
   - Product Operations Manager
   - Clinical Informatics Analyst → PM track
   Each with 1-line rationale

4. Your Origin as Advantage
   Short paragraph: "In health-tech interviews, lean into: high-stakes
   triage = prioritisation, protocol documentation = PRD writing,
   multi-discipline rounds = cross-functional leadership. These are
   not analogies — they are the job."

5. 30-Day Action Plan
   Week 1: [3 specific actions]
   Week 2: [3 specific actions]
   Week 3–4: [3 specific actions]

6. Honest Expectations
   Timeline: 3–6 months is realistic for a first PM role
   Salary: Expect 10–20% reduction in year 1 for most markets
   Leading indicator: 1 informational interview per week is the minimum
   signal of forward motion

Design: Document-style layout on off-white surface. Left-aligned,
information-dense but well-sectioned. Navy section headers, amber
accents for "do this" actions, teal for positive signals. The whole
page should be printable / saveable as a clean PDF.

Include a "Share this brief" button and a sticky CTA: "Start Applying →"

Produce responsive HTML/CSS with real example content.
```

---

## 10. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| AI hallucinations in résumé rewriting | High | High | Every output links to source bullet; user reviews before download |
| Users expect magic, reality is messy | High | Medium | Onboarding sets honest expectations; readiness score < 100 is normal |
| LinkedIn blocks scraping | High | Low | Offer paste-text fallback as primary path |
| Job taxonomy becomes stale | Medium | Medium | Use O*NET + quarterly manual review; allow user correction |
| Low conversion from analysis to résumé | Medium | High | Persistent "continue" prompt; email re-engagement at 24h |
| Competitor (LinkedIn, Resume.io) copies feature | Medium | Low | Speed and depth of pivot-specific logic is the moat |

---

## 11. Open Questions

1. **Monetisation for MVP:** Free with email gate, or freemium (translation free, résumé download paid)? Recommendation: free with email, add a $12/mo paid tier at week 6.
2. **LLM provider:** Single-provider (Anthropic) or multi-model routing? Recommendation: Anthropic only for MVP, add routing layer at scale.
3. **Job description corpus:** Build own scraper or license from a third party? Recommendation: Licensed data (Lightcast/Burning Glass) to avoid scraper fragility at launch.
4. **Privacy:** Are users comfortable with their résumé being processed by a third-party LLM? Need explicit consent + data retention policy before launch.

---

## 12. Launch Plan

| Phase | Timeframe | Goal |
|---|---|---|
| Private beta | Week 1–2 | 50 hand-picked users, collect qualitative feedback |
| Public beta | Week 3–6 | 500 users via Reddit (r/careerguidance, r/cscareerquestions), Twitter/X, Product Hunt |
| Iteration sprint | Week 7–10 | Prioritise top 3 friction points from beta |
| v1.0 | Week 12 | Paid tier launch, 1,000 active users target |

---

*This document is a living artifact. Update after each sprint.*
