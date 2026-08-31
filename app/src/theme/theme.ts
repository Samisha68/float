/**
 * Float — prototype theme. NOT the Float design system.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DESIGN.md COMPLIANCE: FAILING. Audited 2026-08-31.
 * ─────────────────────────────────────────────────────────────────────────────
 * DESIGN.md (repo root) is the source of truth for every visual decision. This
 * file predates it and contradicts it on essentially every axis. It is left in
 * place because the hackathon app still runs on it, not because it is correct.
 * Do not copy any value from this file into a new surface.
 *
 * Violations, in order of severity:
 *
 *  1. PALETTE. DESIGN.md locks four values — #FFFFFF, #000000, #031329 (dark
 *     blue), #8A94A6 (grey) — and states "no fifth colour". This file defines
 *     ~30 colours and uses none of the four (only #000, and only in shadows).
 *
 *  2. ACCENT. DESIGN.md: "No accent colour." This file is built around an
 *     indigo/violet accent (primary #6366F1, primaryLight, primaryDark,
 *     primaryMuted, primaryGlow).
 *
 *  3. STATUS BY COLOUR. The most important violation. DESIGN.md removes red,
 *     amber and green deliberately, so that loan states must be carried by
 *     "text, iconography, and hierarchy, not colour" — "every status needs an
 *     explicit written label". This file colour-codes status twice over:
 *     success/warning/error/info, and active/repaid/liquidated/
 *     collateralWithdrawn. DESIGNER_BRIEF.md repeats the same constraint and
 *     asks that it be raised rather than quietly broken. It was quietly broken.
 *
 *  4. GLOW. primaryGlow and shadows.glow. DESIGN.md's motion rule is "things
 *     settle and level… no bounce, no spin, no confetti"; DESIGNER_BRIEF.md
 *     bans "crypto aesthetics — neon, dark casino energy, gradients, glow"
 *     outright.
 *
 *  5. SPACING. DESIGN.md scale: 4/8/12/16/24/32/48/64. This file: 4/8/12/16/
 *     20/24/32 — 20 is off-scale, 48 and 64 are missing.
 *
 *  6. RADIUS. DESIGN.md: sm 6 / md 10 / lg 14. This file: sm 8 / md 12 / lg 16
 *     (plus xl/xxl/full, which do not exist in the system).
 *
 *  7. TYPE. DESIGN.md specifies Poppins 400–700 and tabular lining figures
 *     everywhere money appears. Poppins is not loaded anywhere in the app, no
 *     tabular figure setting exists, and weights here run to 900.
 *
 *  8. BYPASS. ~30 hard-coded hex values live in app/src/screens and
 *     app/src/components without going through this file at all (#374151
 *     appears 14 times), so even fixing this file would not make the app
 *     compliant.
 *
 * Recommendation: do not repaint this app. Per README.md the mobile app is not
 * the v1 surface for the business-credit product. Treat DESIGN.md as binding
 * for the new surface and build its tokens there from scratch.
 */

import { Platform } from "react-native";

export const colors = {
  // Backgrounds
  bg: "#050508",
  bgElevated: "#0C0C12",
  bgCard: "#12121A",
  bgCardHover: "#18182A",
  bgInput: "#0E0E14",

  // Surface
  surface: "#16161F",
  surfaceBorder: "#1E1E2E",
  surfaceBorderSubtle: "#252532",

  // Text
  text: "#FAFAFC",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
  textDisabled: "#475569",

  // Accent
  primary: "#6366F1",
  primaryLight: "#818CF8",
  primaryDark: "#4F46E5",
  primaryMuted: "rgba(99, 102, 241, 0.15)",
  primaryGlow: "rgba(99, 102, 241, 0.4)",

  // Semantic
  success: "#22C55E",
  successMuted: "rgba(34, 197, 94, 0.15)",
  warning: "#F59E0B",
  warningMuted: "rgba(245, 158, 11, 0.15)",
  error: "#EF4444",
  errorMuted: "rgba(239, 68, 68, 0.15)",
  info: "#3B82F6",

  // Status
  active: "#4ADE80",
  repaid: "#60A5FA",
  liquidated: "#F87171",
  collateralWithdrawn: "#A78BFA",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const typography = {
  hero: {
    fontSize: 48,
    fontWeight: "900" as const,
    letterSpacing: -2,
  },
  h1: {
    fontSize: 32,
    fontWeight: "800" as const,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 20,
    fontWeight: "700" as const,
  },
  body: {
    fontSize: 16,
    fontWeight: "500" as const,
  },
  bodySm: {
    fontSize: 14,
    fontWeight: "500" as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: "500" as const,
  },
  label: {
    fontSize: 11,
    fontWeight: "600" as const,
    letterSpacing: 1,
  },
  mono: {
    fontSize: 13,
    fontWeight: "600" as const,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
};

export const shadows = {
  sm: Platform.select({
    ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.4, shadowRadius: 2 },
    android: { elevation: 2 },
  }),
  md: Platform.select({
    ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 4 },
    android: { elevation: 4 },
  }),
  lg: Platform.select({
    ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8 },
    android: { elevation: 8 },
  }),
  glow: Platform.select({
    ios: { shadowColor: colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 12 },
    android: { elevation: 6 },
  }),
};
