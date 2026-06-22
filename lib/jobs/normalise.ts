/**
 * Dedup key generation and fuzzy title matching.
 * No external dependencies — pure string operations.
 */

// ─── Abbreviation expansion ───────────────────────────────────────────────────
// Expand common shorthand before fuzzy comparison so
// "Associate PM" and "Associate Product Manager" share the same tokens.

const EXPANSIONS: Record<string, string> = {
  'pm':  'product manager',
  'apm': 'associate product manager',
  'gpm': 'group product manager',
  'spm': 'senior product manager',
  'tpm': 'technical product manager',
  'po':  'product owner',
  'ba':  'business analyst',
  'ux':  'user experience',
  'ui':  'user interface',
  'sm':  'scrum master',
  'swe': 'software engineer',
  'sde': 'software development engineer',
  'ml':  'machine learning',
  'ai':  'artificial intelligence',
  'hr':  'human resources',
  'pmo': 'project management office',
}

// Stopwords that add no dedup signal
const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'of', 'in', 'at', 'to', 'for',
  'with', 'on', 'is', 'are', 'be', 'been', 'being',
  'uk', 'gb', 'england', 'scotland', 'wales',
])

function tokenise(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .flatMap((t) => {
      const expanded = EXPANSIONS[t]
      return expanded ? expanded.split(' ') : [t]
    })
    .filter((t) => !STOPWORDS.has(t))
}

function normaliseField(s: string): string {
  return tokenise(s).sort().join(' ')
}

// ─── Dedup key ────────────────────────────────────────────────────────────────

/**
 * Produces a stable dedup key from employer + title + location.
 * Sorted tokens make "London Product Manager Acme" and "Acme Product Manager London" identical.
 */
export function dedupKey(employer: string, title: string, location: string): string {
  return [
    normaliseField(employer),
    normaliseField(title),
    normaliseField(location),
  ].join('::')
}

// ─── Levenshtein distance ─────────────────────────────────────────────────────

export function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  // Use two rows instead of full matrix — O(n) space
  let prev = Array.from({ length: n + 1 }, (_, j) => j)
  let curr = new Array<number>(n + 1)
  for (let i = 1; i <= m; i++) {
    curr[0] = i
    for (let j = 1; j <= n; j++) {
      curr[j] =
        a[i - 1] === b[j - 1]
          ? prev[j - 1]
          : 1 + Math.min(prev[j - 1], prev[j], curr[j - 1])
    }
    ;[prev, curr] = [curr, prev]
  }
  return prev[n]
}

// ─── Token-set similarity ─────────────────────────────────────────────────────
// Better than raw Levenshtein for job titles because word order varies.
// tokenSetSimilarity("Associate PM", "Associate Product Manager") → ~0.67

export function tokenSetSimilarity(a: string, b: string): number {
  const ta = new Set(tokenise(a))
  const tb = new Set(tokenise(b))
  if (ta.size === 0 && tb.size === 0) return 1
  const intersection = [...ta].filter((t) => tb.has(t)).length
  const union = new Set([...ta, ...tb]).size
  return intersection / union
}

// ─── Title fuzzy match ────────────────────────────────────────────────────────
// Returns true if two job titles are "close enough" to be the same role.
// Uses token-set similarity (fast) first; Levenshtein is the tiebreaker.

const TITLE_SIMILARITY_THRESHOLD = 0.6

export function titlesMatch(a: string, b: string): boolean {
  const tss = tokenSetSimilarity(a, b)
  if (tss >= TITLE_SIMILARITY_THRESHOLD) return true
  // Normalised Levenshtein fallback
  const na = normaliseField(a)
  const nb = normaliseField(b)
  const maxLen = Math.max(na.length, nb.length)
  if (maxLen === 0) return true
  return levenshtein(na, nb) / maxLen <= 0.35
}

// ─── Salary normalisation ─────────────────────────────────────────────────────
// Parse free-text salary strings and NHS/CS pay structures into annual GBP.

const K_FACTOR = 1_000

/** Parse "£30,000 - £35,000 per annum" → { min: 30000, max: 35000 } */
export function parseSalaryString(s: string): { min: number | null; max: number | null } {
  if (!s) return { min: null, max: null }
  const lower = s.toLowerCase()

  // "per hour" / "per day" — convert to annual
  const isHourly = lower.includes('hour') || lower.includes('/hr') || lower.includes('p/h')
  const isDaily  = lower.includes('day') || lower.includes('/day') || lower.includes('p/d')

  // Extract all numeric values
  const nums = [...s.matchAll(/(\d[\d,]*(?:\.\d+)?)\s*k?/gi)].map((m) => {
    const raw = parseFloat(m[1].replace(/,/g, ''))
    return m[0].toLowerCase().endsWith('k') ? raw * K_FACTOR : raw
  })

  if (nums.length === 0) return { min: null, max: null }

  let [min, max] = nums.length === 1 ? [nums[0], nums[0]] : [nums[0], nums[nums.length - 1]]

  if (isHourly) { min *= 1820; max *= 1820 }   // 35h/wk × 52
  if (isDaily)  { min *= 260;  max *= 260 }     // 5d/wk × 52

  // Sanity check — discard unrealistic values
  if (max < 1_000 || max > 999_999) return { min: null, max: null }

  return { min: Math.round(min), max: Math.round(max) }
}

/** NHS Agenda for Change 2024/25 pay bands */
const NHS_BANDS: Record<string, { min: number; max: number }> = {
  '2':  { min: 23615,  max: 25674  },
  '3':  { min: 24071,  max: 25674  },
  '4':  { min: 26530,  max: 29114  },
  '5':  { min: 29970,  max: 36483  },
  '6':  { min: 37338,  max: 44962  },
  '7':  { min: 46148,  max: 52809  },
  '8a': { min: 53755,  max: 60504  },
  '8b': { min: 62215,  max: 72293  },
  '8c': { min: 74290,  max: 85601  },
  '8d': { min: 88168,  max: 105376 },
  '9':  { min: 105376, max: 121271 },
}

export function parseNhsBand(band: string): { min: number; max: number } | null {
  const b = band.replace(/band\s*/i, '').trim().toLowerCase()
  return NHS_BANDS[b] ?? null
}

/** Civil Service pay grades (2024 approximate) */
const CS_GRADES: Record<string, { min: number; max: number }> = {
  'aa':    { min: 20000,  max: 23000  },
  'ao':    { min: 22000,  max: 26000  },
  'eo':    { min: 26000,  max: 32000  },
  'heo':   { min: 33000,  max: 40000  },
  'seo':   { min: 40000,  max: 50000  },
  'grade7':{ min: 54000,  max: 65000  },
  'grade6':{ min: 65000,  max: 80000  },
  'scs1':  { min: 75000,  max: 117800 },
  'scs2':  { min: 95000,  max: 162500 },
}

export function parseCsGrade(grade: string): { min: number; max: number } | null {
  const g = grade.toLowerCase().replace(/\s+/g, '').replace('grade ', 'grade')
  return CS_GRADES[g] ?? null
}

// ─── Skill extraction ─────────────────────────────────────────────────────────
// Lightweight keyword scan — no NLP dep. Adapters call this on descriptionText.

const SKILL_KEYWORDS = [
  // Product
  'product management','product strategy','product roadmap','product discovery',
  'user research','a/b testing','go-to-market','agile','scrum','kanban',
  'jira','confluence','figma','miro','amplitude','mixpanel','sql','data analysis',
  'stakeholder management','prioritisation','okrs','kpis',
  // Tech
  'python','javascript','typescript','react','node.js','aws','gcp','azure',
  'machine learning','data science','api','rest','graphql',
  // Operations
  'process improvement','six sigma','lean','operations management',
  'project management','programme management','change management',
  'budget management','forecasting','excel','powerbi','tableau',
  // Clinical / Health
  'clinical governance','patient safety','nhs','ehr','emr',
  'clinical informatics','quality improvement','audit',
  // Soft
  'leadership','communication','presentation','negotiation','coaching','mentoring',
]

export function extractSkills(text: string): string[] {
  const lower = text.toLowerCase()
  return SKILL_KEYWORDS.filter((skill) => lower.includes(skill))
}
