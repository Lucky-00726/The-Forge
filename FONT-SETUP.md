# Font setup — prerequisite for the UI migration

## The problem

`src/constants/tokens.ts` declares six font families. **None of them are loaded anywhere in the app.**

- No `useFonts` call exists in the codebase (`grep -rn "useFonts" app src` → 0 results)
- No font files are bundled (`find assets -iname "*.ttf" -o -iname "*.otf"` → 0 results)
- `expo-font` is installed and listed in `app.config.ts` plugins, but nothing is ever handed to it

React Native does not error on a missing `fontFamily` — it silently falls back to the platform default. So all **319** `fontFamily` declarations across the app currently render in Roboto on Android.

This matters for the redesign in two ways:

1. Your app has never looked like any mockup, because the mockups assume real fonts.
2. Fixing it is the highest leverage change available — it lands across all 319 sites at once, with no per-screen work.

Do this **before** judging whether the token retune got the look right. Evaluating the palette while the typography is wrong will send you chasing the wrong problems.

## Which fonts

From `industrial_precision/DESIGN.md`:

| Role | Family | Weights needed |
| --- | --- | --- |
| Display, headings, body | Hanken Grotesk | 400, 500, 600, 700 |
| Labels, technical readouts | Geist | 400, 600 |

## Option A — Expo Google Fonts packages (try first)

Both families are on Google Fonts, so `@expo-google-fonts` packages very likely exist for them. **I could not verify the exact package names from my sandbox** — scoped npm packages are blocked by its proxy — so confirm before relying on it:

```
npm view @expo-google-fonts/hanken-grotesk version
npm view @expo-google-fonts/geist version
```

If both resolve:

```
npx expo install @expo-google-fonts/hanken-grotesk @expo-google-fonts/geist expo-font
```

If `geist` has no package, fall back to Option B for Geist only — you can mix the two approaches.

## Option B — bundle the TTFs directly (always works)

1. Download from `fonts.google.com` — Hanken Grotesk and Geist.
2. Create `assets/fonts/` and copy in the static weights you need:

```
assets/fonts/
  HankenGrotesk-Regular.ttf
  HankenGrotesk-Medium.ttf
  HankenGrotesk-SemiBold.ttf
  HankenGrotesk-Bold.ttf
  Geist-Regular.ttf
  Geist-SemiBold.ttf
```

Use the **static** weights, not the variable-font files — React Native does not select weights from a variable font.

The filename stem becomes the family name, and it must match `Fonts` in `tokens.ts` exactly. `HankenGrotesk-SemiBold.ttf` → `'HankenGrotesk-SemiBold'`.

## The patch to `app/_layout.tsx`

Two changes. Both are additive.

### 1. Add the import

After the existing `expo-secure-store` import (currently line 16):

```ts
import { useFonts } from 'expo-font';
```

### 2. Load the fonts inside `RootLayout`

Immediately after the `useAuthInitializer();` call:

```ts
  // Load the Industrial Precision type stack.
  // Deliberately NOT gating the splash screen on this — see note below.
  const [fontsLoaded, fontError] = useFonts({
    'HankenGrotesk-Regular':  require('../assets/fonts/HankenGrotesk-Regular.ttf'),
    'HankenGrotesk-Medium':   require('../assets/fonts/HankenGrotesk-Medium.ttf'),
    'HankenGrotesk-SemiBold': require('../assets/fonts/HankenGrotesk-SemiBold.ttf'),
    'HankenGrotesk-Bold':     require('../assets/fonts/HankenGrotesk-Bold.ttf'),
    'Geist-Regular':          require('../assets/fonts/Geist-Regular.ttf'),
    'Geist-SemiBold':         require('../assets/fonts/Geist-SemiBold.ttf'),
  });

  useEffect(() => {
    if (fontError) console.error('[STARTUP] Font load failed:', fontError);
  }, [fontError]);
```

`useEffect` is already imported. Nothing else changes.

## Why the splash screen is deliberately not gated on fonts

Your `app/_layout.tsx` hides the splash in `onLayoutRootView` on first layout, unconditionally. That is what makes startup robust, and it is the fix for the production splash bug recorded in §11 of your brief.

The common Expo pattern is to hold the splash until `fontsLoaded` is true. **Do not do that here.** It reintroduces exactly the failure mode you already fixed: if a font file is missing from the release bundle, `fontsLoaded` never becomes true, the splash never hides, and the app hangs on a blank screen in the production APK while working fine in dev.

The cost of not gating is a brief flash of system font on first paint before text re-renders in Hanken Grotesk. That is a much better trade than a startup hang.

If the flash bothers you later, gate it with a timeout rather than on `fontsLoaded` alone — never let a font failure block the splash.

## Verifying it worked

Font problems are invisible in a typecheck and easy to miss by eye, because Roboto is a competent fallback.

1. `npx tsc --noEmit` — should stay clean.
2. Run on a device and open any session screen.
3. Check that the monospaced readouts (the timer in Session 3, the `label-caps` headers) render in Geist, not Roboto. Geist's digits are visibly narrower and more geometric.
4. If everything still looks like Roboto, the filename stems do not match the `Fonts` values in `tokens.ts` — that is the usual cause, and it fails silently.