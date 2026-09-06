import {
  AspectType,
  CelestialBody,
  type ChartRelationshipAspect,
  type RawCoupleAspectRow,
} from '../domain/compatibility.types';

const BODY_MAPPING: Record<string, CelestialBody> = {
  sun: CelestialBody.SUN,
  sol: CelestialBody.SUN,
  moon: CelestialBody.MOON,
  luna: CelestialBody.MOON,
  mer: CelestialBody.MERCURY,
  mercury: CelestialBody.MERCURY,
  ven: CelestialBody.VENUS,
  venus: CelestialBody.VENUS,
  mar: CelestialBody.MARS,
  mars: CelestialBody.MARS,
  jup: CelestialBody.JUPITER,
  jupiter: CelestialBody.JUPITER,
  sat: CelestialBody.SATURN,
  saturn: CelestialBody.SATURN,
  ura: CelestialBody.URANUS,
  uranus: CelestialBody.URANUS,
  nep: CelestialBody.NEPTUNE,
  neptune: CelestialBody.NEPTUNE,
  plu: CelestialBody.PLUTO,
  pluto: CelestialBody.PLUTO,
  node: CelestialBody.NORTH_NODE,
  rahu: CelestialBody.NORTH_NODE,
  chi: CelestialBody.CHIRON,
  chiron: CelestialBody.CHIRON,
  asc: CelestialBody.ASCENDANT,
  ascendant: CelestialBody.ASCENDANT,
  mc: CelestialBody.MIDHEAVEN,
  midheaven: CelestialBody.MIDHEAVEN,
};

const ASPECT_MAPPING: Record<string, AspectType> = {
  cnj: AspectType.CONJUNCTION,
  conjunction: AspectType.CONJUNCTION,
  opp: AspectType.OPPOSITION,
  opposition: AspectType.OPPOSITION,
  tri: AspectType.TRINE,
  trine: AspectType.TRINE,
  sqr: AspectType.SQUARE,
  square: AspectType.SQUARE,
  sex: AspectType.SEXTILE,
  sxt: AspectType.SEXTILE,
  sextile: AspectType.SEXTILE,
  inc: AspectType.QUINCUNX,
  qnc: AspectType.QUINCUNX,
  quincunx: AspectType.QUINCUNX,
};

export interface ParsedAspectColumn {
  planetA: CelestialBody;
  planetB: CelestialBody;
  aspectType: AspectType;
  rawColumnName: string;
}

export const datasetNormalizer = {
  /**
   * Parses column headers like "A-B-MerCnjVen" or "A-B-SunOppMar" into structured aspect definitions.
   */
  parseAspectColumn(columnName: string): ParsedAspectColumn | null {
    // Pattern matches: A-B-[Body1][Aspect][Body2] or [Body1]_[Aspect]_[Body2]
    const match = columnName.match(/^(?:A-B-)?([A-Za-z]+?)(Cnj|Opp|Tri|Sqr|Sex|Sxt|Inc|Qnc|Conjunction|Opposition|Trine|Square|Sextile)([A-Za-z]+)$/i);
    if (!match || !match[1] || !match[2] || !match[3]) {
      return null;
    }

    const rawBodyA = match[1].toLowerCase();
    const rawAspect = match[2].toLowerCase();
    const rawBodyB = match[3].toLowerCase();

    const planetA = BODY_MAPPING[rawBodyA] ?? CelestialBody.UNKNOWN;
    const aspectType = ASPECT_MAPPING[rawAspect] ?? AspectType.UNKNOWN;
    const planetB = BODY_MAPPING[rawBodyB] ?? CelestialBody.UNKNOWN;

    if (planetA === CelestialBody.UNKNOWN || planetB === CelestialBody.UNKNOWN || aspectType === AspectType.UNKNOWN) {
      return null;
    }

    return {
      planetA,
      planetB,
      aspectType,
      rawColumnName: columnName,
    };
  },

  /**
   * Normalizes a raw CSV couple row into typed ChartRelationshipAspect array.
   */
  normalizeRow(
    row: RawCoupleAspectRow,
    sourceDataset: string = 'gokhanyu/open-astrology-datasets',
    sourceFile: string = 'gauq-couples-aspects-REAL-7deg-20000-noa2b-cdata4.csv',
    defaultOrb: number = 7.0,
  ): ChartRelationshipAspect[] {
    const chartA = row.Chart_A_Name ?? 'Unknown_Chart_A';
    const chartB = row.Chart_B_Name ?? 'Unknown_Chart_B';
    const importedAt = new Date().toISOString();
    const aspects: ChartRelationshipAspect[] = [];

    for (const [key, rawVal] of Object.entries(row)) {
      if (key.startsWith('Chart_')) continue;

      const numVal = parseInt(String(rawVal ?? '').trim(), 10);
      // Value '1' denotes aspect activation within the configured orb threshold
      if (numVal === 1) {
        const parsed = datasetNormalizer.parseAspectColumn(key);
        if (parsed) {
          aspects.push({
            chartA,
            chartB,
            planetA: parsed.planetA,
            planetB: parsed.planetB,
            aspectType: parsed.aspectType,
            orbDegrees: defaultOrb,
            sourceDataset,
            sourceFile,
            methodology: 'WESTERN_TROPICAL_PTOLEMAIC',
            importedAt,
            confidence: 'HIGH',
            metadata: {
              rawColumnName: key,
              chartA_UTC: row.Chart_A_UTC,
              chartB_UTC: row.Chart_B_UTC,
              chartA_LatLong: row.Chart_A_LatLong,
              chartB_LatLong: row.Chart_B_LatLong,
            },
          });
        }
      }
    }

    return aspects;
  },
};
