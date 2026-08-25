import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        noatum: {
          navy: "#00204E",
          deep: "#00204E",
          blue: "#21578A",
          teal: "#4CADA9",
          mist: "#D8DCDF",
          red: "#AA272F",
          lightRed: "#CD202C",
          lightBlue: "#7090B7",
          paleBlue: "#9BB2CE",
          grey: "#818A8F",
          orange: "#E87722",
          yellow: "#E4B242",
          green: "#79A52B",
          purple: "#504685",
        },
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,32,78,.12)",
      },
    },
  },
  plugins: [],
};

export default config;
