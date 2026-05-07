import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#161616",
        paper: "#f7f6f2",
        line: "#d7d2c8",
        accent: "#0f766e",
        coral: "#d85f45",
        steel: "#40576d"
      }
    }
  },
  plugins: []
};

export default config;
