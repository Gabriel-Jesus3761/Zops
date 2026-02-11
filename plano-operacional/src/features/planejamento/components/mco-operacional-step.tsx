import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { AlertTriangle, Users, Truck, Settings2, CheckCircle2 } from 'lucide-react'
import type { MCOOperacionalData } from '../types/mco.types'

interface MCOOperacionalStepProps {
  data: MCOOperacionalData
  onChange: (data: MCOOperacionalData) => void
}

// Modalidades mock (até integrar com Firebase)
const modalidades = [
  { id: '1', nome: 'Self-Service', descricao: 'Cliente opera sozinho' },
  { id: '2', nome: 'Atendimento Assistido', descricao: 'Com equipe de suporte' },
  { id: '3', nome: 'Híbrido', descricao: 'Misto de operações' },
  { id: '4', nome: 'Cashless', descricao: 'Pagamento digital' },
]

export function MCOOperacionalStep({ data, onChange }: MCOOperacionalStepProps) {
  const modalidadeSelecionada = modalidades.find(m => m.id === data.modalidadeId)
  const alertaLogisticaSemTime = data.logistica && !data.timeTecnico

  const camposValidos = {
    modalidade: !!data.modalidadeId,
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Modelo Operacional */}
      <div className="bg-card rounded-lg border-2 border-border dark:border-white/20 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings2 className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold text-base text-foreground">Modelo Operacional</h3>
          <span className="text-destructive text-sm font-bold">*</span>
          {camposValidos.modalidade && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-sm text-foreground mb-2 block">Selecione o Modelo</Label>
            <Select
              value={data.modalidadeId || ""}
              onValueChange={(value) => onChange({ ...data, modalidadeId: value })}
            >
              <SelectTrigger className="h-auto min-h-[44px] py-2">
                <SelectValue placeholder="Selecione o modelo operacional">
                  {modalidadeSelecionada && (
                    <div className="flex flex-col items-start text-left gap-0.5">
                      <span className="font-medium text-foreground">{modalidadeSelecionada.nome}</span>
                      <span className="text-xs text-muted-foreground">{modalidadeSelecionada.descricao}</span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {modalidades.map((mod) => (
                  <SelectItem key={mod.id} value={mod.id}>
                    <div className="flex flex-col items-start text-left gap-0.5">
                      <span className="font-medium text-foreground">{mod.nome}</span>
                      <span className="text-xs text-muted-foreground">{mod.descricao}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!data.modalidadeId && (
              <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Campo obrigatório para cálculo de equipe técnica
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Time Técnico */}
      <div className="bg-card rounded-lg border-2 border-border dark:border-white/20 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold text-base text-foreground">Time Técnico</h3>
          {data.timeTecnico && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label className="text-sm text-foreground">Incluir equipe de campo no evento</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Ativa cálculo de mão de obra e custos relacionados
              </p>
            </div>
            <Switch
              checked={data.timeTecnico}
              onCheckedChange={(checked) => onChange({
                ...data,
                timeTecnico: checked,
                clienteForneceAlimentacaoGoLive: checked ? data.clienteForneceAlimentacaoGoLive : false,
                clienteForneceHospedagemAlpha: checked ? data.clienteForneceHospedagemAlpha : false,
              })}
            />
          </div>

          {data.timeTecnico && (
            <div className="pt-4 border-t space-y-3">
              <Label className="text-sm text-muted-foreground">Descontos do Cliente</Label>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <Label htmlFor="alimentacao" className="text-sm text-foreground cursor-pointer">
                  Alimentação Go Live
                </Label>
                <Switch
                  id="alimentacao"
                  checked={data.clienteForneceAlimentacaoGoLive}
                  onCheckedChange={(checked) => onChange({ ...data, clienteForneceAlimentacaoGoLive: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <Label htmlFor="hospedagem" className="text-sm text-foreground cursor-pointer">
                  Hospedagem Time Alpha
                </Label>
                <Switch
                  id="hospedagem"
                  checked={data.clienteForneceHospedagemAlpha}
                  onCheckedChange={(checked) => onChange({ ...data, clienteForneceHospedagemAlpha: checked })}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Logística */}
      <div className="bg-card rounded-lg border-2 border-border dark:border-white/20 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Truck className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold text-base text-foreground">Logística</h3>
          {data.logistica && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label className="text-sm text-foreground">Incluir custos de frete e equipamentos</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Ativa cálculo de transporte e logística
              </p>
            </div>
            <Switch
              checked={data.logistica}
              onCheckedChange={(checked) => onChange({ ...data, logistica: checked })}
            />
          </div>

          {alertaLogisticaSemTime && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5" />
                Logística sem Time Técnico: frete será calculado mas sem equipe
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
