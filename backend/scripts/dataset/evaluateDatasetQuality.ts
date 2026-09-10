import fs from 'fs';
import readline from 'readline';
import path from 'path';

const OUTPUT_DIR = path.resolve(__dirname, '../../data/fine-tuning');
const TRAIN_PATH = path.join(OUTPUT_DIR, 'sft_train.jsonl');
const VAL_PATH = path.join(OUTPUT_DIR, 'sft_val.jsonl');
const DPO_PATH = path.join(OUTPUT_DIR, 'dpo_pairs.jsonl');

const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

interface QualityReport {
  totalSamples: number;
  validJSON: number;
  emojiViolations: number;
  wordCountExceeded: number;
  averageWordCount: number;
  thoughtTagsPresent: number;
  errors: string[];
}

async function validateSFTFile(filePath: string): Promise<QualityReport> {
  const report: QualityReport = {
    totalSamples: 0,
    validJSON: 0,
    emojiViolations: 0,
    wordCountExceeded: 0,
    averageWordCount: 0,
    thoughtTagsPresent: 0,
    errors: []
  };

  if (!fs.existsSync(filePath)) {
    report.errors.push(`File not found: ${filePath}`);
    return report;
  }

  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let totalWords = 0;
  let assistantTurns = 0;

  for await (const line of rl) {
    if (!line.trim()) continue;
    report.totalSamples++;

    try {
      const parsed = JSON.parse(line);
      report.validJSON++;

      if (!Array.isArray(parsed.messages) || parsed.messages.length < 2) {
        report.errors.push(`Line ${report.totalSamples}: Invalid messages array format`);
        continue;
      }

      for (const msg of parsed.messages) {
        if (msg.role === 'assistant') {
          assistantTurns++;
          const content: string = msg.content;

          // Check Emojis
          if (EMOJI_REGEX.test(content)) {
            report.emojiViolations++;
            report.errors.push(`Line ${report.totalSamples}: Emoji detected in assistant response`);
          }

          // Check Thought tags
          if (content.includes('<thought>') && content.includes('</thought>')) {
            report.thoughtTagsPresent++;
          }

          // Strip thought tag for word count check
          const cleanText = content.replace(/<thought>[\s\S]*?<\/thought>/, '').trim();
          const wordCount = cleanText.split(/\s+/).filter(Boolean).length;
          totalWords += wordCount;

          if (wordCount > 75) {
            report.wordCountExceeded++;
            report.errors.push(`Line ${report.totalSamples}: Assistant response too long (${wordCount} words)`);
          }
        }
      }
    } catch (err: any) {
      report.errors.push(`Line ${report.totalSamples}: JSON parse error - ${err.message}`);
    }
  }

  report.averageWordCount = assistantTurns > 0 ? Math.round(totalWords / assistantTurns) : 0;
  return report;
}

async function validateDPOFile(filePath: string): Promise<{ totalPairs: number; validPairs: number; emojiInChosen: number }> {
  let totalPairs = 0;
  let validPairs = 0;
  let emojiInChosen = 0;

  if (!fs.existsSync(filePath)) return { totalPairs, validPairs, emojiInChosen };

  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const line of rl) {
    if (!line.trim()) continue;
    totalPairs++;
    try {
      const parsed = JSON.parse(line);
      if (parsed.prompt && parsed.chosen && parsed.rejected) {
        validPairs++;
        if (EMOJI_REGEX.test(parsed.chosen)) {
          emojiInChosen++;
        }
      }
    } catch {
      // ignore
    }
  }

  return { totalPairs, validPairs, emojiInChosen };
}

export async function runQualityEvaluation(): Promise<boolean> {
  console.log('=== AstroAI Astrologer Dataset Quality Evaluation ===\n');

  console.log('1. Evaluating SFT Train Set...');
  const trainReport = await validateSFTFile(TRAIN_PATH);
  console.log(`- Total Samples: ${trainReport.totalSamples}`);
  console.log(`- Valid JSON: ${trainReport.validJSON} (${((trainReport.validJSON / trainReport.totalSamples) * 100).toFixed(1)}%)`);
  console.log(`- Emoji Violations: ${trainReport.emojiViolations} (Target: 0)`);
  console.log(`- Word Count Exceeded (>75 words): ${trainReport.wordCountExceeded} (Target: 0)`);
  console.log(`- Average Assistant Words: ${trainReport.averageWordCount} words/turn (Ideal: 25-50 words)`);
  console.log(`- Reasoning <thought> Tags: ${trainReport.thoughtTagsPresent}`);

  console.log('\n2. Evaluating SFT Validation Set...');
  const valReport = await validateSFTFile(VAL_PATH);
  console.log(`- Total Samples: ${valReport.totalSamples}`);
  console.log(`- Valid JSON: ${valReport.validJSON}`);
  console.log(`- Emoji Violations: ${valReport.emojiViolations}`);

  console.log('\n3. Evaluating DPO Preference Pairs...');
  const dpoReport = await validateDPOFile(DPO_PATH);
  console.log(`- Total Preference Pairs: ${dpoReport.totalPairs}`);
  console.log(`- Valid Pairs: ${dpoReport.validPairs}`);
  console.log(`- Emoji in Chosen: ${dpoReport.emojiInChosen} (Target: 0)`);

  const passed =
    trainReport.validJSON === trainReport.totalSamples &&
    trainReport.emojiViolations === 0 &&
    trainReport.wordCountExceeded === 0 &&
    dpoReport.emojiInChosen === 0;

  console.log('\n----------------------------------------');
  if (passed) {
    console.log('Quality Gate Result: PASSED (100% compliant with Vedic Astrologer rubric)');
  } else {
    console.log(`Quality Gate Result: FAILED (${trainReport.errors.length} issues found)`);
    if (trainReport.errors.length > 0) {
      console.log('Top Errors:', trainReport.errors.slice(0, 5));
    }
  }
  console.log('----------------------------------------\n');

  return passed;
}

if (require.main === module) {
  runQualityEvaluation();
}
