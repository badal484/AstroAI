import { describe, it, expect } from 'vitest';
import {
  datasetImporter,
  datasetNormalizer,
  datasetValidator,
  AspectType,
  CelestialBody,
} from '../index';

describe('Open Astrology Dataset Integration & Normalization Suite', () => {
  const sampleValidCSV = `Chart_A_Name,Chart_A_UTC,Chart_B_Name,Chart_B_UTC,A-B-MerCnjVen,A-B-SunOppMar,A-B-JupTriSat,A-B-VenSqrMar
Pair_001,1920-04-15T12:00:00Z,Pair_001_B,1922-08-20T15:30:00Z,1,0,1,0
Pair_002,1931-11-05T08:15:00Z,Pair_002_B,1933-02-10T22:45:00Z,0,1,0,1`;

  const sampleMalformedValuesCSV = `Chart_A_Name,Chart_A_UTC,A-B-MerCnjVen,A-B-SunOppMar
Pair_001,1920-04-15T12:00:00Z,5,INVALID_VALUE`;

  const sampleNoAspectsCSV = `Chart_A_Name,Chart_A_UTC,Chart_B_Name,Chart_B_UTC
Pair_001,1920-04-15T12:00:00Z,Pair_001_B,1922-08-20T15:30:00Z`;

  describe('1. Aspect Column Header Parser', () => {
    it('accurately parses personal planet aspect combinations', () => {
      const merCnjVen = datasetNormalizer.parseAspectColumn('A-B-MerCnjVen');
      expect(merCnjVen).not.toBeNull();
      expect(merCnjVen?.planetA).toBe(CelestialBody.MERCURY);
      expect(merCnjVen?.planetB).toBe(CelestialBody.VENUS);
      expect(merCnjVen?.aspectType).toBe(AspectType.CONJUNCTION);

      const sunOppMar = datasetNormalizer.parseAspectColumn('A-B-SunOppMar');
      expect(sunOppMar?.planetA).toBe(CelestialBody.SUN);
      expect(sunOppMar?.planetB).toBe(CelestialBody.MARS);
      expect(sunOppMar?.aspectType).toBe(AspectType.OPPOSITION);

      const jupTriSat = datasetNormalizer.parseAspectColumn('A-B-JupTriSat');
      expect(jupTriSat?.planetA).toBe(CelestialBody.JUPITER);
      expect(jupTriSat?.planetB).toBe(CelestialBody.SATURN);
      expect(jupTriSat?.aspectType).toBe(AspectType.TRINE);

      const venSqrMar = datasetNormalizer.parseAspectColumn('A-B-VenSqrMar');
      expect(venSqrMar?.planetA).toBe(CelestialBody.VENUS);
      expect(venSqrMar?.planetB).toBe(CelestialBody.MARS);
      expect(venSqrMar?.aspectType).toBe(AspectType.SQUARE);
    });

    it('accurately parses outer planets, nodes, and angle aspects', () => {
      const ascCnjVen = datasetNormalizer.parseAspectColumn('A-B-AscCnjVen');
      expect(ascCnjVen?.planetA).toBe(CelestialBody.ASCENDANT);
      expect(ascCnjVen?.planetB).toBe(CelestialBody.VENUS);

      const mcTriSun = datasetNormalizer.parseAspectColumn('A-B-MCTriSun');
      expect(mcTriSun?.planetA).toBe(CelestialBody.MIDHEAVEN);
      expect(mcTriSun?.planetB).toBe(CelestialBody.SUN);

      const nodeSexMar = datasetNormalizer.parseAspectColumn('A-B-NodeSexMar');
      expect(nodeSexMar?.planetA).toBe(CelestialBody.NORTH_NODE);
      expect(nodeSexMar?.aspectType).toBe(AspectType.SEXTILE);
    });

    it('returns null for unrecognized or non-aspect column names', () => {
      expect(datasetNormalizer.parseAspectColumn('Chart_A_Name')).toBeNull();
      expect(datasetNormalizer.parseAspectColumn('Chart_A_UTC')).toBeNull();
      expect(datasetNormalizer.parseAspectColumn('Random_Invalid_Column')).toBeNull();
    });
  });

  describe('2. Dataset Validator', () => {
    it('validates a well-formed CSV header and rows', () => {
      const { headers, rows } = datasetImporter.parseCSVText(sampleValidCSV);
      const validation = datasetValidator.validateRows(rows, headers);

      expect(validation.isValid).toBe(true);
      expect(validation.totalRows).toBe(2);
      expect(validation.validRows).toBe(2);
      expect(validation.issues).toHaveLength(0);
    });

    it('rejects CSV with missing aspect headers', () => {
      const { headers, rows } = datasetImporter.parseCSVText(sampleNoAspectsCSV);
      const validation = datasetValidator.validateRows(rows, headers);

      expect(validation.isValid).toBe(false);
      expect(validation.issues.some((i) => i.message.includes('No recognizable astrological aspect columns'))).toBe(true);
    });

    it('flags non-binary aspect values as validation errors', () => {
      const { headers, rows } = datasetImporter.parseCSVText(sampleMalformedValuesCSV);
      const validation = datasetValidator.validateRows(rows, headers);

      expect(validation.isValid).toBe(false);
      expect(validation.issues.some((i) => i.message.includes("Invalid aspect value '5'"))).toBe(true);
    });
  });

  describe('3. Dataset Importer & Provenance Normalization', () => {
    it('imports and normalizes valid couple records with strict provenance', () => {
      const result = datasetImporter.importCSV(sampleValidCSV, {
        sourceDataset: 'gokhanyu/open-astrology-datasets',
        sourceFileName: 'gauq-couples-aspects-REAL-7deg-20000-noa2b-cdata4.csv',
        defaultOrb: 7.0,
      });

      expect(result.success).toBe(true);
      expect(result.processedCouplesCount).toBe(2);
      expect(result.aspectCount).toBe(4); // 2 active aspects per row

      const firstAspect = result.normalizedAspects[0];
      expect(firstAspect?.chartA).toBe('Pair_001');
      expect(firstAspect?.planetA).toBe(CelestialBody.MERCURY);
      expect(firstAspect?.planetB).toBe(CelestialBody.VENUS);
      expect(firstAspect?.aspectType).toBe(AspectType.CONJUNCTION);
      expect(firstAspect?.orbDegrees).toBe(7.0);
      expect(firstAspect?.sourceDataset).toBe('gokhanyu/open-astrology-datasets');
      expect(firstAspect?.methodology).toBe('WESTERN_TROPICAL_PTOLEMAIC');
      expect(firstAspect?.importedAt).toBeDefined();

      expect(result.provenance.policyNote).toContain('Strictly isolated for research/evaluation benchmarking');
    });

    it('rejects malformed CSV data and avoids returning partial corrupted records', () => {
      const result = datasetImporter.importCSV(sampleMalformedValuesCSV);
      expect(result.success).toBe(false);
      expect(result.aspectCount).toBe(0);
      expect(result.normalizedAspects).toHaveLength(0);
    });
  });
});
