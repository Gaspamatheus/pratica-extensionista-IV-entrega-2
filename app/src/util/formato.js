// Formatação no padrão brasileiro. As datas da API vêm como "AAAA-MM-DD".

export function dataBR(iso) {
  if (!iso) return '—'
  const [a, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${a}`
}

export function hojeISO() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function kg(valor, casas = 1) {
  if (valor === null || valor === undefined) return '—'
  return Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas }) + ' kg'
}

export function gmd(valor) {
  if (valor === null || valor === undefined) return '—'
  return Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + ' kg/dia'
}

export const ROTULO_STATUS = { ATIVO: 'Ativo', VENDIDO: 'Vendido', MORTO: 'Morto' }
export const ROTULO_SEXO = { MACHO: 'Macho', FEMEA: 'Fêmea' }
export const ROTULO_TIPO = {
  VACINA: 'Vacina',
  VERMIFUGO: 'Vermífugo',
  MEDICAMENTO: 'Medicamento',
  OUTRO: 'Outro'
}

/** Dias que faltam até a data (0 = hoje). */
export function diasAte(iso, hoje = hojeISO()) {
  const fim = Date.UTC(...partes(iso))
  const ini = Date.UTC(...partes(hoje))
  return Math.round((fim - ini) / 86400000)
}

function partes(iso) {
  const [a, m, d] = iso.split('-').map(Number)
  return [a, m - 1, d]
}

/** Data e hora de um instante (ms), ex.: "23/11/2026 14:05". */
export function dataHora(ms) {
  const d = new Date(ms)
  const p = (n) => String(n).padStart(2, '0')
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`
}
