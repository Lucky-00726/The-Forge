// ─────────────────────────────────────────────────────────────
// THE FORGE — Design Tokens
// "Industrial Precision" design system (Stitch redux).
// Import from here — never hardcode hex values in components.
//
// MIGRATION NOTE
// Every export name from the previous token file is preserved,
// so all 19 screens and 12 shared components compile unchanged.
// Only the VALUES move to the Stitch palette. Nothing here
// touches business logic, navigation or data.
//
// Source of truth: industrial_precision/DESIGN.md frontmatter,
// cross-checked against the hex values actually used in the 16
// exported screens. Where DESIGN.md prose and frontmatter
// disagreed (#121212 vs #131313), the frontmatter wins — it is
// what the screens render.
// ─────────────────────────────────────────────────────────────

// ── Colours ───────────────────────────────────────────────────
export const Colors = {
  // Backgrounds — darkest to brightest.
  // Stitch surface ladder: container-lowest → surface-bright.
  bgBase:      '#131313', // root background (StatusBar matches this)
  bgLowest:    '#0E0E0E', // deepest wells, inset inputs
  bgLow:       '#1C1B1B', // subtle raised panel
  bgSurface:   '#201F1F', // standard card surface
  bgHigh:      '#2A2A2A', // hovered / selected card
  bgHighest:   '#353534', // chips, pressed states
  bgBright:    '#393939', // dividers on dark cards

  // Primary — Forge Gold
  // primary  = bright gold, for text/icons/active states
  // primaryDim = deeper gold, for filled button backgrounds
  primary:     '#F2CA50',
  primaryDim:  '#D4AF37',
  onPrimary:   '#3C2F00', // text/icon ON a gold background
  primaryHi:   '#FFE088', // top-edge highlight on pressed gold
  primaryFixed:'#E9C349', // gold at rest in gradients/borders

  // Text
  textPrimary:   '#E5E2E1', // warm off-white
  textSecondary: '#D0C5AF', // warm secondary metadata
  textTertiary:  '#99907C', // muted labels, disabled

  // Outline / border
  outline:      '#99907C',
  outlineVar:   '#4D4635',
  outlineFaint: '#353534',

  // Semantic
  success:     '#4ADE80',
  successDim:  '#22C55E',
  successBg:   '#0E2A18',
  error:       '#FFB4AB',
  errorBg:     '#2A1010',
  errorContainer: '#93000A',
  onError:     '#690005',

  // Accent — Burnt Orange.
  // Reserved for "Active" / "In Progress" states only.
  accent:      '#FF9961',
  accentSoft:  '#FFC1A1',
  accentBg:    '#753000',
  onAccent:    '#552100',

  // Neutral secondary (cool grey) — system chrome, inactive tabs
  neutral:     '#C6C6CB',
  neutralDim:  '#46464B',

  // Category accents (mission chips) — retuned to sit in the
  // warmer Industrial Precision palette without losing identity.
  communication:    '#5DCAA5',
  communicationBg:  '#152A25',
  confidence:       '#378ADD',
  confidenceBg:     '#152230',
  leadership:       '#D85A30',
  leadershipBg:     '#2A1A14',
  awareness:        '#7F77DD',
  awarenessBg:      '#1C1A2A',
  officerThinking:  '#EF9F27',
  officerThinkingBg:'#2A2214',
} as const;

export type ColorKey = keyof typeof Colors;

// ── Typography ────────────────────────────────────────────────
// ⚠ These families are NOT currently loaded anywhere in the app.
// Until the font files are bundled and registered in
// app/_layout.tsx, React Native silently falls back to the
// Android system font (Roboto) at all 319 call sites.
// See FONT-SETUP.md — this is a prerequisite for the redesign,
// not an optional polish step.
export const Fonts = {
  display:     'HankenGrotesk-Bold',      // 700
  heading:     'HankenGrotesk-SemiBold',  // 600
  body:        'HankenGrotesk-Regular',   // 400
  bodyMedium:  'HankenGrotesk-Medium',    // 500
  mono:        'Geist-Regular',           // 400 — technical readouts
  monoMedium:  'Geist-SemiBold',          // 600 — label-caps
} as const;

// Stitch type scale. Sizes shift down from the previous scale
// (display 48→36, headingLg 32→28) — this is the single biggest
// visual change in the retune and will reflow long headings.
export const FontSizes = {
  display:    36, // display-lg
  headingLg:  28, // display-md
  headingMd:  24,
  headingSm:  20, // headline-sm
  bodyLg:     18,
  bodyMd:     16, // body-lg
  bodySm:     14, // body-md
  label:      12, // label-mono
  micro:      11, // label-caps
} as const;

export const LineHeights = {
  tight:   1.22, // display-lg 44/36
  normal:  1.5,  // body-lg 24/16
  relaxed: 1.75,
} as const;

// Absolute px line heights, for when a multiplier is not precise
// enough (RN does not accept em units).
export const LineHeightPx = {
  display:   44,
  headingLg: 34,
  headingSm: 28,
  bodyMd:    24,
  bodySm:    20,
  label:     16,
} as const;

export const LetterSpacing = {
  tight:  -0.7, // -0.02em @ 36px
  normal:  0,
  wide:    0.8,
  wider:   1.1, // 0.1em @ 11px — label-caps
  widest:  1.6,
} as const;

// ── Spacing ───────────────────────────────────────────────────
// Strict 8pt grid with 4pt sub-divisions.
export const Spacing = {
  xs:     4,
  sm:     8,
  md:     16,
  lg:     24,
  xl:     32,
  xxl:    48,
  xxxl:   64,
  gutter: 16, // was 20 — Stitch fixes mobile side margins at 16
} as const;

// ── Border radius ─────────────────────────────────────────────
// "Soft-Industrial": 4px baseline. Avoid pill shapes — they
// clash with the instrument aesthetic. `full` is retained only
// for avatars and status dots.
export const Radius = {
  xs:   2,
  sm:   4,  // buttons, inputs, cards — the default
  md:   6,
  lg:   8,
  xl:   12,
  full: 9999,
} as const;

// ── Shadows ───────────────────────────────────────────────────
// Depth is tactile, not dramatic: a dark shadow below paired
// with a 1px light top edge (apply `raisedEdge` as a border).
export const Shadows = {
  sm: {
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius:  2,
    elevation:     2,
  },
  md: {
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius:  6,
    elevation:     5,
  },
} as const;

// 1px "milled" highlight on the top edge of a raised surface.
export const RaisedEdge = {
  borderTopWidth: 1,
  borderTopColor: 'rgba(255, 255, 255, 0.05)',
} as const;

// Inset treatment for input fields and depressed buttons.
export const InsetSurface = {
  backgroundColor: Colors.bgLowest,
  borderWidth:     1,
  borderColor:     Colors.outlineVar,
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

// ── Legacy Tactical aliases ───────────────────────────────────
// Retained so existing imports keep resolving. Values now point
// at the Industrial Precision surfaces rather than the old
// blue-grey tactical ones.
export const TacticalColors = {
  surfaceCard:     Colors.bgSurface,
  borderTactical:  Colors.outlineVar,
  glassBackground: 'rgba(19, 19, 19, 0.88)',
} as const;

export const TacticalShadows = {
  glow: {
    shadowColor:   Colors.primary,
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius:  15,
    elevation:     8,
  },
} as const;

// ── Corner brackets — the signature detail ────────────────────
// 1px L-shapes in the four corners of an ACTIVE or FEATURED
// component. Amber for focus, burnt orange for "engaged".
export const CornerMarker = {
  size:        12,
  borderWidth: 1,   // was 2 — Stitch specifies 1px throughout
  color:       Colors.primary,
  activeColor: Colors.accent,
} as const;