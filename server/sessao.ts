import crypto from 'crypto';

/**
 * Sessão sem estado (padrão crmWeb): token "usuarioId.expiracao.credencial.assinatura", assinado com HMAC-SHA256.
 *
 * "credencial" = e-mail:senha cifrados com AES-256-GCM (chave derivada do SESSION_SECRET). Só existe porque os
 * sistemas de destino dos módulos recebem `user=base64(email:senha)`; o servidor a decifra para montar o link e
 * ela nunca chega legível ao navegador. Sai daqui quando os módulos aceitarem outro tipo de acesso.
 */
const SEGREDO = process.env.SESSION_SECRET || '';
if (SEGREDO.length < 32) throw new Error('SESSION_SECRET não definido no .env (mínimo de 32 caracteres).');

const VALIDADE_MS = 12 * 60 * 60 * 1000; // 12 horas
const CHAVE_CIFRA = crypto.createHash('sha256').update(`bmmaster-credencial:${SEGREDO}`).digest();

const assinar = (dados: string) => crypto.createHmac('sha256', SEGREDO).update(dados).digest('base64url');

function cifrar(texto: string): string {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', CHAVE_CIFRA, iv);
  const dados = Buffer.concat([c.update(texto, 'utf8'), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), dados]).toString('base64url');
}

function decifrar(cifrado: string): string {
  const b = Buffer.from(cifrado, 'base64url');
  const d = crypto.createDecipheriv('aes-256-gcm', CHAVE_CIFRA, b.subarray(0, 12));
  d.setAuthTag(b.subarray(12, 28));
  return Buffer.concat([d.update(b.subarray(28)), d.final()]).toString('utf8');
}

export function emitirToken(usuarioId: number, email: string, senha: string): string {
  const dados = `${usuarioId}.${Date.now() + VALIDADE_MS}.${cifrar(`${email}:${senha}`)}`;
  return `${dados}.${assinar(dados)}`;
}

/** Id do usuário e credencial do token, ou null se inválido/expirado */
export function lerToken(token: string): { usuarioId: number; credencial: string } | null {
  const [id, exp, cred, assinatura] = String(token || '').split('.');
  if (!id || !exp || !cred || !assinatura) return null;
  const esperada = assinar(`${id}.${exp}.${cred}`);
  if (esperada.length !== assinatura.length || !crypto.timingSafeEqual(Buffer.from(esperada), Buffer.from(assinatura))) return null;
  if (Number(exp) < Date.now()) return null;
  try {
    return { usuarioId: Number(id), credencial: decifrar(cred) };
  } catch {
    return null;
  }
}
