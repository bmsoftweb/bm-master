import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, X } from 'lucide-react';

const CORES = {
  erro: {
    caixa: 'bg-rose-50 dark:bg-rose-950 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300',
    icone: 'text-rose-600',
    fechar: 'text-rose-400 hover:text-rose-700 hover:bg-rose-100 dark:hover:bg-rose-900/60',
  },
  alerta: {
    caixa: 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300',
    icone: 'text-amber-600',
    fechar: 'text-amber-500 hover:text-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/60',
  },
};

/** Pilha do canto inferior direito, fixa e por cima de tudo (diálogos inclusive): avisos e toasts */
function pilha(): HTMLElement {
  let el = document.getElementById('avisos-no-canto');
  if (!el) {
    el = document.createElement('div');
    el.id = 'avisos-no-canto';
    // Só os avisos recebem clique: o espaço vazio da pilha não tampa a tela
    el.className = 'fixed bottom-8 right-5 z-[80] w-[min(28rem,calc(100vw-2.5rem))] flex flex-col items-end gap-2 pointer-events-none';
    document.body.appendChild(el);
  }
  return el;
}

/** Mostra o conteúdo na pilha do canto (stay-on-top) */
export const NoCanto: React.FC<{ children: React.ReactNode }> = ({ children }) => createPortal(children, pilha());

/** Fecha sozinho depois do tempo; o relógio reinicia quando a mensagem muda */
function useFecharSozinho(mensagem: string, onFechar: () => void, segundos: number) {
  const fechar = useRef(onFechar);
  useEffect(() => {
    fechar.current = onFechar;
  });
  useEffect(() => {
    const t = setTimeout(() => fechar.current(), segundos * 1000);
    return () => clearTimeout(t);
  }, [mensagem, segundos]);
}

/** Aviso de erro (vermelho) ou alerta (âmbar) de uma ação: fecha no "x" ou sozinho em 10 s */
export const AvisoErro: React.FC<{ mensagem: string; onFechar: () => void; tom?: 'erro' | 'alerta' }> = ({ mensagem, onFechar, tom = 'erro' }) => {
  const cor = CORES[tom];
  useFecharSozinho(mensagem, onFechar, 10);
  return (
    <NoCanto>
      <div role="alert" className={`pointer-events-auto max-w-full p-3 rounded-xl shadow-2xl border flex items-start gap-2.5 text-xs ${cor.caixa}`}>
        <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${cor.icone}`} />
        <span className="flex-1 min-w-0 whitespace-pre-line">{mensagem}</span>
        <button type="button" onClick={onFechar} title="Fechar aviso" className={`p-0.5 -mt-0.5 rounded shrink-0 cursor-pointer ${cor.fechar}`}>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </NoCanto>
  );
};

/** Toast de sucesso, na mesma pilha: some sozinho em 4 s */
export const Toast: React.FC<{ mensagem: string; onFechar: () => void }> = ({ mensagem, onFechar }) => {
  useFecharSozinho(mensagem, onFechar, 4);
  return (
    <NoCanto>
      <div role="status" className="pointer-events-auto bg-stone-900 text-white text-xs font-semibold py-3 px-4 rounded-xl shadow-2xl border border-stone-800 flex items-center gap-2.5">
        <span className="w-2 h-2 rounded-full bg-emerald-400" />
        <span>{mensagem}</span>
      </div>
    </NoCanto>
  );
};
