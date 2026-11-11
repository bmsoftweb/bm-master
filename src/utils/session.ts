import type { Usuario } from '../types';

/**
 * Sessão no navegador: só o token assinado pelo servidor e os dados públicos do usuário (sem senha).
 * Fica no sessionStorage: termina ao fechar o navegador.
 */
const CHAVE = 'bmmaster_sessao';

export interface Sessao {
  usuario: Usuario;
  token: string;
}

export function lerSessao(): Sessao | null {
  try {
    const s = JSON.parse(sessionStorage.getItem(CHAVE) || 'null') as Sessao | null;
    return s?.token && s.usuario ? s : null;
  } catch {
    return null;
  }
}

export function salvarSessao(s: Sessao) {
  try {
    sessionStorage.setItem(CHAVE, JSON.stringify(s));
  } catch {
    // sem storage: vale só até recarregar
  }
}

export function limparSessao() {
  try {
    sessionStorage.removeItem(CHAVE);
  } catch {
    // idem
  }
}
