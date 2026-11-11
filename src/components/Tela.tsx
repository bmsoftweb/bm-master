import React, { createContext, useContext } from 'react';
import { Loader2, Menu } from 'lucide-react';

/** Abre o menu lateral no celular (fornecido pelo App; null = tela sem menu, nível user) */
export const AbrirMenuMobile = createContext<(() => void) | null>(null);

interface TelaProps {
  titulo: string;
  subtitulo?: React.ReactNode;
  /** Botões à direita do header (ex.: "Novo") */
  acoes?: React.ReactNode;
  children: React.ReactNode;
}

/** Header da tela + área de trabalho com rolagem (padrão crmWeb) */
export const Tela: React.FC<TelaProps> = ({ titulo, subtitulo, acoes, children }) => {
  const abrirMenu = useContext(AbrirMenuMobile);
  return (
    <>
      <header className="h-[var(--altura-topo)] shrink-0 z-20 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800">
        <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {abrirMenu && (
              <button
                onClick={abrirMenu}
                title="Abrir menu de navegação"
                className="lg:hidden p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 transition-colors cursor-pointer shrink-0"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 leading-tight truncate">{titulo}</h2>
              {subtitulo && <div className="text-[11px] text-stone-500 dark:text-stone-400 truncate hidden sm:block">{subtitulo}</div>}
            </div>
          </div>
          {acoes && <div className="flex items-center gap-2.5 shrink-0">{acoes}</div>}
        </div>
      </header>
      <main className="flex-1 min-h-0 flex flex-col overflow-auto">{children}</main>
    </>
  );
};

export const Carregando: React.FC<{ texto?: string }> = ({ texto }) => (
  <div className="flex-1 min-h-[50vh] flex items-center justify-center gap-3 text-stone-400">
    <Loader2 className="w-6 h-6 animate-spin" />
    {texto && <span className="text-xs font-medium">{texto}</span>}
  </div>
);

/** Cartão branco que envolve uma grade ou um bloco de conteúdo */
export const Cartao: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden ${className}`}>{children}</div>
);
