import { describe, expect, it } from 'vitest';
import { findAnswer, SAFETY_ANSWER, FALLBACK_ANSWER } from './assistantNotes';

describe('findAnswer', () => {
  it('always gives the safety answer to edibility questions', () => {
    expect(findAnswer('Can I eat this chanterelle?')).toBe(SAFETY_ANSWER);
    expect(findAnswer('is amanita edible')).toBe(SAFETY_ANSWER);
    expect(findAnswer('Is it toxic to dogs?')).toBe(SAFETY_ANSWER);
  });

  it('matches keywords at word starts only', () => {
    // "heat" contains "eat" but is not an edibility question
    expect(findAnswer('drying vouchers on low heat')).toMatch(/Voucher specimens/);
  });

  it('picks the most specific topic', () => {
    expect(findAnswer("What does amyloid mean in Melzer's?")).toMatch(/Melzer's reagent/);
    expect(findAnswer('How do I take a spore print?')).toMatch(/Spore print/);
  });

  it('falls back when nothing matches', () => {
    expect(findAnswer('quantum chromodynamics')).toBe(FALLBACK_ANSWER);
  });
});
