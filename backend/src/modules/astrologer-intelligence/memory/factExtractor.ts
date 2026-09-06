import { MemoryCategory } from './memoryTypes';

export interface ExtractedFact {
  category: MemoryCategory;
  fact: string;
  key?: string;
  value?: string;
}

export const factExtractor = {
  extractFacts(text: string): ExtractedFact[] {
    return factExtractor.extractFactsFromMessage(text);
  },

  extractFactsFromMessage(text: string): ExtractedFact[] {
    const facts: ExtractedFact[] = [];

    // 1. Career & Profession
    if (/\b(i am a|i work as a|working as|profession is)\s+([a-z\s]{3,30})/i.test(text)) {
      const match = text.match(/\b(?:i am a|i work as a|working as|profession is)\s+([a-zA-Z\s]{3,30})/i);
      if (match && match[1]) {
        facts.push({
          category: MemoryCategory.CAREER,
          key: 'profession',
          value: match[1].trim(),
          fact: `Works as ${match[1].trim()}`,
        });
      }
    } else if (/\b(preparing for|exam for|studying for)\s+([a-z\s]{3,30})/i.test(text)) {
      const match = text.match(/\b(?:preparing for|exam for|studying for)\s+([a-zA-Z\s]{3,30})/i);
      if (match && match[1]) {
        facts.push({
          category: MemoryCategory.CAREER,
          key: 'preparation',
          value: match[1].trim(),
          fact: `Preparing for ${match[1].trim()}`,
        });
      }
    } else if (/\b(software engineer|developer|doctor|lawyer|teacher|designer|marketer|consultant|accountant)\b/i.test(text)) {
      const match = text.match(/\b(software engineer|developer|doctor|lawyer|teacher|designer|marketer|consultant|accountant)\b/i);
      if (match && match[1]) {
        facts.push({
          category: MemoryCategory.CAREER,
          key: 'profession',
          value: match[1].trim(),
          fact: `Professional background in ${match[1].trim()}`,
        });
      }
    }

    // 2. Relationship Status
    if (/\b(my girlfriend|my boyfriend|my partner|my wife|my husband)\s+(?:name is\s+)?([A-Z][a-z]+)/.test(text)) {
      const match = text.match(/\b(my girlfriend|my boyfriend|my partner|my wife|my husband)\s+(?:name is\s+)?([A-Z][a-z]+)/);
      if (match && match[1] && match[2]) {
        facts.push({
          category: MemoryCategory.RELATIONSHIP,
          key: 'partner',
          value: `${match[1]} (${match[2]})`,
          fact: `${match[1]} named ${match[2]}`,
        });
      }
    } else if (/\b(i am single|unmarried|single hoon|not married)\b/i.test(text)) {
      facts.push({
        category: MemoryCategory.RELATIONSHIP,
        key: 'relationshipStatus',
        value: 'single',
        fact: 'Currently single / unmarried',
      });
    } else if (/\b(married for\s+\d+\s+years|shaadi ko\s+\d+\s+saal)\b/i.test(text)) {
      const match = text.match(/\b(?:married for|shaadi ko)\s+(\d+)\s+(?:years|saal)\b/i);
      if (match && match[1]) {
        facts.push({
          category: MemoryCategory.RELATIONSHIP,
          key: 'relationshipStatus',
          value: `married ${match[1]} years`,
          fact: `Married for ${match[1]} years`,
        });
      }
    }

    // 3. Family Context
    if (/\b(have\s+(\d+|one|two|three)\s+(?:kids|children|daughters?|sons?))\b/i.test(text)) {
      const match = text.match(/\b(have\s+(\d+|one|two|three)\s+(?:kids|children|daughters?|sons?))\b/i);
      if (match && match[1]) {
        facts.push({
          category: MemoryCategory.FAMILY,
          fact: match[1],
        });
      }
    }

    // 4. Goals & Aspirations
    if (/\b(want to start a|planning to start a|thinking of starting a)\s+(business|startup|company|venture|firm)\b/i.test(text)) {
      facts.push({
        category: MemoryCategory.GOALS,
        fact: 'Aspires to launch a business / startup venture',
      });
    } else if (/\b(planning to buy a\s+(?:home|house|flat|property)|ghar khareedna chahta)\b/i.test(text)) {
      facts.push({
        category: MemoryCategory.GOALS,
        fact: 'Planning to purchase a home / property',
      });
    } else if (/\b(planning (?:to go|for)\s+(?:abroad|master'?s|foreign studies|ms|mba))\b/i.test(text)) {
      facts.push({
        category: MemoryCategory.GOALS,
        fact: 'Planning for higher studies / Master’s degree abroad',
      });
    }

    return facts;
  },
};
