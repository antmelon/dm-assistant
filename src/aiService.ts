import Anthropic from '@anthropic-ai/sdk'
import type { ContextPayload } from './assembleContext'

export const API_KEY_STORAGE_KEY = 'claude-api-key'
export const MODEL_STORAGE_KEY = 'claude-model'

export const AVAILABLE_MODELS = [
  { id: 'claude-sonnet-4-6', label: 'Sonnet 4.6 — balanced (recommended)' },
  { id: 'claude-haiku-4-5',  label: 'Haiku 4.5 — fastest, cheapest' },
  { id: 'claude-opus-4-7',   label: 'Opus 4.7 — most capable, most expensive' },
] as const

export type ModelId = typeof AVAILABLE_MODELS[number]['id']
export const DEFAULT_MODEL: ModelId = 'claude-sonnet-4-6'

export type GenerationType =
  | 'npc'
  | 'encounter'
  | 'item'
  | 'location'
  | 'prep-suggestion'
  | 'session-summary'

export interface GenerateOptions {
  type: GenerationType
  context: ContextPayload
  userPrompt?: string
}

const SYSTEM_PROMPTS: Record<GenerationType, string> = {
  npc:
    'You are a D&D 5e dungeon master. Generate a single NPC tailored to the campaign. ' +
    'Reply with: Name, Role (one line), Description (2-3 sentences covering appearance, motivation, and a hook).',

  encounter:
    'You are a D&D 5e dungeon master. Design a balanced combat encounter for the party. ' +
    'Use party levels from the provided characters. Reply with monster names, counts, and CRs, plus a brief tactical setup.',

  item:
    'You are a D&D 5e dungeon master. Generate a single item (mundane or magical) appropriate to the campaign. ' +
    'Reply with: Name, Rarity (if magical), Description (2-3 sentences covering appearance and properties).',

  location:
    'You are a D&D 5e dungeon master. Generate a single location appropriate to the campaign. ' +
    'Reply with: Name, Type (one line), Description (2-3 sentences evoking mood, notable features, and a possible hook).',

  'prep-suggestion':
    'You are a D&D 5e dungeon master assistant using the Lazy DM framework. ' +
    'Suggest concrete prep ideas for the upcoming session, drawing on the campaign and previous session summary. ' +
    'Cover strong start, scenes, secrets, and NPCs as appropriate.',

  'session-summary':
    'You are a D&D 5e dungeon master. Write a concise session summary suitable for sharing with players. ' +
    'Focus on what happened, key NPC interactions, and unresolved threads. Keep it to 3-5 short paragraphs.',
}

export function getApiKey(): string {
  return localStorage.getItem(API_KEY_STORAGE_KEY) ?? ''
}

export function getModel(): ModelId {
  const stored = localStorage.getItem(MODEL_STORAGE_KEY)
  if (stored && AVAILABLE_MODELS.some(m => m.id === stored)) {
    return stored as ModelId
  }
  return DEFAULT_MODEL
}

export class MissingApiKeyError extends Error {
  constructor() {
    super('No Claude API key configured. Set one in Settings.')
    this.name = 'MissingApiKeyError'
  }
}

function buildUserMessage(
  type: GenerationType,
  context: ContextPayload,
  userPrompt?: string,
): string {
  const parts: string[] = []
  parts.push(`Campaign: ${context.campaign.name}`)
  if (context.campaign.description) {
    parts.push(`Setting: ${context.campaign.description}`)
  }

  if (context.characters.length > 0) {
    const chars = context.characters
      .map(c => `- ${c.name} (${c.class} ${c.level})${c.backstoryHooks ? `: ${c.backstoryHooks}` : ''}`)
      .join('\n')
    parts.push(`Characters:\n${chars}`)
  }

  if (context.npcs.length > 0) {
    const npcs = context.npcs
      .map(n => `- ${n.name} (${n.role}): ${n.description}`)
      .join('\n')
    parts.push(`Known NPCs:\n${npcs}`)
  }

  if (context.previousSessionSummary) {
    parts.push(`Previous session summary:\n${context.previousSessionSummary}`)
  }

  if (context.currentSessionPrep) {
    const prep = context.currentSessionPrep
    const prepLines = [
      prep.strongStart && `Strong start: ${prep.strongStart}`,
      prep.scenes && `Scenes: ${prep.scenes}`,
      prep.secretsAndClues && `Secrets/clues: ${prep.secretsAndClues}`,
      prep.fantasticLocations && `Locations: ${prep.fantasticLocations}`,
      prep.npcs && `NPCs: ${prep.npcs}`,
      prep.monsters && `Monsters: ${prep.monsters}`,
      prep.magicItems && `Magic items: ${prep.magicItems}`,
      prep.characterReview && `Character review: ${prep.characterReview}`,
    ].filter(Boolean)
    if (prepLines.length > 0) {
      parts.push(`Current session prep:\n${prepLines.join('\n')}`)
    }
  }

  parts.push(`Task: generate a ${type}.`)

  if (userPrompt && userPrompt.trim()) {
    parts.push(`Additional guidance: ${userPrompt.trim()}`)
  }

  return parts.join('\n\n')
}

export async function generate({ type, context, userPrompt }: GenerateOptions): Promise<string> {
  const apiKey = getApiKey()
  if (!apiKey) throw new MissingApiKeyError()

  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

  const message = await client.messages.create({
    model: getModel(),
    max_tokens: 4096,
    system: SYSTEM_PROMPTS[type],
    messages: [
      { role: 'user', content: buildUserMessage(type, context, userPrompt) },
    ],
  })

  return message.content
    .filter((b): b is Extract<typeof b, { type: 'text' }> => b.type === 'text')
    .map(b => b.text)
    .join('')
}
