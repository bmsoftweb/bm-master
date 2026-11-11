import React from 'react';
import { Building2 } from 'lucide-react';
import { CadastroCrm } from './CadastroCrm';
import { Campo, INPUT_CLASS } from './FormCrm';
import { BotaoAcao } from './MenuAcoes';
import { Toggle } from './Toggle';
import { simNao } from '../utils/formato';
import { ehSuper } from '../utils/menu';
import type { Grupo, Usuario } from '../types';

interface Form {
  nome: string;
  ativo: boolean;
}

/** Grupos de empresas (sys_grupos) */
/** O admin só vê o próprio grupo (sem incluir, editar nem excluir) */
export const Grupos: React.FC<{ usuario: Usuario; onEmpresas: (g: Grupo) => void }> = ({ usuario, onEmpresas }) => (
  <CadastroCrm<Grupo, Form>
    cadastro="grupos"
    titulo="Grupos"
    subtitulo="Grupos de empresas do ERP"
    registro="Grupo"
    inativa
    somenteLeitura={!ehSuper(usuario)}
    nomeDe={(g) => g.nome}
    acoesExtras={(g) => <BotaoAcao icone={Building2} titulo="Empresas" descricao="Abre as empresas deste grupo" onClick={() => onEmpresas(g)} />}
    colunas={[
      { key: 'id', label: 'ID', alinhar: 'numero', largura: 70 },
      { key: 'nome', label: 'Nome', largura: 320 },
      { key: 'empresas', label: 'Empresas', alinhar: 'numero', largura: 100 },
      { key: 'ativo', label: 'Ativo', alinhar: 'centro', largura: 80, render: (g) => simNao(g.ativo) },
    ]}
    novo={() => ({ nome: '', ativo: true })}
    doRegistro={(g) => ({ nome: g.nome, ativo: !!g.ativo })}
    campos={(f, alterar) => (
      <>
        <Campo rotulo="Nome do grupo" span={2}>
          <input autoFocus required maxLength={100} value={f.nome} onChange={(e) => alterar({ nome: e.target.value })} className={INPUT_CLASS} />
        </Campo>
        <Campo rotulo="Ativo">
          <div className="h-[34px] flex items-center">
            <Toggle checked={f.ativo} onChange={(v) => alterar({ ativo: v })} />
          </div>
        </Campo>
      </>
    )}
  />
);
