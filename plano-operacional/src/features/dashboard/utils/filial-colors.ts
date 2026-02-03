const FILIAL_COLORS = [
  '#0050C3',
  '#0066F5',
  '#52c41a',
  '#faad14',
  '#f5222d',
  '#722ed1',
  '#eb2f96',
  '#2F4F4F',
]

export const getFilialColor = (label: string) => {
  if (!label) return FILIAL_COLORS[0]
  let hash = 0
  for (let i = 0; i < label.length; i += 1) {
    hash = (hash * 31 + label.charCodeAt(i)) % FILIAL_COLORS.length
  }
  return FILIAL_COLORS[hash]
}
