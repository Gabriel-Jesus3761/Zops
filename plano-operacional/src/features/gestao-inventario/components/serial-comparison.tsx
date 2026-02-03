import * as React from 'react'
import { toast } from 'sonner'
import {
  ScanBarcode,
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MapPin,
  Truck,
  Copy,
  Download,
  Loader2,
  ArrowRight,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { FormField } from '@/components/ui/form-field'

import type { Asset, SerialSearchResult } from '../types'

interface SerialComparisonProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filialOptions: string[]
  onComparisonComplete?: (result: SerialSearchResult) => void
}

type ComparisonTab = 'missing' | 'extras' | 'outraFilial' | 'emOS' | 'duplicados'

export function SerialComparison({
  open,
  onOpenChange,
  filialOptions,
  onComparisonComplete,
}: SerialComparisonProps) {
  // State
  const [serialInput, setSerialInput] = React.useState('')
  const [selectedFilial, setSelectedFilial] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [result, setResult] = React.useState<SerialSearchResult | null>(null)
  const [activeResultTab, setActiveResultTab] = React.useState<ComparisonTab>('missing')

  // Parse serials from input
  const parseSerials = (input: string): string[] => {
    return input
      .split(/[\n\r,;\s]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0)
  }

  // Find duplicates in input
  const findDuplicates = (serials: string[]): string[] => {
    const seen = new Set<string>()
    const duplicates: string[] = []

    serials.forEach(serial => {
      if (seen.has(serial)) {
        if (!duplicates.includes(serial)) {
          duplicates.push(serial)
        }
      } else {
        seen.add(serial)
      }
    })

    return duplicates
  }

  // Run comparison
  const handleCompare = async () => {
    const serials = parseSerials(serialInput)

    if (serials.length === 0) {
      toast.error('Por favor, insira ao menos um Serial Máquina')
      return
    }

    if (!selectedFilial) {
      toast.error('Por favor, selecione uma filial para comparação')
      return
    }

    setIsLoading(true)
    setProgress(0)
    setResult(null)

    try {
      // Find duplicates first
      const duplicadosEntrada = findDuplicates(serials)
      const uniqueSerials = [...new Set(serials)]

      setProgress(10)

      // Fetch assets in the selected filial
      const filialResponse = await fetch(
        'https://southamerica-east1-zops-mobile.cloudfunctions.net/getAtivos',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: '/ativos',
            where: [
              { field: 'alocacao', operator: '==', value: selectedFilial },
            ],
          }),
        }
      )

      if (!filialResponse.ok) throw new Error('Falha ao buscar ativos da filial')

      const filialData = await filialResponse.json()
      const filialAssets: Asset[] = filialData.docs.map(
        (doc: { id: string; data: Partial<Asset> }) => ({
          ...doc.data,
          firestoreId: doc.id,
        })
      )

      setProgress(40)

      // Create lookup map for filial assets
      const filialSerialsMap = new Map<string, Asset>()
      filialAssets.forEach(asset => {
        filialSerialsMap.set(asset.serialMaquina, asset)
      })

      // Find missing serials (in input but not in filial)
      const missingSerials: string[] = []
      const foundInFilial: string[] = []

      uniqueSerials.forEach(serial => {
        if (filialSerialsMap.has(serial)) {
          foundInFilial.push(serial)
        } else {
          missingSerials.push(serial)
        }
      })

      setProgress(60)

      // Find extras in filial (in filial but not in input)
      const inputSerialsSet = new Set(uniqueSerials)
      const extrasInFilial = filialAssets.filter(
        asset => !inputSerialsSet.has(asset.serialMaquina)
      )

      setProgress(70)

      // Search for missing serials in other filiais and OS
      const emOutraFilial: Asset[] = []
      const alocadosEmOS: Asset[] = []

      if (missingSerials.length > 0) {
        // Batch search for missing serials
        const BATCH_SIZE = 30
        const batches: string[][] = []

        for (let i = 0; i < missingSerials.length; i += BATCH_SIZE) {
          batches.push(missingSerials.slice(i, i + BATCH_SIZE))
        }

        for (let i = 0; i < batches.length; i++) {
          const batch = batches[i]

          const response = await fetch(
            'https://southamerica-east1-zops-mobile.cloudfunctions.net/getAtivos',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                url: '/ativos',
                where: [{ field: 'serialMaquina', operator: 'in', value: batch }],
              }),
            }
          )

          if (response.ok) {
            const data = await response.json()
            const foundAssets: Asset[] = data.docs.map(
              (doc: { id: string; data: Partial<Asset> }) => ({
                ...doc.data,
                firestoreId: doc.id,
              })
            )

            foundAssets.forEach(asset => {
              // Check if alocado em OS (starts with "OS")
              if (asset.alocacao?.startsWith('OS')) {
                alocadosEmOS.push(asset)
              } else if (asset.alocacao !== selectedFilial) {
                emOutraFilial.push(asset)
              }
            })
          }

          setProgress(70 + Math.round((i / batches.length) * 25))
        }
      }

      setProgress(95)

      // Calculate final missing (not found anywhere)
      const foundSerials = new Set([
        ...foundInFilial,
        ...emOutraFilial.map(a => a.serialMaquina),
        ...alocadosEmOS.map(a => a.serialMaquina),
      ])

      const finalMissing = missingSerials.filter(s => !foundSerials.has(s))

      const comparisonResult: SerialSearchResult = {
        filial: selectedFilial,
        inputCount: serials.length,
        filialCount: filialAssets.length,
        missingSerials: finalMissing,
        extrasInFilial,
        emOutraFilial,
        alocadosEmOS,
        duplicadosEntrada,
        matchedCount: foundInFilial.length,
      }

      setResult(comparisonResult)
      setProgress(100)

      onComparisonComplete?.(comparisonResult)

      // Set active tab to show most relevant results
      if (finalMissing.length > 0) {
        setActiveResultTab('missing')
      } else if (extrasInFilial.length > 0) {
        setActiveResultTab('extras')
      } else if (emOutraFilial.length > 0) {
        setActiveResultTab('outraFilial')
      }

      toast.success('Comparação concluída!')
    } catch (error) {
      console.error('Comparison error:', error)
      toast.error('Erro ao realizar comparação')
    } finally {
      setIsLoading(false)
    }
  }

  // Copy list to clipboard
  const copyToClipboard = (items: string[]) => {
    navigator.clipboard.writeText(items.join('\n'))
    toast.success(`${items.length} itens copiados`)
  }

  // Export results
  const handleExport = async () => {
    if (!result) return

    try {
      const { utils, writeFile } = await import('xlsx')
      const wb = utils.book_new()

      // Missing serials sheet
      if (result.missingSerials.length > 0) {
        const wsData = result.missingSerials.map(s => ({ 'Serial Máquina': s }))
        const ws = utils.json_to_sheet(wsData)
        utils.book_append_sheet(wb, ws, 'Não Encontrados')
      }

      // Extras sheet
      if (result.extrasInFilial.length > 0) {
        const wsData = result.extrasInFilial.map(a => ({
          'Serial Máquina': a.serialMaquina,
          Tipo: a.tipo,
          Modelo: a.modelo,
          Situação: a.situacao,
        }))
        const ws = utils.json_to_sheet(wsData)
        utils.book_append_sheet(wb, ws, 'Extras na Filial')
      }

      // Em outra filial sheet
      if (result.emOutraFilial.length > 0) {
        const wsData = result.emOutraFilial.map(a => ({
          'Serial Máquina': a.serialMaquina,
          'Alocação Atual': a.alocacao,
          Tipo: a.tipo,
          Modelo: a.modelo,
        }))
        const ws = utils.json_to_sheet(wsData)
        utils.book_append_sheet(wb, ws, 'Em Outra Filial')
      }

      // Em OS sheet
      if (result.alocadosEmOS.length > 0) {
        const wsData = result.alocadosEmOS.map(a => ({
          'Serial Máquina': a.serialMaquina,
          OS: a.alocacao,
          Tipo: a.tipo,
          Modelo: a.modelo,
        }))
        const ws = utils.json_to_sheet(wsData)
        utils.book_append_sheet(wb, ws, 'Em OS')
      }

      writeFile(
        wb,
        `comparacao_${selectedFilial}_${new Date().toISOString().split('T')[0]}.xlsx`
      )
      toast.success('Relatório exportado!')
    } catch (error) {
      toast.error('Erro ao exportar relatório')
    }
  }

  // Reset state
  const handleReset = () => {
    setSerialInput('')
    setSelectedFilial('')
    setResult(null)
    setProgress(0)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanBarcode className="h-5 w-5" />
            Comparação de Seriais por Filial
          </DialogTitle>
          <DialogDescription>
            Compare uma lista de Serial Máquina com os ativos alocados em uma filial específica.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* Input Section */}
          {!result && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <FormField>
                  <FormField.Label>Filial para Comparação</FormField.Label>
                  <Select value={selectedFilial} onValueChange={setSelectedFilial}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a filial..." />
                    </SelectTrigger>
                    <SelectContent>
                      {filialOptions.map(filial => (
                        <SelectItem key={filial} value={filial}>
                          {filial}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormField.Description>
                    Os seriais serão comparados com os ativos desta filial
                  </FormField.Description>
                </FormField>

                <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3 text-sm">
                  <p className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                    O que será identificado:
                  </p>
                  <ul className="text-blue-700 dark:text-blue-300 space-y-1 text-xs">
                    <li className="flex items-center gap-2">
                      <XCircle className="h-3 w-3" />
                      Seriais não encontrados no sistema
                    </li>
                    <li className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      Seriais em outras filiais
                    </li>
                    <li className="flex items-center gap-2">
                      <Truck className="h-3 w-3" />
                      Seriais alocados em OS
                    </li>
                    <li className="flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3" />
                      Extras na filial (não estão na lista)
                    </li>
                  </ul>
                </div>
              </div>

              <FormField>
                <FormField.Label>Lista de Serial Máquina</FormField.Label>
                <FormField.Textarea
                  rows={10}
                  placeholder={'Cole a lista de seriais aqui...\n\nExemplo:\n123456\n789012\n345678'}
                  value={serialInput}
                  onChange={e => setSerialInput(e.target.value)}
                  className="font-mono text-xs"
                />
                <FormField.Description>
                  {parseSerials(serialInput).length} serial(is) na lista
                </FormField.Description>
              </FormField>
            </div>
          )}

          {/* Loading Progress */}
          {isLoading && (
            <div className="space-y-3 py-4">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Realizando comparação...</span>
              </div>
              <Progress value={progress} />
              <p className="text-center text-sm text-muted-foreground">
                {progress < 40 && 'Buscando ativos da filial...'}
                {progress >= 40 && progress < 70 && 'Comparando seriais...'}
                {progress >= 70 && progress < 95 && 'Verificando outras alocações...'}
                {progress >= 95 && 'Finalizando...'}
              </p>
            </div>
          )}

          {/* Results Section */}
          {result && !isLoading && (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
                <Card className="p-3">
                  <p className="text-xs text-muted-foreground">Entrada</p>
                  <p className="text-2xl font-bold">{result.inputCount}</p>
                </Card>
                <Card className="p-3">
                  <p className="text-xs text-muted-foreground">Encontrados</p>
                  <p className="text-2xl font-bold text-green-600">{result.matchedCount}</p>
                </Card>
                <Card className="p-3">
                  <p className="text-xs text-muted-foreground">Não Encontrados</p>
                  <p className="text-2xl font-bold text-red-600">{result.missingSerials.length}</p>
                </Card>
                <Card className="p-3">
                  <p className="text-xs text-muted-foreground">Outra Filial</p>
                  <p className="text-2xl font-bold text-yellow-600">{result.emOutraFilial.length}</p>
                </Card>
                <Card className="p-3">
                  <p className="text-xs text-muted-foreground">Extras</p>
                  <p className="text-2xl font-bold text-blue-600">{result.extrasInFilial.length}</p>
                </Card>
              </div>

              {/* Result Tabs */}
              <Tabs value={activeResultTab} onValueChange={v => setActiveResultTab(v as ComparisonTab)}>
                <TabsList className="grid grid-cols-5">
                  <TabsTrigger value="missing" className="gap-1">
                    <XCircle className="h-3 w-3" />
                    <span className="hidden sm:inline">Não Encontrados</span>
                    <Badge variant="destructive" className="ml-1">
                      {result.missingSerials.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="extras" className="gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    <span className="hidden sm:inline">Extras</span>
                    <Badge variant="secondary" className="ml-1">
                      {result.extrasInFilial.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="outraFilial" className="gap-1">
                    <MapPin className="h-3 w-3" />
                    <span className="hidden sm:inline">Outra Filial</span>
                    <Badge variant="secondary" className="ml-1">
                      {result.emOutraFilial.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="emOS" className="gap-1">
                    <Truck className="h-3 w-3" />
                    <span className="hidden sm:inline">Em OS</span>
                    <Badge variant="secondary" className="ml-1">
                      {result.alocadosEmOS.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="duplicados" className="gap-1">
                    <Copy className="h-3 w-3" />
                    <span className="hidden sm:inline">Duplicados</span>
                    <Badge variant="secondary" className="ml-1">
                      {result.duplicadosEntrada.length}
                    </Badge>
                  </TabsTrigger>
                </TabsList>

                {/* Missing Serials */}
                <TabsContent value="missing" className="mt-4">
                  {result.missingSerials.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 text-green-500 mb-2" />
                      <p>Todos os seriais foram encontrados!</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(result.missingSerials)}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copiar Lista
                        </Button>
                      </div>
                      <div className="rounded-md border max-h-[300px] overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>#</TableHead>
                              <TableHead>Serial Máquina</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {result.missingSerials.map((serial, idx) => (
                              <TableRow key={serial}>
                                <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                                <TableCell className="font-mono text-sm">{serial}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Extras in Filial */}
                <TabsContent value="extras" className="mt-4">
                  {result.extrasInFilial.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 text-green-500 mb-2" />
                      <p>Não há ativos extras na filial</p>
                    </div>
                  ) : (
                    <div className="rounded-md border max-h-[300px] overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Serial Máquina</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Modelo</TableHead>
                            <TableHead>Situação</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {result.extrasInFilial.slice(0, 100).map(asset => (
                            <TableRow key={asset.firestoreId}>
                              <TableCell className="font-mono text-sm">
                                {asset.serialMaquina}
                              </TableCell>
                              <TableCell>{asset.tipo}</TableCell>
                              <TableCell>{asset.modelo}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={asset.situacao === 'Good' ? 'default' : 'destructive'}
                                >
                                  {asset.situacao}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {result.extrasInFilial.length > 100 && (
                        <p className="text-center text-sm text-muted-foreground py-2">
                          Mostrando 100 de {result.extrasInFilial.length} registros
                        </p>
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* Em Outra Filial */}
                <TabsContent value="outraFilial" className="mt-4">
                  {result.emOutraFilial.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 text-green-500 mb-2" />
                      <p>Nenhum serial encontrado em outra filial</p>
                    </div>
                  ) : (
                    <div className="rounded-md border max-h-[300px] overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Serial Máquina</TableHead>
                            <TableHead>Alocação Atual</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Modelo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {result.emOutraFilial.map(asset => (
                            <TableRow key={asset.firestoreId}>
                              <TableCell className="font-mono text-sm">
                                {asset.serialMaquina}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1 text-yellow-600">
                                  {result.filial}
                                  <ArrowRight className="h-3 w-3" />
                                  <span className="font-medium">{asset.alocacao}</span>
                                </div>
                              </TableCell>
                              <TableCell>{asset.tipo}</TableCell>
                              <TableCell>{asset.modelo}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>

                {/* Em OS */}
                <TabsContent value="emOS" className="mt-4">
                  {result.alocadosEmOS.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 text-green-500 mb-2" />
                      <p>Nenhum serial está alocado em OS</p>
                    </div>
                  ) : (
                    <div className="rounded-md border max-h-[300px] overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Serial Máquina</TableHead>
                            <TableHead>OS</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Modelo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {result.alocadosEmOS.map(asset => (
                            <TableRow key={asset.firestoreId}>
                              <TableCell className="font-mono text-sm">
                                {asset.serialMaquina}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{asset.alocacao}</Badge>
                              </TableCell>
                              <TableCell>{asset.tipo}</TableCell>
                              <TableCell>{asset.modelo}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>

                {/* Duplicados */}
                <TabsContent value="duplicados" className="mt-4">
                  {result.duplicadosEntrada.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 text-green-500 mb-2" />
                      <p>Nenhum serial duplicado na lista de entrada</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Estes seriais aparecem mais de uma vez na lista de entrada:
                      </p>
                      <div className="rounded-md border max-h-[300px] overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>#</TableHead>
                              <TableHead>Serial Máquina</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {result.duplicadosEntrada.map((serial, idx) => (
                              <TableRow key={serial}>
                                <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                                <TableCell className="font-mono text-sm">{serial}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {result ? (
            <>
              <Button variant="outline" onClick={handleReset}>
                Nova Comparação
              </Button>
              <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Exportar Resultado
              </Button>
              <Button onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCompare} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                Comparar
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
