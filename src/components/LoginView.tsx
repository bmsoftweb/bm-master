import React, { useState } from 'react';
import { ArrowRight, Eye, EyeOff, Lock, User } from 'lucide-react';
import { VISUAL_MASTER } from '../utils/apps';
import { ThemeToggle } from './ThemeToggle';
import { AvisoErro } from './AvisoErro';
import { INPUT_CLASS_LG } from '../utils/formStyles';
import { applyTheme, temaAtual, type ThemeMode } from '../utils/theme';
import { login } from '../services/api';
import type { Usuario } from '../types';

interface LoginViewProps {
  /** Mensagem mostrada ao abrir a tela, ex.: sessão recusada pelo servidor */
  avisoInicial?: string | null;
  onLoginSuccess: (usuario: Usuario, token: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ avisoInicial, onLoginSuccess }) => {
  const [theme, setTheme] = useState<ThemeMode>(temaAtual);
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(avisoInicial ?? null);

  const alternarTema = () => {
    const novo = theme === 'dark' ? 'light' : 'dark';
    applyTheme(novo);
    setTheme(novo);
  };

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);
    setErro(null);
    try {
      const r = await login(usuario.trim(), senha);
      onLoginSuccess(r.usuario, r.token);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível conectar ao servidor.');
      setCarregando(false);
    }
  };
  const marca = (
    <div className="flex items-center gap-2.5">
      <div className={`w-9 h-9 ${VISUAL_MASTER.fundo} rounded-xl flex items-center justify-center shadow-lg shadow-blue-200/50 dark:shadow-none shrink-0`}>
        <VISUAL_MASTER.Icone className="w-5 h-5 text-white" />
      </div>
      <span className="text-sm font-black tracking-wider uppercase text-stone-800 dark:text-stone-100">BM-Master</span>
    </div>
  );

  return (
    <div className="min-h-screen flex relative bg-white dark:bg-stone-900 text-stone-900 dark:text-white">
      {/* Painel esquerdo: identidade visual (oculto em telas pequenas) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col p-12 bg-white dark:bg-stone-950 isolate">
        <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
          {/* Pano de fundo: o grupo no topo ligado às empresas e aos usuários */}
          <svg viewBox="0 0 380 420" aria-hidden="true" className="absolute top-1/2 right-[6%] -translate-y-1/2 w-[min(440px,70%)] text-indigo-200 dark:text-indigo-400/25">
            <g fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" opacity=".7">
              <path d="M190 90 V150 M190 150 H80 V210 M190 150 V210 M190 150 H300 V210" />
              <path d="M80 270 V320 M80 320 H40 V360 M80 320 H120 V360 M300 270 V320 M300 320 H260 V360 M300 320 H340 V360" />
            </g>
            <g fill="currentColor">
              <rect x="140" y="20" width="100" height="70" rx="14" />
              <rect x="40" y="210" width="80" height="60" rx="12" opacity=".75" />
              <rect x="150" y="210" width="80" height="60" rx="12" opacity=".75" />
              <rect x="260" y="210" width="80" height="60" rx="12" opacity=".75" />
              <circle cx="40" cy="378" r="18" opacity=".5" />
              <circle cx="120" cy="378" r="18" opacity=".5" />
              <circle cx="260" cy="378" r="18" opacity=".5" />
              <circle cx="340" cy="378" r="18" opacity=".5" />
            </g>
          </svg>
          <div className="absolute top-[15%] left-[10%] w-[280px] h-[280px] rounded-[40%] rotate-12 blur-3xl bg-indigo-100/70 dark:bg-indigo-500/10" />
          <div className="absolute bottom-[10%] right-[5%] w-[220px] h-[220px] rounded-[45%] -rotate-12 blur-2xl bg-blue-100/60 dark:bg-blue-500/10" />
        </div>

        {marca}

        <div className="flex-1 flex flex-col justify-center">
          <h1 className="text-6xl font-black leading-[0.95] tracking-tight text-stone-900 dark:text-white">Master</h1>
          <p className="mt-4 text-sm font-medium max-w-xs text-stone-500 dark:text-stone-400">
            Grupos, empresas, usuários, perfis e módulos dos sistemas BMsoft em um só lugar.
          </p>
        </div>
      </div>

      {/* Painel direito: formulário de login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative bg-stone-50 dark:bg-stone-900">
        <div className="absolute top-6 right-6 z-20">
          <ThemeToggle theme={theme} onToggle={alternarTema} />
        </div>

        <div className="w-full max-w-md">
          <div className="flex lg:hidden mb-8">{marca}</div>

          <h2 className="text-3xl font-black tracking-tight text-stone-900 dark:text-white">Login</h2>
          <p className="text-sm font-medium mt-1.5 text-stone-500 dark:text-stone-400">Entre com o usuário e a senha do sistema BMsoft. No primeiro acesso, a senha digitada passa a ser a sua.</p>

          <form onSubmit={entrar} className="flex flex-col gap-5 mt-8">
            <div>
              <label htmlFor="login-usuario" className="block text-[10px] font-bold uppercase tracking-widest ml-1 mb-1.5 text-stone-400 dark:text-stone-500">
                Usuário
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-stone-500 pointer-events-none" />
                <input
                  id="login-usuario"
                  type="text"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  placeholder="seu usuário"
                  autoComplete="username"
                  autoFocus
                  required
                  className={`${INPUT_CLASS_LG} w-full pl-11`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-senha" className="block text-[10px] font-bold uppercase tracking-widest ml-1 mb-1.5 text-stone-400 dark:text-stone-500">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-stone-500 pointer-events-none" />
                <input
                  id="login-senha"
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className={`${INPUT_CLASS_LG} w-full pl-11 pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
                  tabIndex={-1}
                  title={mostrarSenha ? 'Esconder a senha' : 'Mostrar a senha'}
                >
                  {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center gap-2 mt-2 group disabled:opacity-70 cursor-pointer"
            >
              {carregando ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="uppercase tracking-wide">Entrar</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="flex items-center justify-between mt-8 pt-4 border-t border-stone-200 dark:border-stone-800 text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
            <span>BM-Master by BMsoft Sistemas</span>
            <span className="normal-case">v{__APP_VERSION__} • © {new Date().getFullYear()}</span>
          </div>
        </div>
      </div>

      {erro && <AvisoErro mensagem={erro} onFechar={() => setErro(null)} />}
    </div>
  );
};