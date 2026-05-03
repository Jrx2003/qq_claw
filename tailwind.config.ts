import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        qq: {
          blue: "#4A8DFF",
          green: "#4CAF50",
          orange: "#FF9F43",
          bg: "#F4F5F7",
          ink: "#1F2329",
        },
      },
      boxShadow: {
        soft: "0 12px 40px rgba(31, 35, 41, 0.08)",
        card: "0 8px 24px rgba(31, 35, 41, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
