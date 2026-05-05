import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ContextPayload } from './assembleContext'

const createMock = vi.fn()
const constructorMock = vi.fn()

vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class MockAnthropic {
      messages = { create: createMock }
      constructor(opts: { apiKey: string; dangerouslyAllowBrowser?: boolean }) {
        constructorMock(opts)
      }
    },
  }
})

const localStorageStore = new Map<string, string>()
const localStorageMock = {
  getItem: (k: string) => localStorageStore.get(k) ?? null,
  setItem: (k: string, v: string) => { localStorageStore.set(k, v) },
  removeItem: (k: string) => { localStorageStore.delete(k) },
  clear: () => { localStorageStore.clear() },
}
vi.stubGlobal('localStorage', localStorageMock)

import {
  generate,
  getApiKey,
  getModel,
  API_KEY_STORAGE_KEY,
  MODEL_STORAGE_KEY,
  DEFAULT_MODEL,
  MissingApiKeyError,
  type GenerationType,
} from './aiService'

const baseContext: ContextPayload = {
  campaign: { name: 'Curse of Strahd', description: 'Gothic horror in Barovia' },
  characters: [
    { name: 'Tav', class: 'Fighter', level: 5, backstoryHooks: 'Lost sibling' },
  ],
  npcs: [
    { name: 'Strahd', role: 'Antagonist', description: 'Vampire lord' },
  ],
  currentSessionPrep: {
    strongStart: 'Wolves attack',
    scenes: 'Village',
    secretsAndClues: '',
    fantasticLocations: '',
    npcs: '',
    monsters: '',
    magicItems: '',
    characterReview: '',
  },
  previousSessionSummary: 'Met Ismark',
}

const okResponse = { content: [{ type: 'text' as const, text: 'mocked output' }] }

beforeEach(() => {
  createMock.mockReset()
  constructorMock.mockReset()
  localStorageStore.clear()
  localStorageStore.set(API_KEY_STORAGE_KEY, 'sk-ant-test')
  createMock.mockResolvedValue(okResponse)
})

describe('getApiKey', () => {
  it('reads from localStorage at the documented key', () => {
    localStorageStore.set(API_KEY_STORAGE_KEY, 'sk-ant-from-storage')
    expect(getApiKey()).toBe('sk-ant-from-storage')
  })

  it('uses the literal key "claude-api-key"', () => {
    expect(API_KEY_STORAGE_KEY).toBe('claude-api-key')
  })

  it('returns empty string when not set', () => {
    localStorageStore.clear()
    expect(getApiKey()).toBe('')
  })
})

describe('getModel', () => {
  it('returns the default model when nothing is stored', () => {
    localStorageStore.delete(MODEL_STORAGE_KEY)
    expect(getModel()).toBe(DEFAULT_MODEL)
  })

  it('returns the stored model when valid', () => {
    localStorageStore.set(MODEL_STORAGE_KEY, 'claude-opus-4-7')
    expect(getModel()).toBe('claude-opus-4-7')
  })

  it('falls back to default when stored value is unknown', () => {
    localStorageStore.set(MODEL_STORAGE_KEY, 'gpt-4')
    expect(getModel()).toBe(DEFAULT_MODEL)
  })
})

describe('generate — model selection', () => {
  it('uses the stored model in the request', async () => {
    localStorageStore.set(MODEL_STORAGE_KEY, 'claude-haiku-4-5')
    await generate({ type: 'npc', context: baseContext })
    expect(createMock.mock.calls[0][0].model).toBe('claude-haiku-4-5')
  })

  it('uses the default model when none is stored', async () => {
    localStorageStore.delete(MODEL_STORAGE_KEY)
    await generate({ type: 'npc', context: baseContext })
    expect(createMock.mock.calls[0][0].model).toBe(DEFAULT_MODEL)
  })
})

describe('generate — API key handling', () => {
  it('passes the API key from localStorage to the SDK client', async () => {
    localStorageStore.set(API_KEY_STORAGE_KEY, 'sk-ant-specific')
    await generate({ type: 'npc', context: baseContext })
    expect(constructorMock).toHaveBeenCalledWith(
      expect.objectContaining({ apiKey: 'sk-ant-specific', dangerouslyAllowBrowser: true }),
    )
  })

  it('throws MissingApiKeyError when no key is configured', async () => {
    localStorageStore.clear()
    await expect(generate({ type: 'npc', context: baseContext })).rejects.toBeInstanceOf(
      MissingApiKeyError,
    )
  })
})

describe('generate — request structure per type', () => {
  const types: GenerationType[] = [
    'npc',
    'encounter',
    'item',
    'location',
    'prep-suggestion',
    'session-summary',
  ]

  it.each(types)('builds a structured request for type %s', async (type) => {
    await generate({ type, context: baseContext })
    expect(createMock).toHaveBeenCalledOnce()
    const call = createMock.mock.calls[0][0]

    expect(call.model).toBe('claude-sonnet-4-6')
    expect(typeof call.max_tokens).toBe('number')
    expect(typeof call.system).toBe('string')
    expect(call.system.length).toBeGreaterThan(20)
    expect(Array.isArray(call.messages)).toBe(true)
    expect(call.messages).toHaveLength(1)
    expect(call.messages[0].role).toBe('user')
    expect(typeof call.messages[0].content).toBe('string')
    expect(call.messages[0].content).toContain(`generate a ${type}`)
  })

  it('uses different system prompts for different types', async () => {
    await generate({ type: 'npc', context: baseContext })
    const npcSystem = createMock.mock.calls[0][0].system

    createMock.mockClear()
    await generate({ type: 'encounter', context: baseContext })
    const encSystem = createMock.mock.calls[0][0].system

    expect(npcSystem).not.toBe(encSystem)
  })

  it('includes campaign info in user message', async () => {
    await generate({ type: 'npc', context: baseContext })
    const content = createMock.mock.calls[0][0].messages[0].content
    expect(content).toContain('Curse of Strahd')
    expect(content).toContain('Gothic horror in Barovia')
  })

  it('includes character info in user message', async () => {
    await generate({ type: 'npc', context: baseContext })
    const content = createMock.mock.calls[0][0].messages[0].content
    expect(content).toContain('Tav')
    expect(content).toContain('Fighter')
  })

  it('includes NPC info in user message', async () => {
    await generate({ type: 'npc', context: baseContext })
    const content = createMock.mock.calls[0][0].messages[0].content
    expect(content).toContain('Strahd')
  })

  it('includes previous session summary when present', async () => {
    await generate({ type: 'session-summary', context: baseContext })
    const content = createMock.mock.calls[0][0].messages[0].content
    expect(content).toContain('Met Ismark')
  })

  it('includes current session prep notes when present', async () => {
    await generate({ type: 'prep-suggestion', context: baseContext })
    const content = createMock.mock.calls[0][0].messages[0].content
    expect(content).toContain('Wolves attack')
  })

  it('appends optional userPrompt as additional guidance', async () => {
    await generate({ type: 'npc', context: baseContext, userPrompt: 'make them a tiefling' })
    const content = createMock.mock.calls[0][0].messages[0].content
    expect(content).toContain('make them a tiefling')
  })

  it('omits empty optional context cleanly', async () => {
    const minimal: ContextPayload = {
      campaign: { name: 'Test', description: '' },
      characters: [],
      npcs: [],
      currentSessionPrep: null,
      previousSessionSummary: null,
    }
    await generate({ type: 'npc', context: minimal })
    const content = createMock.mock.calls[0][0].messages[0].content
    expect(content).toContain('Test')
    expect(content).not.toContain('Characters:')
    expect(content).not.toContain('Known NPCs:')
    expect(content).not.toContain('Previous session summary')
  })
})

describe('generate — response handling', () => {
  it('returns concatenated text from response content', async () => {
    createMock.mockResolvedValueOnce({
      content: [
        { type: 'text', text: 'part one. ' },
        { type: 'text', text: 'part two.' },
      ],
    })
    const result = await generate({ type: 'npc', context: baseContext })
    expect(result).toBe('part one. part two.')
  })

  it('ignores non-text content blocks', async () => {
    createMock.mockResolvedValueOnce({
      content: [
        { type: 'thinking', thinking: 'hidden reasoning' },
        { type: 'text', text: 'visible text' },
      ],
    })
    const result = await generate({ type: 'npc', context: baseContext })
    expect(result).toBe('visible text')
  })
})

describe('generate — error surfacing', () => {
  it('propagates SDK errors to the caller', async () => {
    createMock.mockRejectedValueOnce(new Error('rate_limit_error'))
    await expect(generate({ type: 'npc', context: baseContext })).rejects.toThrow(
      'rate_limit_error',
    )
  })
})
