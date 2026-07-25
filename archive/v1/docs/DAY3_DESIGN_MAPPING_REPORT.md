# DAY 3: DESIGN MAPPING REPORT
## Stitch UI → Forge Implementation Analysis

**Date:** 2026-06-13  
**Objective:** Visual redesign only — preserve all functionality  
**Source of Truth:** Stitch 1 and Stitch 2 design files  

---

## EXECUTIVE SUMMARY

### Stitch Design System Key Elements
1. **Tactical Minimalism** - Dark ops aesthetic (#101415 background)
2. **Corner Markers** - 12px border accents (top-left, bottom-right)
3. **Technical Metadata** - `JetBrains Mono` for IDs and coordinates
4. **Tactical Amber** (#FFBF00) - Primary action color
5. **Card Structure** - `#121A26` surface with `#1E293B` borders
6. **Hero Emphasis** - Large display typography for mission titles
7. **Segmented Progress** - Visual bars with gaps between segments
8. **Glassmorphism Nav** - backdrop-blur-xl with 80% opacity

---

## SCREEN-BY-SCREEN MAPPING

### 1. DASHBOARD (Home Screen)

#### Current Implementation (`app/(tabs)/index.tsx`)
- ✅ Dark background
- ✅ Monospace labels
- ✅ XP card with progress bar
- ✅ Streak card with fire emoji
- ✅ Mission briefing card
- ❌ Missing corner markers
- ❌ Missing hero visual treatment
- ❌ Missing tactical metadata (ID tags)
- ❌ Mission card lacks image/hero section
- ❌ Progress bar not segmented
- ❌ Layout density lower than Stitch

#### Matching Stitch Screen
**Stitch 1:** `mission_dashboard/code.html`

**Key Visual Elements:**
1. **Header:**
   - Profile avatar (40x40, rounded, border)
   - "ELITE VANGUARD" rank badge with XP progress inline
   - Horizontal progress bar (32px wide) next to text
   - Coordinate-sm metadata: "8,450 / 10,000"

2. **Streak Section:**
   - Fire icon (filled, primary color)
   - "ACTIVE ENGAGEMENT" label (label-caps)
   - "07 DAY STREAK" (display-lg, primary-container color)
   - Status text: "Operational Consistency: Optimal"
   - Card has tactical-glow shadow
   - Background watermark (shield logo, opacity 5%)

3. **Today's Mission (Hero Card):**
   - Hero image (192px height, grayscale, opacity 60%)
   - Gradient overlay from bottom
   - "PRIORITY: ALPHA" badge with pulse dot
   - Mission title overlay on image (headline-md)
   - Content section with italic quote
   - Full-width "COMMENCE MISSION" button
   - Corner ID tag: "ID: TACT-04"

4. **Quick Access Grid:**
   - 2-column grid
   - Icon in bordered container (40x40)
   - Label-caps titles
   - Coordinate-sm timestamps

#### Files to Modify
- ✅ `app/(tabs)/index.tsx`
- ✅ `src/constants/tokens.ts` (add corner marker utilities)
- ⚠️ `src/components/ui/CornerMarkers.tsx` (NEW - create component)

---

### 2. MISSION DETAIL SCREEN

#### Current Implementation (`app/mission/[id].tsx`)
- ✅ Category chips with colors
- ✅ XP badge
- ✅ Mission type display
- ❌ Missing corner markers on briefing card
- ❌ Back button not styled as "← ABORT"
- ❌ Missing hero image section
- ❌ Card borders not tactical (#1E293B)
- ❌ Missing ID metadata tags

#### Matching Stitch Screen
**Stitch 1:** `mission_execution_communication_drill/code.html`

**Key Visual Elements:**
1. **Header:**
   - "← ABORT" back button (label-caps, red/danger color)
   - Mission ID in coordinate-sm (top-right)

2. **Briefing Card:**
   - Corner markers (12px, primary color borders)
   - Category + Type chips (horizontal)
   - XP badge (primary-container background, rounded-lg)
   - Mission objective label (label-caps, "MISSION OBJECTIVE")
   - Large title (headline-md)
   - Importance indicator with dot

3. **Content Section:**
   - Type-specific content rendering (unchanged functionally)
   - Full-width submit button with arrow icon

#### Files to Modify
- ✅ `app/mission/[id].tsx`
- ✅ Mission type components (ReflectWrite, PollReasoning, DailyChallenge)

---

### 3. SUCCESS SCREEN

#### Current Implementation (`app/mission/success.tsx`)
- ✅ Large success icon
- ✅ XP display
- ✅ Streak and rank stats
- ❌ Missing radar pulse visual
- ❌ Missing corner markers on hero card
- ❌ Missing segmented progress bar
- ❌ Missing technical metadata panel
- ❌ Missing streak activity chart (vertical bars)
- ❌ Layout not matching Stitch's grid structure

#### Matching Stitch Screen
**Stitch 1:** `mission_success_rank_progression/code.html`

**Key Visual Elements:**
1. **Header:**
   - "OPERATIONAL UPDATE" label (label-caps, primary-container)
   - "MISSION ACCOMPLISHED" (display-lg, center)
   - Metadata row: timestamp + ID (coordinate-sm)

2. **Hero Visual Block (8-column):**
   - Corner markers (top-left, bottom-right)
   - Radar pulse animation (200px circle)
   - Rotating radar line with gradient
   - Shield emblem in center (96px)
   - "ELITE VANGUARD" title below
   - "RANK STATUS: ASCENDING" subtitle

3. **Side Panel (4-column):**
   - **XP Block:**
     - "+250" (headline-md, primary-container)
     - "NEXT: COMMANDER" label
     - Segmented progress bar (8 segments with gaps)
     - Progress text: "4,750 / 5,000 XP" + "95%"
   
   - **Streak Block:**
     - Fire icon in bordered box
     - "ACTIVE STREAK" label
     - "07 DAYS" (headline-sm)
     - Activity chart (7 vertical bars, varying heights)
     - "MAINTAINED: OPTIMAL PERFORMANCE" status

   - **Technical Specs Panel:**
     - Darkest background (surface-container-lowest)
     - 3 rows: DEPLOYMENT, DATA SYNC, LOADOUT
     - Dot separators, right-aligned values

4. **Actions:**
   - "CONTINUE TRAINING" (primary-container, scale hover effect)
   - "REVIEW INTEL" (ghost button)

#### Files to Modify
- ✅ `app/mission/success.tsx`
- ⚠️ `src/components/ui/RadarPulse.tsx` (NEW - create component)
- ⚠️ `src/components/ui/SegmentedProgressBar.tsx` (NEW - create component)

---

### 4. PROFILE SCREEN

#### Current Implementation (`app/(tabs)/profile.tsx`)
- ✅ Rank display
- ✅ XP stats
- ✅ Service record table
- ✅ Feedback section
- ❌ Missing corner markers on cards
- ❌ Stats grid layout differs from Stitch
- ❌ Missing technical styling for metadata
- ❌ Progress bar not segmented

#### Matching Stitch Screen
**Stitch 2:** `officer_dossier_performance_record/screen.png`

**Key Visual Elements** (inferred from design system):
1. **Header:**
   - Officer name (display-lg, uppercase)
   - Rank badge (bordered, colored by rank)
   - "OFFICER PROFILE" metadata label

2. **Rank Progression Card:**
   - Corner markers
   - Current → Next rank visual
   - Segmented progress bar
   - XP counter with "to next rank" text

3. **Stats Grid:**
   - 2-column layout
   - Icon in bordered container
   - Large value (headline-md)
   - Label below (label-caps)
   - Active state styling for streak card

4. **Service Record:**
   - Row-based layout with dividers
   - Left: label (coordinate-sm)
   - Right: value (monoMedium, colored)

5. **Feedback:**
   - Multi-line textarea with character count
   - Ghost button for submit

#### Files to Modify
- ✅ `app/(tabs)/profile.tsx`

---

## SHARED COMPONENTS NEEDED

### NEW Components to Create

#### 1. `CornerMarkers.tsx`
```typescript
// Visual corner accents (12px L-shaped borders)
// Props: position ('tl' | 'tr' | 'bl' | 'br' | 'all')
```

#### 2. `RadarPulse.tsx`
```typescript
// Animated radar circle with rotating line
// Props: size, centerContent (ReactNode)
```

#### 3. `SegmentedProgressBar.tsx`
```typescript
// Progress bar with gaps between segments
// Props: segments (number), progress (0-1), height
```

#### 4. `TechnicalMetadata.tsx`
```typescript
// ID tags, coordinates, timestamps in coordinate-sm font
// Props: id, label, position ('top-right' | 'bottom-left', etc.)
```

#### 5. `HeroMissionCard.tsx`
```typescript
// Large mission card with image, overlay, priority badge
// Props: mission (DbMission), onPress
```

---

## DESIGN TOKENS TO ADD

### Colors (Already in Stitch DESIGN.md)
```typescript
// Tactical surfaces
surfaceCard: '#121A26',
borderTactical: '#1E293B',

// Corner markers
cornerMarker: '#FFBF00',

// Glassmorphism
glassBlur: 'backdrop-blur-xl',
glassOpacity: 0.8,
```

### Shadows
```typescript
tacticalGlow: '0 0 15px rgba(255, 191, 0, 0.15)',
```

### Animations
```typescript
radarRotate: '4s linear infinite',
scaleHover: 'scale-105',
scaleActive: 'scale-95',
```

---

## TYPOGRAPHY HIERARCHY UPDATES

Current tokens need adjustment to match Stitch exactly:

```typescript
// Coordinates/Metadata
coordinateSm: {
  fontFamily: 'JetBrains Mono',
  fontSize: 10,
  fontWeight: '400',
  lineHeight: 1.0,
  letterSpacing: 0.3, // widest tracking
}

// Labels
labelCaps: {
  fontFamily: 'JetBrains Mono',
  fontSize: 12,
  fontWeight: '500',
  lineHeight: 1.2,
  letterSpacing: 0.1, // 0.1em
}

// Display (Hero text)
displayLg: {
  fontFamily: 'Geist',
  fontSize: 48,
  fontWeight: '700',
  lineHeight: 1.1,
  letterSpacing: -0.02, // -0.02em
}
```

---

## IMPLEMENTATION PRIORITY

### Phase 1: Foundation (Do First)
1. ✅ Create `CornerMarkers` component
2. ✅ Create `SegmentedProgressBar` component
3. ✅ Create `TechnicalMetadata` component
4. ✅ Update design tokens
5. ✅ Update shared `TacticalButton` to match Stitch styling

### Phase 2: Dashboard Redesign
1. ✅ Add corner markers to all cards
2. ✅ Redesign streak card with background watermark
3. ✅ Convert mission card to hero format with image
4. ✅ Add header profile + inline XP progress
5. ✅ Add metadata ID tags

### Phase 3: Mission Detail
1. ✅ Add corner markers to briefing card
2. ✅ Style "ABORT" back button
3. ✅ Update card borders to tactical color
4. ✅ Add metadata tags

### Phase 4: Success Screen
1. ✅ Create `RadarPulse` component
2. ✅ Restructure layout to 8+4 column grid
3. ✅ Add streak activity chart
4. ✅ Add technical specs panel
5. ✅ Add corner markers to hero block

### Phase 5: Profile
1. ✅ Add corner markers to cards
2. ✅ Update stats grid layout
3. ✅ Add segmented progress to rank card
4. ✅ Style metadata with coordinate-sm

---

## REMAINING VISUAL GAPS vs STITCH

After full implementation, these gaps will remain:

### Acceptable Gaps (Out of Scope)
1. **Hero Images** - Stitch uses AI-generated tactical imagery; we don't have mission images in database
2. **Shield Logo Watermark** - Requires custom SVG asset
3. **Radar Animation** - Complex SVG animation; simplified version acceptable
4. **Glassmorphism on Mobile** - May cause performance issues; fallback to solid OK

### Must-Have Elements
1. ✅ Corner markers on all major cards
2. ✅ Tactical color scheme (#121A26 cards, #FFBF00 accents)
3. ✅ Metadata tags (ID, coordinates, timestamps)
4. ✅ Segmented progress bars
5. ✅ Typography hierarchy (Geist + Inter + JetBrains Mono)
6. ✅ Layout density and spacing matching Stitch
7. ✅ Tactical button styling with arrow icons

---

## FILES INVENTORY

### Files to Create (7 new files)
1. `src/components/ui/CornerMarkers.tsx`
2. `src/components/ui/SegmentedProgressBar.tsx`
3. `src/components/ui/TechnicalMetadata.tsx`
4. `src/components/ui/RadarPulse.tsx`
5. `src/components/ui/HeroMissionCard.tsx`
6. `src/components/ui/ActivityChart.tsx`
7. `src/components/ui/TechnicalSpecsPanel.tsx`

### Files to Modify (10 existing files)
1. `src/constants/tokens.ts` - Add new colors, shadows, sizes
2. `src/components/ui/index.ts` - Export new components
3. `src/components/ui/TacticalButton.tsx` - Match Stitch styling
4. `app/(tabs)/index.tsx` - Dashboard redesign
5. `app/mission/[id].tsx` - Mission detail redesign
6. `app/mission/success.tsx` - Success screen redesign
7. `app/(tabs)/profile.tsx` - Profile redesign
8. `src/components/mission-types/ReflectWrite.tsx` - Minor styling updates
9. `src/components/mission-types/PollReasoning.tsx` - Minor styling updates
10. `src/components/mission-types/DailyChallenge.tsx` - Minor styling updates

---

## ESTIMATED IMPACT

### No Breaking Changes
- ✅ All auth flows preserved
- ✅ All mission logic preserved
- ✅ All XP/streak calculations preserved
- ✅ All navigation preserved
- ✅ All Supabase queries preserved

### Pure Visual Changes
- Colors, spacing, typography
- Component structure (visual only)
- Layout hierarchy
- Corner accents, borders, shadows
- Progress bar segmentation (visual only)

---

## NEXT STEP

**Proceed with implementation in this order:**
1. Create foundation components (CornerMarkers, SegmentedProgressBar, etc.)
2. Update design tokens
3. Redesign Dashboard
4. Redesign Mission Detail
5. Redesign Success Screen
6. Redesign Profile
7. Generate completion report with before/after screenshots

---

*Ready to implement. Awaiting approval to proceed.*
