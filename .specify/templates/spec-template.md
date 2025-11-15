# Feature Specification: [FEATURE NAME]

**Feature Branch**: `[###-feature-name]`  
**Created**: [DATE]  
**Status**: Draft  
**Input**: User description: "$ARGUMENTS"

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently

  For Aurum, every story also documents:
  - A transcript snippet proving non-directive tone (references user language, no advice)
  - Privacy notes describing whether any text leaves the browser
  - Offline status: how the journey behaves when Supabase/AI proxy is unavailable
-->

### User Story 1 - [Brief Title] (Priority: P1)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently - e.g., "Can be fully tested by [specific action] and delivers [specific value]"]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]
2. **Given** [initial state], **When** [action], **Then** [expected outcome]

**Tone & Privacy Notes**: [Quote from prototype copy that echoes the user's words + list of network calls/payloads]
**Offline Expectation**: [Describe what users see if Supabase/AI is unreachable]

---

### User Story 2 - [Brief Title] (Priority: P2)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

**Tone & Privacy Notes**: [Details]
**Offline Expectation**: [Details]

---

### User Story 3 - [Brief Title] (Priority: P3)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

**Tone & Privacy Notes**: [Details]
**Offline Expectation**: [Details]

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

- Offline-first: What happens when the browser is offline or Supabase auth fails?
- Privacy guardrail: How does the flow behave if the user denies sharing text with the AI proxy?
- Dialogue loop: What happens when the user sends empty/short inputs or repeats the same phrase?
- Status UI: How does the status bar evolve if a request exceeds 600 ms or errors?
- Local storage: How are transcripts cleared or migrated when schema changes?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST [describe the non-directive interaction being added] without injecting advice or diagnoses.
- **FR-002**: System MUST surface status updates ("prêt / en cours / erreur") within 600 ms of any async user action.
- **FR-003**: Users MUST be able to [key interaction] while keeping transcripts in browser storage unless they opt in.
- **FR-004**: Any network call MUST document payload, destination, and retention, and expose a UI affordance when pending.
- **FR-005**: Offline fallback MUST allow the user to keep writing and saving their "phrase repere".

*Mark unclear requirements explicitly, e.g.:*

- **FR-00X**: [Capability] via [NEEDS CLARIFICATION: which auth provider?]

### Key Entities *(include if feature involves data)*

- **[Entity 1]**: [What it represents, key attributes without implementation]
- **[Entity 2]**: [What it represents, relationships to other entities]

### Privacy & Local-First Requirements *(mandatory when data leaves the device)*

- **PR-001**: [Describe consent surface before sharing text externally]
- **PR-002**: [State storage duration + clearing behaviour]
- **PR-003**: [List secrets/keys touched and how they are loaded]

### Experience Constraints

- **UX-001**: Copy MUST quote or paraphrase the user's previous message before posing a question.
- **UX-002**: Only one primary CTA per screen; any secondary link uses muted styling.
- **UX-003**: New typography or motion requires approval plus contrast/motion audit results.

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: [Metric] (e.g., "User can send first reflection in <30 s without hitting an error")
- **SC-002**: [Metric] (e.g., "Status bar reflects accurate state within 600 ms in 95% of trials")
- **SC-003**: [Metric] (e.g., "Offline write/save loop works end-to-end in 3/3 scripted tests")
- **SC-004**: [Metric] (e.g., "No unexpected network calls detected in console/network logs for this story")
