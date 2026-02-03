import { useMemo } from 'react'
import type { PDV, DashboardMetrics } from '../types'
import { useEstoque } from './use-estoque'

export function useDashboardMetrics(pdvs: PDV[]): DashboardMetrics {
  const { totalTerminais, totalInsumos, terminaisDisponiveis, insumosDisponiveis, alertasBaixoEstoque } = useEstoque()

  return useMemo(() => {
    const pdvsNormais = pdvs.filter(pdv => pdv['Ponto de Venda'].toLowerCase() !== 'estoque')

    const totalPDVs = pdvsNormais.length
    const pdvsAtivos = pdvsNormais.filter(pdv => !pdv.desativado).length
    const pdvsInativos = pdvsNormais.filter(pdv => pdv.desativado).length

    const pdvsPendentes = pdvsNormais.filter(pdv => pdv.Status === 'Pendente').length
    const pdvsEntregues = pdvsNormais.filter(pdv => pdv.Status === 'Entregue').length
    const pdvsDevolvidos = pdvsNormais.filter(pdv => pdv.Status === 'Devolvido').length

    const terminaisAlocados = pdvsNormais.reduce((acc, pdv) => acc + pdv.totalTerminais, 0)

    const insumosAlocados = pdvsNormais.reduce(
      (acc, pdv) =>
        acc + pdv.carregadores + pdv.capas + pdv.cartoes + pdv.powerbanks + pdv.tomadas,
      0
    )

    const taxaOcupacao = totalTerminais > 0 ? (terminaisAlocados / totalTerminais) * 100 : 0

    return {
      totalPDVs,
      pdvsAtivos,
      pdvsInativos,
      pdvsPendentes,
      pdvsEntregues,
      pdvsDevolvidos,
      totalTerminais,
      terminaisAlocados,
      terminaisDisponiveis,
      totalInsumos,
      insumosAlocados,
      insumosDisponiveis,
      taxaOcupacao,
      alertasBaixoEstoque,
    }
  }, [pdvs, totalTerminais, totalInsumos, terminaisDisponiveis, insumosDisponiveis, alertasBaixoEstoque])
}
