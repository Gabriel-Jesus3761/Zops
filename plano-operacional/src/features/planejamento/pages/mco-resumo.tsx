import { useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { format, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Download,
  Calendar,
  DollarSign,
  Users,
  UtensilsCrossed,
  BedDouble,
  Car,
  Plane,
  Coffee,
  Truck,
  type LucideIcon
} from 'lucide-react'
import { mcoService } from '@/features/planejamento/services/mco.service'
import { cn } from '@/lib/utils'

// Interface para item detalhado de custo
interface ItemCusto {
  nome: string
  quantidade: number
  valorUnitario: number
  valorTotal: number
  unidade?: string
}

// Interface para categoria de custo
interface CategoriaCusto {
  key: string
  label: string
  valor: number
  icon: LucideIcon
  cor: string
  itens: ItemCusto[]
  cortesia?: boolean
}

export default function MCOResumoPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const contentRef = useRef<HTMLDivElement>(null)

  const { data: mco, isLoading } = useQuery({
    queryKey: ['mco-resumo', id],
    queryFn: async () => {
      if (!id) throw new Error('ID não fornecido')
      return await mcoService.buscarMCO(id)
    },
    enabled: !!id,
  })

  const handlePrint = () => {
    window.print()
  }

  const formatCurrency = (value: number | undefined | null) => {
    if (value === undefined || value === null) return 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ptBR })
    } catch {
      return dateStr
    }
  }

  const calcularPercentual = (valor: number | undefined, total: number | undefined) => {
    if (!valor || !total || total === 0) return '0'
    return ((valor / total) * 100).toFixed(1).replace('.', ',')
  }

  const calcularTotalDias = () => {
    if (!mco?.data_inicial || !mco?.data_final) return 1
    return differenceInDays(new Date(mco.data_final), new Date(mco.data_inicial)) + 1
  }

  const getTipoAtendimentoLabel = (tipo?: string) => {
    switch (tipo) {
      case 'atendimento_matriz':
        return 'ATENDIMENTO MATRIZ'
      case 'filial':
        return 'FILIAL'
      case 'filial_interior':
        return 'FILIAL INTERIOR'
      default:
        return 'ATENDIMENTO MATRIZ'
    }
  }

  const getTipoAtendimentoBadgeColor = (tipo?: string) => {
    switch (tipo) {
      case 'atendimento_matriz':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700'
      case 'filial':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700'
      case 'filial_interior':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-700'
      default:
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700'
    }
  }

  // Construir categorias de custo (simulação simplificada)
  const buildCategorias = (): CategoriaCusto[] => {
    if (!mco) return []

    const custoTotal = mco.custo_operacional_efetivo || 0
    const periodoTotal = calcularTotalDias()

    // Distribuição estimada dos custos (valores fictícios para demonstração)
    const maoDeObra = custoTotal * 0.50
    const alimentacao = custoTotal * 0.15
    const hospedagem = custoTotal * 0.15
    const viagem = custoTotal * 0.08
    const transporte = custoTotal * 0.07
    const dayOff = custoTotal * 0.03
    const frete = custoTotal * 0.02

    return [
      {
        key: 'mao_de_obra',
        label: 'Mão de Obra',
        valor: maoDeObra,
        icon: Users,
        cor: 'text-blue-600',
        itens: maoDeObra > 0 ? [{
          nome: 'Equipe técnica e operacional',
          quantidade: 8,
          valorUnitario: maoDeObra / 8,
          valorTotal: maoDeObra,
          unidade: 'pessoa'
        }] : []
      },
      {
        key: 'alimentacao',
        label: 'Alimentação',
        valor: alimentacao,
        icon: UtensilsCrossed,
        cor: 'text-orange-600',
        itens: alimentacao > 0 ? [{
          nome: 'Alimentação da equipe durante o evento',
          quantidade: 8,
          valorUnitario: alimentacao / 8,
          valorTotal: alimentacao,
          unidade: 'pessoa'
        }] : []
      },
      {
        key: 'hospedagem',
        label: 'Hospedagem',
        valor: hospedagem,
        icon: BedDouble,
        cor: 'text-purple-600',
        itens: hospedagem > 0 ? [{
          nome: `Hospedagem da equipe em ${mco.cidade}/${mco.uf}`,
          quantidade: periodoTotal,
          valorUnitario: hospedagem / periodoTotal,
          valorTotal: hospedagem,
          unidade: 'diária'
        }] : []
      },
      {
        key: 'viagem',
        label: 'Viagem',
        valor: viagem,
        icon: Plane,
        cor: 'text-sky-600',
        itens: viagem > 0 ? [{
          nome: `Viagem da equipe até ${mco.cidade}/${mco.uf}`,
          quantidade: 1,
          valorUnitario: viagem,
          valorTotal: viagem,
          unidade: 'lote'
        }] : []
      },
      {
        key: 'transporte',
        label: 'Transporte',
        valor: transporte,
        icon: Car,
        cor: 'text-green-600',
        itens: transporte > 0 ? [{
          nome: 'Transporte local durante o evento',
          quantidade: periodoTotal,
          valorUnitario: transporte / periodoTotal,
          valorTotal: transporte,
          unidade: 'dia'
        }] : []
      },
      {
        key: 'day_off',
        label: 'Day Off',
        valor: dayOff,
        icon: Coffee,
        cor: 'text-amber-600',
        itens: dayOff > 0 ? [{
          nome: 'Folga Remunerada',
          quantidade: 1,
          valorUnitario: dayOff,
          valorTotal: dayOff,
          unidade: 'lote'
        }] : []
      },
      {
        key: 'frete',
        label: 'Frete',
        valor: frete,
        icon: Truck,
        cor: 'text-gray-600',
        itens: frete > 0 ? [{
          nome: `Frete de equipamentos para ${mco.cidade}/${mco.uf}`,
          quantidade: 1,
          valorUnitario: frete,
          valorTotal: frete,
          unidade: 'serviço'
        }] : []
      },
    ].filter(c => c.valor > 0)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!mco) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-muted-foreground">MCO não encontrada</p>
        <Button onClick={() => navigate('/planejamento/mcos')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>
    )
  }

  const custoTotal = mco.custo_operacional_efetivo || 0
  const totalDias = calcularTotalDias()
  const categorias = buildCategorias()

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/planejamento/mcos')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Resumo da MCO</h1>
            <p className="text-lg font-medium text-muted-foreground">{mco.nome_evento}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handlePrint()} className="gap-2">
            <Download className="h-4 w-4" />
            Baixar PDF
          </Button>
        </div>
      </div>

      {/* Conteúdo para impressão - otimizado para A4 */}
      <div ref={contentRef} className="bg-white p-4 print:p-6 print:w-[210mm] print:min-h-[297mm] print:mx-auto space-y-3 print:space-y-2">
        {/* Cabeçalho com informações */}
        <div className="flex justify-between items-center pb-3 border-b print:pb-2">
          <div className="text-left">
            <h2 className="text-xl font-bold text-primary print:text-lg">MATRIZ DE CUSTO OPERACIONAL</h2>
            <p className="text-sm text-muted-foreground">Resumo Detalhado</p>
          </div>
          <div className="text-right">
            {mco.codigo && (
              <div className="mb-2">
                <p className="text-lg font-bold text-primary print:text-base">
                  {mco.codigo}
                  <span className="text-muted-foreground font-normal ml-2">Rev. 0</span>
                </p>
              </div>
            )}
            <p className="text-xs text-muted-foreground print:text-[10px]">Documento gerado em:</p>
            <p className="text-sm font-medium print:text-xs">
              {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        </div>

        {/* Banner azul com nome do evento e custo total */}
        <div className="rounded-lg p-4 print:p-3 print:rounded-md" style={{ backgroundColor: '#3C83F6' }}>
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold print:text-xl text-white uppercase">{mco.nome_evento}</h2>
            <div className="text-right text-white">
              <div className="text-2xl font-bold print:text-xl">{formatCurrency(custoTotal)}</div>
              <div className="text-sm font-semibold opacity-90 print:text-xs">
                COT: {mco.cot?.toFixed(2).replace('.', ',')}%
              </div>
            </div>
          </div>
        </div>

        {/* Card Dados do Evento - Linha inteira */}
        <Card className="w-full bg-white dark:bg-card print:shadow-none print:border">
          <CardHeader className="pb-2 print:pb-1 print:p-3">
            <CardTitle className="text-xs text-muted-foreground uppercase flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Dados do Evento
            </CardTitle>
          </CardHeader>
          <CardContent className="print:p-3 print:pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2 text-xs print:text-[9px] print:grid-cols-4">
              {/* Coluna 1 - Cliente e Período */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cliente:</span>
                  <span className="font-medium text-right truncate ml-2">{mco.cliente_nome || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Período:</span>
                  <span className="font-medium">{formatDate(mco.data_inicial)} a {formatDate(mco.data_final)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duração:</span>
                  <span className="font-medium">{totalDias} dias ({mco.num_sessoes || '-'} sessões)</span>
                </div>
              </div>

              {/* Coluna 2 - Local */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cidade:</span>
                  <span className="font-medium">{mco.cidade}/{mco.uf}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Responsável:</span>
                  <span className="font-medium">{mco.responsavel_nome || '-'}</span>
                </div>
              </div>

              {/* Coluna 3 - Financeiro */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Faturamento:</span>
                  <span className="font-medium">{formatCurrency(parseFloat(mco.faturamento_estimado || '0'))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Porte:</span>
                  <span className="font-medium">{mco.porte || 'N/D'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Público:</span>
                  <span className="font-medium">{mco.publico_estimado ? parseInt(mco.publico_estimado).toLocaleString('pt-BR') : '-'}</span>
                </div>
              </div>

              {/* Coluna 4 - Tipo de Atendimento em Destaque */}
              <div className="flex flex-col items-center justify-center">
                <span className="text-[9px] text-muted-foreground mb-1 print:text-[8px]">Tipo de Atendimento</span>
                <Badge
                  variant="outline"
                  className={cn('text-sm px-3 py-1.5 font-bold uppercase', getTipoAtendimentoBadgeColor(mco.tipo_atendimento))}
                >
                  {getTipoAtendimentoLabel(mco.tipo_atendimento)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detalhamento de Custos com Tabela */}
        <Card className="bg-white dark:bg-card print:shadow-none print:border overflow-hidden">
          <CardHeader className="pb-2 print:pb-1 print:p-2 bg-muted/30">
            <CardTitle className="text-xs text-muted-foreground uppercase flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              Detalhamento dos Custos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {categorias.map((categoria) => {
                const temItens = categoria.itens.length > 0
                const IconComponent = categoria.icon

                return (
                  <div key={categoria.key}>
                    {/* Cabeçalho da categoria */}
                    <div className="w-full flex items-center justify-between px-3 py-2 bg-primary/5 print:py-1.5">
                      <div className="flex items-center gap-2">
                        <IconComponent className={cn('h-4 w-4 print:h-3 print:w-3', categoria.cor)} />
                        <div className="text-left">
                          <span className="text-sm font-medium print:text-xs">{categoria.label}</span>
                          {temItens && (
                            <span className="text-[10px] text-muted-foreground ml-2 print:text-[8px]">
                              {categoria.itens.length} {categoria.itens.length === 1 ? 'item' : 'itens'}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <span className="font-semibold text-sm print:text-xs">{formatCurrency(categoria.valor)}</span>
                          <span className="text-[10px] text-muted-foreground ml-1 print:text-[8px]">
                            ({calcularPercentual(categoria.valor, custoTotal)}%)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Itens - Sempre visíveis */}
                    {temItens && (
                      <div className="bg-muted/20 border-t px-3 py-2">
                        <table className="w-full text-xs print:text-[9px]">
                          <thead>
                            <tr className="text-muted-foreground">
                              <th className="text-left font-medium py-1">Item</th>
                              <th className="text-center font-medium py-1 w-16">Qtd</th>
                              <th className="text-right font-medium py-1 w-24">V. Unit.</th>
                              <th className="text-right font-medium py-1 w-24">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {categoria.itens.map((item, idx) => (
                              <tr key={idx} className="border-t border-muted/30">
                                <td className="py-1">{item.nome}</td>
                                <td className="py-1 text-center">
                                  {item.quantidade}
                                  {item.unidade && (
                                    <span className="text-[9px] text-muted-foreground ml-0.5">{item.unidade}</span>
                                  )}
                                </td>
                                <td className="py-1 text-right">{formatCurrency(item.valorUnitario)}</td>
                                <td className="py-1 text-right font-medium">{formatCurrency(item.valorTotal)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Total */}
            <div className="flex justify-between items-center p-3 bg-primary/5 border-t-2 border-primary/20 print:p-2">
              <span className="font-bold text-sm print:text-xs">
                CUSTO OPERACIONAL TOTAL
              </span>
              <span className="text-xl font-bold text-primary print:text-lg">
                {formatCurrency(custoTotal)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estilos de impressão */}
      <style>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
