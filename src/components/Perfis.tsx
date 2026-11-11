import React from 'react';
import { CadastroCrm } from './CadastroCrm';
import { Campo, INPUT_CLASS } from './FormCrm';
import type { Perfil } from '../types';

interface Form {
  nome: string;
  descricao: string;
}

/** Perfis de acesso (sys_perfis) */
export const Perfis: React.FC = () => (
  <CadastroCrm<Perfil, Form>
    cadastro="perfis"
    titulo="Perfis"
    subtitulo="Perfis de acesso dos usuários"
    registro="Perfil"
    nomeDe={(p) => p.nome}
    colunas={[
      { key: 'id', label: 'ID', alinhar: 'numero', largura: 70 },
      { key: 'nome', label: 'Nome', largura: 220 },
      { key: 'descricao', label: 'Descrição', largura: 360 },
      { key: 'usuarios', label: 'Usuários', alinhar: 'numero', largura: 100 },
    ]}
    novo={() => ({ nome: '', descricao: '' })}
    doRegistro={(p) => ({ nome: p.nome, descricao: p.descricao || '' })}
    campos={(f, alterar) => (
      <>
        <Campo rotulo="Nome do perfil" span={2}>
          <input autoFocus required maxLength={60} value={f.nome} onChange={(e) => alterar({ nome: e.target.value })} className={INPUT_CLASS} />
        </Campo>
        <Campo rotulo="Descrição" span={4}>
          <input maxLength={255} value={f.descricao} onChange={(e) => alterar({ descricao: e.target.value })} className={INPUT_CLASS} />
        </Campo>
      </>
    )}
  />
);
