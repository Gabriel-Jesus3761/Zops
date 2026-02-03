import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Info, AlertTriangle, Users, Truck, Settings2, CheckCircle2, Cog } from 'lucide-react'
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

// Ilustrações com ícones Lucide
const IllustracaoOperacional = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="relative">
      <div className="w-16 h-16 rounded-2xl bg-chart-4/20 flex items-center justify-center">
        <Cog className="w-8 h-8 text-chart-4" />
      </div>
      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-chart-4/40 flex items-center justify-center">
        <Settings2 className="w-3 h-3 text-chart-4" />
      </div>
    </div>
  </div>
)

const IllustracaoTimeTecnico = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="relative">
      <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
        <Users className="w-8 h-8 text-primary" />
      </div>
      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
        <CheckCircle2 className="w-3 h-3 text-primary-foreground" />
      </div>
    </div>
  </div>
)

const IllustracaoLogistica = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="relative">
      <div className="w-16 h-16 rounded-2xl bg-chart-3/20 flex items-center justify-center">
        <Truck className="w-8 h-8 text-chart-3" />
      </div>
    </div>
  </div>
)

export function MCOOperacionalStep({ data, onChange }: MCOOperacionalStepProps) {
  const modalidadeSelecionada = modalidades.find(m => m.id === data.modalidadeId)

  // Alerta: Logística sem Time Técnico
  const alertaLogisticaSemTime = data.logistica && !data.timeTecnico

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Card 1 - Modelo Operacional */}
        <div
          className={cn(
            "relative rounded-2xl bg-card border shadow-sm p-6 min-h-[140px] transition-all duration-300",
            data.modalidadeId ? "border-primary/30 bg-primary/5" : "border-border"
          )}
        >
          <div className="relative z-10 pr-28 sm:pr-36">
            <div className="flex items-center gap-2 mb-1">
              <Settings2 className="h-4 w-4 text-chart-4" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Modelo Operacional
              </span>
              <span className="text-destructive text-xs font-bold">*</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[200px]">
                  <p className="text-xs">Afeta: <span className="font-semibold">Mão de Obra</span></p>
                  <p className="text-xs text-muted-foreground mt-1">Define TPV/terminal para cálculo de TCA e LTT</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <h3 className="text-xl font-bold text-foreground mt-1 mb-1">
              {modalidadeSelecionada?.nome || "Selecione o modelo"}
            </h3>
            {modalidadeSelecionada && (
              <p className="text-xs text-muted-foreground mb-3">{modalidadeSelecionada.descricao}</p>
            )}
            <Select
              value={data.modalidadeId || ""}
              onValueChange={(value) => onChange({ ...data, modalidadeId: value })}
            >
              <SelectTrigger className={cn("w-full", !data.modalidadeId && "border-amber-500/50")}>
                <SelectValue placeholder="Selecione o modelo operacional" />
              </SelectTrigger>
              <SelectContent>
                {modalidades.map((mod) => (
                  <SelectItem key={mod.id} value={mod.id}>
                    <div className="flex flex-col">
                      <span>{mod.nome}</span>
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
          <div className="absolute right-2 top-1/2 -translate-y-1/2 w-24 h-24 sm:w-28 sm:h-28 opacity-80">
            <IllustracaoOperacional />
          </div>

          {/* Badge de status */}
          {data.modalidadeId && (
            <Badge className="absolute top-4 right-4 bg-primary/10 text-primary border-primary/20">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Selecionado
            </Badge>
          )}
        </div>

        {/* Card 2 - Time Técnico */}
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl bg-card border shadow-sm p-6 min-h-[140px] cursor-pointer transition-all duration-300 group",
            data.timeTecnico
              ? "border-primary/30 bg-primary/5 hover:border-primary/50"
              : "border-border hover:border-muted-foreground/40"
          )}
          onClick={() => onChange({
            ...data,
            timeTecnico: !data.timeTecnico,
            clienteForneceAlimentacaoGoLive: !data.timeTecnico ? data.clienteForneceAlimentacaoGoLive : false,
            clienteForneceHospedagemAlpha: !data.timeTecnico ? data.clienteForneceHospedagemAlpha : false,
          })}
        >
          <div className="relative z-10 pr-28 sm:pr-36">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Equipe de Campo
              </span>
            </div>
            <h3 className="text-xl font-bold text-foreground mt-1 mb-1">
              Time Técnico
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Incluir equipe de campo no evento
            </p>
            <div className="flex items-center gap-3">
              <Switch
                checked={data.timeTecnico}
                onCheckedChange={(checked) => onChange({
                  ...data,
                  timeTecnico: checked,
                  clienteForneceAlimentacaoGoLive: checked ? data.clienteForneceAlimentacaoGoLive : false,
                  clienteForneceHospedagemAlpha: checked ? data.clienteForneceHospedagemAlpha : false,
                })}
                onClick={(e) => e.stopPropagation()}
              />
              <span className={cn(
                "text-sm font-medium transition-colors",
                data.timeTecnico ? "text-primary" : "text-muted-foreground"
              )}>
                {data.timeTecnico ? "Ativado" : "Desativado"}
              </span>
            </div>
          </div>
          <div className="absolute right-4 top-4 w-24 h-24 sm:w-28 sm:h-28 opacity-80 transition-transform duration-300 group-hover:scale-105">
            <IllustracaoTimeTecnico />
          </div>

          {/* Badge de status */}
          {data.timeTecnico && (
            <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Ativo
            </Badge>
          )}

          {/* Sub-flags animadas */}
          <div className={cn(
            "overflow-hidden transition-all duration-300 -mx-6 mt-6",
            data.timeTecnico ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
          )}>
            <div className="border-t border-border bg-muted/30 p-4 pt-5 pb-6 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                Descontos do Cliente
              </p>

              <div
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer",
                  data.clienteForneceAlimentacaoGoLive
                    ? "bg-green-500/10 border-green-500/30"
                    : "bg-muted/30 border-border hover:border-muted-foreground/30"
                )}
                onClick={(e) => {
                  e.stopPropagation()
                  onChange({ ...data, clienteForneceAlimentacaoGoLive: !data.clienteForneceAlimentacaoGoLive })
                }}
              >
                <span className="text-sm font-medium text-foreground">Alimentação Go Live</span>
                <Switch
                  checked={data.clienteForneceAlimentacaoGoLive}
                  onCheckedChange={(checked) => onChange({ ...data, clienteForneceAlimentacaoGoLive: checked })}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              <div
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer",
                  data.clienteForneceHospedagemAlpha
                    ? "bg-green-500/10 border-green-500/30"
                    : "bg-muted/30 border-border hover:border-muted-foreground/30"
                )}
                onClick={(e) => {
                  e.stopPropagation()
                  onChange({ ...data, clienteForneceHospedagemAlpha: !data.clienteForneceHospedagemAlpha })
                }}
              >
                <span className="text-sm font-medium text-foreground">Hospedagem Time Alpha</span>
                <Switch
                  checked={data.clienteForneceHospedagemAlpha}
                  onCheckedChange={(checked) => onChange({ ...data, clienteForneceHospedagemAlpha: checked })}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 3 - Logística */}
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl bg-card border shadow-sm p-6 min-h-[140px] cursor-pointer transition-all duration-300 group",
            data.logistica
              ? "border-chart-3/30 bg-chart-3/5 hover:border-chart-3/50"
              : "border-border hover:border-muted-foreground/40"
          )}
          onClick={() => onChange({ ...data, logistica: !data.logistica })}
        >
          <div className="relative z-10 pr-28 sm:pr-36">
            <div className="flex items-center gap-2 mb-1">
              <Truck className="h-4 w-4 text-chart-3" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Custos Logísticos
              </span>
            </div>
            <h3 className="text-xl font-bold text-foreground mt-1 mb-1">
              Logística
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Incluir custos de frete e equipamentos
            </p>
            <div className="flex items-center gap-3">
              <Switch
                checked={data.logistica}
                onCheckedChange={(checked) => onChange({ ...data, logistica: checked })}
                onClick={(e) => e.stopPropagation()}
              />
              <span className={cn(
                "text-sm font-medium transition-colors",
                data.logistica ? "text-chart-3" : "text-muted-foreground"
              )}>
                {data.logistica ? "Ativado" : "Desativado"}
              </span>
            </div>
            {alertaLogisticaSemTime && (
              <p className="text-xs text-amber-600 mt-3 flex items-center gap-1 animate-in fade-in duration-300">
                <AlertTriangle className="h-3 w-3" />
                Logística sem Time Técnico: frete será calculado mas sem equipe
              </p>
            )}
          </div>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 w-24 h-24 sm:w-28 sm:h-28 opacity-80 transition-transform duration-300 group-hover:scale-105">
            <IllustracaoLogistica />
          </div>

          {/* Badge de status */}
          {data.logistica && (
            <Badge className="absolute top-4 right-4 bg-chart-3/10 text-chart-3 border-chart-3/20">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Ativo
            </Badge>
          )}
        </div>

        {/* Resumo das seleções */}
        <div className="mt-6 p-4 rounded-xl bg-muted/30 border border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Resumo da Configuração
          </p>
          <div className="flex flex-wrap gap-2">
            {data.modalidadeId && (
              <Badge variant="outline" className="bg-chart-4/10 border-chart-4/30 text-chart-4">
                <Settings2 className="h-3 w-3 mr-1" />
                {modalidadeSelecionada?.nome}
              </Badge>
            )}
            <Badge
              variant="outline"
              className={cn(
                data.timeTecnico
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "bg-muted border-border text-muted-foreground"
              )}
            >
              <Users className="h-3 w-3 mr-1" />
              Time Técnico: {data.timeTecnico ? "Sim" : "Não"}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                data.logistica
                  ? "bg-chart-3/10 border-chart-3/30 text-chart-3"
                  : "bg-muted border-border text-muted-foreground"
              )}
            >
              <Truck className="h-3 w-3 mr-1" />
              Logística: {data.logistica ? "Sim" : "Não"}
            </Badge>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
