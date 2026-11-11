import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, LogOut, User, X } from 'lucide-react';
import type { Usuario } from '../types';
import { GRUPOS_MENU, NOME_PAPEL, podeAcessar, type ItemMenu } from '../utils/menu';
import { VISUAL_MASTER } from '../utils/apps';

const CHAVE_RECOLHIDO = 'bmmaster_menu_recolhido';

/** Título do grupo do menu; recolhido, vira uma linha (o primeiro grupo não precisa) */
const tituloGrupo = (titulo: string, rec: boolean, primeiro: boolean) =>
  rec ? (
    primeiro ? null : <div className="mx-4 mb-2 border-t border-stone-200 dark:border-stone-800" />
  ) : (
    <div className="px-4 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-blue-500 dark:text-blue-400">{titulo}</div>
  );

interface SidebarProps {
  activeTab: string;
  setActiveTab: (id: string) => void;
  usuario: Usuario;
  onLogout: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, usuario, onLogout, isOpenMobile, onCloseMobile }) => {
  // Desktop: menu recolhido (só os ícones), lembrado neste navegador
  const [recolhido, setRecolhido] = useState(() => {
    try {
      return localStorage.getItem(CHAVE_RECOLHIDO) === '1';
    } catch {
      return false;
    }
  });
  const alternar = () =>
    setRecolhido((r) => {
      try {
        localStorage.setItem(CHAVE_RECOLHIDO, r ? '0' : '1');
      } catch {
        // sem storage: vale só até recarregar
      }
      return !r;
    });

  const grupos = GRUPOS_MENU.map((g) => ({ ...g, itens: g.itens.filter((it) => podeAcessar(usuario, it.id)) })).filter((g) => g.itens.length);

  const botao = ({ id, label, icone: Icone }: ItemMenu, rec: boolean) => {
    const ativo = activeTab === id;
    return (
      <button
        key={id}
        onClick={() => {
          setActiveTab(id);
          onCloseMobile();
        }}
        title={rec ? label : undefined}
        className={`w-full flex items-center gap-3 ${rec ? 'justify-center' : 'px-4'} py-[11px] text-left transition-colors cursor-pointer group border-l-2 ${
          ativo
            ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold dark:border-blue-400 dark:bg-blue-950/40 dark:text-blue-300'
            : 'border-transparent text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-stone-800/70 dark:hover:text-white'
        }`}
      >
        <Icone
          className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
            ativo ? 'text-blue-600 dark:text-blue-300' : 'text-stone-400 group-hover:text-blue-600 dark:text-stone-400 dark:group-hover:text-blue-400'
          }`}
        />
        {!rec && <span className="text-xs truncate">{label}</span>}
      </button>
    );
  };

  const conteudo = (rec: boolean) => (
    <div className="flex flex-col h-full bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 border-r border-stone-200 dark:border-stone-800 select-none">
      {/* Marca — mesma altura do header da área de trabalho */}
      <div className={`h-[var(--altura-topo)] shrink-0 ${rec ? 'justify-center' : 'px-4 justify-between'} border-b border-stone-200 dark:border-stone-800/80 flex items-center gap-3 bg-stone-50/50 dark:bg-transparent`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-xl ${VISUAL_MASTER.fundo} text-white flex items-center justify-center shadow-md shrink-0`}>
            <VISUAL_MASTER.Icone className="w-5 h-5" />
          </div>
          <div className={rec ? 'hidden' : 'min-w-0'}>
            <h1 className="text-sm font-bold text-stone-900 dark:text-white leading-tight truncate">BM-Master</h1>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">Gerenciador Web</p>
          </div>
        </div>
        <button
          onClick={onCloseMobile}
          title="Fechar menu lateral"
          className="lg:hidden p-1.5 rounded-lg text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navegação */}
      <nav className="flex-1 overflow-y-auto py-4">
        {grupos.map((g, i) => (
          <div key={g.titulo} className={i ? 'pt-3' : ''}>
            {tituloGrupo(g.titulo, rec, !i)}
            {g.itens.map((it) => botao(it, rec))}
          </div>
        ))}
      </nav>

      {/* Usuário & sair */}
      <div className={`p-3 border-t border-stone-200 dark:border-stone-800/80 flex ${rec ? 'flex-col' : ''} items-center justify-between gap-2 bg-stone-50 dark:bg-stone-950/60`}>
        <div className="flex items-center gap-2.5 min-w-0" title={rec ? usuario.nome : undefined}>
          <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 flex items-center justify-center font-semibold text-xs shrink-0">
            {usuario.nome ? usuario.nome.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
          </div>
          <div className={rec ? 'hidden' : 'min-w-0'}>
            <div className="text-xs font-semibold text-stone-900 dark:text-white truncate leading-tight">{usuario.nome || 'Usuário'}</div>
            <div className="text-[10px] text-stone-500 dark:text-stone-400 truncate mt-0.5">{NOME_PAPEL[usuario.role] ?? usuario.email}</div>
          </div>
        </div>
        <button
          onClick={onLogout}
          title="Encerrar sessão"
          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-950/50 transition-colors cursor-pointer shrink-0"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Sidebar fixa no desktop */}
      <aside className={`hidden lg:flex flex-col ${recolhido ? 'w-16' : 'w-64'} shrink-0 h-full sticky top-0 z-30 transition-[width] duration-200`}>
        {conteudo(recolhido)}
        <button
          type="button"
          onClick={alternar}
          title={recolhido ? 'Abrir o menu' : 'Esconder o menu'}
          className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-14 rounded-full flex items-center justify-center bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-500 hover:text-blue-600 dark:text-stone-400 dark:hover:text-blue-400 shadow-sm cursor-pointer"
        >
          {recolhido ? <ChevronRight className="w-2.5 h-2.5 shrink-0" strokeWidth={3} /> : <ChevronLeft className="w-2.5 h-2.5 shrink-0" strokeWidth={3} />}
        </button>
      </aside>

      {/* Drawer no mobile */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs" onClick={onCloseMobile} aria-hidden="true" />
          <div className="relative flex-1 flex flex-col max-w-xs w-full h-full shadow-2xl z-10">{conteudo(false)}</div>
        </div>
      )}
    </>
  );
};
