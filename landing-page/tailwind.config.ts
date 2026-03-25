import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./styles/**/*.css"
  ],
  theme: {
    extend: {
      colors: {
        canvas: "var(--color-canvas)",
        ink: "var(--color-ink)",
        "ink-soft": "var(--color-ink-soft)",
        muted: "var(--color-muted)",
        line: "var(--color-line)",
        surface: "var(--color-surface)",
        "surface-muted": "var(--color-surface-muted)",
        brand: {
          red: "var(--color-brand-red)",
          "red-wash": "var(--color-brand-red-wash)",
          iris: "var(--color-brand-iris)",
          "iris-deep": "var(--color-brand-deep-iris)",
          "iris-soft": "var(--color-brand-pastel-iris)",
          "iris-soft-wash": "var(--color-brand-pastel-iris-wash)",
          sky: "var(--color-brand-sky)",
          "ink-blue": "var(--color-brand-ink-blue)"
        }
      },
      fontFamily: {
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"]
      },
      fontSize: {
        display: [
          "clamp(3rem, 6vw, 4.125rem)",
          {
            lineHeight: "0.98",
            letterSpacing: "var(--tracking-display)"
          }
        ],
        hero: [
          "clamp(2.75rem, 5vw, 4rem)",
          {
            lineHeight: "1",
            letterSpacing: "var(--tracking-display)"
          }
        ],
        section: [
          "clamp(2rem, 3.5vw, 3rem)",
          {
            lineHeight: "1.02",
            letterSpacing: "var(--tracking-title)"
          }
        ],
        title: [
          "1.5rem",
          {
            lineHeight: "1.1",
            letterSpacing: "var(--tracking-title)"
          }
        ],
        body: [
          "1.125rem",
          {
            lineHeight: "1.55",
            letterSpacing: "-0.02em"
          }
        ],
        label: [
          "0.875rem",
          {
            lineHeight: "1.35",
            letterSpacing: "-0.04em"
          }
        ],
        meta: [
          "0.75rem",
          {
            lineHeight: "1.4",
            letterSpacing: "-0.02em"
          }
        ]
      },
      letterSpacing: {
        display: "var(--tracking-display)",
        title: "var(--tracking-title)"
      },
      borderRadius: {
        card: "var(--radius-card)",
        frame: "var(--radius-frame)",
        button: "var(--radius-button)",
        pill: "999px"
      },
      boxShadow: {
        card: "var(--shadow-card)",
        float: "var(--shadow-float)",
        soft: "var(--shadow-soft)"
      },
      spacing: {
        gutter: "var(--space-gutter)",
        section: "var(--space-section)",
        cluster: "var(--space-cluster)",
        frame: "var(--space-frame)"
      },
      maxWidth: {
        page: "var(--max-width-page)",
        copy: "var(--max-width-copy)"
      },
      backgroundImage: {
        "brand-glow": "var(--gradient-brand-glow)",
        "footer-fade": "var(--gradient-footer)",
        "canvas-grid": "var(--pattern-canvas-grid)"
      }
    }
  },
  plugins: []
};

export default config;
