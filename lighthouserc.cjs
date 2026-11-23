module.exports = {
  ci: {
    collect: {
      startServerCommand:
        "node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3198",
      startServerReadyPattern: "Ready",
      url: ["http://127.0.0.1:3198/"],
      numberOfRuns: 3,
      settings: {
        onlyCategories: ["performance", "accessibility"],
        chromeFlags: "--headless --no-first-run",
      },
    },
    assert: {
      assertions: {
        "largest-contentful-paint": [
          "error",
          { maxNumericValue: 2500, aggregationMethod: "median" },
        ],
        "cumulative-layout-shift": [
          "error",
          { maxNumericValue: 0, aggregationMethod: "median" },
        ],
      },
    },
  },
};
