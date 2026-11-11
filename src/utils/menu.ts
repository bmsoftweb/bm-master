import { LayoutDashboard, Network, Package, Shield, Users, type LucideIcon } from 'lucide-react';
import type { Usuario } from '../types';

export interface ItemMenu {
  id: string;
  label: string;
  descricao: string;
  icone: LucideIcon;
  /** Operador (role "user") não vê */
  soAdmin?: boolean;
  /** Só o super vê */
  soSuper?: boolean;
}

export const GRUPOS_MENU: { titulo: string; itens: ItemMenu[] }[] = [
  { titulo: 'Visão Geral', itens: [{ id: 'painel', label: 'Painel de Controle', descricao: 'Indicadores do cadastro', icone: LayoutDashboard, soAdmin: true }] },
  {
    titulo: 'Cadastros',
    itens: [
      { id: 'grupos', label: 'Grupos', descricao: 'Grupos de empresas', icone: Network, soAdmin: true },
      { id: 'usuarios', label: 'Usuários', descricao: 'Login do Master e dos módulos', icone: Users, soAdmin: true },
      { id: 'perfis', label: 'Perfis', descricao: 'Perfis de acesso dos usuários', icone: Shield, soSuper: true },
    ],
  },
  { titulo: 'Sistemas', itens: [{ id: 'modulos', label: 'Módulos', descricao: 'Selecione um módulo para acessar as ferramentas de gestão', icone: Package }] },
];

export const NOME_PAPEL: Record<string, string> = { super: 'Super Admin', admin: 'Administrador', user: 'Operador' };

export const ehAdmin = (u: Usuario | null) => u?.role === 'super' || u?.role === 'admin';
export const ehSuper = (u: Usuario | null) => u?.role === 'super';

export const podeAcessar = (u: Usuario | null, id: string) =>
  GRUPOS_MENU.some((g) => g.itens.some((it) => it.id === id && (!it.soAdmin || ehAdmin(u)) && (!it.soSuper || ehSuper(u))));

/** Primeira tela depois do login */
export const telaInicial = (u: Usuario) => (ehAdmin(u) ? 'painel' : 'modulos');
