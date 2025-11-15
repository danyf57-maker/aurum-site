# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

**Language/Version**: HTML5 + TypeScript (ES2022) frontend, Deno 1.x (Supabase Edge)  
**Primary Dependencies**: Tailwind CSS (CDN), Supabase JS v2, Supabase Edge runtime, fetch-based AI proxy  
**Storage**: Browser `localStorage` for transcripts/phrase-repere + Supabase Postgres for auth metadata  
**Testing**: Manual dialogue transcripts + Playwright (preferred) or equivalent automated journey checks  
**Target Platform**: GitHub Pages static hosting + Supabase Edge Functions (eu-central)  
**Project Type**: Static web experience with minimal edge functions  
**Performance Goals**: Dialogue prompt reflection in <1 s; status bar copy updates within 600 ms of action  
**Constraints**: Non-directive tone, offline-first dialogue, no unsolicited network calls, zero PII persisted server-side  
**Scale/Scope**: Landing page + dialogue workspace + Supabase auth/signup; <=5 concurrent feature tracks

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

1. **Tone integrity**: Does every planned output reference user language and avoid advice/diagnosis? Attach sample phrasing.
2. **Privacy accounting**: List every network call plus payload, retention, and key path. Confirm defaults stay local-first.
3. **Offline resilience**: Identify how the feature behaves with Supabase/API unavailable and how the UI communicates it.
4. **Status feedback**: Plan status bar copy for each async step and prove timing stays within the 600 ms requirement.
5. **Incremental delivery**: Demonstrate that the feature decomposes into stand-alone user stories with acceptance scripts.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
|-- plan.md              # /speckit.plan output (this file)
|-- research.md          # Phase 0 output (/speckit.plan)
|-- data-model.md        # Phase 1 output (/speckit.plan)
|-- quickstart.md        # Phase 1 output (/speckit.plan)
|-- contracts/           # Phase 1 output (/speckit.plan)
`-- tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
assets/
`-- img/
pages/
|-- dialogue.html        # Core dialogue workspace
`-- signup.html          # Auth/signup path
supabase/
`-- functions/
    `-- ai-proxy/
        `-- index.ts     # Supabase Edge proxy for third-party AI
index.html               # Marketing + CTA entry point
```

**Structure Decision**: Single static web surface with supporting Supabase Edge functions. Any new component must live inside the existing folders (e.g., `pages/`, `assets/`, or `supabase/functions/`) unless the plan documents why an additional directory is required.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
