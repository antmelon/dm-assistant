import { describe, it, expect } from 'vitest'
import { calculateEncounter, crToXP } from './encounter'

describe('crToXP', () => {
  it('maps standard CRs', () => {
    expect(crToXP(0)).toBe(10)
    expect(crToXP(0.125)).toBe(25)
    expect(crToXP(0.25)).toBe(50)
    expect(crToXP(0.5)).toBe(100)
    expect(crToXP(1)).toBe(200)
    expect(crToXP(5)).toBe(1800)
    expect(crToXP(20)).toBe(25000)
    expect(crToXP(30)).toBe(155000)
  })

  it('throws on unknown CR', () => {
    expect(() => crToXP(99)).toThrow('Unknown CR: 99')
  })
})

describe('calculateEncounter — difficulty thresholds', () => {
  // 4 level-5 characters: thresholds [1000, 2000, 3000, 4400]
  const party4L5 = [5, 5, 5, 5]

  it('trivial — adjusted XP below easy threshold', () => {
    // 1 CR 1/8 monster → 25 XP × 1 multiplier = 25 < 1000
    const result = calculateEncounter(party4L5, [0.125])
    expect(result.difficulty).toBe('trivial')
    expect(result.totalXP).toBe(25)
    expect(result.adjustedXP).toBe(25)
  })

  it('easy — at easy threshold', () => {
    // Need adjustedXP >= 1000 but < 2000
    // 6 CR 1 monsters → 1200 XP × 2 (3-6 monsters) = 2400 — too high
    // 2 CR 2 monsters → 900 XP × 1.5 = 1350 → easy
    const result = calculateEncounter(party4L5, [2, 2])
    expect(result.difficulty).toBe('easy')
    expect(result.totalXP).toBe(900)
    expect(result.adjustedXP).toBe(1350)
  })

  it('medium — adjusted XP at medium threshold', () => {
    // 4 CR 2 monsters → 1800 XP × 2 = 3600 → hard (overshoot)
    // 3 CR 2 monsters → 1350 XP × 2 = 2700 → medium
    const result = calculateEncounter(party4L5, [2, 2, 2])
    expect(result.difficulty).toBe('medium')
    expect(result.adjustedXP).toBe(2700)
  })

  it('hard — adjusted XP at hard threshold', () => {
    // 4 CR 2 → 1800 × 2 = 3600 → hard (>= 3000 < 4400)
    const result = calculateEncounter(party4L5, [2, 2, 2, 2])
    expect(result.difficulty).toBe('hard')
    expect(result.adjustedXP).toBe(3600)
  })

  it('deadly — adjusted XP at or above deadly threshold', () => {
    // 5 CR 3 → 3500 × 2 = 7000 >= 4400
    const result = calculateEncounter(party4L5, [3, 3, 3, 3, 3])
    expect(result.difficulty).toBe('deadly')
  })
})

describe('calculateEncounter — edge cases', () => {
  it('single character, single monster', () => {
    // Level 1 solo vs CR 1/4: threshold [25,50,75,100]
    // solo party (<3) bumps multiplier: 1 monster base ×1 → ×1.5; 50 × 1.5 = 75 → hard
    const result = calculateEncounter([1], [0.25])
    expect(result.totalXP).toBe(50)
    expect(result.adjustedXP).toBe(75)
    expect(result.difficulty).toBe('hard')
  })

  it('small party (<3) shifts multiplier up one step', () => {
    // 2 players level 5: thresholds [500, 1000, 1500, 2200]
    // 2 CR 1 monsters → 400 XP; base multiplier for 2 monsters = 1.5x, small party bumps to 2x → 800
    // 800 < 1000 → easy
    const result = calculateEncounter([5, 5], [1, 1])
    expect(result.adjustedXP).toBe(800)
    expect(result.difficulty).toBe('easy')
  })

  it('large party (>=6) shifts multiplier down one step', () => {
    // 6 players level 5: thresholds [1500, 3000, 4500, 6600]
    // 2 CR 2 monsters → 900 XP; base multiplier 1.5x, large party drops to 1x → 900
    const result = calculateEncounter([5, 5, 5, 5, 5, 5], [2, 2])
    expect(result.adjustedXP).toBe(900)
  })

  it('large monster group (15+) uses 4x multiplier', () => {
    // 15 × CR 1/8 = 375 XP × 4 = 1500; L5 party easy threshold = 1000 → easy
    const result = calculateEncounter([5, 5, 5, 5], Array(15).fill(0.125))
    expect(result.totalXP).toBe(375)
    expect(result.adjustedXP).toBe(1500)
    expect(result.difficulty).toBe('easy')
  })

  it('level 1 boundary', () => {
    const result = calculateEncounter([1], [0])
    expect(result.totalXP).toBe(10)
  })

  it('level 20 boundary', () => {
    const result = calculateEncounter([20], [1])
    expect(result.totalXP).toBe(200)
    expect(result.difficulty).toBe('trivial')
  })

  it('mixed party levels', () => {
    // Levels 1, 10, 20 → thresholds [25+600+2800, 50+1200+5700, 75+1900+8500, 100+2800+12700]
    //                               = [3425, 6950, 10475, 15600]
    const result = calculateEncounter([1, 10, 20], [5])
    expect(result.totalXP).toBe(1800)
    expect(result.difficulty).toBe('trivial')
  })

  it('throws when party is empty', () => {
    expect(() => calculateEncounter([], [1])).toThrow('Party cannot be empty')
  })

  it('zero monsters returns trivial with 0 XP', () => {
    const result = calculateEncounter([5, 5, 5, 5], [])
    expect(result.totalXP).toBe(0)
    expect(result.adjustedXP).toBe(0)
    expect(result.difficulty).toBe('trivial')
  })
})

describe('calculateEncounter — level boundary conditions', () => {
  it('level 1 thresholds are correct', () => {
    // easy=25, monster: 1 CR 0 = 10 XP × 1 = 10 → trivial
    expect(calculateEncounter([1], [0]).difficulty).toBe('trivial')
    // 3 CR 0 = 30 XP; solo party bumps 3-monster multiplier ×2 → ×2.5; 30 × 2.5 = 75 → hard
    expect(calculateEncounter([1], [0, 0, 0]).difficulty).toBe('hard')
  })

  it('level 20 thresholds are correct', () => {
    // deadly = 12700 for one L20 character
    // 1 CR 20 = 25000 × 1 = 25000 >= 12700 → deadly
    expect(calculateEncounter([20], [20]).difficulty).toBe('deadly')
  })
})
