# ADR 0001: Local-Only Storage via IndexedDB

## Status
Accepted

## Context
The tool is used by a single DM on a single device. Cross-device sync, auth, and a backend server would add significant complexity without delivering value for the current use case.

## Decision
All campaign data is stored locally using IndexedDB (via Dexie.js). No backend server. The Claude API key is stored locally in the browser.

## Consequences
- No sync across devices
- No account recovery if browser data is cleared — user must export/backup manually
- Eliminates auth, deployment, and database infrastructure entirely
- Can be revisited by adding a backend once the data model is stable
