import { describe, it, expect } from 'vitest'
import { assembleContext, type ContextSnapshot } from './assembleContext'
import type { Campaign, Character, Npc, Session, PrepNotes } from './db'

const emptyPrep: PrepNotes = {
  strongStart: '',
  scenes: '',
  secretsAndClues: '',
  fantasticLocations: '',
  npcs: '',
  monsters: '',
  magicItems: '',
  characterReview: '',
}

const campaign: Campaign = {
  id: 'c1',
  name: 'Curse of Strahd',
  description: 'Gothic horror in Barovia',
  createdAt: 1000,
}

const characters: Character[] = [
  { id: 'ch1', campaignId: 'c1', name: 'Tav', class: 'Fighter', level: 5, backstoryHooks: 'Lost sibling' },
  { id: 'ch2', campaignId: 'c1', name: 'Lia', class: 'Wizard', level: 5, backstoryHooks: 'Forbidden tome' },
]

const npcs: Npc[] = [
  { id: 'n1', campaignId: 'c1', name: 'Strahd', role: 'Antagonist', description: 'Vampire lord', origin: 'prepped' },
  { id: 'n2', campaignId: 'c1', name: 'Ireena', role: 'Ally', description: 'Tatyana reborn', origin: 'prepped' },
]

const currentPrep: PrepNotes = {
  ...emptyPrep,
  strongStart: 'Wolves attack the camp',
  scenes: 'Village of Barovia',
}

const sessions: Session[] = [
  { id: 's1', campaignId: 'c1', name: 'Session 1', date: 100, status: 'complete', prepNotes: emptyPrep, summary: 'Met Ismark' },
  { id: 's2', campaignId: 'c1', name: 'Session 2', date: 200, status: 'complete', prepNotes: emptyPrep, summary: 'Reached the village' },
  { id: 's3', campaignId: 'c1', name: 'Session 3', date: 300, status: 'prep', prepNotes: currentPrep, summary: '' },
]

const snapshot: ContextSnapshot = {
  campaign,
  characters,
  npcs,
  sessions,
  currentSessionId: 's3',
}

describe('assembleContext — campaign', () => {
  it('includes campaign name and description', () => {
    const result = assembleContext(snapshot)
    expect(result.campaign.name).toBe('Curse of Strahd')
    expect(result.campaign.description).toBe('Gothic horror in Barovia')
  })
})

describe('assembleContext — characters', () => {
  it('returns all characters', () => {
    const result = assembleContext(snapshot)
    expect(result.characters).toHaveLength(2)
  })

  it('shapes character data correctly', () => {
    const result = assembleContext(snapshot)
    expect(result.characters[0]).toEqual({
      name: 'Tav',
      class: 'Fighter',
      level: 5,
      backstoryHooks: 'Lost sibling',
    })
  })

  it('strips id and campaignId from characters', () => {
    const result = assembleContext(snapshot)
    expect(result.characters[0]).not.toHaveProperty('id')
    expect(result.characters[0]).not.toHaveProperty('campaignId')
  })
})

describe('assembleContext — npcs', () => {
  it('returns all npcs', () => {
    const result = assembleContext(snapshot)
    expect(result.npcs).toHaveLength(2)
  })

  it('shapes npc data with name, role, description only', () => {
    const result = assembleContext(snapshot)
    expect(result.npcs[0]).toEqual({
      name: 'Strahd',
      role: 'Antagonist',
      description: 'Vampire lord',
    })
  })

  it('strips id, campaignId, origin, sessionId from npcs', () => {
    const result = assembleContext(snapshot)
    const keys = Object.keys(result.npcs[0])
    expect(keys.sort()).toEqual(['description', 'name', 'role'])
  })
})

describe('assembleContext — current session prep', () => {
  it('returns prep notes from current session', () => {
    const result = assembleContext(snapshot)
    expect(result.currentSessionPrep).toEqual(currentPrep)
  })

  it('returns null when current session not found', () => {
    const result = assembleContext({ ...snapshot, currentSessionId: 'missing' })
    expect(result.currentSessionPrep).toBeNull()
  })
})

describe('assembleContext — previous session summary', () => {
  it('returns most recent completed session summary', () => {
    const result = assembleContext(snapshot)
    expect(result.previousSessionSummary).toBe('Reached the village')
  })

  it('excludes the current session even if completed', () => {
    const onlyCurrent: Session[] = [
      { id: 's1', campaignId: 'c1', name: 'S1', date: 100, status: 'complete', prepNotes: emptyPrep, summary: 'Old' },
      { id: 's2', campaignId: 'c1', name: 'S2', date: 200, status: 'complete', prepNotes: emptyPrep, summary: 'Current is complete' },
    ]
    const result = assembleContext({ ...snapshot, sessions: onlyCurrent, currentSessionId: 's2' })
    expect(result.previousSessionSummary).toBe('Old')
  })

  it('skips non-completed sessions when finding previous', () => {
    const mixed: Session[] = [
      { id: 'a', campaignId: 'c1', name: 'A', date: 100, status: 'complete', prepNotes: emptyPrep, summary: 'Older complete' },
      { id: 'b', campaignId: 'c1', name: 'B', date: 200, status: 'play', prepNotes: emptyPrep, summary: 'Mid play' },
      { id: 'c', campaignId: 'c1', name: 'C', date: 300, status: 'prep', prepNotes: currentPrep, summary: '' },
    ]
    const result = assembleContext({ ...snapshot, sessions: mixed, currentSessionId: 'c' })
    expect(result.previousSessionSummary).toBe('Older complete')
  })

  it('returns null when no prior completed session exists', () => {
    const result = assembleContext({
      ...snapshot,
      sessions: [{ id: 's3', campaignId: 'c1', name: 'S3', date: 300, status: 'prep', prepNotes: currentPrep, summary: '' }],
      currentSessionId: 's3',
    })
    expect(result.previousSessionSummary).toBeNull()
  })

  it('picks most recent by date, not by array order', () => {
    const outOfOrder: Session[] = [
      { id: 'a', campaignId: 'c1', name: 'A', date: 500, status: 'complete', prepNotes: emptyPrep, summary: 'Newest' },
      { id: 'b', campaignId: 'c1', name: 'B', date: 100, status: 'complete', prepNotes: emptyPrep, summary: 'Oldest' },
      { id: 'cur', campaignId: 'c1', name: 'Cur', date: 600, status: 'prep', prepNotes: currentPrep, summary: '' },
    ]
    const result = assembleContext({ ...snapshot, sessions: outOfOrder, currentSessionId: 'cur' })
    expect(result.previousSessionSummary).toBe('Newest')
  })
})

describe('assembleContext — exclusions', () => {
  it('payload has no items field', () => {
    const result = assembleContext(snapshot)
    expect(result).not.toHaveProperty('items')
  })

  it('payload has no locations field', () => {
    const result = assembleContext(snapshot)
    expect(result).not.toHaveProperty('locations')
  })

  it('payload has no full sessions array', () => {
    const result = assembleContext(snapshot)
    expect(result).not.toHaveProperty('sessions')
  })

  it('payload exposes only previous session summary, not full session objects', () => {
    const result = assembleContext(snapshot)
    expect(typeof result.previousSessionSummary).toBe('string')
  })
})
