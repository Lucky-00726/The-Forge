---
name: Tactical Minimalism
colors:
  surface: '#101415'
  surface-dim: '#101415'
  surface-bright: '#363a3b'
  surface-container-lowest: '#0b0f10'
  surface-container-low: '#191c1e'
  surface-container: '#1d2022'
  surface-container-high: '#272a2c'
  surface-container-highest: '#323537'
  on-surface: '#e0e3e5'
  on-surface-variant: '#d4c5ab'
  inverse-surface: '#e0e3e5'
  inverse-on-surface: '#2d3133'
  outline: '#9c8f78'
  outline-variant: '#504532'
  surface-tint: '#fbbc00'
  primary: '#ffe2ab'
  on-primary: '#402d00'
  primary-container: '#ffbf00'
  on-primary-container: '#6d5000'
  inverse-primary: '#795900'
  secondary: '#b7c8e1'
  on-secondary: '#213145'
  secondary-container: '#3a4a5f'
  on-secondary-container: '#a9bad3'
  tertiary: '#b4efff'
  on-tertiary: '#003640'
  tertiary-container: '#04dcff'
  on-tertiary-container: '#005d6d'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdfa0'
  primary-fixed-dim: '#fbbc00'
  on-primary-fixed: '#261a00'
  on-primary-fixed-variant: '#5c4300'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#aaedff'
  tertiary-fixed-dim: '#00d9fc'
  on-tertiary-fixed: '#001f26'
  on-tertiary-fixed-variant: '#004e5c'
  background: '#101415'
  on-background: '#e0e3e5'
  surface-variant: '#323537'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: 0.1em
  coordinate-sm:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '400'
    lineHeight: '1.0'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  gutter: 16px
  margin-mobile: 20px
  margin-desktop: 48px
  max-width: 1200px
---

## Brand & Style

This design system is built for elite performance and high-stakes self-improvement. It draws from **Tactical Minimalism**, emphasizing discipline, precision, and operational clarity. The UI should evoke the feeling of a mission-critical interface—functional, unobtrusive, and authoritative. 

The aesthetic avoids the "gamified" tropes of typical fitness apps, opting instead for a **Corporate / Modern** structure infused with subtle military technicality. The experience is defined by high-contrast information density, focused whitespace, and a "dark-ops" color palette that minimizes eye strain while maintaining a premium, high-tech feel.

## Colors

The palette is strictly functional, utilizing a deep-space foundation to ensure content is the primary focus.

*   **Tactical Amber (#FFBF00):** Used exclusively for high-priority actions, active states, and critical data points. It is the "mission-critical" signal color.
*   **Deep Navy Surface (#0A0E14):** The primary background. It provides a non-distracting canvas that feels premium and immersive.
*   **Slate Secondary (#64748B):** Reserved for supporting text, borders, and inactive UI elements to maintain a low visual profile.
*   **High-Contrast White (#F8FAFC):** Used for primary body text and essential iconography to ensure maximum legibility against the dark background.

## Typography

Typography is treated as data. We use **Geist** for headlines to provide a sharp, technical edge, while **Inter** ensures that long-form educational content remains highly readable. 

A third typeface, **JetBrains Mono**, is used for "technical meta-data"—things like timestamps, coordinates, progress percentages, and status labels. This reinforces the "instrument panel" feel of the interface. 

Mobile adjustments: `display-lg` should scale down to `32px` on mobile devices to maintain layout integrity while preserving the heavy weight. All labels should remain uppercase for an authoritative, disciplined tone.

## Layout & Spacing

The layout follows a **Fixed Grid** philosophy to mirror the structured nature of military planning. Everything is built on an 8px base unit.

*   **Desktop:** 12-column grid with a fixed max-width. Large margins create "breathing room" that prevents the technical data from feeling overwhelming.
*   **Mobile:** 4-column grid. Information is stacked vertically in "modules."
*   **Rhythm:** Use consistent vertical rhythm. Components are separated by `32px` (4 units) or `64px` (8 units) to create clear "mission blocks."

Margins should feel intentional and spacious, directing the eye toward the center-aligned "objective" of the screen.

## Elevation & Depth

This design system rejects soft, ambient shadows in favor of **Tonal Layers** and **Low-Contrast Outlines**.

*   **Surface Tiering:** The background is `#0A0E14`. Elements that sit "above" the background (like cards) use `#121A26`.
*   **Borders:** Depth is defined by 1px borders using `#1E293B`. These "ghost borders" create a structural, technical look without adding visual weight.
*   **Active States:** When an element is focused or active, the border color shifts to the Tactical Amber (#FFBF00) or a brighter Slate.
*   **Glassmorphism:** Use very sparingly for top navigation bars (Backdrop blur: 12px, Opacity: 80%) to maintain context of the scroll position without breaking the minimalist aesthetic.

## Shapes

To maintain a disciplined and serious tone, the design system utilizes **Soft** roundedness. 

A corner radius of `4px` (0.25rem) is the standard for buttons, input fields, and cards. This provides just enough refinement to feel "modern" and "designed" without losing the aggressive, hardware-inspired edge of a sharp-cornered tactical interface. 

Large-scale containers or "zones" may use `0px` radius to emphasize structural rigidity when they span the full width of the viewport.

## Components

### Buttons
*   **Primary:** Solid Tactical Amber background, Black text (#000000), 4px radius. Bold uppercase labels.
*   **Secondary:** Ghost style. 1px Slate border, Slate or White text. No background fill unless hovered.

### Cards (Mission Blocks)
*   Background: `#121A26`. 
*   Border: 1px `#1E293B`.
*   Header: Includes a `label-caps` technical identifier in the top right (e.g., "ID: TACT-04").

### Input Fields
*   Minimalist design. Underline-only or subtle 1px border.
*   Focus state: Border changes to Tactical Amber. 
*   Label: Sits above the field in `label-caps` JetBrains Mono.

### Chips & Status Indicators
*   Rectangular with 2px radius. 
*   Used for "Mission Status" (e.g., ACTIVE, PENDING, COMPLETE). 
*   Use a "dot" indicator next to the text for a hardware-sensor feel.

### Progress Bars
*   Thin (4px height). 
*   Track: `#1E293B`. 
*   Indicator: `#FFBF00`. 
*   Segmented style: Use vertical dividers to show milestones, emphasizing the "steps" in a tactical plan.