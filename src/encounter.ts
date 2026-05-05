export type Difficulty = 'trivial' | 'easy' | 'medium' | 'hard' | 'deadly'

export interface EncounterResult {
  totalXP: number
  adjustedXP: number
  difficulty: Difficulty
}

// DMG p. 82 — XP thresholds by character level [easy, medium, hard, deadly]
const XP_THRESHOLDS: Record<number, [number, number, number, number]> = {
  1:  [25,   50,   75,   100],
  2:  [50,   100,  150,  200],
  3:  [75,   150,  225,  400],
  4:  [125,  250,  375,  500],
  5:  [250,  500,  750,  1100],
  6:  [300,  600,  900,  1400],
  7:  [350,  750,  1100, 1700],
  8:  [450,  900,  1400, 2100],
  9:  [550,  1100, 1600, 2400],
  10: [600,  1200, 1900, 2800],
  11: [800,  1600, 2400, 3600],
  12: [1000, 2000, 3000, 4500],
  13: [1100, 2200, 3400, 5100],
  14: [1250, 2500, 3800, 5700],
  15: [1400, 2800, 4300, 6400],
  16: [1600, 3200, 4800, 7200],
  17: [2000, 3900, 5900, 8800],
  18: [2100, 4200, 6300, 9500],
  19: [2400, 4900, 7300, 10900],
  20: [2800, 5700, 8500, 12700],
}

// DMG p. 82 — XP by CR
const CR_XP: Record<number, number> = {
  0:     10,
  0.125: 25,
  0.25:  50,
  0.5:   100,
  1:     200,
  2:     450,
  3:     700,
  4:     1100,
  5:     1800,
  6:     2300,
  7:     2900,
  8:     3900,
  9:     5000,
  10:    5900,
  11:    7200,
  12:    8400,
  13:    10000,
  14:    11500,
  15:    13000,
  16:    15000,
  17:    18000,
  18:    20000,
  19:    22000,
  20:    25000,
  21:    33000,
  22:    41000,
  23:    50000,
  24:    62000,
  25:    75000,
  26:    90000,
  27:    105000,
  28:    120000,
  29:    135000,
  30:    155000,
}

// DMG p. 82 — monster count multiplier, adjusted for party size
// Base multiplier index by monster count:
//   1 → 0, 2 → 1, 3–6 → 2, 7–10 → 3, 11–14 → 4, 15+ → 5
const MULTIPLIERS = [1, 1.5, 2, 2.5, 3, 4]

function monsterMultiplierIndex(monsterCount: number): number {
  if (monsterCount === 1)  return 0
  if (monsterCount === 2)  return 1
  if (monsterCount <= 6)   return 2
  if (monsterCount <= 10)  return 3
  if (monsterCount <= 14)  return 4
  return 5
}

export function crToXP(cr: number): number {
  const xp = CR_XP[cr]
  if (xp === undefined) throw new Error(`Unknown CR: ${cr}`)
  return xp
}

export function calculateEncounter(
  characterLevels: number[],
  monsterCRs: number[]
): EncounterResult {
  if (characterLevels.length === 0) throw new Error('Party cannot be empty')

  // Sum XP thresholds across all characters
  const partyThresholds = [0, 0, 0, 0] // [easy, medium, hard, deadly]
  for (const level of characterLevels) {
    const t = XP_THRESHOLDS[Math.min(20, Math.max(1, level))]
    for (let i = 0; i < 4; i++) partyThresholds[i] += t[i]
  }

  const totalXP = monsterCRs.reduce((sum, cr) => sum + crToXP(cr), 0)

  // Multiplier adjusted for party size
  let idx = monsterMultiplierIndex(monsterCRs.length)
  const partySize = characterLevels.length
  if (partySize < 3) idx = Math.min(idx + 1, MULTIPLIERS.length - 1)
  else if (partySize >= 6) idx = Math.max(idx - 1, 0)
  const adjustedXP = Math.floor(totalXP * MULTIPLIERS[idx])

  let difficulty: Difficulty
  if (adjustedXP < partyThresholds[0])      difficulty = 'trivial'
  else if (adjustedXP < partyThresholds[1]) difficulty = 'easy'
  else if (adjustedXP < partyThresholds[2]) difficulty = 'medium'
  else if (adjustedXP < partyThresholds[3]) difficulty = 'hard'
  else                                       difficulty = 'deadly'

  return { totalXP, adjustedXP, difficulty }
}
