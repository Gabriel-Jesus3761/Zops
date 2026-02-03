import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Package, PackageX, Boxes, Barcode, Scan, Link2 } from 'lucide-react'

export function CadastroHome() {
  const navigate = useNavigate()

  const cadastroOptions = [
    {
      title: 'Ativos Serializados/Patrimônio',
      description: 'Cadastre ativos com número de série individual (SKU, Tipo, Modelo, Adquirência)',
      icon: Package,
      path: '/logistica/cadastro/ativo-serializado',
      color: 'text-blue-600 dark:text-blue-400',
      buttonText: 'Cadastrar',
    },
    {
      title: 'Ativos Não Serializados',
      description: 'Cadastre ativos sem número de série individual (SKU, Tipo, Modelo)',
      icon: PackageX,
      path: '/logistica/cadastro/ativo-nao-serializado',
      color: 'text-green-600 dark:text-green-400',
      buttonText: 'Cadastrar',
    },
    {
      title: 'Insumos',
      description: 'Cadastre insumos e materiais de consumo (SKU, Tipo, Modelo)',
      icon: Boxes,
      path: '/logistica/cadastro/insumo',
      color: 'text-orange-600 dark:text-orange-400',
      buttonText: 'Cadastrar',
    },
    {
      title: 'Padrões de SKU',
      description: 'Configure padrões para geração automática de códigos SKU',
      icon: Barcode,
      path: '/logistica/cadastro/sku-patterns',
      color: 'text-purple-600 dark:text-purple-400',
      buttonText: 'Configurar',
    },
    {
      title: 'Padrões de Serial',
      description: 'Configure prefixos para identificação automática de equipamentos por número de série',
      icon: Scan,
      path: '/logistica/cadastro/serial-patterns',
      color: 'text-amber-600 dark:text-amber-400',
      buttonText: 'Configurar',
    },
    {
      title: 'Vinculações SKU-Equipamento',
      description: 'Visualize e gerencie os SKUs vinculados a cada tipo de equipamento',
      icon: Link2,
      path: '/logistica/cadastro/sku-bindings',
      color: 'text-cyan-600 dark:text-cyan-400',
      buttonText: 'Gerenciar',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Cadastro</h1>
        <p className="mt-2 text-muted-foreground">
          Selecione o tipo de item que deseja cadastrar ou configure padrões
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {cadastroOptions.map((option) => {
          const Icon = option.icon
          return (
            <Card
              key={option.path}
              className="transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer"
              onClick={() => navigate(option.path)}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg bg-muted p-3 ${option.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">{option.title}</CardTitle>
                </div>
                <CardDescription className="mt-3">
                  {option.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" onClick={() => navigate(option.path)}>
                  {option.buttonText}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
