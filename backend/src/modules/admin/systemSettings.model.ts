import { HydratedDocument, InferSchemaType, model, Schema } from 'mongoose';
import { AyanamshaSystem, HouseSystem } from '@astroai/shared-types';

const systemSettingsSchema = new Schema(
  {
    singletonKey: { type: String, default: 'GLOBAL_SETTINGS', unique: true, required: true },
    maintenance: {
      enabled: { type: Boolean, default: false },
      message: { type: String, default: 'AstroAI is currently undergoing scheduled celestial alignment maintenance.' },
      allowedIpAddresses: { type: [String], default: [] },
      startedAt: { type: Date, default: null },
      estimatedEndAt: { type: Date, default: null },
    },
    globalRateLimits: {
      publicApiRequestsPerMin: { type: Number, default: 60 },
      authRequestsPerMin: { type: Number, default: 10 },
      chatRequestsPerMin: { type: Number, default: 30 },
      voiceTurnsPerMin: { type: Number, default: 20 },
    },
    astrologyEngine: {
      ayanamsha: { type: String, default: AyanamshaSystem.LAHIRI },
      houseSystem: { type: String, default: HouseSystem.PLACIDUS },
      ephemerisProvider: { type: String, default: 'swiss_ephemeris' },
      ephemerisPrecision: { type: String, default: 'high_precision' },
      ashtakootaWeights: {
        varna: { type: Number, default: 1 },
        vashya: { type: Number, default: 2 },
        tara: { type: Number, default: 3 },
        yoni: { type: Number, default: 4 },
        grahaMaitri: { type: Number, default: 5 },
        gana: { type: Number, default: 6 },
        bhakoot: { type: Number, default: 7 },
        nadi: { type: Number, default: 8 },
      },
      manglikStrictness: { type: String, default: 'standard' },
      sadeSatiCalculation: { type: String, default: 'exact_degree_transit' },
    },
    security: {
      enforceMfaForAdmins: { type: Boolean, default: false },
      sessionTimeoutMinutes: { type: Number, default: 60 },
      maxLoginAttempts: { type: Number, default: 5 },
    },
    aiRouting: {
      chatPrimary: { type: String, default: 'gpt-4o' },
      chatFallback: { type: String, default: 'gemini-1.5-pro' },
      reportPrimary: { type: String, default: 'claude-3-5-sonnet' },
      voicePrimary: { type: String, default: 'gpt-4o-realtime' },
    },
  },
  { timestamps: true },
);

export type SystemSettingsDocument = HydratedDocument<InferSchemaType<typeof systemSettingsSchema>>;
export const SystemSettingsModel = model('SystemSettings', systemSettingsSchema);
