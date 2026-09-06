/**
 * AstroAI Mobile Theme & Vedic Design Tokens
 * Defines a calm, trustworthy, premium, modern Indian spiritual technology aesthetic.
 * Primary Astrologer: Acharya Vashishta
 */

export const colors = {
  // Backgrounds & Surfaces (Restrained Deep Midnight & Charcoal Navy)
  background: '#0B0F19',
  backgroundElevated: '#121827',
  backgroundCard: '#121827',
  backgroundCardElevated: '#1B2236',
  backgroundGlass: 'rgba(18, 24, 39, 0.92)',
  backgroundInput: '#161D2F',
  backgroundHighlight: 'rgba(212, 163, 71, 0.08)',

  // Brand / Vedic Gold & Spiritual Accents (Antique Gold & Subtle Saffron)
  gold: '#D4A347',
  goldLight: '#E9C16C',
  goldDark: '#B88930',
  goldMuted: 'rgba(212, 163, 71, 0.12)',
  goldGlow: 'rgba(212, 163, 71, 0.15)',
  saffron: '#D96B27',
  celestialIndigo: '#5C6F9C',
  mysticPurple: '#7E69AB', // Muted, restrained secondary accent

  // Semantic Status & Feedback
  success: '#10B981',
  successBackground: 'rgba(16, 185, 129, 0.12)',
  warning: '#F59E0B',
  warningBackground: 'rgba(245, 158, 11, 0.12)',
  danger: '#EF4444',
  dangerBackground: 'rgba(239, 68, 68, 0.12)',
  info: '#38BDF8',
  infoBackground: 'rgba(56, 189, 248, 0.12)',

  // Typography & Text (WCAG AAA/AA Compliant High Contrast)
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textInverse: '#0B0F19',
  textGold: '#E2B857',
  textGoldLight: '#FDE68A',

  // Borders & Dividers
  borderSubtle: 'rgba(255, 255, 255, 0.08)',
  borderDefault: 'rgba(255, 255, 255, 0.14)',
  borderGold: 'rgba(212, 163, 71, 0.28)',
  borderFocus: '#D4A347',

  // Overlays
  overlay: 'rgba(11, 15, 25, 0.85)',
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
    fontWeight: '600' as const,
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
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 2,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
  },
  goldGlow: {
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
};
