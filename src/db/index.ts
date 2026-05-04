import Dexie, { type EntityTable } from 'dexie'

export interface Campaign {
  id: string
  name: string
  description: string
  createdAt: number
}

export interface Character {
  id: string
  campaignId: string
  name: string
  class: string
  level: number
  backstoryHooks: string
}

export type NpcOrigin = 'prepped' | 'improvised'

export interface Npc {
  id: string
  campaignId: string
  name: string
  role: string
  description: string
  origin: NpcOrigin
  sessionId?: string
}

export type SessionStatus = 'prep' | 'play' | 'complete'

export interface Session {
  id: string
  campaignId: string
  name: string
  date: number
  status: SessionStatus
  prepNotes: PrepNotes
  summary: string
}

export interface PrepNotes {
  strongStart: string
  scenes: string
  secretsAndClues: string
  fantasticLocations: string
  npcs: string
  monsters: string
  magicItems: string
  characterReview: string
}

export type ContentOrigin = 'prepped' | 'improvised'

export interface Item {
  id: string
  campaignId: string
  sessionId?: string
  name: string
  description: string
  origin: ContentOrigin
}

export interface Location {
  id: string
  campaignId: string
  sessionId?: string
  name: string
  description: string
  origin: ContentOrigin
}

class DmAssistantDb extends Dexie {
  campaigns!: EntityTable<Campaign, 'id'>
  characters!: EntityTable<Character, 'id'>
  npcs!: EntityTable<Npc, 'id'>
  sessions!: EntityTable<Session, 'id'>
  items!: EntityTable<Item, 'id'>
  locations!: EntityTable<Location, 'id'>

  constructor() {
    super('dm-assistant')
    this.version(1).stores({
      campaigns: 'id, createdAt',
      characters: 'id, campaignId',
      npcs: 'id, campaignId, sessionId',
      sessions: 'id, campaignId, date',
      items: 'id, campaignId, sessionId',
      locations: 'id, campaignId, sessionId',
    })
  }
}

export const db = new DmAssistantDb()
