/**
 * AstroAI Mobile Theme & Modern Design Tokens
 * Modern Electric Indigo & Monochrome (Linear / Apple Editorial Light Mode)
 * Crisp Porcelain, Deep Slate Typography, Electric Indigo & Ice Blue Accents.
 */

export const colors = {
  // Backgrounds & Surfaces (Clean Crisp Porcelain & Slate)
  background: '#F8FAFC',
  backgroundElevated: '#FFFFFF',
  backgroundCard: '#FFFFFF',
  backgroundCardElevated: '#F1F5F9',
  backgroundGlass: 'rgba(255, 255, 255, 0.95)',
  backgroundGlassHover: 'rgba(241, 245, 249, 0.98)',
  backgroundInput: '#F1F5F9',
  backgroundHighlight: 'rgba(79, 70, 229, 0.08)',
  backgroundGoldTint: 'rgba(79, 70, 229, 0.05)',

  // Brand / Electric Indigo & Cosmic Highlights (Zero Gold / Zero Orange)
  primary: '#4F46E5',
  primaryLight: '#6366F1',
  primaryDark: '#4338CA',
  primaryMuted: 'rgba(79, 70, 229, 0.08)',
  indigo: '#4F46E5',
  indigoLight: '#6366F1',
  indigoDark: '#4338CA',
  indigoMuted: 'rgba(79, 70, 229, 0.08)',
  iceBlue: '#EEF2FF',
  frostSilver: '#E2E8F0',

  // Backward compatible aliases mapped to Electric Indigo
  gold: '#4F46E5',
  goldLight: '#6366F1',
  goldDark: '#4338CA',
  goldMuted: 'rgba(79, 70, 229, 0.08)',
  goldGlow: 'rgba(79, 70, 229, 0.18)',
  goldBorder: 'rgba(79, 70, 229, 0.25)',
  saffron: '#6366F1',
  saffronLight: '#818CF8',
  saffronDark: '#4F46E5',
  saffronMuted: 'rgba(99, 102, 241, 0.08)',
  celestialIndigo: '#4F46E5',
  mysticPurple: '#7C3AED',
  mysticPurpleLight: '#8B5CF6',
  mysticPurpleMuted: 'rgba(124, 58, 237, 0.08)',

  // Semantic Status & Feedback
  success: '#10B981',
  successLight: '#34D399',
  successBackground: 'rgba(16, 185, 129, 0.10)',
  warning: '#F59E0B',
  warningLight: '#FCD34D',
  warningBackground: 'rgba(245, 158, 11, 0.10)',
  danger: '#EF4444',
  dangerLight: '#F87171',
  dangerBackground: 'rgba(239, 68, 68, 0.10)',
  error: '#EF4444',
  errorLight: 'rgba(239, 68, 68, 0.10)',
  errorBackground: 'rgba(239, 68, 68, 0.10)',
  info: '#0284C7',
  infoBackground: 'rgba(2, 132, 199, 0.10)',
  cardShadow: '#0F172A',

  // Typography & Text (Deep Obsidian Slate & High Contrast Legibility)
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',
  textGold: '#4F46E5',
  textGoldLight: '#6366F1',
  textSaffron: '#6366F1',
  textEmerald: '#059669',

  // Borders & Dividers (Crisp 1px Hairline Borders)
  borderSubtle: '#E2E8F0',
  borderDefault: '#CBD5E1',
  borderElevated: '#94A3B8',
  borderGold: 'rgba(79, 70, 229, 0.25)',
  borderGoldSubtle: 'rgba(79, 70, 229, 0.12)',
  borderFocus: '#4F46E5',

  // Overlays & Floating Navigation
  overlay: 'rgba(15, 23, 42, 0.60)',
  tabBarBackground: '#FFFFFF',
  tabBarBorder: '#E2E8F0',
};

export const typography = {
  display: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  h1: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  h2: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  h3: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  bodyLarge: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
    color: colors.textPrimary,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '400' as const,
    color: colors.textPrimary,
  },
  bodySecondary: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '400' as const,
    color: colors.textSecondary,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
    color: colors.textMuted,
  },
  overline: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    color: colors.textGold,
  },
};

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48,
  massive: 64,
};

export const radius = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  xxl: 28,
  full: 9999,
};

export const shadows = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  elevated: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  goldGlow: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.20,
    shadowRadius: 8,
    elevation: 3,
  },
  saffronGlow: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
};
