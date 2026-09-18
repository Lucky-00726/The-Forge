# Forge component library — Industrial Precision

Drop these into `src/components/forge/`. Import from the barrel:

```ts
import { MilledSurface, ForgeButton, Display, SegmentedProgress } from '../../components/forge';
```

Verified: `tsc --noEmit` clean against the library plus all 19 existing screens.

## What's here

| Component | Purpose |
| --- | --- |
| `MilledSurface` | The signature raised card — 1px light top/left edge, shadow below. `brackets` adds corner brackets, `active` adds the gold outline |
| `RecessedTrack` | Inset well, darker than its parent — the streak module, input backgrounds |
| `CornerBrackets` | The 1px L-shapes on their own, for composing into anything |
| `Display` `Headline` `BodyLg` `Body` `LabelCaps` `Mono` | The six type roles. Use these instead of bare `<Text>` |
| `ForgeButton` | `primary` (the gold key), `secondary` (outlined), `ghost` (text + arrow) |
| `SegmentedProgress` | Segment bar — 3 for daily sessions, 12 or 10 for questions |
| `OptionButton` | Answer row with letter gutter and `default / selected / correct / incorrect / disabled` |
| `Chip` `MetaItem` `MetaRow` `SectionLabel` | IN PROGRESS, 6 MIN, the icon+label meta rows, section headers |

## The rule these follow

**Nothing here decides anything.** No component fetches, scores, times, or judges correctness. `OptionButton` takes a `state`; it does not know which answer is right. `SegmentedProgress` takes `total` and `current`; it does not know what a session is.

That is deliberate and it is the line that keeps the migration safe. Session logic stays in the controllers. If a component ever needs to call `setInterval` or compare an answer, the wrong thing is being built.

## Icons

Components take icons as an optional `React.ReactNode` prop rather than importing an icon library, so nothing here forces a dependency.

The Stitch designs use **Material Symbols Outlined**. To use the same glyphs:

```
npx expo install @expo/vector-icons
```

Then pass them in:

```tsx
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/tokens';

<MetaItem
  label="10 exercises"
  icon={<MaterialIcons name="layers" size={16} color={Colors.textSecondary} />}
/>
```

Material Symbols names map to MaterialIcons with dashes: `check_circle` → `check-circle`, `local_fire_department` → `local-fire-department`. A few Symbols glyphs have no MaterialIcons equivalent — substitute rather than adding a second icon font.

Everything renders correctly with no icons at all, so this can wait.

## Two RN limits worth knowing

**No inset shadows.** The Stitch `inset 1px 1px 0 rgba(255,255,255,0.05)` is reproduced with hairline top and left borders. Visually equivalent at 1px; don't try to fake it with a gradient.

**The primary button is two views.** A shelf (`#9A7F2A`) with the gold face on top; pressing translates the face down 4px onto the shelf. The container height is fixed, so the button never reflows while pressed. If you restyle it, keep that structure.

## Rebuilding a screen with these

The pattern, using the Home screen as the example:

1. **Keep every hook, effect and handler exactly as it is.** Only the returned JSX changes.
2. Replace layout `View`s with `MilledSurface` / `RecessedTrack` where the design shows a card.
3. Replace every `<Text>` with the matching type role.
4. Replace buttons with `ForgeButton`.
5. Delete the screen's local `StyleSheet` entries that the components now own. Keep the ones for screen-level layout (padding, gaps, scroll container).

If a screen's diff touches anything other than JSX and styles, stop — that is a logic change wearing a redesign costume.

## Don't copy the mock content

The Stitch HTML contains invented data. None of it should reach the app:

- `COMMUNICATION: Talk to Pakistan` — placeholder mission
- `REMAINING AIR` on the Session 3 timer — should read time remaining
- `OFFICER_DEV_012`, `MOD-0824`, `PROGRESS_LOG_04`, `Validated Protocol 7.21` — invented identifiers
- `844 XP`, `STREAK 01`, `BEST 04`, `DAY 02` — all come from the store and the session service
