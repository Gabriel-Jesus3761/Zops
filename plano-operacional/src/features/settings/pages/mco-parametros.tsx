import { useLocation, useNavigate } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ManageClusters,
  ManageFiliais,
  ManageCargos,
  ManageModalidades,
  ManageJornadas,
  ManageDimensionamento,
} from '../components/mco-parametros'

const MCO_TABS = [
  { value: 'clusters', label: 'Clusters', path: 'clusters' },
  { value: 'filiais', label: 'Filiais', path: 'filiais' },
  { value: 'cargos', label: 'Cargos', path: 'cargos' },
  { value: 'modalidades', label: 'Modalidades', path: 'modalidades' },
  { value: 'jornadas', label: 'Jornadas', path: 'jornadas' },
  { value: 'dimensionamento', label: 'Dimensionamento', path: 'dimensionamento' },
] as const

type MCOTabValue = (typeof MCO_TABS)[number]['value']

export function MCOParametrosPage() {
  const location = useLocation()
  const navigate = useNavigate()

  // Detectar tab ativa baseada na URL
  const getActiveTab = (): MCOTabValue => {
    const path = location.pathname
    for (const tab of MCO_TABS) {
      if (path.includes(`/mco-parametros/${tab.path}`)) {
        return tab.value
      }
    }
    return 'clusters' // default
  }

  const handleTabChange = (value: string) => {
    navigate(`/configuracoes/mco-parametros/${value}`)
  }

  const activeTab = getActiveTab()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Parâmetros MCO</h2>
        <p className="text-muted-foreground">
          Configure os parâmetros utilizados nos cálculos da Matriz de Custo Operacional
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          {MCO_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="clusters" className="mt-6">
          <ManageClusters />
        </TabsContent>

        <TabsContent value="filiais" className="mt-6">
          <ManageFiliais />
        </TabsContent>

        <TabsContent value="cargos" className="mt-6">
          <ManageCargos />
        </TabsContent>

        <TabsContent value="modalidades" className="mt-6">
          <ManageModalidades />
        </TabsContent>

        <TabsContent value="jornadas" className="mt-6">
          <ManageJornadas />
        </TabsContent>

        <TabsContent value="dimensionamento" className="mt-6">
          <ManageDimensionamento />
        </TabsContent>

      </Tabs>
    </div>
  )
}
