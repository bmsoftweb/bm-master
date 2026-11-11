import React, { useEffect, useRef, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { LoginView } from './components/LoginView';
import { AbrirMenuMobile } from './components/Tela';
import { Painel } from './components/Painel';
import { Grupos } from './components/Grupos';
import { Empresas } from './components/Empresas';
import { Perfis } from './components/Perfis';
import { Usuarios } from './components/Usuarios';
import { Modulos } from './components/Modulos';
import { AvisoErro } from './components/AvisoErro';
import { BarraAbas, type AbaModulo } from './components/BarraAbas';
import { linkModulo, revalidarSessao, setAoExpirarSessao, setTokenSessao } from './services/api';
import { lerSessao, limparSessao, salvarSessao, type Sessao } from './utils/session';
import { podeAcessar, telaInicial } from './utils/menu';
import type { Grupo, Modulo, Usuario } from './types';

// Sessão guardada: o token já vai nas primeiras requisições das telas
const sessaoInicial = lerSessao();
setTokenSessao(sessaoInicial?.token ?? null);

type JanelaMaster = Window & { __mostrarErroModulo?: (mensagem: string, janela: Window) => void };

// Volta de um módulo que não conseguiu entrar (?erro=). Dentro da aba do Master (iframe) ou numa aba do navegador
// aberta por ele: avisa o Master de origem, que fecha a aba do módulo. Sem ele (link aberto à mão): mostra aqui.
const erroModulo = new URLSearchParams(window.location.search).get('erro');
let erroFicaAqui = erroModulo;
if (erroModulo !== null) {
  window.history.replaceState(null, '', window.location.pathname);
  try {
    const origem = (window.parent !== window ? window.parent : window.opener) as JanelaMaster | null;
    if (origem && origem.location.origin === window.location.origin && origem.__mostrarErroModulo) {
      origem.__mostrarErroModulo(erroModulo, window);
      erroFicaAqui = null;
      if (window.parent === window) window.close();
    }
  } catch {
    // Master de origem em outro endereço: fica aqui
  }
}

export default function App() {
  const [sessao, setSessao] = useState<Sessao | null>(sessaoInicial);
  const [aviso, setAviso] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(() => (sessaoInicial ? telaInicial(sessaoInicial.usuario) : 'painel'));
  const [menuMobile, setMenuMobile] = useState(false);
  // Grupo escolhido em Grupos > Empresas: a tela de empresas (sem item no menu) é sempre a de um grupo; navegar pelo menu fecha
  const [grupoEmpresas, setGrupoEmpresas] = useState<Grupo | null>(null);
  const navegar = (tab: string) => {
    setGrupoEmpresas(null);
    setActiveTab(tab);
  };

  // Módulos abertos em abas do próprio Master (iframe). Ficam montados ao trocar de aba; sair fecha todos.
  const [abas, setAbas] = useState<AbaModulo[]>([]);
  const [abaAtiva, setAbaAtiva] = useState<'master' | number>('master');
  const iframes = useRef(new Map<number, HTMLIFrameElement>());

  const fecharAba = (id: number) => {
    setAbas((l) => l.filter((a) => a.id !== id));
    setAbaAtiva((atual) => (atual === id ? 'master' : atual));
  };

  /** Módulo já aberto: só ativa a aba; senão busca o link de entrada automática e abre uma aba nova */
  const abrirModulo = async (m: Modulo) => {
    if (abas.some((a) => a.id === m.id)) return setAbaAtiva(m.id);
    const { url } = await linkModulo(m.id);
    setAbas((l) => (l.some((a) => a.id === m.id) ? l : [...l, { id: m.id, titulo: m.descricao, sigla: m.sigla, url }]));
    setAbaAtiva(m.id);
  };

  const abrirFora = (id: number) => {
    const aba = abas.find((a) => a.id === id);
    if (!aba) return;
    window.open(aba.url, '_blank');
    fecharAba(id);
  };

  const sair = (mensagem?: string) => {
    setAbas([]);
    setAbaAtiva('master');
    limparSessao();
    setTokenSessao(null);
    setSessao(null);
    setAviso(mensagem ?? null);
  };

  const entrar = (usuario: Usuario, token: string) => {
    const nova = { usuario, token };
    salvarSessao(nova);
    setTokenSessao(token);
    setSessao(nova);
    setActiveTab(telaInicial(usuario));
  };

  // Token recusado pelo servidor (expirado ou usuário removido): volta para o login com o motivo
  useEffect(() => {
    setAoExpirarSessao(sair);
    return () => setAoExpirarSessao(null);
  }, []);

  // Erro de um módulo aberto daqui: a página de volta (dentro do iframe ou na aba do navegador) chama esta função
  const [erroVolta, setErroVolta] = useState<string | null>(erroFicaAqui);
  useEffect(() => {
    (window as JanelaMaster).__mostrarErroModulo = (mensagem, janela) => {
      for (const [id, frame] of iframes.current) if (frame.contentWindow === janela) fecharAba(id);
      setErroVolta(mensagem);
      window.focus();
    };
    return () => void delete (window as JanelaMaster).__mostrarErroModulo;
  }, []);
  const avisoVolta = erroVolta && <AvisoErro mensagem={erroVolta} onFechar={() => setErroVolta(null)} />;

  // Sair dentro de um módulo aberto aqui: o módulo pede (postMessage) e a aba dele fecha, em vez de ir para o login.
  // Só vale para mensagem vinda de um iframe de módulo deste Master.
  useEffect(() => {
    const ouvir = (e: MessageEvent) => {
      if (e.data?.tipo !== 'bm:fechar-modulo') return;
      for (const [id, frame] of iframes.current) if (frame.contentWindow === e.source) fecharAba(id);
    };
    window.addEventListener('message', ouvir);
    return () => window.removeEventListener('message', ouvir);
  }, []);

  // Relê o usuário ao abrir com sessão guardada: papel alterado pelo administrador vale na hora
  useEffect(() => {
    if (!sessaoInicial) return;
    revalidarSessao()
      .then(({ usuario }) => {
        const atualizada = { ...sessaoInicial, usuario };
        salvarSessao(atualizada);
        setSessao(atualizada);
      })
      .catch(() => undefined); // 401 já cai em sair(); falha de rede mantém a sessão
  }, []);

  if (!sessao)
    return (
      <>
        <LoginView avisoInicial={aviso} onLoginSuccess={entrar} />
        {avisoVolta}
      </>
    );

  const usuario = sessao.usuario;
  const tela = podeAcessar(usuario, activeTab) ? activeTab : telaInicial(usuario);

  const master =
    usuario.role === 'user' ? (
      // Nível user: só os módulos, sem o menu lateral
      <div className="h-full flex flex-col">
        <Modulos nome={usuario.nome} onSair={() => sair()} onAbrir={abrirModulo} />
      </div>
    ) : (
      <div className="h-full flex">
        <Sidebar
          activeTab={tela}
          setActiveTab={navegar}
          usuario={usuario}
          onLogout={() => sair()}
          isOpenMobile={menuMobile}
          onCloseMobile={() => setMenuMobile(false)}
        />
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <AbrirMenuMobile.Provider value={() => setMenuMobile(true)}>
            {tela === 'painel' && <Painel usuario={usuario} onNavegar={navegar} />}
            {tela === 'grupos' &&
              (grupoEmpresas ? <Empresas usuario={usuario} grupo={grupoEmpresas} onVoltar={() => setGrupoEmpresas(null)} /> : <Grupos usuario={usuario} onEmpresas={setGrupoEmpresas} />)}
            {tela === 'usuarios' && <Usuarios usuario={usuario} />}
            {tela === 'perfis' && <Perfis />}
            {tela === 'modulos' && <Modulos onAbrir={abrirModulo} />}
          </AbrirMenuMobile.Provider>
        </div>
      </div>
    );

  return (
    <div className="h-screen overflow-hidden bg-stone-100/70 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      <BarraAbas abas={abas} ativa={abaAtiva} onAtivar={setAbaAtiva} onFechar={fecharAba} onAbrirFora={abrirFora} />
      <div className="flex-1 min-h-0 relative">
        <div className={abaAtiva === 'master' ? 'h-full' : 'hidden'}>{master}</div>
        {abas.map((a) => (
          <iframe
            key={a.id}
            ref={(el) => void (el ? iframes.current.set(a.id, el) : iframes.current.delete(a.id))}
            src={a.url}
            title={a.titulo}
            className={abaAtiva === a.id ? 'absolute inset-0 w-full h-full border-0 bg-white' : 'hidden'}
          />
        ))}
      </div>
      {avisoVolta}
    </div>
  );
}
