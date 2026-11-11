# Histórico de versões

Mais recente primeiro. PATCH a cada envio ao GitHub; MAJOR/MINOR só quando pedido.

## 0.1.2 — 2026-11-11

Ajustes gerais.

- Corrigido: editar o grupo ou a empresa de código 0 (demonstração) incluía um registro novo em vez de alterar.
- Usuários: abrir um usuário para editar antes de as empresas carregarem não apaga mais as empresas liberadas dele ao gravar.
- Usuários e Empresas: falha ao carregar grupos, empresas ou perfis do formulário mostra o aviso de erro (antes as listas ficavam vazias sem explicação).
- Inativar grupo/empresa e excluir perfil inexistente responde "não encontrado".
- Logo do login igual ao do menu e da aba; aba de módulo sem fundo branco no modo escuro.
- Removidas dependências sem uso (`@google/genai`, `@hookform/resolvers`, `jsonwebtoken`, `firebase-tools`).

## 0.1.1 — 2026-11-11

Primeiro envio ao GitHub.

- Projeto no modelo do crmWeb (Vite + React + Express), no mesmo banco do bm-estoque (tabelas `sys_*`); login pelo `sys_usuarios`.
- Cadastros no padrão do bm-estoque (lista com busca, colunas configuráveis e formulário em grade): Grupos, Usuários, Perfis e Módulos. Empresas abre pela ação "Empresas" da lista de Grupos, sempre filtrada pelo grupo.
- Usuário com grupo (`sys_usuarios.grupo_id`, `extras/2026-11-10_usuarios_grupo.sql`); empresa principal e empresas liberadas só do grupo dele.
- Níveis (`sys_usuarios.nivel`): super vê tudo; admin só o próprio grupo, vê grupo e empresas sem alterar e cadastra os usuários do grupo; user só vê os Módulos, sem o menu.
- Módulos abrem em abas do próprio Master, com entrada automática (sem login): clicar num módulo já aberto só ativa a aba, Sair fecha todas, ↗ abre o módulo numa aba do navegador. O módulo abre no mesmo modo claro/escuro do Master; erro na entrada fecha a aba e mostra o aviso; Sair dentro do módulo fecha a aba dele.
- Cada app com ícone e cor próprios no logo, no card de Módulos e na aba; cards de Módulos menores, 5 por linha.
