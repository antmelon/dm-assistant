# PRD: DM Assistant

## Problem Statement

Dungeon Masters running D&D 5e campaigns virtually spend significant time on session prep and are frequently caught off-guard during play — needing to improvise NPCs, encounters, items, and locations on the spot with no structured support. Existing tools (D&D Beyond, notion docs, random generators) are fragmented and don't share context, forcing the DM to context-switch constantly and repeat themselves across tools.

## Solution

A single web app for the DM that handles the full session lifecycle: structured pre-session prep using the Lazy DM framework (Sly Flourish), AI-assisted on-the-fly generation during play, and post-session summary capture. All campaign data lives locally on one machine — no accounts, no sync, no backend. The AI (Claude) has access to campaign context (party, NPCs, current session prep, previous session summary) so generated content feels like it belongs to the world.

## User Stories

1. As a DM, I want a campaign dashboard showing all my campaigns, so that I can pick up where I left off without hunting through files.
2. As a DM, I want to create a new campaign with a name and description, so that I can start organizing a new story.
3. As a DM, I want to open a campaign and see its characters, NPC roster, and session list at a glance, so that I understand the current state before prepping.
4. As a DM, I want to add player characters to a campaign with name, class, level, and backstory hooks, so that AI generation can reference the actual party.
5. As a DM, I want to edit a character's level and backstory hooks as the campaign progresses, so that the AI context stays accurate.
6. As a DM, I want to create a new session within a campaign, so that I can begin prep for the next play date.
7. As a DM, I want to fill out a structured Strong Start field during session prep, so that I have a compelling opening scene ready.
8. As a DM, I want to outline potential Scenes during session prep, so that I have a loose arc to guide play without railroading.
9. As a DM, I want to record Secrets & Clues during session prep, so that players have meaningful discoveries to find.
10. As a DM, I want to define Fantastic Locations during session prep, so that each scene has a vivid, memorable setting.
11. As a DM, I want to add prepped NPCs to a session during prep, so that key characters are ready before play starts.
12. As a DM, I want to plan Monsters for a session during prep, so that encounters are ready when combat begins.
13. As a DM, I want to plan Magic Items during session prep, so that rewards feel intentional.
14. As a DM, I want to review my player characters as part of session prep, so that I tailor the session to the actual party.
15. As a DM, I want AI to suggest content for any Lazy DM prep step based on my campaign context, so that I can fill out the prep form quickly.
16. As a DM, I want to see the previous session's summary while prepping a new session, so that I maintain continuity.
17. As a DM, I want a persistent Quick Generate sidebar during play, so that I can generate content without leaving the session view.
18. As a DM, I want to generate a random NPC from the sidebar during play, so that I can give a name, personality, and role to an improvised character instantly.
19. As a DM, I want to generate a combat encounter from the sidebar during play, so that I have appropriate monsters with XP budget guidance.
20. As a DM, I want encounter difficulty to be calculated automatically based on party levels, so that I understand the risk without doing math mid-session.
21. As a DM, I want to override encounter difficulty without friction, so that plot-driven combat isn't constrained by XP budgets.
22. As a DM, I want to generate a magic item from the sidebar during play, so that I can reward players with something fitting the world.
23. As a DM, I want to generate a location description from the sidebar during play, so that I can paint a vivid picture when players go somewhere unexpected.
24. As a DM, I want all sidebar-generated content to be auto-saved to the campaign, so that nothing is lost if I close the tab.
25. As a DM, I want generated NPCs to appear in the campaign NPC roster tagged as "improvised", so that I can reuse them in future sessions.
26. As a DM, I want to view and edit the campaign NPC roster, so that I can promote improvised NPCs or update prepped ones as the story evolves.
27. As a DM, I want to generate a session summary with one click at the end of play, so that I capture what actually happened without writing from scratch.
28. As a DM, I want to edit the AI-generated session summary before saving, so that I can correct inaccuracies.
29. As a DM, I want the previous session's summary automatically included in the AI context, so that generated content reflects recent story events.
30. As a DM, I want to delete generated content after a session during cleanup, so that the campaign stays tidy.
31. As a DM, I want to store my Claude API key locally in the app, so that AI features work without any backend.

## Implementation Decisions

### Modules

**Storage Layer (Dexie.js over IndexedDB)**
Provides typed CRUD operations for all entities: Campaign, Session, Character, NPC, Item, Location. All other modules read and write through this layer — no direct IndexedDB access elsewhere. Schema versioned via Dexie migrations.

**Encounter XP Calculator**
Pure function module. Takes party composition (array of character levels) and a proposed monster list (CR values), returns XP totals and a difficulty rating (easy/medium/hard/deadly) per 5e DMG rules. No UI dependency. Used by both Session Prep and Quick Generate.

**AI Context Assembler**
Pure function module. Takes a Campaign snapshot and returns a structured context payload: all Character cards, key NPCs (name, role, description), current Session prep notes, and the previous Session summary. This payload is the single source of truth for what gets sent to Claude on every request.

**AI Service**
Wraps the Claude API. Accepts a generation type (npc, encounter, item, location, prep-suggestion, session-summary) plus the assembled context payload. Manages the API key from local storage. Owns all prompt templates — callers pass intent, not raw prompts.

**Session Prep Form**
React component. Renders the 8 Lazy DM steps as discrete, ordered fields. Each field has an AI-assist button that triggers a generation via the AI Service and populates the field. Persists to the Storage Layer on every change.

**Quick Generate Sidebar**
React component. Persistent panel visible during the Play phase. Four action buttons (NPC, Encounter, Item, Location). Each generation auto-saves to the Campaign via the Storage Layer and displays the result inline.

**Campaign Dashboard**
React component. Lists all Campaigns. Create, open, and delete Campaigns. Entry point of the app.

**Campaign View**
React component. Shows the Campaign's character roster, NPC roster, and session list. Entry point for all Campaign-level management.

### Data Model

- `Campaign`: id, name, description, createdAt
- `Character`: id, campaignId, name, class, level, backstoryHooks
- `NPC`: id, campaignId, name, role, description, origin (prepped | improvised), sessionId?
- `Session`: id, campaignId, name, date, prepNotes (per-step JSON), summary, status (prep | play | complete)
- `Item`: id, campaignId, sessionId?, name, description, origin
- `Location`: id, campaignId, sessionId?, name, description, origin

### AI Context

- Always included: all Characters, all NPCs (name + role + description only)
- Per-session: current Session prep notes, previous Session summary
- Never included: full session history, item/location lists (too verbose)

### Encounter Math

Follows 5e DMG XP threshold tables. Multiplier applied for number of monsters. Difficulty label is informational only — no UI blocks or warns on override.

## Testing Decisions

A good test exercises observable behavior through the module's public interface, not its internals. Tests should not assert on implementation details (e.g. which Dexie method was called) — only on outputs and state changes.

### Modules to test

**Encounter XP Calculator** — Unit tests. Pure function with no dependencies. Test all four difficulty thresholds, edge cases (single character, single monster, large groups triggering multiplier changes), and level boundary conditions.

**AI Context Assembler** — Unit tests. Pure function. Test that the correct fields are included/excluded, that the previous session summary is correctly identified, and that character/NPC data is shaped correctly for the prompt.

**Storage Layer** — Integration tests using a real IndexedDB instance (via fake-indexeddb or a Dexie test helper). Test CRUD for each entity, cascading deletes (e.g. deleting a Campaign removes its Sessions and Characters), and schema migrations.

**AI Service** — Unit tests with a mocked Claude API client. Test that each generation type produces a correctly structured request, that the API key is read from the expected location, and that errors surface cleanly.

**Session Prep Form** — Component tests (React Testing Library). Test that each step renders, that the AI-assist button triggers generation and populates the field, and that changes persist via the Storage Layer.

**Quick Generate Sidebar** — Component tests. Test that each action button triggers the correct generation type, that results appear inline, and that content is saved to the Campaign.

## Out of Scope

- Player-facing views of any kind
- Cross-device sync or cloud storage
- Authentication or user accounts
- Support for RPG systems other than D&D 5e
- Player character stat blocks (handled by external tools)
- Map tooling (handled by external tools)
- Export or backup functionality (future consideration)
- Multiplayer / co-DM features

## Further Notes

- The Lazy DM framework is by Sly Flourish (Michael Shea). The 8 prep steps are: Strong Start, Scenes, Secrets & Clues, Fantastic Locations, NPCs, Monsters, Magic Items, Character Review.
- The Campaign Dashboard should feel similar to D&D Beyond's campaign list — card-based, visually distinct per campaign.
- NPCs are the most reused entity. An improvised NPC from session 3 may become a recurring villain by session 10 — the unified roster with origin tagging is intentional.
- Session Summary is the critical handoff artifact between sessions. It feeds the AI context for the next session, so its quality directly affects generation quality.
