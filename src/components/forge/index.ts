// ─────────────────────────────────────────────────────────────
// THE FORGE — Industrial Precision component library
//
// Presentation only. Nothing in here fetches, scores, times or
// decides anything: every component renders exactly what it is
// given. Session logic stays in the controllers.
//
//   import { MilledSurface, ForgeButton, Display } from '@/components/forge';
// ─────────────────────────────────────────────────────────────

export { MilledSurface, RecessedTrack, CornerBrackets } from './Surface';
export type { BracketTone } from './Surface';

export { Display, Headline, BodyLg, Body, LabelCaps, Mono } from './Text';

export { ForgeButton } from './Button';
export type { ButtonVariant } from './Button';

export { SegmentedProgress } from './SegmentedProgress';
export type { SegmentState } from './SegmentedProgress';

export { OptionButton } from './OptionButton';
export type { OptionState } from './OptionButton';

export { Chip, MetaItem, MetaRow, SectionLabel } from './Chip';
export type { ChipTone } from './Chip';