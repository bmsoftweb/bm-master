import React, { useEffect, useState } from 'react';
import { CadastroCrm } from './CadastroCrm';
import { Campo, INPUT_CLASS } from './FormCrm';
import { Toggle } from './Toggle';
import { listar } from '../services/api';
import { formatarDataHora, simNao } from '../utils/formato';
import { NOME_PAPEL, ehSuper } from '../utils/menu';
import type { Empresa, Grupo, Papel, Perfil, Usuario, UsuarioLista } from '../types';

const DICA_NIVEL: Record<Papel, string> = {
  super: 'Todos os grupos e empresas.',
  admin: 'Cadastros do Master, só do próprio grupo.',
  user: 'Só os módulos, sem o menu.',
};

interface Form {
  login: string;
  senha: string;
  grupo_id: number | null;
  empresa_id: number | null;
  perfil_id: number | null;
  nivel: Papel;
  ativo: boolean;
  empresas: number[];
}

const nomeEmpresa = (e: Empresa) => e.nome_fantasia || e.razao_social;

/** Usuários do ERP (sys_usuarios): o login do Master e dos módulos */
export const Usuarios: React.FC<{ usuario: Usuario }> = ({ usuario }) => {
  // O admin não cria nem promove ninguém a super (o servidor também recusa)
  const niveis: Papel[] = ehSuper(usuario) ? ['super', 'admin', 'user'] : ['admin', 'user'];
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  useEffect(() => {
    listar<Empresa>('empresas').then(setEmpresas).catch(() => undefined);
    listar<Perfil>('perfis').then(setPerfis).catch(() => undefined);
    listar<Grupo>('grupos').then(setGrupos).catch(() => undefined);
  }, []);

  // Empresa principal e liberadas só do grupo do usuário (o servidor também confere)
  const doGrupo = (g: number | null) => empresas.filter((e) => e.grupo_id === g);
  const principalDe = (g: number | null) => doGrupo(g).find((e) => e.ativo)?.id ?? null;

  return (
    <CadastroCrm<UsuarioLista, Form>
      cadastro="usuarios"
      titulo="Usuários"
      subtitulo="Usuários do ERP: login do Master e dos módulos"
      registro="Usuário"
      inativa
      nomeDe={(u) => u.login}
      colunas={[
        { key: 'id', label: 'ID', alinhar: 'numero', largura: 70 },
        { key: 'login', label: 'Login', largura: 180 },
        { key: 'grupo_nome', label: 'Grupo', largura: 160 },
        { key: 'empresa_nome', label: 'Empresa principal', largura: 220 },
        { key: 'perfil_nome', label: 'Perfil', largura: 150 },
        { key: 'nivel', label: 'Nível', alinhar: 'centro', largura: 120, render: (u) => NOME_PAPEL[u.nivel] ?? u.nivel },
        { key: 'ultimo_acesso', label: 'Último acesso', alinhar: 'centro', largura: 140, render: (u) => formatarDataHora(u.ultimo_acesso) },
        { key: 'ativo', label: 'Ativo', alinhar: 'centro', largura: 80, render: (u) => simNao(u.ativo) },
      ]}
      novo={() => {
        const grupo_id = grupos.find((g) => g.ativo)?.id ?? null;
        return { login: '', senha: '', grupo_id, empresa_id: principalDe(grupo_id), perfil_id: null, nivel: 'user', ativo: true, empresas: [] };
      }}
      doRegistro={(u) => {
        // Liberações antigas de empresas de outro grupo saem ao gravar
        const ids = doGrupo(u.grupo_id).map((e) => e.id);
        return { login: u.login, senha: '', grupo_id: u.grupo_id, empresa_id: u.empresa_id, perfil_id: u.perfil_id, nivel: u.nivel, ativo: !!u.ativo, empresas: u.empresas.filter((e) => ids.includes(e)) };
      }}
      campos={(f, alterar, editando) => (
        <>
          <Campo rotulo="Login">
            <input autoFocus required maxLength={60} autoComplete="off" value={f.login} onChange={(e) => alterar({ login: e.target.value })} className={INPUT_CLASS} />
          </Campo>
          <Campo rotulo={editando ? 'Nova senha' : 'Senha'} dica={editando ? 'Em branco = não altera.' : 'Em branco = o usuário define no primeiro acesso.'}>
            <input type="password" autoComplete="new-password" value={f.senha} onChange={(e) => alterar({ senha: e.target.value })} className={INPUT_CLASS} />
          </Campo>
          <Campo rotulo="Grupo" span={2}>
            <select
              required
              value={f.grupo_id ?? ''}
              onChange={(e) => {
                const g = e.target.value === '' ? null : Number(e.target.value);
                alterar({ grupo_id: g, empresa_id: principalDe(g), empresas: [] });
              }}
              className={INPUT_CLASS}
            >
              <option value="">Selecione…</option>
              {grupos.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nome}
                  {g.ativo ? '' : ' (inativo)'}
                </option>
              ))}
            </select>
          </Campo>
          <Campo rotulo="Empresa principal" span={2}>
            <select required value={f.empresa_id ?? ''} onChange={(e) => alterar({ empresa_id: e.target.value === '' ? null : Number(e.target.value) })} className={INPUT_CLASS}>
              <option value="">Selecione…</option>
              {doGrupo(f.grupo_id).map((e) => (
                <option key={e.id} value={e.id}>
                  {nomeEmpresa(e)}
                  {e.ativo ? '' : ' (inativa)'}
                </option>
              ))}
            </select>
          </Campo>
          <Campo rotulo="Perfil" span={2}>
            <select value={f.perfil_id ?? ''} onChange={(e) => alterar({ perfil_id: e.target.value === '' ? null : Number(e.target.value) })} className={INPUT_CLASS}>
              <option value="">Sem perfil</option>
              {perfis.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </Campo>
          <Campo rotulo="Nível" dica={DICA_NIVEL[f.nivel]}>
            <select required value={f.nivel} onChange={(e) => alterar({ nivel: e.target.value as Papel })} className={INPUT_CLASS}>
              {niveis.map((n) => (
                <option key={n} value={n}>
                  {NOME_PAPEL[n]}
                </option>
              ))}
            </select>
          </Campo>
          <Campo rotulo="Ativo">
            <div className="h-[34px] flex items-center">
              <Toggle checked={f.ativo} onChange={(v) => alterar({ ativo: v })} />
            </div>
          </Campo>
          <Campo rotulo="Empresas liberadas" span={4} dica="Filiais em que o usuário pode entrar nos módulos.">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 p-3 rounded-lg border border-stone-200 dark:border-stone-800">
              {doGrupo(f.grupo_id).map((e) => (
                <Toggle
                  key={e.id}
                  size="sm"
                  checked={f.empresas.includes(e.id)}
                  onChange={(v) => alterar({ empresas: v ? [...f.empresas, e.id] : f.empresas.filter((x) => x !== e.id) })}
                  label={`${nomeEmpresa(e)}${e.ativo ? '' : ' (inativa)'}`}
                />
              ))}
              {doGrupo(f.grupo_id).length === 0 && <span className="text-xs text-stone-400">{f.grupo_id === null ? 'Escolha o grupo.' : 'Nenhuma empresa neste grupo.'}</span>}
            </div>
          </Campo>
        </>
      )}
    />
  );
};
