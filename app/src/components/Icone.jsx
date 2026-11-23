// Ícones em SVG inline (sem biblioteca), herdam a cor do texto.
const caminhos = {
  boi: 'M4 7c2 0 3.5-1.5 4-3 1 1.5 2.5 2 4 2s3-.5 4-2c.5 1.5 2 3 4 3-1 2-3 3-4.5 3v5c0 3.5-1.6 6-3.5 6s-3.5-2.5-3.5-6v-5C7 10 5 9 4 7z',
  seringa: 'M18 2l4 4M17 7l3-3M19 9l-8 8-4 1-3 3M5 15l4 4M14 6l4 4M10 10l2 2M8 12l2 2',
  sair: 'M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3',
  mais: 'M12 5v14M5 12h14',
  voltar: 'M15 18l-6-6 6-6',
  busca: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3',
  alerta: 'M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  editar: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
  lixo: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6',
  nuvem: 'M1 1l22 22M16.7 16.7A5 5 0 0 1 18 21H6a4 4 0 0 1-1.8-7.6M9 5.2A7 7 0 0 1 19.4 10H20a3 3 0 0 1 1.3 5.7',
  balanca: 'M12 3v18M6 21h12M5 7h14M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0z',
  relogio: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2',
  baixar: 'M12 3v12M7 10l5 5 5-5M5 21h14',
  atualizar: 'M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5',
  fechar: 'M18 6L6 18M6 6l12 12',
  enviar: 'M22 2L11 13M22 2l-7 20-4-9-9-4z'
}

export default function Icone({ nome, tamanho = 22, titulo }) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={titulo ? undefined : true}
      role={titulo ? 'img' : undefined}
    >
      {titulo && <title>{titulo}</title>}
      <path d={caminhos[nome]} />
    </svg>
  )
}
