export type ThemeMode = 'light' | 'dark';

/** Mesma chave do script de index.html, que aplica o tema antes da primeira pintura */
const CHAVE_TEMA = 'bmmaster_theme';

export const temaAtual = (): ThemeMode => (document.documentElement.classList.contains('dark') ? 'dark' : 'light');

export function applyTheme(theme: ThemeMode) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  try {
    localStorage.setItem(CHAVE_TEMA, theme);
  } catch {
    // sem storage: vale só até recarregar
  }
}
