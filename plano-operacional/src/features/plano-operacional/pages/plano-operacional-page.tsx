import { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { BarChart, FileText, Package, Warehouse, Handshake } from 'lucide-react'
import { DashboardTab } from '../components/dashboard'
import { PlanoTab } from '../components/plano'
import { EstoqueTab } from '../components/estoque'
import { CCOTab } from '../components/cco'
import { ComodatoTab } from '../components/comodato'
import { usePlanoData, useDashboardMetrics } from '../hooks'

export function PlanoOperacionalPage() {
  const [activeTab, setActiveTab] = useState('dashboard')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const media = window.matchMedia('(max-width: 640px)')
    const handleChange = () => {
      if (media.matches && activeTab === 'dashboard') {
        setActiveTab('plano')
      }
    }
    handleChange()
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [activeTab])

  // Busca dados do plano (PDVs)
  const { data: planoData, isLoading: isLoadingPlano } = usePlanoData()

  // Calcula métricas do dashboard
  const metrics = useDashboardMetrics(planoData)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Plano Operacional</h1>
          <p className="text-muted-foreground">
            Gerencie PDVs, equipamentos e estoque do evento
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="hidden border-b px-4 pt-4 sm:block sm:px-6 sm:pt-6">
            <TabsList className="flex h-auto w-full gap-2 overflow-x-auto pb-2">
              <TabsTrigger value="dashboard" className="min-w-[120px] shrink-0 gap-2">
                <BarChart className="h-4 w-4" />
                <span className="text-xs font-medium sm:text-sm">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="plano" className="min-w-[120px] shrink-0 gap-2">
                <FileText className="h-4 w-4" />
                <span className="text-xs font-medium sm:text-sm">Plano</span>
              </TabsTrigger>
              <TabsTrigger value="estoque" className="min-w-[120px] shrink-0 gap-2">
                <Package className="h-4 w-4" />
                <span className="text-xs font-medium sm:text-sm">Estoque</span>
              </TabsTrigger>
              <TabsTrigger value="cco" className="min-w-[120px] shrink-0 gap-2">
                <Warehouse className="h-4 w-4" />
                <span className="text-xs font-medium sm:text-sm">CCO</span>
              </TabsTrigger>
              <TabsTrigger value="comodato" className="min-w-[120px] shrink-0 gap-2">
                <Handshake className="h-4 w-4" />
                <span className="text-xs font-medium sm:text-sm">Comodato</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-4 pb-6 sm:p-6">
            <div className="flex min-h-[calc(100vh-14rem)] flex-col gap-6">
              <div className="space-y-0">
                <TabsContent value="dashboard" className="mt-0">
                  <DashboardTab metrics={metrics} isLoading={isLoadingPlano} />
                </TabsContent>

                <TabsContent value="plano" className="mt-0">
                  <PlanoTab data={planoData} isLoading={isLoadingPlano} />
                </TabsContent>

                <TabsContent value="estoque" className="mt-0">
                  <EstoqueTab />
                </TabsContent>

                <TabsContent value="cco" className="mt-0">
                  <CCOTab />
                </TabsContent>

                <TabsContent value="comodato" className="mt-0">
                  <ComodatoTab />
                </TabsContent>
              </div>

              <div className="sticky bottom-4 z-30 flex justify-center sm:hidden">
                <TabsList className="grid h-auto w-[92%] max-w-sm grid-cols-4 gap-1 rounded-[26px] border border-border/60 bg-card/95 p-1.5 shadow-2xl">
                  <TabsTrigger
                    value="plano"
                    className="flex w-full min-w-0 flex-col items-center justify-center gap-1 rounded-[22px] px-1 py-2 text-[10px] font-semibold leading-none tracking-tight text-muted-foreground whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                  >
                <FileText className="h-4 w-4" />
                Plano
              </TabsTrigger>
              <TabsTrigger
                value="estoque"
                className="flex w-full min-w-0 flex-col items-center justify-center gap-1 rounded-[22px] px-1 py-2 text-[10px] font-semibold leading-none tracking-tight text-muted-foreground whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
              >
                <Package className="h-4 w-4" />
                Estoque
              </TabsTrigger>
              <TabsTrigger
                value="cco"
                className="flex w-full min-w-0 flex-col items-center justify-center gap-1 rounded-[22px] px-1 py-2 text-[10px] font-semibold leading-none tracking-tight text-muted-foreground whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
              >
                <Warehouse className="h-4 w-4" />
                CCO
              </TabsTrigger>
              <TabsTrigger
                value="comodato"
                className="flex w-full min-w-0 flex-col items-center justify-center gap-1 rounded-[22px] px-1 py-2 text-[10px] font-semibold leading-none tracking-tight text-muted-foreground whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
              >
                    <Handshake className="h-4 w-4" />
                    Comodato
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>
          </div>
        </Tabs>
      </Card>
    </div>
  )
}
