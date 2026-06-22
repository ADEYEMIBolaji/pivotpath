/**
 * Realistic UK job fixture data shared across mock adapters.
 * Used when an adapter's API key is not configured.
 */

import type { RawListing, SourceName } from '../types'

const now = new Date()
function daysAgo(n: number) {
  return new Date(now.getTime() - n * 86_400_000).toISOString()
}

function listing(
  externalId: string,
  sourceName: SourceName,
  overrides: Partial<RawListing> & Pick<RawListing, 'title' | 'employer' | 'location'>,
): RawListing {
  return {
    externalId,
    sourceName,
    sourceUrl: `https://example.com/jobs/${sourceName}/${externalId}`,
    remote: null,
    salaryMin: null,
    salaryMax: null,
    currency: 'GBP',
    postedAt: daysAgo(Math.floor(Math.random() * 20)),
    descriptionText: `We are looking for a talented ${overrides.title} to join our growing team.
You will be responsible for product management, stakeholder management, agile delivery,
and data analysis. Experience with sql, jira, figma, and user research is highly valued.
You should have strong communication and prioritisation skills. We work with okrs and kpis
to track progress. A background in operations management or project management is a bonus.`,
    rawSkills: [
      'product management', 'stakeholder management', 'agile', 'sql',
      'jira', 'user research', 'data analysis', 'prioritisation', 'okrs', 'communication',
    ],
    ...overrides,
  }
}

export const MOCK_REED: RawListing[] = [
  listing('reed-001', 'reed', {
    title: 'Associate Product Manager',
    employer: 'HealthTech Innovations Ltd',
    location: 'London (Hybrid)',
    remote: false,
    salaryMin: 45000,
    salaryMax: 55000,
    postedAt: daysAgo(3),
    rawSkills: ['product management', 'agile', 'user research', 'stakeholder management', 'jira', 'sql', 'data analysis', 'prioritisation'],
    descriptionText: `HealthTech Innovations is seeking an Associate PM to help shape our clinical workflow products.
You will run product discovery, own the roadmap, and work closely with clinicians and engineers.
Key skills: product strategy, user research, agile, jira, sql, stakeholder management, okrs, data analysis.
NHS or clinical background highly desirable. Remote-friendly with 2 days/wk in London.`,
  }),
  listing('reed-002', 'reed', {
    title: 'Product Operations Manager',
    employer: 'Babylon Health',
    location: 'London',
    remote: false,
    salaryMin: 50000,
    salaryMax: 62000,
    postedAt: daysAgo(7),
    rawSkills: ['product management', 'operations management', 'process improvement', 'stakeholder management', 'sql', 'data analysis', 'jira', 'okrs', 'forecasting'],
    descriptionText: `Babylon Health is looking for a Product Operations Manager to bridge our PM and engineering teams.
You will drive operational excellence, build processes, and ensure our teams work with clear prioritisation.
Skills needed: operations management, process improvement, sql, data analysis, okrs, forecasting, stakeholder management.`,
  }),
  listing('reed-003', 'reed', {
    title: 'Digital Health Product Manager',
    employer: 'NHS England',
    location: 'Leeds (Hybrid)',
    remote: true,
    salaryMin: 48353,
    salaryMax: 54619,
    postedAt: daysAgo(5),
    rawSkills: ['product management', 'agile', 'nhs', 'stakeholder management', 'user research', 'product roadmap', 'communication', 'clinical governance'],
    descriptionText: `NHS England is recruiting a Digital Health Product Manager to lead our patient-facing app portfolio.
You will manage the product roadmap, engage clinical stakeholders, and run agile ceremonies.
NHS Band 8a. Strong product management, agile, and clinical governance experience required.`,
  }),
  listing('reed-004', 'reed', {
    title: 'Senior Business Analyst',
    employer: 'Accenture',
    location: 'Manchester (Hybrid)',
    remote: false,
    salaryMin: 52000,
    salaryMax: 65000,
    postedAt: daysAgo(12),
    rawSkills: ['stakeholder management', 'process improvement', 'sql', 'data analysis', 'change management', 'project management', 'excel', 'powerbi', 'communication'],
    descriptionText: `Accenture is looking for a Senior BA with healthcare or public sector experience.
You will work on process improvement programmes, run stakeholder workshops, and deliver data analysis.
Skills: sql, powerbi, excel, change management, process improvement, project management.`,
  }),
  listing('reed-005', 'reed', {
    title: 'Product Manager — Clinical Informatics',
    employer: 'Cerner (Oracle Health)',
    location: 'London',
    remote: false,
    salaryMin: 65000,
    salaryMax: 80000,
    postedAt: daysAgo(2),
    rawSkills: ['product management', 'clinical informatics', 'ehr', 'agile', 'sql', 'stakeholder management', 'user research', 'product roadmap', 'nhs'],
    descriptionText: `Oracle Health is hiring a Clinical Informatics PM for our UK EHR platform.
You will work with trusts and clinicians to shape product strategy for our EHR portfolio.
Must have: ehr, clinical informatics, product management, agile, sql, stakeholder management, nhs experience.`,
  }),
]

export const MOCK_ADZUNA: RawListing[] = [
  listing('adzuna-001', 'adzuna', {
    title: 'Associate Product Manager',
    employer: 'HealthTech Innovations Ltd',
    location: 'London',
    remote: false,
    salaryMin: 45000,
    salaryMax: 55000,
    postedAt: daysAgo(3),
    rawSkills: ['product management', 'agile', 'user research', 'stakeholder management', 'jira', 'sql', 'data analysis', 'prioritisation'],
    descriptionText: 'Cross-posted listing — same role as Reed.',
  }),
  listing('adzuna-002', 'adzuna', {
    title: 'Operations Manager — Digital Services',
    employer: 'BUPA',
    location: 'Bristol (Hybrid)',
    remote: false,
    salaryMin: 48000,
    salaryMax: 56000,
    postedAt: daysAgo(9),
    rawSkills: ['operations management', 'process improvement', 'stakeholder management', 'project management', 'change management', 'excel', 'forecasting', 'budget management'],
    descriptionText: `BUPA Digital is hiring an Operations Manager to oversee our UK digital health services.
You will manage cross-functional teams, own operational KPIs, and drive process improvement.
Skills: operations management, process improvement, forecasting, budget management, change management.`,
  }),
  listing('adzuna-003', 'adzuna', {
    title: 'Product Manager',
    employer: 'Depop',
    location: 'London (Remote-first)',
    remote: true,
    salaryMin: 70000,
    salaryMax: 85000,
    postedAt: daysAgo(1),
    rawSkills: ['product management', 'product strategy', 'a/b testing', 'sql', 'amplitude', 'user research', 'agile', 'go-to-market', 'prioritisation', 'okrs'],
    descriptionText: `Depop is seeking a PM for our buyer experience team.
Own the discovery-to-launch lifecycle: product strategy, a/b testing, sql analysis, user research.
Tools: amplitude, jira, figma, sql. Remote-first with monthly London meet-ups.`,
  }),
  listing('adzuna-004', 'adzuna', {
    title: 'Healthcare Technology Consultant',
    employer: 'McKinsey & Company',
    location: 'London',
    remote: false,
    salaryMin: 75000,
    salaryMax: 95000,
    postedAt: daysAgo(14),
    rawSkills: ['stakeholder management', 'data analysis', 'process improvement', 'change management', 'presentation', 'project management', 'communication', 'leadership'],
    descriptionText: `McKinsey's Healthcare Practice is hiring at Consultant level.
Projects span NHS transformation, digital health strategy, and health system operations.
Strong analytical skills, stakeholder management, presentation, and data analysis required.`,
  }),
]

export const MOCK_LINKEDIN: RawListing[] = [
  listing('li-001', 'linkedin', {
    title: 'Product Manager — Health & Wellness',
    employer: 'Monzo',
    location: 'London (Hybrid)',
    remote: false,
    salaryMin: 75000,
    salaryMax: 95000,
    postedAt: daysAgo(4),
    rawSkills: ['product management', 'product strategy', 'user research', 'a/b testing', 'sql', 'stakeholder management', 'agile', 'okrs', 'data analysis', 'go-to-market'],
    descriptionText: `Monzo is building health and financial wellness features. We need a PM who can blend empathy with data.
You'll own discovery, roadmap, and launch for our wellness product line.
Requires: sql, user research, a/b testing, stakeholder management, product strategy, agile.`,
  }),
  listing('li-002', 'linkedin', {
    title: 'Associate Product Manager',
    employer: 'NHS Digital',
    location: 'Leeds (Remote-friendly)',
    remote: true,
    salaryMin: 37338,
    salaryMax: 44962,
    postedAt: daysAgo(6),
    rawSkills: ['product management', 'agile', 'user research', 'stakeholder management', 'nhs', 'jira', 'communication', 'product roadmap'],
    descriptionText: `NHS Digital APM Programme — 2-year rotational role across digital health products.
Work with clinical teams, run user research, manage backlogs, and ship to millions of NHS patients.
NHS Band 6. Skills: agile, user research, stakeholder management, product management, communication.`,
  }),
  listing('li-003', 'linkedin', {
    title: 'Operations & Strategy Manager',
    employer: 'Babylon Health',
    location: 'London',
    remote: false,
    salaryMin: 55000,
    salaryMax: 68000,
    postedAt: daysAgo(10),
    rawSkills: ['operations management', 'stakeholder management', 'data analysis', 'sql', 'forecasting', 'process improvement', 'okrs', 'excel', 'presentation'],
    descriptionText: `Strategy & Operations role at Babylon — own operational metrics, drive efficiency, work with the C-suite.
Strong data analysis (sql, excel), stakeholder management, and operations management background needed.`,
  }),
]

export const MOCK_OTTA: RawListing[] = [
  listing('otta-001', 'otta', {
    title: 'Product Manager — Data',
    employer: 'Palantir Technologies',
    location: 'London',
    remote: false,
    salaryMin: 80000,
    salaryMax: 110000,
    postedAt: daysAgo(5),
    rawSkills: ['product management', 'data science', 'sql', 'python', 'stakeholder management', 'product strategy', 'agile', 'communication', 'prioritisation', 'okrs'],
    descriptionText: `Palantir UK is looking for a Product Manager to own our data platform for NHS and government clients.
SQL proficiency required. Python a plus. Must be comfortable with ambiguity and stakeholder management.`,
  }),
  listing('otta-002', 'otta', {
    title: 'Associate PM — Healthcare',
    employer: 'Cera Care',
    location: 'London (Hybrid)',
    remote: false,
    salaryMin: 42000,
    salaryMax: 52000,
    postedAt: daysAgo(8),
    rawSkills: ['product management', 'agile', 'user research', 'stakeholder management', 'jira', 'data analysis', 'communication', 'prioritisation'],
    descriptionText: `Cera is the UK's largest tech-enabled home care company. We're hiring an APM to build tools for carers.
Background in health or operations a strong plus. Agile, user research, jira, stakeholder management required.`,
  }),
  listing('otta-003', 'otta', {
    title: 'Product Operations Lead',
    employer: 'Farewill',
    location: 'London (Remote-first)',
    remote: true,
    salaryMin: 55000,
    salaryMax: 70000,
    postedAt: daysAgo(2),
    rawSkills: ['product management', 'operations management', 'process improvement', 'sql', 'data analysis', 'stakeholder management', 'change management', 'okrs'],
    descriptionText: `Farewill is making end-of-life services accessible and affordable. We need a Product Ops Lead to run the engine.
You'll own our product tooling, processes, and data pipelines. Strong sql, process improvement, and ops management needed.`,
  }),
]

export const MOCK_NHS: RawListing[] = [
  listing('nhs-001', 'nhs', {
    title: 'Digital Programme Manager',
    employer: 'NHS South East London ICB',
    location: 'London (Hybrid)',
    remote: false,
    salaryMin: 53755,
    salaryMax: 60504,
    postedAt: daysAgo(4),
    rawSkills: ['programme management', 'project management', 'nhs', 'stakeholder management', 'agile', 'change management', 'clinical governance', 'budget management', 'leadership'],
    descriptionText: `South East London ICB is recruiting a Digital Programme Manager (Band 8a) to oversee digital transformation.
Manage multiple concurrent workstreams, engage clinical leads, and drive system-wide digital change.
Essential: programme management, change management, nhs, stakeholder management, budget management.`,
  }),
  listing('nhs-002', 'nhs', {
    title: 'Clinical Informatics Specialist',
    employer: 'King\'s College Hospital NHS Foundation Trust',
    location: 'London',
    remote: false,
    salaryMin: 46148,
    salaryMax: 52809,
    postedAt: daysAgo(9),
    rawSkills: ['clinical informatics', 'ehr', 'nhs', 'clinical governance', 'data analysis', 'sql', 'stakeholder management', 'audit', 'quality improvement'],
    descriptionText: `King's College Hospital is hiring a Clinical Informatics Specialist (Band 7) to support Epic EHR implementation.
Strong clinical background required with ehr, data analysis, sql, and quality improvement expertise.
You will liaise between clinical and technical teams, audit workflows, and champion patient safety.`,
  }),
  listing('nhs-003', 'nhs', {
    title: 'Health Informatics Analyst',
    employer: 'NHS Midlands',
    location: 'Birmingham (Hybrid)',
    remote: true,
    salaryMin: 37338,
    salaryMax: 44962,
    postedAt: daysAgo(3),
    rawSkills: ['clinical informatics', 'data analysis', 'sql', 'excel', 'powerbi', 'nhs', 'audit', 'stakeholder management'],
    descriptionText: `NHS Midlands seeks a Health Informatics Analyst (Band 6) to support population health management.
Build dashboards, analyse patient data, and present insights to clinical leads.
Skills: sql, powerbi, excel, data analysis, clinical informatics, nhs, stakeholder management.`,
  }),
]

export const MOCK_CIVIL_SERVICE: RawListing[] = [
  listing('cs-001', 'civil-service', {
    title: 'Digital Policy Manager',
    employer: 'Department of Health and Social Care',
    location: 'London (Hybrid)',
    remote: false,
    salaryMin: 54000,
    salaryMax: 65000,
    postedAt: daysAgo(6),
    rawSkills: ['stakeholder management', 'communication', 'policy', 'data analysis', 'presentation', 'project management', 'change management', 'leadership'],
    descriptionText: `DHSC is recruiting a Digital Policy Manager (Grade 7) to shape NHS digital strategy.
You will develop policy, engage stakeholders, and produce evidence-based recommendations.
Essential: policy analysis, stakeholder management, data analysis, communication, presentation skills.`,
  }),
  listing('cs-002', 'civil-service', {
    title: 'Technology Transformation Lead',
    employer: 'NHS Business Services Authority',
    location: 'Newcastle (Hybrid)',
    remote: true,
    salaryMin: 54000,
    salaryMax: 65000,
    postedAt: daysAgo(11),
    rawSkills: ['project management', 'stakeholder management', 'change management', 'agile', 'process improvement', 'leadership', 'communication', 'budget management'],
    descriptionText: `NHS BSA Grade 7 role leading technology transformation across our business services.
Manage suppliers, lead agile delivery, and drive digital change across the organisation.
Skills: agile, project management, change management, stakeholder management, budget management.`,
  }),
  listing('cs-003', 'civil-service', {
    title: 'Data and Insight Manager',
    employer: 'NHS England',
    location: 'Leeds (Remote-first)',
    remote: true,
    salaryMin: 40000,
    salaryMax: 50000,
    postedAt: daysAgo(2),
    rawSkills: ['data analysis', 'sql', 'powerbi', 'excel', 'stakeholder management', 'nhs', 'communication', 'forecasting', 'presentation'],
    descriptionText: `NHS England HEO role in our Analytics and Intelligence team.
Build reports, run sql queries, maintain powerbi dashboards, and present insights to senior leaders.
Strong sql, powerbi, excel, data analysis, and communication skills required.`,
  }),
]
