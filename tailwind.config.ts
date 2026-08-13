import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#141312",
        paper: "#F7F4EC",
        pepper: "#1F6B4C",
        flag: "#008751",
        signal: "#D64545",
        punchRed: "#CC0000",
        gold: "#C9A227",
        muted: "#6B6459",
        naira: "#1A56DB",
        gist: "#8E4A9E",
        hazard: "#F2C94C",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "Inter", "sans-serif"],
      },
      animation: {
        ticker: "ticker 55s linear infinite",
        pulseFast: "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        ticker: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(-100%)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
