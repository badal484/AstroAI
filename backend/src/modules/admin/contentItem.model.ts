import { HydratedDocument, InferSchemaType, model, Schema } from 'mongoose';

const horoscopeSchema = new Schema(
  {
    rashi: { type: String, required: true, index: true },
    period: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'daily', required: true },
    date: { type: String, required: true, index: true }, // YYYY-MM-DD
    overview: { type: String, required: true },
    career: { type: String, required: true },
    love: { type: String, required: true },
    finance: { type: String, required: true },
    luckyNumber: { type: Number, default: 7 },
    luckyColor: { type: String, default: 'Gold' },
    luckyTime: { type: String, default: '09:00 AM - 11:00 AM' },
    published: { type: Boolean, default: true, required: true },
  },
  { timestamps: true },
);

const vedicArticleSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title: { type: String, required: true },
    summary: { type: String, required: true },
    bodyMarkdown: { type: String, required: true },
    category: {
      type: String,
      enum: ['kundli', 'planetary_transits', 'gemstones', 'rituals', 'vedic_philosophy'],
      required: true,
      index: true,
    },
    author: { type: String, default: 'AstroAI Vedic Council' },
    tags: { type: [String], default: [] },
    readingTimeMinutes: { type: Number, default: 5 },
    published: { type: Boolean, default: true },
    publishedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

const remedySchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    type: {
      type: String,
      enum: ['gemstone', 'rudraksha', 'mantra', 'puja', 'fasting'],
      required: true,
      index: true,
    },
    deityPlanet: { type: String, required: true },
    problemTarget: { type: String, required: true },
    instructions: { type: String, required: true },
    benefits: { type: String, required: true },
    caution: { type: String, default: 'Consult with an astrologer prior to wearing.' },
    published: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type HoroscopeDocument = HydratedDocument<InferSchemaType<typeof horoscopeSchema>>;
export type VedicArticleDocument = HydratedDocument<InferSchemaType<typeof vedicArticleSchema>>;
export type RemedyDocument = HydratedDocument<InferSchemaType<typeof remedySchema>>;

export const HoroscopeModel = model('Horoscope', horoscopeSchema);
export const VedicArticleModel = model('VedicArticle', vedicArticleSchema);
export const RemedyModel = model('Remedy', remedySchema);
