// Combined pages. Each one is a picker over calculators already defined in calculators.js;
// combo.js shows the chosen calculator with the same page code and equations as its own page.
// To add one: add an entry here, then run node scripts/build-pages.mjs.

export const COMBOS = [
  {
    "slug": "injury-rates",
    "name": "Injury and Illness Rates (TRIR, DART, LTCR)",
    "group": "Injury and illness rates",
    "pick": "Rate",
    "intro": "The three OSHA/BLS incidence rates on one page. Pick the rate, fill in every box except the one you want, and press Solve. The hours worked carry over when you switch.",
    "labels": [
      "TRIR, total recordable incident rate",
      "DART rate",
      "LTCR, lost time case rate"
    ],
    "members": [
      "trir",
      "dart-rate",
      "lost-time-rate"
    ],
    "site": "OEMS Safety Calculators",
    "back": "All safety calculators"
  }
];
