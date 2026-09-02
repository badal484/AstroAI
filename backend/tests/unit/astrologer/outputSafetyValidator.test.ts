import { describe, expect, it } from 'vitest';
import { validateResponseSafety } from '../../../src/modules/astrologer/safety/outputSafetyValidator';

describe('validateResponseSafety', () => {
  it('flags a guaranteed-prediction claim', () => {
    const result = validateResponseSafety('You are guaranteed to get married next year.');
    expect(result.safe).toBe(false);
    expect(result.violations).toContain('guaranteed prediction');
  });

  it('flags a death prediction', () => {
    const result = validateResponseSafety('Based on your chart, you will die in 2030.');
    expect(result.safe).toBe(false);
    expect(result.violations).toContain('death prediction');
  });

  it('flags a claim to be human', () => {
    const result = validateResponseSafety(
      'Trust me, I am a real human astrologer with 20 years of experience.',
    );
    expect(result.safe).toBe(false);
    expect(result.violations).toContain('claims to be human');
  });

  it('flags an explicit medical diagnosis', () => {
    const result = validateResponseSafety('Your chart shows you have cancer.');
    expect(result.safe).toBe(false);
    expect(result.violations).toContain('medical diagnosis');
  });

  it('allows normal, appropriately-hedged interpretive language', () => {
    const result = validateResponseSafety(
      'This period often brings new opportunities in your career, though the outcome depends on the choices you make.',
    );
    expect(result.safe).toBe(true);
    expect(result.violations).toEqual([]);
  });

  it('reports every violation found, not just the first', () => {
    const result = validateResponseSafety('I am a real human and I guarantee you will die alone.');
    expect(result.violations.length).toBeGreaterThan(1);
  });
});
