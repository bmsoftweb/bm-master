import React from 'react';
import { ExternalLink, X } from 'lucide-react';
import { VISUAL_MASTER, visualApp } from '../utils/apps';

export interface AbaModulo {
  /** sys_modulos.id */
  id: number;
  titulo: string;
  /** sys_modulos.sigla: ícone e cor do app */
  sigla: string;
  /** Link de entrada automática (com o acesso do usuário) */
  url: string;
}

// Visual padrão das abas BMsoft (BarraAbas do receitaWeb / contratos-dbisam): chapadas, sem espaço entre elas
const abaClasse = (ativa: boolean) =>
  `flex items-center gap-1.5 border-r border-stone-200 dark:border-stone-800 border-b-2 transition-colors ${ativa ? 'bg-white dark:bg-stone-900 border-b-amber-600' : 'border-b-transparent hover:bg-stone-200/60 dark:hover:bg-stone-800/60'}`;
const abaTexto = (ativa: boolean) =>
  `flex items-center gap-2 py-2.5 text-xs font-semibold whitespace-nowrap cursor-pointer ${ativa ? 'text-amber-700 dark:text-amber-400' : 'text-stone-600 dark:text-stone-400'}`;
const ICONE = 'p-1 rounded text-stone-400 transition-colors cursor-pointer shrink-0';

/** Abas do Master no topo: a primeira é o Master; depois, um módulo por aba. Só aparece com algum módulo aberto */
export const BarraAbas: React.FC<{
  abas: AbaModulo[];
  /** 'master' ou o id do módulo */
  ativa: 'master' | number;
  onAtivar: (aba: 'master' | number) => void;
  onFechar: (id: number) => void;
  /** Abre o módulo numa aba do navegador (para módulos que não funcionam dentro do Master) */
  onAbrirFora: (id: number) => void;
}> = ({ abas, ativa, onAtivar, onFechar, onAbrirFora }) =>
  abas.length === 0 ? null : (
    <div className="flex items-stretch bg-stone-100 dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800 overflow-x-auto overflow-y-hidden shrink-0">
      <div className={`${abaClasse(ativa === 'master')} px-4`}>
        <button type="button" onClick={() => onAtivar('master')} className={abaTexto(ativa === 'master')}>
          <VISUAL_MASTER.Icone className={`w-3.5 h-3.5 ${VISUAL_MASTER.texto}`} />
          <span>Master</span>
        </button>
      </div>
      {abas.map((a) => {
        const { Icone, texto } = visualApp(a.sigla);
        return (
          <div key={a.id} className={`${abaClasse(ativa === a.id)} pl-4 pr-2`} onAuxClick={(e) => e.button === 1 && onFechar(a.id)}>
            <button type="button" onClick={() => onAtivar(a.id)} className={abaTexto(ativa === a.id)}>
              <Icone className={`w-3.5 h-3.5 ${texto}`} />
              <span>{a.titulo}</span>
            </button>
            <button type="button" onClick={() => onAbrirFora(a.id)} title="Abrir numa aba do navegador" className={`${ICONE} hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-950/40`}>
              <ExternalLink className="w-3 h-3" />
            </button>
            <button type="button" onClick={() => onFechar(a.id)} title="Fechar aba" className={`${ICONE} hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-950/40`}>
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
