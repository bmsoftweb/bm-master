# BM-Master (Gerenciador Web)

@../../_claude/web.md

Cadastro central dos sistemas BMsoft: grupos de empresas, empresas (filiais), usuários e perfis do ERP, e o lançador
de módulos. Modelo 1 (Vite + React + Express), igual ao crmWeb (`D:\projetos\bm-crm\code`). Usa o mesmo database do
bm-estoque (ERP BMsoft): só tabelas `sys_*`.

- `server.ts` sobe o Express local (Vite em dev, `dist/` em produção); `api/index.ts` serve a Vercel. Todas as rotas
  ficam em `server/app.ts`; banco `mysql2` em `server/db.ts` (fuso `-03:00`).
- Frontend em `src/`: `App.tsx` com `activeTab` (sem router), telas em `src/components/`, chamadas em
  `src/services/api.ts`. Tema claro/escuro só na tela de login (`src/utils/theme.ts`).
- Cadastros no padrão do bm-estoque: `CadastroCrm` monta a tela com `ListaCrm` (lista com busca, paginação, colunas
  redimensionáveis/reordenáveis e menu "Salvar Configuração") e, ao incluir/editar, `FormCrm` no lugar da lista
  (grade de 4 colunas, `<Campo>`, Cancelar/Salvar no pé). `ListaCrm` e `FormCrm` vêm de
  `D:\projetos\bm-estoque\code\components`. Preferências de lista e layout em `sys_usuarios.config_listas`, chave
  `master_listas` (o resto do JSON é do Romaneio e do estoque).
- Empresas não tem item no menu: abre pela ação "Empresas" da lista de Grupos, sempre filtrada pelo grupo (sem
  desfiltrar; "← Grupos" ou o menu voltam).
- Tabelas: Grupos → `sys_grupos`; Empresas → `sys_empresas`; Usuários → `sys_usuarios` + `sys_usuarios_empresas`
  (empresas liberadas); Perfis → `sys_perfis`; Módulos → `sys_modulos`. Excluir grupo, empresa ou usuário é lógico
  (`ativo = 0`); perfil (sem `ativo`) é apagado, e a chave estrangeira recusa se estiver em uso. O código 0 é válido
  (a empresa e o grupo 0 são os de demonstração).
- O usuário tem `grupo_id` (SQL em `../extras/2026-11-10_usuarios_grupo.sql`). A empresa principal (`empresa_id`,
  lida no login dos outros sistemas: não remover) e as empresas liberadas precisam ser desse grupo.
- Componentes padrão: `ConfirmDialog`, `AvisoErro`/`Toast` (canto inferior direito), `MenuAcoes`/`BotaoAcao`, `Toggle`.
- Cada app tem ícone e cor próprios (`src/utils/apps.ts`, pela sigla do `sys_modulos`): o mesmo no logo do menu do
  app, no card de Módulos e na aba. O logo dos outros apps repete à mão o daqui (Estoque: `Package` em esmeralda).
- Sessão sem estado (`server/sessao.ts`): token HMAC com `SESSION_SECRET` (obrigatório, ≥ 32 caracteres), válido por
  12 h, guardado no `sessionStorage`. Leva login:senha cifrados (AES-GCM) só porque os módulos recebem
  `user=base64(login:senha)`: o link é montado no servidor (`/api/modulos/:id/link`) e a senha não chega ao navegador.
- Entrada automática nos módulos: o link leva `user`, `g` (grupo do usuário), `e` (empresa principal), `tema`
  (`light`/`dark`, o modo do Master: o módulo abre igual) e `volta` (endereço do Master). O módulo entra sem login (no bm-estoque, `sys_modulos.url` = `<estoque>/api/entrar`); em
  erro, volta para `<Master>/?erro=<mensagem>`: o Master fecha a aba do módulo e mostra o aviso (sem o Master de
  origem, mostra ali mesmo). O módulo só aceita `volta` do `MASTER_URL` do .env dele.
- Módulos abrem em abas do próprio Master (`BarraAbas` no topo + `iframe` por módulo, no `App.tsx`): clicar num
  módulo já aberto só ativa a aba; as abas ficam carregadas ao trocar; Sair fecha todas. O ícone ↗ da aba abre o
  módulo numa aba do navegador (para módulo que não funcione em iframe). Sair dentro do módulo fecha a aba dele, sem
  ir para o login: o módulo (aberto com `master=1`) manda `postMessage({tipo: 'bm:fechar-modulo'})` ao Master (no
  bm-estoque, `lib/origemMaster.ts`).
- Login igual ao do bm-estoque: `sys_usuarios.login` + `senha_hash`. Senha em branco no banco = primeiro acesso (grava
  a digitada); senhas legadas (texto, md5, sha) passam para bcrypt. O usuário é relido do `sys_usuarios` a cada
  requisição (desativado, nível ou grupo trocado, vale na hora). Ninguém muda o próprio nível nem se inativa.
- `sys_usuarios.nivel` (enum): **super** = tudo, todos os grupos; **admin** = só do próprio grupo (`doGrupo()` no
  servidor filtra as listas): grupo e empresas só vê (`somenteLeitura` no CadastroCrm; gravar grupo, empresa e perfil
  é só do super), e cadastra os usuários do grupo (sem ver nem criar super); Perfis (sem grupo, valem para todos) é
  tela só do super; **user** = só a tela de Módulos, sem o menu lateral (todos os módulos, ainda sem filtro por usuário).
- Nenhuma API devolve senha ou hash. No cadastro de usuário, senha em branco: na inclusão, definida no primeiro
  acesso; na edição, não altera.
- `sys_usuarios.config` (JSON) guarda as configurações do usuário para todos os módulos; o Master ainda não lê nem
  grava esse campo.
- CNPJ gravado sem pontuação e validado em `src/utils/cnpj.ts` (aceita o CNPJ alfanumérico); CEP e telefone só com
  dígitos (`src/utils/formato.ts` formata na tela).
- Não há criação automática de tabelas.
