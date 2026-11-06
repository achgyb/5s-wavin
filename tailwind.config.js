/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // ── Orbia Building & Infrastructure Brand Colors ──────────────────────
        "orbia-navy":        "#353750",   // Primary brand navy/purple-dark
        "orbia-navy-dark":   "#23253A",   // Deeper navy
        "orbia-navy-mid":    "#2A2C42",   // Medium navy (sidebar surface)
        "orbia-green":       "#3DAA72",   // Brand green
        "orbia-coral":       "#F05731",   // Brand coral/red-orange
        "orbia-gold":        "#FAB931",   // Brand gold/yellow
        "orbia-blue":        "#29A9E0",   // Brand blue (sky)
        "orbia-gray":        "#F4F4F6",   // Page background (off-white)

        // ── Light Theme Semantic Tokens ────────────────────────────────────────
        "background":        "#FFFFFF",   // Pure white main background
        "surface":           "#FFFFFF",   // Card / panel surface
        "surface-dim":       "#F4F4F6",   // Slightly dimmed surface
        "surface-container":        "#F4F4F6",
        "surface-container-low":    "#EBEBEF",
        "surface-container-high":   "#E3E3EB",
        "surface-container-highest":"#D8D8E4",
        "surface-container-lowest": "#FFFFFF",
        "surface-variant":           "#E8E8F2",
        "surface-bright":            "#FFFFFF",

        // ── Text ───────────────────────────────────────────────────────────────
        "on-background":     "#353750",   // Main text on white
        "on-surface":        "#353750",
        "on-surface-variant":"#6B6E8A",
        "text-primary":      "#353750",
        "text-secondary":    "#6B6E8A",
        "secondary":         "#6B6E8A",
        "on-secondary":      "#FFFFFF",

        // ── Primary = Orbia Navy (used for key CTAs & active states) ──────────
        "primary":                  "#353750",
        "primary-container":        "#353750",   // Navy button bg
        "on-primary":               "#FFFFFF",
        "on-primary-container":     "#FFFFFF",
        "primary-fixed":            "#353750",
        "primary-fixed-dim":        "#23253A",

        // ── Accent = Orbia Coral ───────────────────────────────────────────────
        "surface-tint":      "#F05731",
        "inverse-primary":   "#F05731",
        "outline-variant":   "#D0D0DE",

        // ── Borders ────────────────────────────────────────────────────────────
        "border-gray":       "#E0E0EC",
        "outline":           "#B0B0C8",

        // ── Role-specific containers ───────────────────────────────────────────
        "secondary-container":        "#E8E8F2",
        "on-secondary-container":     "#353750",
        "secondary-fixed":            "#D0D0E0",
        "secondary-fixed-dim":        "#6B6E8A",
        "on-secondary-fixed":         "#353750",
        "on-secondary-fixed-variant": "#6B6E8A",

        // ── Tertiary ───────────────────────────────────────────────────────────
        "tertiary":           "#29A9E0",
        "tertiary-container": "#29A9E0",
        "tertiary-fixed":     "#A5D8FF",
        "tertiary-fixed-dim": "#5BA8DF",
        "on-tertiary":        "#FFFFFF",
        "on-tertiary-container": "#003060",
        "on-tertiary-fixed":     "#001f25",
        "on-tertiary-fixed-variant": "#004e5a",
        "surface-dim":        "#F0F0F8",

        // ── Errors ─────────────────────────────────────────────────────────────
        "error":           "#B3261E",
        "on-error":        "#FFFFFF",
        "error-container": "#FFDAD6",
        "on-error-container": "#410002",

        // ── Inverse ────────────────────────────────────────────────────────────
        "inverse-surface":    "#353750",
        "inverse-on-surface": "#F4F4F6",

        // ── Safety (functional) ────────────────────────────────────────────────
        "safety-red":    "#D32F2F",
        "safety-green":  "#2E7D32",
        "safety-orange": "#F05731",
      },

      borderRadius: {
        "DEFAULT": "0.375rem",
        "lg":      "0.5rem",
        "xl":      "0.75rem",
        "2xl":     "1rem",
        "full":    "9999px"
      },

      spacing: {
        "touch-target-min": "48px",
        "stack-sm":         "8px",
        "stack-md":         "16px",
        "stack-lg":         "24px",
        "margin-mobile":    "16px",
        "margin-desktop":   "32px",
        "gutter":           "16px",
      },

      fontFamily: {
        // All fonts → Nunito
        "body-md":             ["Nunito", "sans-serif"],
        "body-lg":             ["Nunito", "sans-serif"],
        "label-sm":            ["Nunito", "sans-serif"],
        "label-md":            ["Nunito", "sans-serif"],
        "headline-md":         ["Nunito", "sans-serif"],
        "headline-lg":         ["Nunito", "sans-serif"],
        "headline-lg-mobile":  ["Nunito", "sans-serif"],
        "display-lg":          ["Nunito", "sans-serif"],
        sans:                  ["Nunito", "sans-serif"],
      },
    },
  },
  plugins: [],
}
