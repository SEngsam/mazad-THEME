const base = require('../tailwind.config.js');

const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

/**
 * Admin dashboard build: same brand tokens as the site, plus neutral colors driven by CSS variables
 * so the three themes (light, semi-dark, dark) switch without touching the markup.
 */
module.exports = {
  ...base,
  content: ['./admin/**/*.{html,js}'],
  theme: {
    ...base.theme,
    extend: {
      ...base.theme.extend,
      colors: {
        ...base.theme.extend.colors,
        sand: v('sand'),
        mist: v('mist'),
        surface: v('surface'),
        line: { DEFAULT: v('line'), soft: v('line-soft') },
        ink: { DEFAULT: v('ink'), body: v('ink-body'), muted: v('ink-muted') },
      },
    },
  },
};
