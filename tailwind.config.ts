import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        success: { DEFAULT: "hsl(var(--success))", foreground: "hsl(var(--success-foreground))" },
        warning: { DEFAULT: "hsl(var(--warning))", foreground: "hsl(var(--warning-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      borderRadius: { card: "20px", btn: "16px", field: "14px" },
      boxShadow: {
        soft: "0 1px 2px 0 rgb(15 61 110 / 0.04), 0 4px 16px -4px rgb(15 61 110 / 0.08)",
        lift: "0 2px 4px 0 rgb(15 61 110 / 0.05), 0 12px 28px -8px rgb(15 61 110 / 0.14)",
      },
      fontFamily: { sans: ["IBM Plex Sans Arabic", "system-ui", "sans-serif"] },
      fontSize: {
        hero: ["2.5rem", { lineHeight: "1.25", fontWeight: "700" }],
        section: ["1.75rem", { lineHeight: "1.35", fontWeight: "700" }],
        cardtitle: ["1.25rem", { lineHeight: "1.4", fontWeight: "600" }],
        caption: ["0.8125rem", { lineHeight: "1.5" }],
      },
      maxWidth: { site: "1440px" },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
      },
      animation: {
        "fade-up": "fade-up 0.45s ease-out both",
        "fade-in": "fade-in 0.4s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
