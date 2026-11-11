/**
 * Classes visuais fora dos cadastros (os cadastros usam ListaCrm/FormCrm, que trazem as suas).
 * Moldura, raio e foco dos campos vêm da regra "CAMPOS DE ENTRADA" em src/index.css.
 */

/** Campo maior, usado na tela de login */
export const INPUT_CLASS_LG =
  'bg-stone-50 dark:bg-stone-800/80 p-3 text-sm font-medium text-stone-800 dark:text-stone-100 placeholder:text-stone-400 placeholder:font-normal transition-all';

/** Botão secundário (contorno), na altura dos campos */
export const BOTAO_SECUNDARIO =
  'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-stone-600 dark:text-stone-300 border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer disabled:opacity-40';

/** Tabela simples (painel) */
export const TABELA = 'w-full text-xs border-separate border-spacing-0';
export const TH =
  'px-3 py-2.5 text-left font-semibold text-stone-600 dark:text-stone-300 bg-stone-50 dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800 whitespace-nowrap';
export const TD = 'px-3 py-[7.5px] text-stone-700 dark:text-stone-300 align-middle border-b border-stone-100 dark:border-stone-800/60';
export const LINHA = 'group bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors';
