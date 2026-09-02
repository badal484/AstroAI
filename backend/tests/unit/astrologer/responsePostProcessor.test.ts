import { describe, expect, it } from 'vitest';
import { postProcessResponse } from '../../../src/modules/astrologer/postProcess/responsePostProcessor';

describe('postProcessResponse', () => {
  it('strips a repeated opening clause shared with the previous assistant message', () => {
    const previous = 'According to your birth chart, Venus is well placed for you this year.';
    const current = 'According to your birth chart, your career looks promising this month.';

    const result = postProcessResponse(current, previous);

    expect(result).not.toMatch(/^According to your birth chart/i);
    expect(result.toLowerCase()).toContain('career looks promising');
  });

  it('leaves a response alone when it does not repeat the previous opener', () => {
    const previous = 'According to your birth chart, Venus is well placed for you this year.';
    const current =
      "Let's talk about your career for a moment — this looks like a promising month.";

    expect(postProcessResponse(current, previous)).toBe(current);
  });

  it('leaves the response alone when there is no previous assistant message', () => {
    const current = 'According to your birth chart, this is a great time for new beginnings.';
    expect(postProcessResponse(current, null)).toBe(current);
  });

  it('does not strip a short, coincidental shared prefix', () => {
    const previous = 'Your career this month looks steady.';
    const current = 'Your family may need extra attention this week.';

    // Shared prefix is just "Your " (5 chars) — well under the minimum,
    // so nothing should be trimmed.
    expect(postProcessResponse(current, previous)).toBe(current);
  });

  it('collapses excess whitespace and blank lines', () => {
    const messy = 'Hello there.\n\n\n\nHow are you feeling   today?';
    expect(postProcessResponse(messy, null)).toBe('Hello there.\n\nHow are you feeling today?');
  });
});
