/** Formatação só na tela: no banco, CEP e telefone ficam só com dígitos */

const digitos = (v: string | null | undefined) => String(v ?? '').replace(/\D/g, '');

export const limparDigitos = (v: string, max: number) => digitos(v).slice(0, max);

export const formatarCep = (v: string | null | undefined) => {
  const d = digitos(v).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
};

/** (00) 0000-0000 ou (00) 00000-0000, conforme a quantidade de dígitos */
export const formatarTelefone = (v: string | null | undefined) => {
  const d = digitos(v).slice(0, 11);
  if (d.length <= 2) return d;
  const resto = d.slice(2);
  const corte = resto.length > 8 ? 5 : 4;
  return `(${d.slice(0, 2)}) ${resto.length > corte ? `${resto.slice(0, corte)}-${resto.slice(corte)}` : resto}`;
};

/** "aaaa-mm-dd hh:mm" → "dd/mm/aaaa hh:mm" */
export const formatarDataHora = (v: string | null | undefined) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?: (\d{2}:\d{2}))?/.exec(v ?? '');
  return m ? `${m[3]}/${m[2]}/${m[1]}${m[4] ? ` ${m[4]}` : ''}` : '';
};

export const simNao = (v: number | boolean | null | undefined) => (v ? 'Sim' : 'Não');
