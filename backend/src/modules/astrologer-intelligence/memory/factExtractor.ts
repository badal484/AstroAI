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

    // 1. Career, Profession & Competitive Exams
    if (/\b(i am a|i work as a|working as|profession is|main ek)\s+([a-z\s]{3,30})/i.test(text)) {
      const match = text.match(/\b(?:i am a|i work as a|working as|profession is|main ek)\s+([a-zA-Z\s]{3,30})/i);
      if (match && match[1]) {
        facts.push({
          category: MemoryCategory.CAREER,
          key: 'profession',
          value: match[1].trim(),
          fact: `Works as ${match[1].trim()}`,
        });
      }
    } else if (/\b(upsc|ias|ips|gate|cat|neet|iit|jee|ca|bank po|ssc|cgl|sarkari naukri|govt exam)\b/i.test(text)) {
      const match = text.match(/\b(upsc|ias|ips|gate|cat|neet|iit|jee|ca|bank po|ssc|cgl|sarkari naukri|govt exam)\b/i);
      if (match && match[1]) {
        facts.push({
          category: MemoryCategory.CAREER,
          key: 'preparation',
          value: match[1].toUpperCase(),
          fact: `Preparing for ${match[1].toUpperCase()} exam`,
        });
      }
    } else if (/\b(preparing for|exam for|studying for|ki taiyari|ka exam)\s+([a-z\s]{3,30})/i.test(text)) {
      const match = text.match(/\b(?:preparing for|exam for|studying for|ki taiyari|ka exam)\s+([a-zA-Z\s]{3,30})/i);
      if (match && match[1]) {
        facts.push({
          category: MemoryCategory.CAREER,
          key: 'preparation',
          value: match[1].trim(),
          fact: `Preparing for ${match[1].trim()}`,
        });
      }
    } else if (/\b(software engineer|developer|doctor|lawyer|teacher|designer|marketer|consultant|accountant|data scientist)\b/i.test(text)) {
      const match = text.match(/\b(software engineer|developer|doctor|lawyer|teacher|designer|marketer|consultant|accountant|data scientist)\b/i);
      if (match && match[1]) {
        facts.push({
          category: MemoryCategory.CAREER,
          key: 'profession',
          value: match[1].trim(),
          fact: `Professional background in ${match[1].trim()}`,
        });
      }
    }

    // 2. Relationship Status & Specific Entities
    if (/\b(girlfriend nahi|gf nahi|not girlfriend)[,\s]+(wife|patni)\b/i.test(text)) {
      facts.push({
        category: MemoryCategory.RELATIONSHIP,
        key: 'relationshipStatus',
        value: 'married',
        fact: 'Clarified relationship status: Married (Wife, not girlfriend)',
      });
    } else if (/\b(my girlfriend|my boyfriend|my partner|my wife|my husband|meri girlfriend|meri wife|mera partner)\s+(?:name is\s+|ka naam\s+)?([A-Z][a-z]+)/.test(text)) {
      const match = text.match(/\b(my girlfriend|my boyfriend|my partner|my wife|my husband|meri girlfriend|meri wife|mera partner)\s+(?:name is\s+|ka naam\s+)?([A-Z][a-z]+)/);
      if (match && match[1] && match[2]) {
        facts.push({
          category: MemoryCategory.RELATIONSHIP,
          key: 'partner',
          value: `${match[1]} (${match[2]})`,
          fact: `${match[1]} named ${match[2]}`,
        });
      }
    } else if (/\b(i am single|unmarried|single hoon|not married|abhi single)\b/i.test(text)) {
      facts.push({
        category: MemoryCategory.RELATIONSHIP,
        key: 'relationshipStatus',
        value: 'single',
        fact: 'Currently single / unmarried',
      });
    } else if (/\b(breakup ho gaya|breakup hua|alag ho gaye|separated)\b/i.test(text)) {
      facts.push({
        category: MemoryCategory.RELATIONSHIP,
        key: 'relationshipStatus',
        value: 'breakup / separated',
        fact: 'Recently experienced a relationship separation or breakup',
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

    // 3. Family Context & Health
    if (/\b(mummy|papa|father|mother|bhai|brother|sister|behan)\s+(?:ki health|ki tabiyat|bimar|ill|hospital)\b/i.test(text)) {
      facts.push({
        category: MemoryCategory.FAMILY,
        fact: 'Expressed concern regarding family member health / well-being',
      });
    } else if (/\b(have\s+(\d+|one|two|three)\s+(?:kids|children|daughters?|sons?))\b/i.test(text)) {
      const match = text.match(/\b(have\s+(\d+|one|two|three)\s+(?:kids|children|daughters?|sons?))\b/i);
      if (match && match[1]) {
        facts.push({
          category: MemoryCategory.FAMILY,
          fact: match[1],
        });
      }
    }

    // 4. Goals & Aspirations
    if (/\b(want to start a|planning to start a|thinking of starting a|startup shuru)\s+(business|startup|company|venture|firm)\b/i.test(text)) {
      facts.push({
        category: MemoryCategory.GOALS,
        fact: 'Aspires to launch a business / startup venture',
      });
    } else if (/\b(planning to buy a\s+(?:home|house|flat|property)|ghar khareedna chahta|makan lena)\b/i.test(text)) {
      facts.push({
        category: MemoryCategory.GOALS,
        fact: 'Planning to purchase a home / property',
      });
    } else if (/\b(planning (?:to go|for)\s+(?:abroad|master'?s|foreign studies|ms|mba)|videsh jana)\b/i.test(text)) {
      facts.push({
        category: MemoryCategory.GOALS,
        fact: 'Planning for higher studies / relocation abroad',
      });
    }

    return facts;
  },
};
