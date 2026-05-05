import type { Campaign, Character, Npc, Session, PrepNotes } from './db'

export interface ContextSnapshot {
  campaign: Campaign
  characters: Character[]
  npcs: Npc[]
  sessions: Session[]
  currentSessionId: string
}

export interface CharacterContext {
  name: string
  class: string
  level: number
  backstoryHooks: string
}

export interface NpcContext {
  name: string
  role: string
  description: string
}

export interface ContextPayload {
  campaign: { name: string; description: string }
  characters: CharacterContext[]
  npcs: NpcContext[]
  currentSessionPrep: PrepNotes | null
  previousSessionSummary: string | null
}

export function assembleContext(snapshot: ContextSnapshot): ContextPayload {
  const { campaign, characters, npcs, sessions, currentSessionId } = snapshot

  const currentSession = sessions.find(s => s.id === currentSessionId) ?? null

  const previousSession = sessions
    .filter(s => s.id !== currentSessionId && s.status === 'complete')
    .sort((a, b) => b.date - a.date)[0] ?? null

  return {
    campaign: { name: campaign.name, description: campaign.description },
    characters: characters.map(c => ({
      name: c.name,
      class: c.class,
      level: c.level,
      backstoryHooks: c.backstoryHooks,
    })),
    npcs: npcs.map(n => ({
      name: n.name,
      role: n.role,
      description: n.description,
    })),
    currentSessionPrep: currentSession ? currentSession.prepNotes : null,
    previousSessionSummary: previousSession ? previousSession.summary : null,
  }
}
