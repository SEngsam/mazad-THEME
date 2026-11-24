/** Three looks: light (white sidebar), semi-dark (dark sidebar, default) and dark (everything). Saved on this device. */
export const THEMES = [['light', 'فاتح'], ['semi', 'شبه داكن'], ['dark', 'داكن']];
const KEY = 'ad-theme';
const BAR = { light: '#FFFFFF', semi: '#0F172A', dark: '#07140F' };

export const getTheme = () => {
  const t = localStorage.getItem(KEY);
  return THEMES.some(([id]) => id === t) ? t : 'semi';
};

export function applyTheme(theme = getTheme()) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', BAR[theme]);
}

export function setTheme(theme) {
  localStorage.setItem(KEY, theme);
  applyTheme(theme);
}
