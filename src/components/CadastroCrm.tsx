import React, { useCallback, useEffect, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Tela } from './Tela';
import { ListaCrm, type ColunaLista } from './ListaCrm';
import { FormCrm } from './FormCrm';
import { AvisoErro, Toast } from './AvisoErro';
import { ConfirmDialog } from './ConfirmDialog';
import { BotaoAcao } from './MenuAcoes';
import { excluirCadastro, listar, salvarCadastro, type Cadastro } from '../services/api';

const mensagem = (err: unknown) => (err instanceof Error ? err.message : 'Erro de conexão com o servidor.');

interface Props<T extends { id: number }, F> {
  cadastro: Cadastro;
  titulo: string;
  subtitulo: string;
  /** Nome do registro, ex.: "Grupo" (rodapé do formulário e mensagens) */
  registro: string;
  /** "Nova" em vez de "Novo" */
  feminino?: boolean;
  colunas: ColunaLista<T>[];
  /** Formulário em branco da inclusão */
  novo: () => F;
  /** Formulário a partir do registro (edição) */
  doRegistro: (r: T) => F;
  /** Campos (<Campo>) do formulário */
  campos: (form: F, alterar: (p: Partial<F>) => void, editando: T | null) => React.ReactNode;
  /** Validação antes de gravar: texto do erro ou null */
  validar?: (form: F) => string | null;
  nomeDe: (r: T) => string;
  /** Exclusão lógica (UPDATE ativo = 0) em vez de apagar o registro */
  inativa?: boolean;
  /** A lista mudou (ex.: para recarregar as opções de outra tela) */
  aoCarregar?: (linhas: T[]) => void;
  /** Ícones antes de Editar/Excluir na coluna Ações */
  acoesExtras?: (r: T) => React.ReactNode;
  /** Mostra só as linhas que passam (ex.: empresas de um grupo) */
  filtro?: (r: T) => boolean;
  /** Controles a mais na barra da lista */
  barraExtra?: React.ReactNode;
  /** Só a lista: sem Novo, Editar e Excluir (o servidor também recusa) */
  somenteLeitura?: boolean;
}

/**
 * Cadastro no padrão do bm-estoque: lista (ListaCrm) ocupando a tela e, ao incluir ou editar, o formulário
 * (FormCrm) no lugar dela, com Cancelar e Salvar fixos no pé.
 */
export function CadastroCrm<T extends { id: number }, F extends object>({ cadastro, titulo, subtitulo, registro, feminino, colunas, novo, doRegistro, campos, validar, nomeDe, inativa, aoCarregar, acoesExtras, filtro, barraExtra, somenteLeitura }: Props<T, F>) {
  const [linhas, setLinhas] = useState<T[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [form, setForm] = useState<F | null>(null);
  const [editando, setEditando] = useState<T | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState<T | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const l = await listar<T>(cadastro);
      setLinhas(l);
      aoCarregar?.(l);
    } catch (err) {
      setErro(mensagem(err));
    } finally {
      setCarregando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- aoCarregar muda a cada render da tela
  }, [cadastro]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const abrir = (r: T | null) => {
    setEditando(r);
    setForm(r ? doRegistro(r) : novo());
  };

  const salvar = async () => {
    if (!form) return;
    const invalido = validar?.(form);
    if (invalido) return setErro(invalido);
    setSalvando(true);
    try {
      await salvarCadastro(cadastro, editando?.id ?? null, form);
      setForm(null);
      setToast(editando ? `${registro} alterad${feminino ? 'a' : 'o'}.` : `${registro} incluíd${feminino ? 'a' : 'o'}.`);
      carregar();
    } catch (err) {
      setErro(mensagem(err));
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async (r: T) => {
    setExcluindo(null);
    try {
      await excluirCadastro(cadastro, r.id);
      setToast(inativa ? `${registro} inativad${feminino ? 'a' : 'o'}.` : `${registro} excluíd${feminino ? 'a' : 'o'}.`);
      carregar();
    } catch (err) {
      setErro(mensagem(err));
    }
  };

  return (
    <Tela titulo={titulo} subtitulo={subtitulo}>
      {form ? (
        <FormCrm
          id={cadastro}
          onSubmit={salvar}
          onCancel={() => setForm(null)}
          saving={salvando}
          rodape={editando ? `${registro} #${editando.id}` : `${feminino ? 'Nova' : 'Novo'} ${registro.toLowerCase()}`}
        >
          {campos(form, (p) => setForm({ ...form, ...p }), editando)}
        </FormCrm>
      ) : (
        <ListaCrm
          className="flex-1"
          id={cadastro}
          colunas={colunas}
          linhas={filtro ? linhas.filter(filtro) : linhas}
          chave={(r) => r.id}
          carregando={carregando}
          onNovo={somenteLeitura ? undefined : () => abrir(null)}
          onEditar={somenteLeitura ? undefined : abrir}
          barraExtra={barraExtra}
          vazio={`Nenhum registro cadastrado.`}
          acoes={(r) => (
            <>
              {acoesExtras?.(r)}
              {!somenteLeitura && (
                <>
                  <BotaoAcao icone={Pencil} titulo="Editar" descricao="Abre o registro para edição" onClick={() => abrir(r)} />
                  <BotaoAcao
                    icone={Trash2}
                    titulo="Excluir"
                    descricao={inativa ? 'Inativa o registro (pede confirmação)' : 'Apaga o registro (pede confirmação)'}
                    tom="perigo"
                    onClick={() => setExcluindo(r)}
                  />
                </>
              )}
            </>
          )}
        />
      )}

      {excluindo && (
        <ConfirmDialog
          titulo={`Excluir ${registro.toLowerCase()}?`}
          mensagem={
            inativa
              ? `"${nomeDe(excluindo)}" fica inativ${feminino ? 'a' : 'o'} (exclusão lógica): some das escolhas, mas o histórico continua no ERP.`
              : `"${nomeDe(excluindo)}" será excluíd${feminino ? 'a' : 'o'}. Esta ação não pode ser desfeita.`
          }
          onConfirmar={() => excluir(excluindo)}
          onCancelar={() => setExcluindo(null)}
        />
      )}

      {erro && <AvisoErro mensagem={erro} onFechar={() => setErro(null)} />}
      {toast && <Toast mensagem={toast} onFechar={() => setToast(null)} />}
    </Tela>
  );
}
