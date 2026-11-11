import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from './db.js';
import { emitirToken, lerToken } from './sessao.js';
import { cnpjValido, limparCnpj } from '../src/utils/cnpj.js';
import { TIPOS_ATUACAO, UFS } from '../src/utils/listas.js';

type Linha = RowDataPacket & Record<string, unknown>;

type Nivel = 'super' | 'admin' | 'user';
const NIVEIS: Nivel[] = ['super', 'admin', 'user'];

interface UsuarioSessao {
  id: number;
  nome: string;
  email: string;
  /** sys_usuarios.nivel */
  role: Nivel;
  perfil_id: number;
  grupo_id: number;
}

/** Erro com status HTTP: a mensagem vai para o usuário como { erro } */
class ErroApi extends Error {
  constructor(public status: number, mensagem: string) {
    super(mensagem);
  }
}

/** Envolve a rota: erro vira { erro } com o status certo (500 sem detalhe de banco para o usuário) */
const rota = (fn: (req: Request, res: Response) => Promise<unknown>) => async (req: Request, res: Response) => {
  try {
    const r = await fn(req, res);
    if (!res.headersSent) res.json(r ?? { ok: true });
  } catch (err) {
    if (err instanceof ErroApi) return res.status(err.status).json({ erro: err.message });
    const codigo = (err as { code?: string }).code;
    if (codigo === 'ER_DUP_ENTRY') return res.status(400).json({ erro: 'Já existe um registro com esse valor.' });
    if (codigo === 'ER_ROW_IS_REFERENCED_2') return res.status(400).json({ erro: 'O registro está em uso e não pode ser excluído.' });
    console.error(`${req.method} ${req.path}:`, err);
    res.status(500).json({ erro: 'Erro interno do servidor. Tente novamente.' });
  }
};

const texto = (v: unknown, rotulo: string, max: number, obrigatorio = false): string => {
  const t = String(v ?? '').trim();
  if (obrigatorio && !t) throw new ErroApi(400, `${rotulo} é obrigatório.`);
  if (t.length > max) throw new ErroApi(400, `${rotulo}: no máximo ${max} caracteres.`);
  return t;
};
/** Código de registro: aceita 0 (no ERP, a empresa 0 é a de demonstração) */
const id = (v: unknown, rotulo = 'Código'): number => {
  const n = Number(v);
  if (v === '' || v == null || !Number.isInteger(n) || n < 0) throw new ErroApi(400, `${rotulo} inválido.`);
  return n;
};
const flag = (v: unknown) => (v === true || v === 1 || v === '1' ? 1 : 0);
const opcional = (v: unknown, rotulo: string, max: number) => texto(v, rotulo, max) || null;
const digitos = (v: unknown, max: number) => String(v ?? '').replace(/\D/g, '').slice(0, max);

/**
 * sys_usuarios.nivel: super = todos os grupos e empresas; admin = os cadastros, só do próprio grupo;
 * user = só os módulos. Valor desconhecido vale como user.
 */
const usuarioErp = (u: Linha): UsuarioSessao => ({
  id: Number(u.id),
  nome: String(u.login),
  email: String(u.login),
  role: NIVEIS.includes(u.nivel as Nivel) ? (u.nivel as Nivel) : 'user',
  perfil_id: 0,
  grupo_id: Number(u.grupo_id),
});
const COLUNAS_SESSAO = 'id, login, nivel, grupo_id';

const ehBcrypt = (hash: string) => /^\$2[aby]\$/.test(hash);

/** Senha do ERP: bcrypt, ou legado em texto puro, md5, sha256 ou sha1 (hex) */
async function senhaConfere(digitada: string, gravada: string): Promise<boolean> {
  if (ehBcrypt(gravada)) return bcrypt.compare(digitada, gravada).catch(() => false);
  if (digitada === gravada) return true;
  return ['md5', 'sha256', 'sha1'].some((alg) => crypto.createHash(alg).update(digitada).digest('hex') === gravada.toLowerCase());
}

const usuarioAtual = (res: Response) => res.locals.usuario as UsuarioSessao;

/** Cadastros: só admin/super. O user só usa os módulos */
function exigirAdmin(res: Response) {
  const { role } = usuarioAtual(res);
  if (role !== 'admin' && role !== 'super') throw new ErroApi(403, 'Acesso restrito a administradores.');
}
function exigirSuper(res: Response) {
  if (usuarioAtual(res).role !== 'super') throw new ErroApi(403, 'Só o usuário super pode fazer isso.');
}

/** Filtro do grupo: o super vê tudo ('1=1'); o admin só o próprio grupo (coluna = grupo dele) */
function doGrupo(res: Response, coluna: string): { sql: string; params: number[] } {
  const eu = usuarioAtual(res);
  return eu.role === 'super' ? { sql: '1=1', params: [] } : { sql: `${coluna} = ?`, params: [eu.grupo_id] };
}

/** Grupo de um registro gravado pelo admin: só o dele */
function grupoPermitido(res: Response, grupoId: number) {
  const eu = usuarioAtual(res);
  if (eu.role !== 'super' && grupoId !== eu.grupo_id) throw new ErroApi(403, 'Você só pode cadastrar no seu grupo.');
  return grupoId;
}

/** Módulos do lançador: todos, para admin e operador (a diferença é que o operador só tem esta tela) */
// ponytail: sem filtro por usuário; filtrar pelo sys_usuarios.config quando o formato das permissões estiver definido
async function modulosDoUsuario(): Promise<Linha[]> {
  return (await pool.query<Linha[]>('SELECT id, empresa_id, pai_id, sigla, descricao, descricao_detalhada, url, obs FROM sys_modulos ORDER BY pai_id, id'))[0];
}

/** App Express com todas as rotas /api. Local: server.ts adiciona o Vite e o listen; Vercel: api/index.ts */
export function createApp() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // ==========================================================
  // Login igual ao do bm-estoque: usuário do ERP (sys_usuarios.login + senha_hash). Senha em branco no banco =
  // primeiro acesso; senhas legadas (texto, md5, sha) passam para bcrypt.
  // ==========================================================
  app.post(
    '/api/login',
    rota(async (req) => {
      const login = texto(req.body?.login, 'Usuário', 100, true);
      const senha = typeof req.body?.senha === 'string' ? req.body.senha : '';

      const [rows] = await pool.query<Linha[]>(`SELECT ${COLUNAS_SESSAO}, senha_hash FROM sys_usuarios WHERE ativo = 1 AND LOWER(TRIM(login)) = ? LIMIT 1`, [login.toLowerCase()]);
      const u = rows[0];
      if (!u) throw new ErroApi(401, `O usuário "${login}" não foi localizado ou está inativo.`);

      const gravada = String(u.senha_hash ?? '');
      if (!gravada.trim() || gravada.toUpperCase() === 'NULL') {
        if (senha.trim().length < 4) throw new ErroApi(401, 'Primeiro acesso: defina uma senha com pelo menos 4 caracteres.');
        await pool.query('UPDATE sys_usuarios SET senha_hash = ? WHERE id = ?', [await bcrypt.hash(senha, 10), u.id]);
      } else {
        if (!(await senhaConfere(senha, gravada))) throw new ErroApi(401, 'Usuário/senha inválido(s).');
        if (!ehBcrypt(gravada)) await pool.query('UPDATE sys_usuarios SET senha_hash = ? WHERE id = ?', [await bcrypt.hash(senha, 10), u.id]);
      }
      await pool.query('UPDATE sys_usuarios SET ultimo_acesso = NOW() WHERE id = ?', [u.id]).catch(() => undefined);

      return { token: emitirToken(Number(u.id), String(u.login), senha), usuario: usuarioErp(u) };
    }),
  );

  // ==========================================================
  // Daqui para baixo, toda rota /api exige um token válido. O usuário é relido a cada
  // requisição: desativado no ERP ou com o nível/grupo trocado, vale na hora.
  // ==========================================================
  app.use('/api', async (req: Request, res: Response, next: NextFunction) => {
    const sessao = lerToken(String(req.header('authorization') || '').replace(/^Bearer\s+/i, ''));
    if (!sessao) return res.status(401).json({ erro: 'Sessão expirada. Entre novamente.' });
    try {
      const [rows] = await pool.query<Linha[]>(`SELECT ${COLUNAS_SESSAO} FROM sys_usuarios WHERE id = ? AND ativo = 1 LIMIT 1`, [sessao.usuarioId]);
      if (!rows.length) return res.status(401).json({ erro: 'Seu usuário foi desativado. Fale com o administrador.' });
      res.locals.usuario = usuarioErp(rows[0]);
      res.locals.credencial = sessao.credencial;
      next();
    } catch (err) {
      console.error('Sessão:', err);
      res.status(503).json({ erro: 'Banco de dados indisponível. Tente novamente.' });
    }
  });

  app.get('/api/sessao', rota(async (_req, res) => ({ usuario: usuarioAtual(res) })));

  // ==========================================================
  // Módulos (todos os papéis)
  // ==========================================================
  app.get('/api/modulos', rota(modulosDoUsuario));

  /** Endereço do módulo com o acesso do usuário: montado aqui para a senha não ir ao navegador */
  app.get(
    '/api/modulos/:id/link',
    rota(async (req, res) => {
      const m = (await modulosDoUsuario()).find((x) => Number(x.id) === id(req.params.id));
      if (!m) throw new ErroApi(404, 'Módulo não encontrado ou não liberado para o seu perfil.');
      const url = String(m.url || '');
      if (!url) throw new ErroApi(400, `O módulo "${m.descricao}" não tem endereço cadastrado.`);
      const user = Buffer.from(String(res.locals.credencial)).toString('base64');
      // O módulo entra direto (sem login) no grupo e na empresa principal do usuário; em erro, volta para o Master
      // (volta = endereço do Master no navegador) com ?erro=<mensagem>
      const [[u]] = await pool.query<Linha[]>('SELECT grupo_id, empresa_id FROM sys_usuarios WHERE id = ?', [usuarioAtual(res).id]);
      const params = new URLSearchParams({ g: String(u.grupo_id), e: String(u.empresa_id), user });
      const volta = String(req.query.volta || '');
      if (/^https?:\/\/[^\s]+$/i.test(volta)) params.set('volta', volta);
      // Tema do Master (light/dark): o módulo abre no mesmo modo
      if (req.query.tema === 'light' || req.query.tema === 'dark') params.set('tema', req.query.tema);
      return { url: `${url}${url.includes('?') ? '&' : '?'}${params}` };
    }),
  );

  // ==========================================================
  // Preferências das listas e formulários (todos os usuários). sys_usuarios.config_listas é compartilhado com o
  // Romaneio e o bm-estoque: o Master usa só a chave "master_listas"
  // ==========================================================
  const CHAVE_LISTAS = 'master_listas';
  const configListas = async (usuarioId: number): Promise<Record<string, unknown>> => {
    const [[u]] = await pool.query<Linha[]>('SELECT config_listas FROM sys_usuarios WHERE id = ?', [usuarioId]);
    try {
      const obj = JSON.parse(String(u?.config_listas || '{}'));
      return obj && typeof obj === 'object' && !Array.isArray(obj) ? obj : {};
    } catch {
      return {};
    }
  };
  app.get('/api/config-listas', rota(async (_req, res) => (await configListas(usuarioAtual(res).id))[CHAVE_LISTAS] || {}));
  app.put(
    '/api/config-listas',
    rota(async (req, res) => {
      const corpo = req.body;
      if (!corpo || typeof corpo !== 'object' || Array.isArray(corpo)) throw new ErroApi(400, 'Configuração inválida.');
      const { id: usuarioId } = usuarioAtual(res);
      const json = JSON.stringify({ ...(await configListas(usuarioId)), [CHAVE_LISTAS]: corpo });
      if (json.length > 60_000) throw new ErroApi(413, 'Configuração muito grande.');
      await pool.query('UPDATE sys_usuarios SET config_listas = ? WHERE id = ?', [json, usuarioId]);
    }),
  );

  // ==========================================================
  // Cadastros: super (tudo) e admin (só o próprio grupo)
  // ==========================================================
  app.use('/api', (_req: Request, res: Response, next: NextFunction) => {
    try {
      exigirAdmin(res);
      next();
    } catch (err) {
      res.status((err as ErroApi).status).json({ erro: (err as ErroApi).message });
    }
  });

  app.get(
    '/api/indicadores',
    rota(async (_req, res) => {
      const f = doGrupo(res, 'grupo_id');
      const [[t]] = await pool.query<Linha[]>(
        `SELECT (SELECT COUNT(*) FROM sys_usuarios WHERE ativo = 1 AND ${f.sql}) AS usuarios, (SELECT COUNT(*) FROM sys_empresas WHERE ativo = 1 AND ${f.sql}) AS empresas`,
        [...f.params, ...f.params],
      );
      return { usuarios: Number(t.usuarios), empresas: Number(t.empresas) };
    }),
  );

  /**
   * POST e PUT de grupos, empresas e perfis: só o super grava (o admin só vê). As colunas vêm só de ler(), nunca
   * das chaves do corpo.
   */
  const gravacao = (rotaBase: string, tabela: string, ler: (b: Record<string, unknown>) => Record<string, unknown>) => {
    app.post(
      `/api/${rotaBase}`,
      rota(async (req, res) => {
        exigirSuper(res);
        const [r] = await pool.query<ResultSetHeader>(`INSERT INTO ${tabela} SET ?`, [ler(req.body || {})]);
        return { id: r.insertId };
      }),
    );
    app.put(
      `/api/${rotaBase}/:id`,
      rota(async (req, res) => {
        exigirSuper(res);
        const codigo = id(req.params.id);
        const [r] = await pool.query<ResultSetHeader>(`UPDATE ${tabela} SET ? WHERE id = ?`, [ler(req.body || {}), codigo]);
        if (!r.affectedRows) throw new ErroApi(404, 'Registro não encontrado.');
        return { id: codigo };
      }),
    );
  };
  /** Exclusão lógica (só o super): cadastros do ERP com movimentação não são apagados */
  const inativar = (rotaBase: string, tabela: string) =>
    app.delete(
      `/api/${rotaBase}/:id`,
      rota(async (req, res) => {
        exigirSuper(res);
        await pool.query(`UPDATE ${tabela} SET ativo = 0 WHERE id = ?`, [id(req.params.id)]);
      }),
    );

  // ---------- Grupos (admin: só vê o dele) ----------
  app.get(
    '/api/grupos',
    rota(async (_req, res) => {
      const f = doGrupo(res, 'g.id');
      return (await pool.query<Linha[]>(`SELECT g.id, g.nome, g.ativo, (SELECT COUNT(*) FROM sys_empresas e WHERE e.grupo_id = g.id) AS empresas FROM sys_grupos g WHERE ${f.sql} ORDER BY g.nome`, f.params))[0];
    }),
  );
  gravacao('grupos', 'sys_grupos', (b) => ({ nome: texto(b.nome, 'Nome do grupo', 100, true), ativo: flag(b.ativo) }));
  inativar('grupos', 'sys_grupos');

  // ---------- Empresas (admin: só vê as do grupo dele) ----------
  app.get(
    '/api/empresas',
    rota(async (_req, res) => {
      const f = doGrupo(res, 'e.grupo_id');
      return (
        await pool.query<Linha[]>(
          `SELECT e.id, e.grupo_id, g.nome AS grupo_nome, e.razao_social, e.nome_fantasia, e.cnpj, e.inscricao_estadual, e.inscricao_municipal,
                  e.tipo_atuacao, e.cep, e.logradouro, e.numero, e.complemento, e.bairro, e.cidade, e.uf, e.telefone, e.email, e.ativo
             FROM sys_empresas e LEFT JOIN sys_grupos g ON g.id = e.grupo_id WHERE ${f.sql} ORDER BY e.razao_social`,
          f.params,
        )
      )[0];
    }),
  );
  gravacao('empresas', 'sys_empresas', (b) => {
    const cnpj = limparCnpj(String(b.cnpj ?? ''));
    if (!cnpjValido(cnpj)) throw new ErroApi(400, 'CNPJ inválido: confira os dígitos.');
    const tipo = String(b.tipo_atuacao || '');
    if (!TIPOS_ATUACAO.includes(tipo)) throw new ErroApi(400, 'Informe o tipo de atuação.');
    const uf = String(b.uf || '').toUpperCase();
    if (uf && !UFS.includes(uf)) throw new ErroApi(400, 'UF inválida.');
    const cep = digitos(b.cep, 8);
    if (cep && cep.length !== 8) throw new ErroApi(400, 'O CEP tem 8 dígitos.');
    return {
      grupo_id: id(b.grupo_id, 'Grupo'),
      razao_social: texto(b.razao_social, 'Razão social', 150, true),
      nome_fantasia: opcional(b.nome_fantasia, 'Nome fantasia', 100),
      cnpj,
      inscricao_estadual: opcional(b.inscricao_estadual, 'Inscrição estadual', 20),
      inscricao_municipal: opcional(b.inscricao_municipal, 'Inscrição municipal', 20),
      tipo_atuacao: tipo,
      cep: cep || null,
      logradouro: opcional(b.logradouro, 'Logradouro', 150),
      numero: opcional(b.numero, 'Número', 10),
      complemento: opcional(b.complemento, 'Complemento', 60),
      bairro: opcional(b.bairro, 'Bairro', 80),
      cidade: opcional(b.cidade, 'Cidade', 80),
      uf: uf || null,
      telefone: digitos(b.telefone, 20) || null,
      email: opcional(b.email, 'E-mail', 120),
      ativo: flag(b.ativo),
    };
  });
  inativar('empresas', 'sys_empresas');

  // ---------- Perfis (sem grupo: valem para todos; o admin só lê, para escolher no usuário) ----------
  app.get(
    '/api/perfis',
    rota(async () => (await pool.query<Linha[]>('SELECT p.id, p.nome, p.descricao, (SELECT COUNT(*) FROM sys_usuarios u WHERE u.perfil_id = p.id) AS usuarios FROM sys_perfis p ORDER BY p.nome'))[0]),
  );
  gravacao('perfis', 'sys_perfis', (b) => ({ nome: texto(b.nome, 'Nome do perfil', 60, true), descricao: opcional(b.descricao, 'Descrição', 255) }));
  // Sem coluna ativo: apaga de verdade; em uso por usuário, a chave estrangeira recusa
  app.delete(
    '/api/perfis/:id',
    rota(async (req, res) => {
      exigirSuper(res);
      await pool.query('DELETE FROM sys_perfis WHERE id = ?', [id(req.params.id)]);
    }),
  );

  // ---------- Usuários (admin: só os do grupo dele, sem mexer em super) ----------
  /** Usuários que o logado vê e altera: o super, todos; o admin, os do grupo dele que não são super */
  const usuariosAlteraveis = (res: Response, prefixo = '') => {
    const f = doGrupo(res, `${prefixo}grupo_id`);
    return usuarioAtual(res).role === 'super' ? f : { sql: `${f.sql} AND ${prefixo}nivel <> 'super'`, params: f.params };
  };

  app.get(
    '/api/usuarios',
    rota(async (_req, res) => {
      const f = usuariosAlteraveis(res, 'u.');
      const [rows] = await pool.query<Linha[]>(
        `SELECT u.id, u.login, u.grupo_id, g.nome AS grupo_nome, u.empresa_id, COALESCE(NULLIF(e.nome_fantasia, ''), e.razao_social) AS empresa_nome,
                u.perfil_id, p.nome AS perfil_nome, u.nivel, u.ativo, DATE_FORMAT(u.ultimo_acesso, '%Y-%m-%d %H:%i') AS ultimo_acesso,
                (SELECT GROUP_CONCAT(ue.empresa_id) FROM sys_usuarios_empresas ue WHERE ue.usuario_id = u.id) AS empresas
           FROM sys_usuarios u LEFT JOIN sys_grupos g ON g.id = u.grupo_id LEFT JOIN sys_empresas e ON e.id = u.empresa_id
           LEFT JOIN sys_perfis p ON p.id = u.perfil_id
          WHERE ${f.sql}
          ORDER BY u.login`,
        f.params,
      );
      return rows.map((u) => ({ ...u, empresas: u.empresas ? String(u.empresas).split(',').map(Number) : [] }));
    }),
  );

  /**
   * Grava o usuário e as empresas liberadas (sys_usuarios_empresas) numa transação. A empresa principal e as
   * liberadas precisam ser do grupo do usuário (sys_usuarios.grupo_id).
   */
  const gravarUsuario = async (codigo: number | null, b: Record<string, unknown>, res: Response) => {
    const eu = usuarioAtual(res);
    const nivel = String(b.nivel ?? '') as Nivel;
    if (!NIVEIS.includes(nivel)) throw new ErroApi(400, 'Informe o nível do usuário.');
    if (nivel === 'super' && eu.role !== 'super') throw new ErroApi(403, 'Só o usuário super pode criar outro super.');
    const dados: Record<string, unknown> = {
      login: texto(b.login, 'Login', 60, true),
      grupo_id: grupoPermitido(res, id(b.grupo_id, 'Grupo')),
      empresa_id: id(b.empresa_id, 'Empresa principal'),
      perfil_id: b.perfil_id == null || b.perfil_id === '' ? null : id(b.perfil_id, 'Perfil'),
      nivel,
      ativo: flag(b.ativo),
    };
    if (codigo === eu.id && (nivel !== eu.role || !dados.ativo)) throw new ErroApi(400, 'Você não pode mudar o seu próprio nível nem se inativar.');
    const senha = typeof b.senha === 'string' ? b.senha : '';
    if (senha && senha.trim().length < 4) throw new ErroApi(400, 'A senha precisa ter pelo menos 4 caracteres.');
    // Senha em branco: na inclusão, é definida no primeiro acesso; na edição, não altera
    if (senha) dados.senha_hash = await bcrypt.hash(senha, 10);
    else if (codigo === null) dados.senha_hash = '';
    const empresas = [...new Set((Array.isArray(b.empresas) ? b.empresas : []).map((e) => id(e, 'Empresa')))];
    const usadas = [...new Set([dados.empresa_id as number, ...empresas])];

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [doGrupo] = await conn.query<Linha[]>('SELECT id FROM sys_empresas WHERE grupo_id = ? AND id IN (?)', [dados.grupo_id, usadas]);
      if (doGrupo.length !== usadas.length) throw new ErroApi(400, 'A empresa principal e as empresas liberadas precisam ser do grupo do usuário.');
      if (codigo !== null) {
        const f = usuariosAlteraveis(res);
        const [r] = await conn.query<ResultSetHeader>(`UPDATE sys_usuarios SET ? WHERE id = ? AND ${f.sql}`, [dados, codigo, ...f.params]);
        if (!r.affectedRows) throw new ErroApi(404, 'Usuário não encontrado.');
      } else {
        codigo = (await conn.query<ResultSetHeader>('INSERT INTO sys_usuarios SET ?', [dados]))[0].insertId;
      }
      await conn.query('DELETE FROM sys_usuarios_empresas WHERE usuario_id = ?', [codigo]);
      if (empresas.length) await conn.query('INSERT INTO sys_usuarios_empresas (usuario_id, empresa_id) VALUES ?', [empresas.map((e) => [codigo, e])]);
      await conn.commit();
      return { id: codigo };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  };
  app.post('/api/usuarios', rota(async (req, res) => gravarUsuario(null, req.body || {}, res)));
  app.put('/api/usuarios/:id', rota(async (req, res) => gravarUsuario(id(req.params.id), req.body || {}, res)));
  app.delete(
    '/api/usuarios/:id',
    rota(async (req, res) => {
      const codigo = id(req.params.id);
      if (codigo === usuarioAtual(res).id) throw new ErroApi(400, 'Você não pode inativar o seu próprio usuário.');
      const f = usuariosAlteraveis(res);
      const [r] = await pool.query<ResultSetHeader>(`UPDATE sys_usuarios SET ativo = 0 WHERE id = ? AND ${f.sql}`, [codigo, ...f.params]);
      if (!r.affectedRows) throw new ErroApi(404, 'Usuário não encontrado.');
    }),
  );

  // Rota inexistente: JSON, não o index.html do Vite
  app.use('/api', (_req: Request, res: Response) => res.status(404).json({ erro: 'Rota não encontrada.' }));

  return app;
}
