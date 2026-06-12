// ─────────────────────────────────────────────────────────────
// THE FORGE — Design Tokens
// Tactical Minimalism design system.
// Import from here — never hardcode hex values in components.
// ─────────────────────────────────────────────────────────────

// ── Colours ───────────────────────────────────────────────────
export const Colors = {
    // Backgrounds — darkest to brightest
    bgBase:      '#101415', // root background (StatusBar matches this)
    bgLowest:    '#0B0F10',
    bgLow:       '#191C1E',
    bgSurface:   '#1D2022',
    bgHigh:      '#272A2C',
    bgHighest:   '#323537',
    bgBright:    '#363A3B',
  
    // Primary — Tactical Amber
    primary:     '#FFBF00',
    primaryDim:  '#BA7517',
    onPrimary:   '#402D00', // text/icon on amber background
  
    // Text
    textPrimary:  '#E0E3E5',
    textSecondary:'#B4B2A9',
    textTertiary: '#888780',
  
    // Outline / border
    outline:      '#9C8F78',
    outlineVar:   '#504532',
    outlineFaint: '#323537',
  
    // Semantic
    success:     '#4ADE80',
    successBg:   '#0E2A18',
    error:       '#FF8A80',
    errorBg:     '#2A1010',
    errorContainer: '#93000A',
  
    // Category accents (used by mission chips)
    communication:    '#5DCAA5',
    communicationBg:  '#1A2E3B',
    confidence:       '#378ADD',
    confidenceBg:     '#1E2A3A',
    leadership:       '#D85A30',
    leadershipBg:     '#2A1E1E',
    awareness:        '#7F77DD',
    awarenessBg:      '#1E1E2A',
    officerThinking:  '#EF9F27',
    officerThinkingBg:'#2A2518',
  } as const;
  
  export type ColorKey = keyof typeof Colors;
  
  // ── Typography ────────────────────────────────────────────────
  export const Fonts = {
    // Family names must match what's loaded in _layout.tsx
    display:     'Geist-Bold',
    heading:     'Geist-SemiBold',
    body:        'Inter-Regular',
    bodyMedium:  'Inter-Medium',
    mono:        'JetBrainsMono-Regular',
    monoMedium:  'JetBrainsMono-Medium',
  } as const;
  
  export const FontSizes = {
    display:    48,
    headingLg:  32,
    headingMd:  24,
    headingSm:  20,
    bodyLg:     18,
    bodyMd:     16,
    bodySm:     14,
    label:      12,
    micro:      10,
  } as const;
  
  export const LineHeights = {
    tight:   1.1,
    normal:  1.5,
    relaxed: 1.75,
  } as const;
  
  export const LetterSpacing = {
    tight:  -0.5,
    normal:  0,
    wide:    0.8,
    wider:   1.2,
    widest:  1.6,
  } as const;
  
  // ── Spacing ───────────────────────────────────────────────────
  // Base unit = 4px. All spacing is multiples of 4.
  export const Spacing = {
    xs:     4,
    sm:     8,
    md:     16,
    lg:     24,
    xl:     32,
    xxl:    48,
    xxxl:   64,
    gutter: 20, // horizontal screen padding
  } as const;
  
  // ── Border radius ─────────────────────────────────────────────
  export const Radius = {
    xs:   2,
    sm:   4,
    md:   8,
    lg:   12,
    xl:   16,
    full: 9999,
  } as const;
  
  // ── Shadows ───────────────────────────────────────────────────
  // Use sparingly — dark theme shadows are subtle
  export const Shadows = {
    sm: {
      shadowColor:   '#000',
      shadowOffset:  { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius:  2,
      elevation:     2,
    },
    md: {
      shadowColor:   '#000',
      shadowOffset:  { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius:  6,
      elevation:     5,
    },
  } as const;
  
  // ── Animation durations ───────────────────────────────────────
  export const Duration = {
    instant: 100,
    fast:    200,
    normal:  300,
    slow:    500,
    verySlow:800,
  } as const;
  
  // ── Rank colours ──────────────────────────────────────────────
  // Used by RankBadge and rank display components
  export const RankColors: Record<string, string> = {
    Cadet:     Colors.textTertiary,
    Officer:   Colors.success,
    Commander: Colors.primary,
  };
  
  // ── Convenience aliases (keep components readable) ────────────
  export const C = Colors;
  export const F = Fonts;
  export const S = Spacing;
  export const R = Radius;
