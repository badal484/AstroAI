import { describe, it, expect } from 'vitest';
import { responseSelfHealer } from '../../../src/modules/astrologer-intelligence/quality/responseSelfHealer';

describe('Response Self-Healer Unit Tests', () => {
  it('strips forbidden announcement preambles at the start of text', () => {
    const raw = 'Based on your birth chart, your 7th house indicates strong marital alignment.';
    const healed = responseSelfHealer.heal(raw, { turnIndex: 0, userMessage: 'Meri shaadi kab hogi?' });
    expect(healed).toBe('Your 7th house indicates strong marital alignment.');
  });

  it('strips "Looking at your current planetary cycle" and capitalizes the remainder', () => {
    const raw = 'Looking at your current planetary cycle, Jupiter transit is supportive.';
    const healed = responseSelfHealer.heal(raw, { turnIndex: 0, userMessage: 'Career kaisa rahega?' });
    expect(healed).toBe('Jupiter transit is supportive.');
  });

  it('strips turn > 0 salutation spam (Pranam / Namaste)', () => {
    const raw = 'Pranam. Kal jo fight hui thi, uske peeche communication gap tha.';
    const healed = responseSelfHealer.heal(raw, { turnIndex: 2, userMessage: 'Kal fight hui thi.' });
    expect(healed).not.toMatch(/^pranam/i);
    expect(healed).toBe('Kal jo fight hui thi, uske peeche communication gap tha.');
  });

  it('preserves turn 0 greeting', () => {
    const raw = 'Pranam! Batao, aaj mann mein kya chal raha hai?';
    const healed = responseSelfHealer.heal(raw, { turnIndex: 0, userMessage: 'Hello' });
    expect(healed).toMatch(/pranam/i);
  });

  it('strips markdown headers like **Analysis:** and **Remedy:**', () => {
    const raw = '**Analysis:**\nJupiter is well placed.\n\n**Remedy:**\nPerform Surya Arghya.';
    const healed = responseSelfHealer.heal(raw, { turnIndex: 1, userMessage: 'Kya upay karu?' });
    expect(healed).not.toContain('**Analysis:**');
    expect(healed).not.toContain('**Remedy:**');
    expect(healed).toContain('Jupiter is well placed.');
    expect(healed).toContain('Perform Surya Arghya.');
  });

  it('moderates long essay responses for micro user inputs', () => {
    const raw = 'Haan samajh gaya.\n\nAapki kundli mein Shani aur Guru ka yog chal raha hai.\n\nParagraph 3.\n\nParagraph 4.';
    const healed = responseSelfHealer.heal(raw, { turnIndex: 3, userMessage: 'haan' });
    const paragraphs = healed.split(/\n+/);
    expect(paragraphs.length).toBeLessThanOrEqual(2);
  });
});
