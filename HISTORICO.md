# Histórico de versões

Mais recente primeiro. PATCH a cada envio ao GitHub; MAJOR/MINOR só quando pedido.

## 0.1.1 — 2026-11-11

Primeiro envio ao GitHub.

- Projeto no modelo do crmWeb (Vite + React + Express), no mesmo banco do bm-estoque (tabelas `sys_*`); login pelo `sys_usuarios`.
- Cadastros no padrão do bm-estoque (lista com busca, colunas configuráveis e formulário em grade): Grupos, Usuários, Perfis e Módulos. Empresas abre pela ação "Empresas" da lista de Grupos, sempre filtrada pelo grupo.
- Usuário com grupo (`sys_usuarios.grupo_id`, `extras/2026-11-10_usuarios_grupo.sql`); empresa principal e empresas liberadas só do grupo dele.
- Níveis (`sys_usuarios.nivel`): super vê tudo; admin só o próprio grupo, vê grupo e empresas sem alterar e cadastra os usuários do grupo; user só vê os Módulos, sem o menu.
- Módulos abrem em abas do próprio Master, com entrada automática (sem login): clicar num módulo já aberto só ativa a aba, Sair fecha todas, ↗ abre o módulo numa aba do navegador. O módulo abre no mesmo modo claro/escuro do Master; erro na entrada fecha a aba e mostra o aviso; Sair dentro do módulo fecha a aba dele.
- Cada app com ícone e cor próprios no logo, no card de Módulos e na aba; cards de Módulos menores, 5 por linha.
