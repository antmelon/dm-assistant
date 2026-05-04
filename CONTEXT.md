# DM Assistant — Domain Context

## Purpose

A web-based tool for a single Dungeon Master to prepare and run D&D 5e sessions. Supports structured pre-session prep using the Lazy DM framework and real-time content generation during play.

---

## Core Terms

### Campaign
The top-level organizational unit. Contains all Sessions, Characters, NPCs, Locations, and Items for a single ongoing story. One-shots are modeled as short Campaigns. A Campaign is never shared with players — it is DM-only.

### Session
A single play session within a Campaign. Has two phases: **Prep** (before play) and **Play** (during play). A Session belongs to exactly one Campaign.

### Session Prep
The structured pre-session workflow based on the Lazy DM framework (Sly Flourish). Consists of eight ordered steps: Strong Start, Scenes, Secrets & Clues, Fantastic Locations, NPCs, Monsters, Magic Items, and Character Review. Each step is a discrete field, not a free-form document.

### Session Summary
A concise post-session narrative written or AI-generated at the end of play. Captures what actually happened (not what was planned). The previous Session's Summary is included in the AI context for the next Session to provide continuity.

### Character
A player character in a Campaign. Stores: name, class, level, and backstory hooks. Character cards are Campaign-scoped (same player may run different characters in different Campaigns) and editable as characters level up or change. Characters are never full stat blocks — other tools handle that.

### NPC (Non-Player Character)
Any named character controlled by the DM. Lives in the Campaign NPC roster regardless of origin. A **Prepped NPC** is created during Session Prep. An **Improvised NPC** is generated on the fly during play. Both are equal citizens in the roster and can recur across Sessions.

### Encounter
A combat scenario generated for a Session. Includes suggested monsters and an XP budget calculation based on current Character levels and the 5e difficulty thresholds (easy/medium/hard/deadly). Difficulty is advisory — plot always takes precedence and the DM can override.

### Quick Generate
The sidebar panel available during play that lets the DM generate content without leaving the Session view. Supports: NPC, Encounter, Item, Location. Generated content is auto-saved to the Campaign; cleanup happens post-session.

### Campaign Context
The subset of Campaign data sent to the AI on each request: all Character cards, key NPCs, the current Session's prep notes, and the previous Session's Summary. Full session history is excluded to manage token cost and latency.

---

## System Boundaries

- **DM-only**: no player-facing views
- **Single device**: local storage via IndexedDB (Dexie.js), no sync or auth
- **5e only**: encounter math follows 5e XP budget rules
- **AI**: Claude API with a locally stored API key; used for generation and session summary
- **Frontend**: React web app

---

## What This Tool Does Not Do

- Manage player-facing stat blocks (handled by external tools)
- Handle maps (handled by external tools)
- Sync across devices
- Support systems other than D&D 5e (for now)
