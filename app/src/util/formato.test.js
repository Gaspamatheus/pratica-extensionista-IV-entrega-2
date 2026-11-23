import { describe, expect, it } from 'vitest'
import { dataBR, diasAte, gmd, kg } from './formato'

describe('formatação', () => {
  it('converte data ISO para o padrão brasileiro', () => {
    expect(dataBR('2026-12-17')).toBe('17/12/2026')
    expect(dataBR(null)).toBe('—')
  })

  it('formata peso e GMD com vírgula', () => {
    expect(kg(382.5)).toBe('382,5 kg')
    expect(gmd(0.6129)).toBe('0,613 kg/dia')
    expect(kg(null)).toBe('—')
  })

  it('conta os dias até o fim da carência', () => {
    expect(diasAte('2026-12-17', '2026-11-23')).toBe(24)
    expect(diasAte('2026-11-23', '2026-11-23')).toBe(0)
  })
})
