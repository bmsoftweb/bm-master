import type { Modulo, Usuario } from '../types';
import { temaAtual } from '../utils/theme';

/** O token da sessão acompanha toda requisição no header Authorization */
let tokenAtual: string | null = null;
let aoExpirar: ((msg: string) => void) | null = null;

export const setTokenSessao = (token: string | null) => {
  cacheListas = null; // outro usuário: outras preferências
  tokenAtual = token;
};

/** Chamado quando o servidor recusa o token (sessão expirada ou usuário removido) */
export const setAoExpirarSessao = (fn: ((msg: string) => void) | null) => {
  aoExpirar = fn;
};

async function chamar<T>(method: string, url: string, corpo?: unknown): Promise<T> {
  const h: Record<string, string> = {};
  if (tokenAtual) h.Authorization = `Bearer ${tokenAtual}`;
  if (corpo !== undefined) h['Content-Type'] = 'application/json';
  const res = await fetch(url, { method, headers: h, body: corpo === undefined ? undefined : JSON.stringify(corpo), cache: 'no-store' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.erro || `Falha na requisição (HTTP ${res.status}).`;
    if (res.status === 401 && tokenAtual && aoExpirar) aoExpirar(msg);
    throw new Error(msg);
  }
  return data as T;
}

const get = <T>(url: string) => chamar<T>('GET', url);

// ---------- Sessão ----------
export const login = (login: string, senha: string) => chamar<{ token: string; usuario: Usuario }>('POST', '/api/login', { login, senha });
export const revalidarSessao = () => get<{ usuario: Usuario }>('/api/sessao');

// ---------- Painel ----------
export const indicadores = () => get<{ usuarios: number; empresas: number }>('/api/indicadores');

// ---------- Cadastros (tabelas sys_* do ERP) ----------
export type Cadastro = 'grupos' | 'empresas' | 'perfis' | 'usuarios';
export const listar = <T>(cadastro: Cadastro) => get<T[]>(`/api/${cadastro}`);
export const salvarCadastro = (cadastro: Cadastro, id: number | null, dados: object) =>
  // id 0 é válido (grupo e empresa de demonstração): só null é inclusão
  chamar<{ id: number }>(id !== null ? 'PUT' : 'POST', id !== null ? `/api/${cadastro}/${id}` : `/api/${cadastro}`, dados);
export const excluirCadastro = (cadastro: Cadastro, id: number) => chamar<void>('DELETE', `/api/${cadastro}/${id}`);

// ---------- Preferências das listas e formulários (sys_usuarios.config_listas) ----------
// Lidas uma vez por sessão e gravadas por chave. Se a leitura falhar, nada é gravado: um PUT só com uma chave
// apagaria as demais.
let cacheListas: Promise<Record<string, any>> | null = null;

export function lerConfigListas(): Promise<Record<string, any>> {
  if (!cacheListas) {
    cacheListas = get<Record<string, any>>('/api/config-listas').catch((e) => {
      cacheListas = null;
      throw e;
    });
  }
  return cacheListas;
}

export async function gravarConfigLista(chave: string, valor: unknown) {
  const novo = { ...(await lerConfigListas()), [chave]: valor };
  await chamar<void>('PUT', '/api/config-listas', novo);
  cacheListas = Promise.resolve(novo);
}

// ---------- Módulos ----------
/** Árvore de módulos que o usuário acessa (pai_id 0 = raiz) */
export const meusModulos = () => get<Modulo[]>('/api/modulos');
/** Endereço de acesso a um módulo, montado no servidor. volta:o módulo volta para este endereço do Master (com ?erro=) se não conseguir entrar; tema: o modo do Master */
export const linkModulo = (id: number) =>
  get<{ url: string }>(`/api/modulos/${id}/link?volta=${encodeURIComponent(window.location.origin + '/')}&tema=${temaAtual()}`);
