const MIN_SHARED_OPENER_LENGTH = 15;

function capitalizeFirstLetter(text: string): string {
  if (text.length === 0) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * If this response opens with the same clause as the immediately
 * preceding assistant message (e.g. the model reused "According to your
 * birth chart..." two turns in a row), strip the shared opening so the
 * conversation doesn't read as templated (CLAUDE.md "avoid repetitive
 * wording" — prompted for already in `systemPrompt.ts`; this is the
 * enforced backstop). Only trims an exact shared prefix, so it never
 * mangles a response that merely covers a similar topic.
 */
function stripRepeatedOpener(
  responseText: string,
  previousAssistantMessage: string | null,
): string {
  if (!previousAssistantMessage) return responseText;

  const current = responseText;
  const previous = previousAssistantMessage;
  const maxCompareLength = Math.min(current.length, previous.length);

  let sharedLength = 0;
  while (
    sharedLength < maxCompareLength &&
    current[sharedLength]!.toLowerCase() === previous[sharedLength]!.toLowerCase()
  ) {
    sharedLength++;
  }

  if (sharedLength < MIN_SHARED_OPENER_LENGTH) return responseText;

  // Trim back to the nearest clause boundary (comma, period, or newline)
  // so we don't cut off mid-word.
  const boundary = current.slice(0, sharedLength).lastIndexOf(',');
  const cutAt = boundary > 0 ? boundary + 1 : sharedLength;

  const remainder = current.slice(cutAt).trimStart();
  return remainder.length > 0 ? capitalizeFirstLetter(remainder) : current;
}

function collapseWhitespace(text: string): string {
  return text
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function postProcessResponse(
  responseText: string,
  previousAssistantMessage: string | null,
): string {
  const withoutRepeatedOpener = stripRepeatedOpener(responseText, previousAssistantMessage);
  return collapseWhitespace(withoutRepeatedOpener);
}
