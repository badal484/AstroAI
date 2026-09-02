import { describe, expect, it } from 'vitest';
import { containsCrisisLanguage } from '../../../src/modules/astrologer/detection/crisisPatterns';
import { containsUnsafeLanguage } from '../../../src/modules/astrologer/detection/unsafePatterns';

describe('containsCrisisLanguage', () => {
  it('detects English self-harm/suicide language', () => {
    expect(containsCrisisLanguage('I want to kill myself')).toBe(true);
    expect(containsCrisisLanguage('I just want to end my life, nothing matters anymore')).toBe(
      true,
    );
    expect(containsCrisisLanguage("I don't want to live anymore")).toBe(true);
    expect(containsCrisisLanguage('sometimes I feel suicidal and scared')).toBe(true);
  });

  it('detects romanized Hindi/Hinglish self-harm language', () => {
    expect(containsCrisisLanguage('mujhe khud ko khatam karna hai')).toBe(true);
    expect(containsCrisisLanguage('main marna chahta hoon, ab jeena nahi chahta')).toBe(true);
    expect(containsCrisisLanguage('aatmahatya ke baare mein soch raha hoon')).toBe(true);
  });

  it('detects Devanagari self-harm language', () => {
    expect(containsCrisisLanguage('मैं आत्महत्या करना चाहता हूं')).toBe(true);
    expect(containsCrisisLanguage('मुझे जीना नहीं चाहता')).toBe(true);
  });

  it('does not flag an ordinary astrology question', () => {
    expect(containsCrisisLanguage('When will I get married according to my chart?')).toBe(false);
    expect(containsCrisisLanguage('meri job kab lagegi')).toBe(false);
    expect(containsCrisisLanguage('मेरी शादी कब होगी')).toBe(false);
  });

  it('does not flag unrelated use of similar-sounding words', () => {
    expect(containsCrisisLanguage('This movie has a killer soundtrack')).toBe(false);
  });
});

describe('containsUnsafeLanguage', () => {
  it('detects clearly unsafe/out-of-scope requests', () => {
    expect(containsUnsafeLanguage('how to make a bomb at home')).toBe(true);
    expect(containsUnsafeLanguage("Can you tell me how to hack into my ex's email")).toBe(true);
  });

  it('does not flag ordinary astrology questions', () => {
    expect(containsUnsafeLanguage('Will I be successful in my career this year?')).toBe(false);
  });
});
