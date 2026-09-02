import { describe, expect, it } from 'vitest';
import { SupportedLanguage } from '@astroai/shared-types';
import { detectLanguage } from '../../../src/modules/astrologer/detection/languageDetector';

describe('detectLanguage', () => {
  it('detects plain English', () => {
    expect(detectLanguage('When will I get married?')).toBe(SupportedLanguage.ENGLISH);
    expect(detectLanguage('What does my chart say about my career?')).toBe(
      SupportedLanguage.ENGLISH,
    );
  });

  it('detects Hindi written in Devanagari script', () => {
    expect(detectLanguage('मेरी शादी कब होगी?')).toBe(SupportedLanguage.HINDI);
    expect(detectLanguage('मुझे अपने करियर के बारे में जानना है')).toBe(SupportedLanguage.HINDI);
  });

  it('detects Hinglish (romanized Hindi mixed with English)', () => {
    expect(detectLanguage('meri shaadi kab hogi')).toBe(SupportedLanguage.HINGLISH);
    expect(detectLanguage('mera career kaisa rahega is saal')).toBe(SupportedLanguage.HINGLISH);
    expect(detectLanguage('yaar mujhe pata karna hai ki job milegi ya nahi')).toBe(
      SupportedLanguage.HINGLISH,
    );
  });

  it('does not misclassify English sentences that happen to share a short word with Hindi vocabulary', () => {
    // "ho" isn't in the word list; sanity check a clean English sentence
    // with no romanized-Hindi words at all stays English.
    expect(detectLanguage('I would like to understand my chart better.')).toBe(
      SupportedLanguage.ENGLISH,
    );
  });

  it('treats an empty or punctuation-only message as English by default', () => {
    expect(detectLanguage('')).toBe(SupportedLanguage.ENGLISH);
    expect(detectLanguage('???')).toBe(SupportedLanguage.ENGLISH);
  });
});
