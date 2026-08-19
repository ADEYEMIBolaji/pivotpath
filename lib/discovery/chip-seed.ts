/**
 * Discovery Mode intake seed data — TEST BUILD.
 *
 * Deliberately a plain data module, not JSX in the component: tuning the chip
 * banks (wording, adding/removing options, adjusting signal mappings) should
 * never require touching UI code. If this needs runtime tuning without a
 * redeploy later, promote it to a `discovery_chip_bank` table seeded from this
 * file — not needed for a v1 test build.
 *
 * `signal` is a hidden pointer to a likely functional skill, never shown in
 * the UI. It gives the Step 2 Claude call structured signal to reason from
 * before it's read a word of free text — a hint the model can confirm or
 * override once it has the fuller picture, not a verdict.
 */

import type { PromptBank } from './types'

export const INTAKE_PROMPTS: PromptBank[] = [
  {
    id: 'helped_unprompted',
    prompt: 'What do people ask you for help with, unprompted?',
    chips: [
      { id: 'hu-spreadsheet', label: 'Untangling a messy spreadsheet', signal: 'analysis' },
      { id: 'hu-explain-simply', label: 'Explaining something complicated simply', signal: 'teaching / plain-language communication' },
      { id: 'hu-conflict', label: 'Smoothing over a conflict', signal: 'de-escalation / mediation' },
      { id: 'hu-why-broke', label: 'Figuring out why something broke', signal: 'troubleshooting' },
      { id: 'hu-write-right', label: 'Writing something so it sounds right', signal: 'teaching / plain-language communication' },
      { id: 'hu-plan-event', label: 'Planning an event or a trip', signal: 'coordination / project management' },
      { id: 'hu-review-before', label: 'Reviewing something before it goes out', signal: 'attention to detail / quality control' },
      { id: 'hu-decide', label: 'Making a decision when no one else will', signal: 'decisiveness / judgment' },
      { id: 'hu-hard-conversation', label: 'Talking someone through a hard conversation', signal: 'mentorship / coaching' },
      { id: 'hu-fix-process', label: 'Fixing a process that keeps breaking', signal: 'process design' },
      { id: 'hu-read-room', label: 'Reading a tense room before anyone says anything', signal: 'emotional intelligence / active listening' },
      { id: 'hu-negotiate', label: 'Negotiating a better deal or terms', signal: 'negotiation' },
      { id: 'hu-technical', label: 'Untangling a technical problem', signal: 'troubleshooting' },
      { id: 'hu-keep-schedule', label: 'Keeping a group on schedule', signal: 'coordination / project management' },
      { id: 'hu-spot-risk', label: 'Spotting the risk nobody else saw', signal: 'risk anticipation' },
      { id: 'hu-jargon', label: 'Translating jargon for someone', signal: 'teaching / plain-language communication' },
    ],
  },
  {
    id: 'praised',
    prompt: 'What have you been praised for in the last 2 years?',
    chips: [
      { id: 'pr-calm', label: 'Staying calm under pressure', signal: 'composure under pressure' },
      { id: 'pr-catch-mistake', label: 'Catching a mistake before it became a problem', signal: 'attention to detail / quality control' },
      { id: 'pr-bring-together', label: 'Bringing people together', signal: 'relationship-building' },
      { id: 'pr-creative-fix', label: 'Coming up with a creative fix', signal: 'creative problem-solving' },
      { id: 'pr-easier', label: 'Making something easier to understand', signal: 'teaching / plain-language communication' },
      { id: 'pr-follow-through', label: 'Being the person who follows through', signal: 'ownership / follow-through' },
      { id: 'pr-system', label: 'Turning a mess into a system', signal: 'process design / organization' },
      { id: 'pr-difficult-client', label: 'Handling a difficult customer or client well', signal: 'de-escalation / mediation' },
      { id: 'pr-speak-up', label: 'Speaking up when something felt wrong', signal: 'decisiveness / judgment' },
      { id: 'pr-teach-skill', label: 'Teaching someone a new skill', signal: 'mentorship / coaching' },
      { id: 'pr-stalled-project', label: 'Getting a stalled project across the line', signal: 'coordination / project management' },
      { id: 'pr-root-cause', label: 'Finding the root cause of a recurring issue', signal: 'systems thinking' },
      { id: 'pr-good-call', label: 'Making a good call with limited information', signal: 'decisiveness / judgment' },
      { id: 'pr-team-works', label: 'Improving how a team works together', signal: 'coordination / relationship-building' },
      { id: 'pr-persuade', label: 'Persuading someone to see it differently', signal: 'persuasion' },
      { id: 'pr-noticed', label: 'Noticing what everyone else missed', signal: 'attention to detail / quality control' },
    ],
  },
  {
    id: 'fixed_unasked',
    prompt: 'What problems do you fix without being asked?',
    chips: [
      { id: 'fu-rewrite', label: 'Rewriting something so it actually makes sense', signal: 'teaching / plain-language communication' },
      { id: 'fu-reorganize', label: 'Reorganizing a messy system', signal: 'organization' },
      { id: 'fu-step-in', label: 'Stepping in before a conflict escalates', signal: 'de-escalation / mediation' },
      { id: 'fu-catch-error', label: 'Catching an error before it ships', signal: 'attention to detail / quality control' },
      { id: 'fu-fill-gap', label: 'Filling a gap nobody assigned', signal: 'ownership / follow-through' },
      { id: 'fu-handoff', label: 'Smoothing a handoff between people or teams', signal: 'coordination / project management' },
      { id: 'fu-simplify', label: 'Simplifying an overcomplicated process', signal: 'process design' },
      { id: 'fu-chase-info', label: 'Chasing down a missing piece of information', signal: 'ownership / follow-through' },
      { id: 'fu-correct-plan', label: "Correcting a plan that's about to go wrong", signal: 'risk anticipation' },
      { id: 'fu-clean-up', label: "Cleaning up after someone else's mistake", signal: 'ownership / follow-through' },
      { id: 'fu-same-page', label: "Making sure everyone's on the same page", signal: 'coordination / project management' },
      { id: 'fu-whatevers-on-hand', label: "Fixing something broken with whatever's on hand", signal: 'resourcefulness' },
      { id: 'fu-double-check', label: 'Double-checking work before it goes out', signal: 'attention to detail / quality control' },
      { id: 'fu-scheduling', label: 'Untangling a scheduling conflict', signal: 'coordination / project management' },
      { id: 'fu-diagnose', label: 'Diagnosing why a process keeps failing', signal: 'systems thinking' },
    ],
  },
  {
    id: 'not_real_work',
    prompt: 'What\'s a task you do that doesn\'t feel like "real work" to you?',
    chips: [
      { id: 'nrw-talk-through', label: 'Talking someone through a problem', signal: 'mentorship / coaching' },
      { id: 'nrw-tidy-systems', label: 'Organizing or tidying systems', signal: 'organization' },
      { id: 'nrw-at-ease', label: 'Making people feel at ease', signal: 'relationship-building' },
      { id: 'nrw-patterns', label: 'Spotting patterns in messy data', signal: 'analysis' },
      { id: 'nrw-explain', label: 'Explaining things simply', signal: 'teaching / plain-language communication' },
      { id: 'nrw-tension', label: 'Smoothing over tension in a room', signal: 'de-escalation / mediation' },
      { id: 'nrw-small-details', label: 'Keeping track of a dozen small details', signal: 'attention to detail / quality control' },
      { id: 'nrw-plan-on-fly', label: 'Coming up with a plan on the fly', signal: 'creative problem-solving' },
      { id: 'nrw-remember-needs', label: 'Listening and remembering what people need', signal: 'emotional intelligence / active listening' },
      { id: 'nrw-quick-tool', label: 'Building a quick tool or template', signal: 'process design' },
      { id: 'nrw-about-to-go-wrong', label: "Noticing when something's about to go wrong", signal: 'risk anticipation' },
      { id: 'nrw-self-doubt', label: 'Coaching someone through self-doubt', signal: 'mentorship / coaching' },
      { id: 'nrw-efficient', label: 'Making a boring task more efficient', signal: 'process design' },
      { id: 'nrw-between-lines', label: 'Reading between the lines of what people say', signal: 'emotional intelligence / active listening' },
      { id: 'nrw-inbox', label: 'Cleaning up a chaotic inbox or to-do list', signal: 'organization' },
    ],
  },
]

export function findChip(promptId: string, chipId: string): { bank: PromptBank; chip: PromptBank['chips'][number] } | null {
  const bank = INTAKE_PROMPTS.find((b) => b.id === promptId)
  const chip = bank?.chips.find((c) => c.id === chipId)
  if (!bank || !chip) return null
  return { bank, chip }
}
