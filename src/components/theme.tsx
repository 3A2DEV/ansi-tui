import React from 'react';

export type ThemeName = 'Cyan' | 'Blue' | 'White' | 'Gray' | 'Yellow' | 'Violet' | 'Red' | 'Neon';

// Accepts any valid Ink/Chalk color: named ANSI ('cyan', 'red' …),
// hex ('#00d7d7'), or CSS rgb ('rgb(0,215,215)').
export type ThemeColor = string;

export interface ThemePalette {
  readonly name: ThemeName;

  // ── Existing semantic slots (all existing usages preserved) ──────────────
  readonly frame: ThemeColor;         // outer App shell border
  readonly primary: ThemeColor;       // main accent — text, highlights
  readonly secondary: ThemeColor;     // second accent — version chips, badges
  readonly highlight: ThemeColor;     // active/selected background
  readonly highlightText: ThemeColor; // text on highlight background
  readonly success: ThemeColor;       // green-meaning indicators
  readonly warning: ThemeColor;       // yellow/amber-meaning indicators
  readonly error: ThemeColor;         // red-meaning indicators
  readonly muted: ThemeColor;         // dim text, subtle backgrounds

  // ── New semantic slots (used from Phase 2 onward) ────────────────────────
  readonly border: ThemeColor;        // prominent panel/component borders
  readonly dimBorder: ThemeColor;     // muted borders: sidebar rail, footer
  readonly accent2: ThemeColor;       // tertiary accent: gradient fills, subtitles
  readonly panelTitle: ThemeColor;    // default panel title text
  readonly panelFill: string;         // separator fill char (e.g. '·', '─', '▸')
  readonly runningColor: ThemeColor;  // live-execution / spinner color
}

export const THEMES: Record<ThemeName, ThemePalette> = {
  // ── Cyan ── electric teal, professional dark ─────────────────────────────
  Cyan: {
    name: 'Cyan',
    frame:          '#00d7d7',
    primary:        '#00d7d7',
    secondary:      '#ff87af',
    highlight:      '#ffff5f',
    highlightText:  '#000000',
    success:        '#5fd75f',
    warning:        '#ffaf5f',
    error:          '#ff5f5f',
    muted:          '#585858',
    border:         '#00d7d7',
    dimBorder:      '#444444',
    accent2:        '#87d7ff',
    panelTitle:     '#00d7d7',
    panelFill:      '·',
    runningColor:   '#5fd7ff',
  },

  // ── Blue ── deep blue, corporate precision ───────────────────────────────
  Blue: {
    name: 'Blue',
    frame:          '#5f87ff',
    primary:        '#87afff',
    secondary:      '#5fd7ff',
    highlight:      '#ffffff',
    highlightText:  '#005f87',
    success:        '#5faf5f',
    warning:        '#ffaf00',
    error:          '#ff5f5f',
    muted:          '#585858',
    border:         '#5f87ff',
    dimBorder:      '#444466',
    accent2:        '#d7afff',
    panelTitle:     '#87afff',
    panelFill:      '·',
    runningColor:   '#5fd7ff',
  },

  // ── White ── monochrome light, clean terminal ────────────────────────────
  White: {
    name: 'White',
    frame:          '#e4e4e4',
    primary:        '#ffffff',
    secondary:      '#afd7d7',
    highlight:      '#ffffff',
    highlightText:  '#1c1c1c',
    success:        '#5fd75f',
    warning:        '#d7af00',
    error:          '#d75f5f',
    muted:          '#767676',
    border:         '#e4e4e4',
    dimBorder:      '#4e4e4e',
    accent2:        '#afafaf',
    panelTitle:     '#ffffff',
    panelFill:      '─',
    runningColor:   '#afd7d7',
  },

  // ── Gray ── monochrome dark, minimal brutalist ───────────────────────────
  Gray: {
    name: 'Gray',
    frame:          '#6c6c6c',
    primary:        '#bcbcbc',
    secondary:      '#878787',
    highlight:      '#e4e4e4',
    highlightText:  '#1c1c1c',
    success:        '#5f875f',
    warning:        '#878700',
    error:          '#875f5f',
    muted:          '#4e4e4e',
    border:         '#6c6c6c',
    dimBorder:      '#3a3a3a',
    accent2:        '#585858',
    panelTitle:     '#bcbcbc',
    panelFill:      '─',
    runningColor:   '#878787',
  },

  // ── Yellow ── amber/gold, vintage CRT warmth ─────────────────────────────
  Yellow: {
    name: 'Yellow',
    frame:          '#ffd700',
    primary:        '#ffff5f',
    secondary:      '#ff8700',
    highlight:      '#ffd700',
    highlightText:  '#1c1c00',
    success:        '#5fd75f',
    warning:        '#ff8700',
    error:          '#ff5f5f',
    muted:          '#585858',
    border:         '#ffd700',
    dimBorder:      '#5f4f00',
    accent2:        '#d7af00',
    panelTitle:     '#ffff5f',
    panelFill:      '─',
    runningColor:   '#ff8700',
  },

  // ── Violet ── deep purple, refined dark ──────────────────────────────────
  // Fixed: secondary no longer duplicates primary; warning no longer magenta.
  Violet: {
    name: 'Violet',
    frame:          '#af87ff',
    primary:        '#d787ff',
    secondary:      '#ff87d7',
    highlight:      '#ffff87',
    highlightText:  '#2d0054',
    success:        '#87d787',
    warning:        '#ffd700',
    error:          '#ff5f5f',
    muted:          '#585858',
    border:         '#af87ff',
    dimBorder:      '#4b3a6b',
    accent2:        '#875fff',
    panelTitle:     '#d787ff',
    panelFill:      '∙',
    runningColor:   '#ff87d7',
  },

  // ── Red ── warm command-center red with amber highlights ─────────────────
  Red: {
    name: 'Red',
    frame:          '#ff5f5f',
    primary:        '#ff8787',
    secondary:      '#ffaf5f',
    highlight:      '#ffd75f',
    highlightText:  '#3a0000',
    success:        '#87d787',
    warning:        '#ffd75f',
    error:          '#ff5f5f',
    muted:          '#6b4b4b',
    border:         '#ff5f5f',
    dimBorder:      '#5a2d2d',
    accent2:        '#ffaf87',
    panelTitle:     '#ff8787',
    panelFill:      '•',
    runningColor:   '#ffaf5f',
  },

  // ── Neon ── cyberpunk green-on-black ─────────────────────────────────────
  Neon: {
    name: 'Neon',
    frame:          '#39ff14',
    primary:        '#39ff14',
    secondary:      '#00ffff',
    highlight:      '#39ff14',
    highlightText:  '#000000',
    success:        '#00ff7f',
    warning:        '#ffff00',
    error:          '#ff0044',
    muted:          '#2d5a2d',
    border:         '#39ff14',
    dimBorder:      '#1a3d1a',
    accent2:        '#ff00ff',
    panelTitle:     '#39ff14',
    panelFill:      '▸',
    runningColor:   '#00ffff',
  },
};

export const THEME_ORDER: readonly ThemeName[] = [
  'Cyan', 'Blue', 'White', 'Gray', 'Yellow', 'Violet', 'Red', 'Neon',
];

export const ThemeContext = React.createContext<ThemePalette>(THEMES.Cyan);

export const useThemePalette = (): ThemePalette => React.useContext(ThemeContext);
