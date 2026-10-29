import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "hsl(var(--canvas) / <alpha-value>)",
        ink: "hsl(var(--ink) / <alpha-value>)",
        sub: "hsl(var(--sub) / <alpha-value>)",
        mute: "hsl(var(--mute) / <alpha-value>)",
        line: "hsl(var(--ink) / 0.12)",
        prism: "hsl(var(--prism) / <alpha-value>)",
        danger: "hsl(var(--danger) / <alpha-value>)",
        warning: "hsl(var(--warning) / <alpha-value>)",
        success: "hsl(var(--success) / <alpha-value>)",
      },
      borderRadius: { card: "20px" },
      fontFamily: {
        sans: ["Pretendard", "Apple SD Gothic Neo", "Malgun Gothic", "system-ui", "sans-serif"],
        num: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
