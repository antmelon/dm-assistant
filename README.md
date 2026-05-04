# DM Assistant

A web-based tool for D&D 5e Dungeon Masters to prep and run sessions. Handles structured pre-session prep using the [Lazy DM framework](https://slyflourish.com/lazy_dungeon_master.html) (Sly Flourish) and AI-assisted on-the-fly generation during play.

## Features

- **Campaign Dashboard** — manage all your campaigns in one place
- **Lazy DM Session Prep** — structured 8-step prep form with AI suggestions per step
- **Quick Generate Sidebar** — generate NPCs, encounters, items, and locations mid-session without losing your place
- **Encounter XP Calculator** — automatic 5e difficulty ratings based on your party, advisory only
- **Unified NPC Roster** — prepped and improvised NPCs live together so a random character can become a recurring villain
- **Session Summaries** — AI-generated end-of-session summaries that feed context into the next session's prep

## Stack

- React
- Dexie.js (IndexedDB) — all data stored locally, no backend
- Claude API — AI generation, API key stored in-browser

## Getting Started

1. Clone the repo
2. Install dependencies: `npm install`
3. Start the dev server: `npm run dev`
4. Open the app and enter your Claude API key in Settings

## Project Structure

See [`CONTEXT.md`](./CONTEXT.md) for the domain glossary and [`docs/PRD.md`](./docs/PRD.md) for full product requirements.
