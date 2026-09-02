import { FactPrecision, type AstrologyChart, type TimeConfidence } from '@astroai/shared-types';
import { astrologyService } from '../../astrology';
import { birthProfileService } from '../../birthProfiles';
import { AstrologyEngineUnavailableError, NotFoundError } from '../../../shared/errors';

export interface AstrologyContext {
  available: boolean;
  birthProfileName: string | null;
  timeConfidence: TimeConfidence | null;
  /** Pre-formatted, prompt-ready text — the ONLY astrology facts the
   * persona is allowed to reference (CLAUDE.md §11: never invent chart
   * facts). When `available` is false, this instead tells the model
   * plainly that no verified data exists right now. */
  summaryText: string;
}

function unavailable(reason: string): AstrologyContext {
  return {
    available: false,
    birthProfileName: null,
    timeConfidence: null,
    summaryText: `No verified astrology data is available for this conversation (${reason}). Do not invent, guess, or assume any chart facts — planetary positions, houses, dasha, nakshatra, or yogas. If the user's question depends on their chart, say so honestly and, where relevant, ask for their birth details instead of answering as if you had them.`,
  };
}

function precisionNote(precision: FactPrecision): string {
  if (precision === FactPrecision.UNAVAILABLE) {
    return ' (not reliable without an exact birth time — treat as unknown, do not state it as fact)';
  }
  if (precision === FactPrecision.LOW_CONFIDENCE) {
    return ' (lower confidence — birth time is only approximate, so mention this is not exact)';
  }
  return '';
}

function formatChart(chart: AstrologyChart): string {
  const lines: string[] = [];

  lines.push(
    `Ascendant (Lagna): ${chart.ascendant.sign}, ${chart.ascendant.degree.toFixed(2)}°${precisionNote(chart.ascendant.precision)}`,
  );
  lines.push(
    `Moon nakshatra: ${chart.moonNakshatra.name}, pada ${chart.moonNakshatra.pada}, lord ${chart.moonNakshatra.lord}`,
  );

  if (chart.planetPositions.length > 0) {
    const planets = chart.planetPositions
      .map((planet) => {
        const house = planet.house !== null ? `house ${planet.house}` : 'house unknown';
        const retro = planet.isRetrograde ? ', retrograde' : '';
        return `${planet.planet} in ${planet.sign} (${house}${retro})`;
      })
      .join('; ');
    lines.push(`Planetary positions: ${planets}`);
  }

  if (chart.houses.length > 0) {
    const uncertainHouses = chart.houses.filter(
      (house) => house.precision !== FactPrecision.RELIABLE,
    );
    if (uncertainHouses.length > 0) {
      lines.push(
        `Houses ${uncertainHouses.map((house) => house.number).join(', ')} are not reliable without an exact birth time.`,
      );
    }
  }

  if (chart.currentDasha) {
    const antardasha = chart.currentDasha.antardashas[0];
    lines.push(
      `Current mahadasha: ${chart.currentDasha.planet} (${chart.currentDasha.startDate} to ${chart.currentDasha.endDate})` +
        (antardasha ? `, current antardasha: ${antardasha.planet}` : ''),
    );
  }

  if (chart.yogas.length > 0) {
    lines.push(`Yogas present: ${chart.yogas.map((yoga) => yoga.name).join(', ')}`);
  }

  return lines.join('\n');
}

/**
 * Pulls verified facts from the Astrology Engine (never computes anything
 * itself — CLAUDE.md §11) and formats them for prompt injection. Degrades
 * gracefully and explicitly whenever verified data isn't available (no
 * birth profile linked, birth profile not found, or the astrology engine
 * itself isn't configured yet) rather than ever letting the model guess.
 */
export async function buildAstrologyContext(
  userId: string,
  birthProfileId: string | null,
): Promise<AstrologyContext> {
  if (!birthProfileId) {
    return unavailable('no birth profile is linked to this conversation yet');
  }

  let timeConfidence: TimeConfidence;
  let birthProfileName: string;
  try {
    const profile = await birthProfileService.getById(userId, birthProfileId);
    timeConfidence = profile.timeConfidence;
    birthProfileName = profile.name;
  } catch (error) {
    if (error instanceof NotFoundError) {
      return unavailable('the linked birth profile could not be found');
    }
    throw error;
  }

  try {
    const chart = await astrologyService.getChart(userId, birthProfileId);
    return {
      available: true,
      birthProfileName,
      timeConfidence,
      summaryText: formatChart(chart),
    };
  } catch (error) {
    if (error instanceof AstrologyEngineUnavailableError) {
      return unavailable(
        'the astrology calculation engine is not configured on this server right now',
      );
    }
    throw error;
  }
}
