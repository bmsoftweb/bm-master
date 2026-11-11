/** sys_usuarios.nivel: super = todos os grupos; admin = cadastros do próprio grupo; user = só os módulos, sem menu */
export type Papel = 'super' | 'admin' | 'user';

/** Usuário logado (sem senha) */
export interface Usuario {
  id: number;
  nome: string;
  email: string;
  role: Papel;
  perfil_id: number;
}

/** sys_grupos */
export interface Grupo {
  id: number;
  nome: string;
  ativo: number;
  /** Quantidade de empresas do grupo */
  empresas: number;
}

/** sys_empresas */
export interface Empresa {
  id: number;
  grupo_id: number;
  grupo_nome: string | null;
  razao_social: string;
  nome_fantasia: string | null;
  cnpj: string;
  inscricao_estadual: string | null;
  inscricao_municipal: string | null;
  tipo_atuacao: string;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  telefone: string | null;
  email: string | null;
  ativo: number;
}

/** sys_perfis */
export interface Perfil {
  id: number;
  nome: string;
  descricao: string | null;
  /** Quantidade de usuários com o perfil */
  usuarios: number;
}

/** sys_usuarios (sem a senha) */
export interface UsuarioLista {
  id: number;
  login: string;
  grupo_id: number;
  grupo_nome: string | null;
  empresa_id: number;
  empresa_nome: string | null;
  perfil_id: number | null;
  perfil_nome: string | null;
  nivel: Papel;
  ativo: number;
  /** "aaaa-mm-dd hh:mm" (ordena certo na lista; formatado na tela) */
  ultimo_acesso: string | null;
  /** Empresas liberadas (sys_usuarios_empresas) */
  empresas: number[];
}

/** sys_modulos */
export interface Modulo {
  id: number;
  empresa_id: number;
  pai_id: number;
  sigla: string;
  descricao: string;
  descricao_detalhada: string;
  url: string;
  obs: string;
}
