import React, { useEffect, useState } from 'react';
import { Building2, ChevronRight, Users } from 'lucide-react';
import { Tela, Cartao, Carregando } from './Tela';
import { AvisoErro } from './AvisoErro';
import { indicadores, listar } from '../services/api';
import { formatarDataHora } from '../utils/formato';
import { NOME_PAPEL } from '../utils/menu';
import { TABELA, TH, TD, LINHA } from '../utils/formStyles';
import type { Usuario, UsuarioLista } from '../types';

const Indicador: React.FC<{ titulo: string; valor: number; icone: React.ElementType; cor: string; onClick: () => void }> = ({ titulo, valor, icone: Icone, cor, onClick }) => (
  <button
    onClick={onClick}
    className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 text-left hover:border-blue-300 dark:hover:border-blue-800 transition-colors cursor-pointer"
  >
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">{titulo}</span>
      <Icone className={`w-4 h-4 ${cor}`} />
    </div>
    <div className="mt-2 text-xl font-bold text-stone-900 dark:text-stone-100 tabular-nums">{valor.toLocaleString('pt-BR')}</div>
  </button>
);

export const Painel: React.FC<{ usuario: Usuario; onNavegar: (tela: string) => void }> = ({ usuario, onNavegar }) => {
  const [usuarios, setUsuarios] = useState<UsuarioLista[] | null>(null);
  const [totais, setTotais] = useState({ usuarios: 0, empresas: 0 });
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([listar<UsuarioLista>('usuarios'), indicadores()])
      .then(([u, t]) => {
        // Últimos acessos primeiro ("aaaa-mm-dd hh:mm" ordena como texto)
        setUsuarios(u.filter((x) => x.ultimo_acesso).sort((a, b) => b.ultimo_acesso!.localeCompare(a.ultimo_acesso!)));
        setTotais(t);
      })
      .catch((err) => {
        setUsuarios([]);
        setErro(err.message);
      });
  }, []);

  return (
    <Tela titulo="Painel de Controle" subtitulo={`Bem-vindo, ${usuario.nome}`}>
      {!usuarios ? (
        <Carregando texto="Carregando indicadores…" />
      ) : (
        <div className="p-4 sm:p-6 lg:p-8 space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Indicador titulo="Usuários" valor={totais.usuarios} icone={Users} cor="text-blue-600" onClick={() => onNavegar('usuarios')} />
            <Indicador titulo="Empresas" valor={totais.empresas} icone={Building2} cor="text-emerald-600" onClick={() => onNavegar('grupos')} />
          </div>

          <Cartao>
            <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">Últimos acessos</h3>
              <button onClick={() => onNavegar('usuarios')} className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer">
                Ver todos <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className={TABELA}>
                <thead>
                  <tr>
                    <th className={TH}>Login</th>
                    <th className={TH}>Empresa principal</th>
                    <th className={TH}>Perfil</th>
                    <th className={`${TH} text-center`}>Nível</th>
                    <th className={`${TH} text-center`}>Último acesso</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.slice(0, 10).map((u) => (
                    <tr key={u.id} className={LINHA}>
                      <td className={`${TD} font-medium text-stone-900 dark:text-stone-100`}>{u.login}</td>
                      <td className={TD}>{u.empresa_nome || '—'}</td>
                      <td className={TD}>{u.perfil_nome || '—'}</td>
                      <td className={`${TD} text-center`}>{NOME_PAPEL[u.nivel] ?? u.nivel}</td>
                      <td className={`${TD} text-center tabular-nums`}>{formatarDataHora(u.ultimo_acesso)}</td>
                    </tr>
                  ))}
                  {usuarios.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-3 py-12 text-center text-xs text-stone-400">Nenhum acesso registrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Cartao>
        </div>
      )}
      {erro && <AvisoErro mensagem={erro} onFechar={() => setErro(null)} />}
    </Tela>
  );
};
