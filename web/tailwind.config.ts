import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        mtg: {
          W: "#fffbd5",
          U: "#aae0fa",
          B: "#cbc2bf",
          R: "#f9aa8f",
          G: "#9bd3ae",
          C: "#ccc2c0",
        },
      },
    },
  },
};
export default config;
