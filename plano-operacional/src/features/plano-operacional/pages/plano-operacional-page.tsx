import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart, FileText, Package, RefreshCw, Warehouse, Handshake } from 'lucide-react'
import { DashboardTab } from '../components/dashboard'
import { PlanoTab } from '../components/plano'
import { EstoqueTab } from '../components/estoque'
import { CCOTab } from '../components/cco'
import { ComodatoTab } from '../components/comodato'
import { usePlanoData, useDashboardMetrics } from '../hooks'

export function PlanoOperacionalPage() {
  const [activeTab, setActiveTab] = useState('dashboard')

  // Busca dados do plano (PDVs)
  const { data: planoData, isLoading: isLoadingPlano, refetch: refetchPlano } = usePlanoData()

  // Calcula métricas do dashboard
  const metrics = useDashboardMetrics(planoData)

  const handleRefresh = async () => {
    await refetchPlano()
  }

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
        <Button onClick={handleRefresh} variant="outline" className="w-fit">
          <RefreshCw className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* Tabs */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b px-6 pt-6">
            <TabsList className="grid w-full max-w-4xl grid-cols-3 lg:grid-cols-5">
              <TabsTrigger value="dashboard" className="gap-2">
                <BarChart className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="plano" className="gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Plano</span>
              </TabsTrigger>
              <TabsTrigger value="estoque" className="gap-2">
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">Estoque</span>
              </TabsTrigger>
              <TabsTrigger value="cco" className="gap-2">
                <Warehouse className="h-4 w-4" />
                <span className="hidden sm:inline">CCO</span>
              </TabsTrigger>
              <TabsTrigger value="comodato" className="gap-2">
                <Handshake className="h-4 w-4" />
                <span className="hidden sm:inline">Comodato</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
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
        </Tabs>
      </Card>
    </div>
  )
}
