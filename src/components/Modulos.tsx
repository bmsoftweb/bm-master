import React, { useEffect, useState } from 'react';
import { ArrowLeft, ChevronRight, ExternalLink, Loader2, LogOut, Package } from 'lucide-react';
import { Tela, Carregando } from './Tela';
import { AvisoErro } from './AvisoErro';
import { meusModulos } from '../services/api';
import { BOTAO_SECUNDARIO } from '../utils/formStyles';
import { visualApp } from '../utils/apps';
import type { Modulo } from '../types';

/**
 * Lançador de módulos: onAbrir abre o módulo numa aba do Master (ou só ativa a aba, se já estiver aberto).
 * Nível user: é a única tela, sem menu; nome e Sair ficam no topo (onSair).
 */
export const Modulos: React.FC<{ nome?: string; onSair?: () => void; onAbrir: (m: Modulo) => Promise<void> }> = ({ nome, onSair, onAbrir }) => {
  const [modulos, setModulos] = useState<Modulo[] | null>(null);
  const [pilha, setPilha] = useState<number[]>([0]); // pai_id de cada nível aberto
  const [abrindo, setAbrindo] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    meusModulos()
      .then(setModulos)
      .catch((err) => {
        setModulos([]);
        setErro(err.message);
      });
  }, []);

  const paiAtual = pilha[pilha.length - 1];
  const pai = modulos?.find((m) => m.id === paiAtual);
  const visiveis = modulos?.filter((m) => m.pai_id === paiAtual) ?? [];
  const temFilhos = (m: Modulo) => modulos?.some((f) => f.pai_id === m.id) ?? false;

  const acessar = async (m: Modulo) => {
    if (temFilhos(m)) return setPilha([...pilha, m.id]);
    if (!m.url) return setErro(`O módulo "${m.descricao}" não tem endereço cadastrado.`);
    setAbrindo(m.id);
    try {
      await onAbrir(m);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível abrir o módulo.');
    } finally {
      setAbrindo(null);
    }
  };

  return (
    <Tela
      titulo={pai ? pai.descricao : 'Módulos'}
      subtitulo={pai ? pai.descricao_detalhada : 'Selecione um módulo para acessar as ferramentas de gestão.'}
      acoes={
        <>
          {pilha.length > 1 && (
            <button onClick={() => setPilha(pilha.slice(0, -1))} className={BOTAO_SECUNDARIO}>
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>
          )}
          {onSair && (
            <>
              {nome && <span className="hidden sm:inline text-xs font-medium text-stone-500 dark:text-stone-400">{nome}</span>}
              <button onClick={onSair} title="Sair do sistema" className={BOTAO_SECUNDARIO}>
                <LogOut className="w-4 h-4" /> Sair
              </button>
            </>
          )}
        </>
      }
    >
      {!modulos ? (
        <Carregando texto="Carregando módulos…" />
      ) : (
        <div className="p-4 sm:p-6 lg:p-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {visiveis.map((m) => {
            const { Icone, fundo } = visualApp(m.sigla);
            const grupo = temFilhos(m);
            return (
              <button
                key={m.id}
                onClick={() => acessar(m)}
                disabled={abrindo === m.id}
                className="group bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-3.5 text-left flex flex-col gap-2 hover:border-blue-300 dark:hover:border-blue-800 transition-colors cursor-pointer disabled:cursor-wait"
              >
                <div className="flex items-center justify-between">
                  <div className={`w-8 h-8 rounded-lg ${fundo} text-white flex items-center justify-center shadow-sm`}>
                    <Icone className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">{m.sigla}</span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{m.descricao}</h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 line-clamp-2 min-h-[2rem]">{m.descricao_detalhada || 'Acesse as funcionalidades deste módulo.'}</p>
                </div>
                <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                  {grupo ? (
                    <>
                      Explorar <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  ) : (
                    <>
                      Acessar módulo {abrindo === m.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
                    </>
                  )}
                </div>
              </button>
            );
          })}
          {visiveis.length === 0 && (
            <div className="col-span-full py-20 rounded-2xl border-2 border-dashed border-stone-200 dark:border-stone-800 flex flex-col items-center justify-center text-center p-8">
              <Package className="w-10 h-10 text-stone-300 dark:text-stone-600 mb-3" />
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">Nenhum módulo encontrado</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs mt-1">
                {pilha.length > 1 ? 'Esta seção ainda não possui submódulos configurados.' : 'Nenhum módulo liberado para o seu perfil.'}
              </p>
            </div>
          )}
        </div>
      )}
      {erro && <AvisoErro mensagem={erro} onFechar={() => setErro(null)} />}
    </Tela>
  );
};
