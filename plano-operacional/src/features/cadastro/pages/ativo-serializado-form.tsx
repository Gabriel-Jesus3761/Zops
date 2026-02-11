import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Save,
  X,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'
import { useSerialPatterns } from '../hooks/use-serial-patterns'
import { ativosSerializadosService } from '../services/ativos-serializados.service'
import { skuBindingsService } from '../services/sku-bindings.service'
import { BatchSkuBindingDialog } from '../components/batch-sku-binding-dialog'
import { SerialPatternDialog } from '../components/serial-pattern-dialog'
import type { SerialPattern } from '../types/serial-pattern'

interface ProcessedSerial {
  id: string
  numeroSerie: string
  tipo: string
  modelo: string
  adquirencia: string
  sku: string
  status: 'validating' | 'valid' | 'invalid' | 'duplicate'
  error?: string
  padraoDetectado?: string
}

export function AtivoSerializadoForm() {
  const navigate = useNavigate()
  const [serialsInput, setSerialsInput] = useState('')
  const [processedSerials, setProcessedSerials] = useState<ProcessedSerial[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showBindingDialog, setShowBindingDialog] = useState(false)
  const [pendingBindings, setPendingBindings] = useState<{ modelo: string; adquirencia: string; tipo: string }[]>([])
  const [showPatternDialog, setShowPatternDialog] = useState(false)
  const [prefixoNaoReconhecido, setPrefixoNaoReconhecido] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { detectPattern, addPattern, customOptions, addCustomOption, reloadCustomOptions } = useSerialPatterns()

  // Normalizar serial: remove espaços e coloca em MAIÚSCULAS
  const normalizarSerial = (serial: string): string => {
    return serial.replace(/[\s\u00A0]+/g, ' ').trim().toUpperCase()
  }

  // Processar seriais em massa
  const processarSeriais = async () => {
    if (!serialsInput.trim()) {
      toast.error('Cole os números de série no campo de texto')
      return
    }

    setIsProcessing(true)

    // Dividir por linhas e limpar
    const seriais = serialsInput
      .split('\n')
      .map(s => normalizarSerial(s))
      .filter(s => s.length > 0)

    if (seriais.length === 0) {
      toast.error('Nenhum número de série válido encontrado')
      setIsProcessing(false)
      return
    }

    const novosSeriais: ProcessedSerial[] = []
    let erros = 0
    let semPadrao = 0

    for (let i = 0; i < seriais.length; i++) {
      const serialNormalizado = seriais[i]

      // Verificar se já está na lista
      const jaExiste = processedSerials.find(
        s => s.numeroSerie === serialNormalizado
      )

      if (jaExiste) {
        continue
      }

      // Detectar padrão
      const detection = detectPattern(serialNormalizado)

      if (!detection.found || !detection.suggestedValues) {
        const prefixo = serialNormalizado.substring(0, 3)

        novosSeriais.push({
          id: `${Date.now()}_${i}`,
          numeroSerie: serialNormalizado,
          tipo: '',
          modelo: '',
          adquirencia: '',
          sku: '',
          status: 'invalid',
          error: 'Padrão não reconhecido',
          padraoDetectado: prefixo
        })
        semPadrao++
        erros++
        continue
      }

      // Preencher dados do padrão detectado
      const tipo = detection.suggestedValues.tipo || ''
      const modelo = detection.suggestedValues.modelo || ''
      const adquirencia = detection.suggestedValues.adquirencia || ''

      // Verificar vinculação SKU no Firebase
      let sku = ''
      const binding = await skuBindingsService.getByModeloAdquirencia(modelo, adquirencia)
      if (binding) {
        sku = binding.sku
      }

      const novoSerial: ProcessedSerial = {
        id: `${Date.now()}_${i}`,
        numeroSerie: serialNormalizado,
        tipo,
        modelo,
        adquirencia,
        sku,
        status: 'validating',
        padraoDetectado: detection.pattern?.prefixo
      }

      novosSeriais.push(novoSerial)
    }

    // Adicionar à lista
    setProcessedSerials(prev => [...prev, ...novosSeriais])

    // Validar no Firebase em background
    validarNoFirebase(novosSeriais)

    // Limpar input
    setSerialsInput('')

    // Mensagens de resultado
    const mensagens = []
    if (novosSeriais.length > 0) mensagens.push(`${novosSeriais.length} processados`)
    if (semPadrao > 0) mensagens.push(`${semPadrao} sem padrão`)

    if (novosSeriais.length > 0) {
      toast.success(mensagens.join(', '))
    } else {
      toast.warning('Todos os seriais já foram processados')
    }

    setIsProcessing(false)
  }

  // Validar seriais no Firebase
  const validarNoFirebase = async (seriais: ProcessedSerial[]) => {
    for (const serial of seriais) {
      if (serial.status !== 'validating') continue

      try {
        const exists = await ativosSerializadosService.checkSerialExists(serial.numeroSerie)

        setProcessedSerials(prev =>
          prev.map(s =>
            s.id === serial.id
              ? {
                  ...s,
                  status: exists ? 'duplicate' : 'valid',
                  error: exists ? 'Serial já cadastrado no sistema' : undefined
                }
              : s
          )
        )
      } catch (error) {
        setProcessedSerials(prev =>
          prev.map(s =>
            s.id === serial.id
              ? {
                  ...s,
                  status: 'invalid',
                  error: 'Erro ao validar'
                }
              : s
          )
        )
      }
    }
  }

  // Remover serial da lista
  const removerSerial = (id: string) => {
    setProcessedSerials(prev => prev.filter(s => s.id !== id))
  }

  // Limpar todos
  const limparTodos = () => {
    setProcessedSerials([])
    toast.info('Lista limpa')
  }

  // Callback quando um novo padrão é criado
  const handlePatternSave = async (patternData: Omit<SerialPattern, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // Criar padrão no Firebase
      const pattern = await addPattern(patternData)

      // Verificar vinculação SKU no Firebase
      let sku = ''
      const binding = await skuBindingsService.getByModeloAdquirencia(pattern.modelo, pattern.adquirencia)
      if (binding) {
        sku = binding.sku
      }

      // Reprocessar seriais que tinham o prefixo não reconhecido
      setProcessedSerials(prev =>
        prev.map(serial => {
          if (serial.status === 'invalid' && serial.padraoDetectado === pattern.prefixo) {
            return {
              ...serial,
              tipo: pattern.tipo,
              modelo: pattern.modelo,
              adquirencia: pattern.adquirencia,
              sku,
              status: 'validating' as const,
              error: undefined,
              padraoDetectado: pattern.prefixo
            }
          }
          return serial
        })
      )

      // Validar no Firebase os seriais atualizados
      const serialsAtualizados = processedSerials.filter(
        s => s.status === 'invalid' && s.padraoDetectado === pattern.prefixo
      )
      if (serialsAtualizados.length > 0) {
        validarNoFirebase(serialsAtualizados.map(s => ({
          ...s,
          tipo: pattern.tipo,
          modelo: pattern.modelo,
          adquirencia: pattern.adquirencia,
          status: 'validating' as const
        })))
      }

      toast.success(`Padrão criado! ${serialsAtualizados.length} seriais atualizados`)
      setPrefixoNaoReconhecido('')
    } catch (error) {
      toast.error('Erro ao criar padrão')
      console.error(error)
    }
  }

  // Callback quando as vinculações são criadas em lote
  const handleBindingsCreated = (bindings: { modelo: string; adquirencia: string; sku: string }[]) => {
    // Aplicar os SKUs a todos os seriais correspondentes
    setProcessedSerials(prev =>
      prev.map(serial => {
        const binding = bindings.find(
          b => b.modelo === serial.modelo && b.adquirencia === serial.adquirencia
        )
        if (binding && !serial.sku) {
          return { ...serial, sku: binding.sku }
        }
        return serial
      })
    )

    setPendingBindings([])
  }

  // Salvar todos os seriais válidos
  const salvarTodos = async () => {
    // Verificar se há seriais inválidos (sem padrão)
    const serialsInvalidos = processedSerials.filter(s => s.status === 'invalid')
    if (serialsInvalidos.length > 0) {
      // Pegar o primeiro prefixo não reconhecido
      const primeiro = serialsInvalidos[0]
      setPrefixoNaoReconhecido(primeiro.padraoDetectado || primeiro.numeroSerie.substring(0, 3))
      setShowPatternDialog(true)
      toast.warning(`${serialsInvalidos.length} seriais sem padrão. Configure o padrão primeiro.`)
      return
    }

    const serialsValidos = processedSerials.filter(s => s.status === 'valid')

    if (serialsValidos.length === 0) {
      toast.error('Não há seriais válidos para salvar')
      return
    }

    // Verificar se há seriais sem SKU
    const semSku = serialsValidos.filter(s => !s.sku)
    if (semSku.length > 0) {
      // Coletar todas as combinações únicas de modelo+adquirência sem SKU
      const combinacoesUnicas = new Map<string, { modelo: string; adquirencia: string; tipo: string }>()

      semSku.forEach(serial => {
        const key = `${serial.modelo}|${serial.adquirencia}`
        if (!combinacoesUnicas.has(key)) {
          combinacoesUnicas.set(key, {
            modelo: serial.modelo,
            adquirencia: serial.adquirencia,
            tipo: serial.tipo
          })
        }
      })

      const bindingsParaCriar = Array.from(combinacoesUnicas.values())
      setPendingBindings(bindingsParaCriar)
      setShowBindingDialog(true)
      toast.warning(
        `${semSku.length} seriais sem SKU em ${bindingsParaCriar.length} combinações diferentes. Configure as vinculações.`
      )
      return
    }

    setIsSaving(true)
    let savedCount = 0

    try {
      for (const serial of serialsValidos) {
        await ativosSerializadosService.create({
          numeroSerie: serial.numeroSerie,
          sku: serial.sku,
          tipo: serial.tipo,
          modelo: serial.modelo,
          adquirencia: serial.adquirencia
        })

        savedCount++
      }

      toast.success(`${savedCount} ativos cadastrados com sucesso!`)

      // Limpar lista e resetar
      setProcessedSerials([])

    } catch (error) {
      console.error('Erro ao salvar ativos:', error)
      toast.error(`Erro ao salvar. ${savedCount} ativos foram salvos.`)
    } finally {
      setIsSaving(false)
    }
  }

  const serialsValidos = processedSerials.filter(s => s.status === 'valid').length
  const serialsInvalidos = processedSerials.filter(s => s.status === 'invalid' || s.status === 'duplicate').length
  const serialsValidando = processedSerials.filter(s => s.status === 'validating').length

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/logistica/cadastro')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Cadastro em Massa de Ativos</h1>
          <p className="mt-2 text-muted-foreground">
            Cole múltiplos números de série para cadastro rápido
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Números de Série</CardTitle>
          <CardDescription>
            Cole os números de série, um por linha. O sistema identificará automaticamente os padrões.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Instruções</AlertTitle>
            <AlertDescription>
              <ol className="list-decimal list-inside space-y-1 mt-2">
                <li>Cole os números de série no campo abaixo (um por linha)</li>
                <li>Clique em "Processar Seriais" para detectar os padrões automaticamente</li>
                <li>Revise a lista de seriais processados</li>
                <li>Clique em "Salvar Todos" para cadastrar os ativos válidos</li>
              </ol>
            </AlertDescription>
          </Alert>

          <Textarea
            ref={textareaRef}
            placeholder="Cole os números de série aqui, um por linha:&#10;PBA1123456&#10;PBA1123457&#10;PBA1123458"
            value={serialsInput}
            onChange={(e) => setSerialsInput(e.target.value)}
            rows={10}
            className="font-mono text-sm"
          />

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {serialsInput.split('\n').filter(s => s.trim().length > 0).length} seriais detectados
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setSerialsInput('')}
                disabled={!serialsInput.trim() || isProcessing}
              >
                Limpar
              </Button>
              <Button
                onClick={processarSeriais}
                disabled={!serialsInput.trim() || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  'Processar Seriais'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {processedSerials.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Seriais Processados</CardTitle>
                <CardDescription>
                  {processedSerials.length} seriais na lista
                </CardDescription>
              </div>
              <div className="flex gap-2 items-center">
                <div className="flex gap-2">
                  {serialsValidos > 0 && (
                    <Badge variant="default" className="bg-green-600">
                      {serialsValidos} Válidos
                    </Badge>
                  )}
                  {serialsValidando > 0 && (
                    <Badge variant="secondary">
                      {serialsValidando} Validando
                    </Badge>
                  )}
                  {serialsInvalidos > 0 && (
                    <Badge variant="destructive">
                      {serialsInvalidos} Inválidos
                    </Badge>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={limparTodos}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Limpar Todos
                </Button>
                <Button
                  size="sm"
                  onClick={salvarTodos}
                  disabled={processedSerials.length === 0 || isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Todos ({serialsValidos})
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {processedSerials.map((serial) => (
                <div
                  key={serial.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-2">
                      {serial.status === 'valid' && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                      {serial.status === 'validating' && (
                        <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
                      )}
                      {(serial.status === 'invalid' || serial.status === 'duplicate') && (
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <code className="text-sm font-mono font-semibold">
                          {serial.numeroSerie}
                        </code>
                        {serial.padraoDetectado && (
                          <Badge variant="outline" className="text-xs">
                            {serial.padraoDetectado}
                          </Badge>
                        )}
                      </div>

                      {serial.status === 'valid' && (
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          <span><strong>Tipo:</strong> {serial.tipo}</span>
                          <span>•</span>
                          <span><strong>Modelo:</strong> {serial.modelo}</span>
                          <span>•</span>
                          <span><strong>Adquirência:</strong> {serial.adquirencia}</span>
                          <span>•</span>
                          <span>
                            <strong>SKU:</strong> {serial.sku || (
                              <span className="text-amber-600">Sem vinculação</span>
                            )}
                          </span>
                        </div>
                      )}

                      {serial.error && (
                        <p className="text-sm text-red-600 mt-1">{serial.error}</p>
                      )}

                      {serial.status === 'validating' && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Validando no sistema...
                        </p>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removerSerial(serial.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de criação de padrão de serial */}
      <SerialPatternDialog
        open={showPatternDialog}
        onOpenChange={setShowPatternDialog}
        pattern={prefixoNaoReconhecido ? {
          prefixo: prefixoNaoReconhecido,
          tipo: '',
          modelo: '',
          adquirencia: '',
          subCategoria: 'EQUIPAMENTOS',
          needsValidation: false,
          ativo: true
        } as SerialPattern : null}
        customOptions={customOptions}
        onSave={handlePatternSave}
        onAddCustomOption={addCustomOption}
        onReloadOptions={reloadCustomOptions}
      />

      {/* Modal de vinculação em lote de SKUs */}
      <BatchSkuBindingDialog
        open={showBindingDialog}
        onOpenChange={setShowBindingDialog}
        pendingBindings={pendingBindings}
        onBindingsCreated={handleBindingsCreated}
      />
    </div>
  )
}
