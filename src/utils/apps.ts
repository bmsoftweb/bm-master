import {
  BarChart3, ClipboardList, Globe, Handshake, LayoutDashboard, LayoutGrid, Package, Settings, ShoppingBag, ShoppingCart,
  Users, type LucideIcon,
} from 'lucide-react';

/** Ícone e cor de cada app BMsoft: o mesmo no logo do app, no card de Módulos e na aba do Master */
export interface VisualApp {
  Icone: LucideIcon;
  /** Fundo do logo (ícone branco) */
  fundo: string;
  /** Cor do ícone solto (aba) */
  texto: string;
}

const v = (Icone: LucideIcon, cor: string): VisualApp => ({ Icone, fundo: `bg-${cor}-600`, texto: `text-${cor}-600 dark:text-${cor}-400` });

// Classes por extenso para o Tailwind gerar (ele não enxerga as montadas acima)
// bg-blue-600 text-blue-600 dark:text-blue-400 bg-emerald-600 text-emerald-600 dark:text-emerald-400
// bg-amber-600 text-amber-600 dark:text-amber-400 bg-orange-600 text-orange-600 dark:text-orange-400
// bg-cyan-600 text-cyan-600 dark:text-cyan-400 bg-rose-600 text-rose-600 dark:text-rose-400
// bg-violet-600 text-violet-600 dark:text-violet-400 bg-sky-600 text-sky-600 dark:text-sky-400
// bg-slate-600 text-slate-600 dark:text-slate-400 bg-teal-600 text-teal-600 dark:text-teal-400
// bg-indigo-600 text-indigo-600 dark:text-indigo-400 bg-stone-500 text-stone-500 dark:text-stone-400

export const VISUAL_MASTER = v(LayoutGrid, 'blue');

// Pela sigla do sys_modulos (parte dela): a primeira que bater vale
const POR_SIGLA: [string[], VisualApp][] = [
  [['EST', 'PROD'], v(Package, 'emerald')],
  [['FIN', 'FAT'], v(BarChart3, 'amber')],
  [['VEN'], v(ShoppingCart, 'orange')],
  [['COM'], v(ShoppingBag, 'cyan')],
  [['CRM'], v(Handshake, 'rose')],
  [['CAD'], v(ClipboardList, 'violet')],
  [['USU', 'RH'], v(Users, 'sky')],
  [['CFG', 'SYS'], v(Settings, 'slate')],
  [['WEB'], v(Globe, 'teal')],
  [['DAS'], v(LayoutDashboard, 'indigo')],
];
const PADRAO: VisualApp = { Icone: LayoutGrid, fundo: 'bg-stone-500', texto: 'text-stone-500 dark:text-stone-400' };

export function visualApp(sigla: string): VisualApp {
  const s = (sigla || '').toUpperCase();
  return POR_SIGLA.find(([chaves]) => chaves.some((c) => s.includes(c)))?.[1] ?? PADRAO;
}
