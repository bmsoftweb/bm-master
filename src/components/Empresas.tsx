import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { CadastroCrm } from './CadastroCrm';
import { Campo, INPUT_CLASS } from './FormCrm';
import { Toggle } from './Toggle';
import { listar } from '../services/api';
import { cnpjValido, formatarCnpj, limparCnpj } from '../utils/cnpj';
import { formatarCep, formatarTelefone, limparDigitos, simNao } from '../utils/formato';
import { NOME_ATUACAO, TIPOS_ATUACAO, UFS } from '../utils/listas';
import { ehSuper } from '../utils/menu';
import type { Empresa, Grupo, Usuario } from '../types';

type Form = Omit<Empresa, 'id' | 'grupo_id' | 'grupo_nome' | 'ativo'> & { grupo_id: number | null; ativo: boolean };

const TEXTOS = ['nome_fantasia', 'inscricao_estadual', 'inscricao_municipal', 'cep', 'logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'uf', 'telefone', 'email'] as const;

/** Empresas (sys_empresas) de um grupo: abre pela ação "Empresas" da tela de Grupos. O admin só vê */
export const Empresas: React.FC<{ usuario: Usuario; grupo: Grupo; onVoltar: () => void }> = ({ usuario, grupo, onVoltar }) => {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  useEffect(() => {
    listar<Grupo>('grupos').then(setGrupos).catch(() => undefined); // sem grupos o select fica vazio e o servidor recusa
  }, []);

  const texto = (f: Form, alterar: (p: Partial<Form>) => void, k: (typeof TEXTOS)[number], max: number, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <input maxLength={max} value={f[k] ?? ''} onChange={(e) => alterar({ [k]: e.target.value })} className={INPUT_CLASS} {...extra} />
  );

  return (
    <CadastroCrm<Empresa, Form>
      cadastro="empresas"
      titulo="Empresas"
      subtitulo={`Empresas do grupo ${grupo.nome}`}
      registro="Empresa"
      feminino
      inativa
      filtro={(e) => e.grupo_id === grupo.id}
      somenteLeitura={!ehSuper(usuario)}
      barraExtra={
        <button type="button" onClick={onVoltar} title="Volta para a lista de grupos" className="shrink-0 inline-flex items-center gap-1.5 h-[34px] px-3 rounded-md text-xs font-medium text-stone-600 dark:text-stone-300 border border-stone-300 dark:border-stone-700 cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800">
          <ArrowLeft className="w-3.5 h-3.5" />
          Grupos
        </button>
      }
      nomeDe={(e) => e.nome_fantasia || e.razao_social}
      colunas={[
        { key: 'id', label: 'ID', alinhar: 'numero', largura: 70 },
        { key: 'razao_social', label: 'Razão social', largura: 260 },
        { key: 'nome_fantasia', label: 'Nome fantasia', largura: 180 },
        { key: 'cnpj', label: 'CNPJ', largura: 150, render: (e) => formatarCnpj(e.cnpj) },
        { key: 'grupo_nome', label: 'Grupo', largura: 160 },
        { key: 'tipo_atuacao', label: 'Atuação', largura: 120, render: (e) => NOME_ATUACAO[e.tipo_atuacao] ?? e.tipo_atuacao },
        { key: 'cidade', label: 'Cidade', largura: 150, render: (e) => [e.cidade, e.uf].filter(Boolean).join(' / ') },
        { key: 'ativo', label: 'Ativo', alinhar: 'centro', largura: 80, render: (e) => simNao(e.ativo) },
      ]}
      novo={() => {
        const vazio = Object.fromEntries(TEXTOS.map((k) => [k, ''])) as Record<(typeof TEXTOS)[number], string>;
        return { ...vazio, grupo_id: grupo.id, razao_social: '', cnpj: '', tipo_atuacao: '', ativo: true };
      }}
      doRegistro={({ id: _id, grupo_nome: _g, ativo, ...e }) => ({ ...e, ativo: !!ativo })}
      validar={(f) => (cnpjValido(f.cnpj) ? null : 'CNPJ inválido: confira os dígitos.')}
      campos={(f, alterar) => (
        <>
          <Campo rotulo="Razão social" span={2}>
            <input autoFocus required maxLength={150} value={f.razao_social} onChange={(e) => alterar({ razao_social: e.target.value })} className={INPUT_CLASS} />
          </Campo>
          <Campo rotulo="Nome fantasia" span={2}>
            {texto(f, alterar, 'nome_fantasia', 100)}
          </Campo>
          <Campo rotulo="CNPJ">
            <input required value={formatarCnpj(f.cnpj)} onChange={(e) => alterar({ cnpj: limparCnpj(e.target.value) })} placeholder="00.000.000/0000-00" className={`${INPUT_CLASS} tabular-nums`} />
          </Campo>
          <Campo rotulo="Inscrição estadual">{texto(f, alterar, 'inscricao_estadual', 20)}</Campo>
          <Campo rotulo="Inscrição municipal">{texto(f, alterar, 'inscricao_municipal', 20)}</Campo>
          <Campo rotulo="Tipo de atuação">
            <select required value={f.tipo_atuacao} onChange={(e) => alterar({ tipo_atuacao: e.target.value })} className={INPUT_CLASS}>
              <option value="">Selecione…</option>
              {TIPOS_ATUACAO.map((t) => (
                <option key={t} value={t}>
                  {NOME_ATUACAO[t]}
                </option>
              ))}
            </select>
          </Campo>
          <Campo rotulo="Grupo" span={2}>
            <select required value={f.grupo_id ?? ''} onChange={(e) => alterar({ grupo_id: e.target.value === '' ? null : Number(e.target.value) })} className={INPUT_CLASS}>
              <option value="">Selecione…</option>
              {grupos.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nome}
                  {g.ativo ? '' : ' (inativo)'}
                </option>
              ))}
            </select>
          </Campo>
          <Campo rotulo="Ativa">
            <div className="h-[34px] flex items-center">
              <Toggle checked={f.ativo} onChange={(v) => alterar({ ativo: v })} />
            </div>
          </Campo>
          <Campo rotulo="CEP">
            <input value={formatarCep(f.cep)} onChange={(e) => alterar({ cep: limparDigitos(e.target.value, 8) })} placeholder="00000-000" inputMode="numeric" className={`${INPUT_CLASS} tabular-nums`} />
          </Campo>
          <Campo rotulo="Logradouro" span={2}>
            {texto(f, alterar, 'logradouro', 150)}
          </Campo>
          <Campo rotulo="Número">{texto(f, alterar, 'numero', 10)}</Campo>
          <Campo rotulo="Complemento">{texto(f, alterar, 'complemento', 60)}</Campo>
          <Campo rotulo="Bairro">{texto(f, alterar, 'bairro', 80)}</Campo>
          <Campo rotulo="Cidade">{texto(f, alterar, 'cidade', 80)}</Campo>
          <Campo rotulo="UF">
            <select value={f.uf ?? ''} onChange={(e) => alterar({ uf: e.target.value })} className={INPUT_CLASS}>
              <option value="" />
              {UFS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </Campo>
          <Campo rotulo="Telefone">
            <input value={formatarTelefone(f.telefone)} onChange={(e) => alterar({ telefone: limparDigitos(e.target.value, 11) })} placeholder="(00) 00000-0000" inputMode="tel" className={`${INPUT_CLASS} tabular-nums`} />
          </Campo>
          <Campo rotulo="E-mail" span={3}>
            {texto(f, alterar, 'email', 120, { type: 'email' })}
          </Campo>
        </>
      )}
    />
  );
};
