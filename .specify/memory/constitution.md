<!--
Sync Impact Report
Version change: 0.0.0 -> 1.0.0
Modified principles:
- (new) -> I. Non-Directive Dialogue Integrity
- (new) -> II. Privacy & Local-First Stewardship
- (new) -> III. Calm Readability & Accessibility
- (new) -> IV. Resilient Edge Interactions
- (new) -> V. Incremental, Traceable Delivery
Added sections:
- Experience Guardrails
- Delivery Workflow & Review Gates
Removed sections:
- None
Templates requiring updates:
- [done] .specify/templates/plan-template.md
- [done] .specify/templates/spec-template.md
- [done] .specify/templates/tasks-template.md
Follow-up TODOs:
- None
-->

# Aurum Dialogue Platform Constitution

## Core Principles

### I. Non-Directive Dialogue Integrity
All user-facing copy, prompts, and UI cues MUST stay neutral, invitational, and free from
diagnosis, instructions, or advice. Content is written in plain French, second-person
singular, and always acknowledges the user's own language before offering a reflection.
Any new flow ships with a short transcript that proves the tone remains reflective.

### II. Privacy & Local-First Stewardship
User text stays on the device by default (localStorage or in-memory only). Network calls
are permitted solely for authentication or explicitly declared AI handoffs, and every new
integration MUST document what payload leaves the browser, how long it is retained, and
which key protects it. Proxies (Supabase Edge, third-party APIs) must fail closed and
never log user payloads.

### III. Calm Readability & Accessibility
Visuals prioritize whitespace, legible typography (Inter + Playfair), and motion-free
transitions so the interface remains quiet. Minimum 4.5:1 contrast, keyboard navigation,
and reduced motion preferences are mandatory. Copy surfaces one idea per sentence and
never mixes more than one CTA per view.

### IV. Resilient Edge Interactions
The dialogue page must function offline/without Supabase: composing, persisting, and
retrieving local transcripts cannot break when the network is unavailable. When the AI
proxy or auth is required, the UI signals the dependency, retries with jitter, and downgrades
gracefully (never spins indefinitely).

### V. Incremental, Traceable Delivery
Every change maps to a single prioritized user story and includes a manual acceptance
script focusing on the affected journey. No combined "mega" deployments: land the smallest
slice that delivers value, document it in `/specs/...`, and capture observable before/after
notes (e.g., screenshot, transcript, or timing data).

## Experience Guardrails

1. **Voice**: Always reference the user's own words before asking the next question; no new
   metaphors are introduced unless sourced from user text.
2. **Language coverage**: French is the default. If English support is requested, it ships
   as a separate journey with its own tone review.
3. **CTA boundaries**: Each page exposes one primary action; secondary links must be stylistically
   subordinate and never pulse/animate.
4. **Status latency**: Any network touchpoint updates the status bar copy within 600 ms to reflect
   "prêt/en cours/erreur", keeping the calm feedback loop intact.
5. **Data residency**: Browsers store transcripts and "phrase repère" locally with clear user
   controls for clearing data; server-side persistence requires explicit opt-in.

## Delivery Workflow & Review Gates

1. **Specification**: Every new capability begins with `/specs/[feature]/spec.md`, enumerating
   independently shippable stories plus acceptance scripts covering tone, privacy, and fallback
   behavior.
2. **Planning**: `/speckit.plan` outputs must demonstrate how the solution stays client-first,
   documents any Supabase or Edge function additions, and includes a "Non-Directive Gate" checklist.
3. **Tasks**: `/speckit.tasks` groups work by user story and always dedicates early tasks to:
   (a) tone review, (b) local/offline QA, (c) privacy verification.
4. **Testing**: Each PR attaches (i) screenshots or recordings of the dialogue loop, (ii) console
   logs proving no network call is made before consent, and (iii) manual test notes for at least
   one degraded network case.
5. **Release**: Deployments that add a network integration require a rollback plan. Git tags record
   constitution version + feature slug for traceability.

## Governance

The constitution supersedes ad-hoc practices. Amendments require a proposal referencing the impacted
principles, an explicit version bump rationale (major/minor/patch), and dated approval from the
product owner. Ratified changes update ALL dependent templates in `.specify/templates/`. Compliance
is reviewed at every plan/spec/tasks checkpoint plus quarterly audits, and non-compliant work must either
add a justified exception in the plan's Complexity Tracking table or be reworked before merge. Version
numbers follow semantic versioning; MAJOR bumps remove or redefine principles, MINOR adds a new
principle/section or materially expands guidance, PATCH refines wording only.

**Version**: 1.0.0 | **Ratified**: 2025-11-15 | **Last Amended**: 2025-11-15
