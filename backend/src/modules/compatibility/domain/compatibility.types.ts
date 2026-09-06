/**
 * Compatibility Domain & Aspect Data Models
 *
 * Defines domain-neutral relationship aspect representations,
 * provenance metadata, and validation schemas.
 */

export const AspectType = {
  CONJUNCTION: 'CONJUNCTION', // 0° (Cnj)
  OPPOSITION: 'OPPOSITION',   // 180° (Opp)
  TRINE: 'TRINE',             // 120° (Tri)
  SQUARE: 'SQUARE',           // 90° (Sqr)
  SEXTILE: 'SEXTILE',         // 60° (Sex / Sxt)
  QUINCUNX: 'QUINCUNX',       // 150° (Inc / Qnc)
  UNKNOWN: 'UNKNOWN',
} as const;

export type AspectType = (typeof AspectType)[keyof typeof AspectType];

export const CelestialBody = {
  SUN: 'SUN',           // Sun / Sol
  MOON: 'MOON',         // Moon / Luna
  MERCURY: 'MERCURY',   // Mer
  VENUS: 'VENUS',       // Ven
  MARS: 'MARS',         // Mar
  JUPITER: 'JUPITER',   // Jup
  SATURN: 'SATURN',     // Sat
  URANUS: 'URANUS',     // Ura
  NEPTUNE: 'NEPTUNE',   // Nep
  PLUTO: 'PLUTO',       // Plu
  NORTH_NODE: 'NORTH_NODE', // Node / Rahu
  CHIRON: 'CHIRON',     // Chi
  ASCENDANT: 'ASCENDANT', // Asc / Lagna
  MIDHEAVEN: 'MIDHEAVEN', // MC
  UNKNOWN: 'UNKNOWN',
} as const;

export type CelestialBody = (typeof CelestialBody)[keyof typeof CelestialBody];

/**
 * Normalized representation of an inter-chart astrological aspect.
 * Includes complete provenance tracking for traceability.
 */
export interface ChartRelationshipAspect {
  chartA: string;
  chartB: string;
  planetA: CelestialBody;
  planetB: CelestialBody;
  aspectType: AspectType;
  orbDegrees?: number;
  sourceDataset: string;
  sourceFile: string;
  methodology: 'WESTERN_TROPICAL_PTOLEMAIC' | 'VEDIC_DRISHTI' | 'SYNTHETIC_RESEARCH';
  importedAt: string; // ISO timestamp
  confidence?: 'HIGH' | 'MODERATE' | 'LOW';
  metadata?: Record<string, unknown>;
}

export interface DatasetValidationIssue {
  rowNumber?: number;
  columnName?: string;
  severity: 'ERROR' | 'WARNING';
  message: string;
}

export interface DatasetValidationResult {
  isValid: boolean;
  totalRows: number;
  validRows: number;
  issues: DatasetValidationIssue[];
  detectedColumns: string[];
}

export interface RawCoupleAspectRow {
  Chart_A_Name?: string;
  Chart_A_UTC?: string;
  Chart_A_LatLong?: string;
  Chart_B_Name?: string;
  Chart_B_UTC?: string;
  Chart_B_LatLong?: string;
  [aspectKey: string]: string | undefined;
}
