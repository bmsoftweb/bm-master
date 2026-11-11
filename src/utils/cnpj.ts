/**
 * CNPJ: gravado sem pontuação, formatado só na tela. Aceita o CNPJ alfanumérico (IN RFB 2.229/2024):
 * as 12 primeiras posições podem ter letras; cada caractere vale (código ASCII - 48) no cálculo do DV.
 */

export const limparCnpj = (v: string) => v.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 14);

export function formatarCnpj(v: string): string {
  const c = limparCnpj(v);
  return [c.slice(0, 2), c.slice(2, 5), c.slice(5, 8)].filter(Boolean).join('.') + (c.length > 8 ? `/${c.slice(8, 12)}` : '') + (c.length > 12 ? `-${c.slice(12)}` : '');
}

function dv(base: string): number {
  let peso = base.length - 7; // 5 para 12 posições, 6 para 13
  let soma = 0;
  for (const ch of base) {
    soma += (ch.charCodeAt(0) - 48) * peso;
    peso = peso === 2 ? 9 : peso - 1;
  }
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

export function cnpjValido(v: string): boolean {
  const c = limparCnpj(v);
  if (!/^[0-9A-Z]{12}[0-9]{2}$/.test(c) || /^(.)\1{13}$/.test(c)) return false;
  return dv(c.slice(0, 12)) === Number(c[12]) && dv(c.slice(0, 13)) === Number(c[13]);
}
