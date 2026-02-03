import { useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { divIcon } from 'leaflet'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import 'leaflet/dist/leaflet.css'
import '../styles/map.css'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  MapPin,
  Users,
  Calendar,
  Eye,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'

import type { MCO } from '../types/mco.types'
import { getCityCoordinates, BRAZIL_CENTER, BRAZIL_ZOOM } from '../utils/brazil-cities'

interface MCOMapViewProps {
  mcos: MCO[]
  onView?: (mco: MCO) => void
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const formatDisplayText = (text?: string) => {
  if (!text) return '-'
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

// Configuração de cores e ícones por status
const statusConfig = {
  pendente: {
    color: '#f59e0b',
    icon: Clock,
    label: 'Pendente'
  },
  aprovado: {
    color: '#10b981',
    icon: CheckCircle2,
    label: 'Aprovado'
  },
  rejeitado: {
    color: '#ef4444',
    icon: AlertCircle,
    label: 'Rejeitado'
  },
}

// Configuração de tamanho por porte
const porteSize = {
  'Pequeno': 20,
  'Médio': 30,
  'Grande': 40,
  'MEGA': 50,
}

function MCOMarker({ mco, onView }: { mco: MCO; onView?: (mco: MCO) => void }) {
  const coords = getCityCoordinates(mco.cidade, mco.uf)
  const config = statusConfig[mco.status]
  const size = porteSize[mco.porte as keyof typeof porteSize] || 25

  // Criar ícone customizado usando divIcon
  const customIcon = divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${config.color};
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
        transition: transform 0.2s;
      " onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
        <span style="color: white; font-size: ${size * 0.4}px; font-weight: bold;">${mco.porte?.[0] || 'M'}</span>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  })

  return (
    <Marker position={[coords.lat, coords.lng]} icon={customIcon}>
      <Popup maxWidth={320} className="custom-popup">
        <div className="p-2 space-y-3">
          {/* Header */}
          <div className="space-y-1">
            <div className="flex items-start justify-between gap-2">
              <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0.5">
                {mco.codigo}
              </Badge>
              <Badge
                variant="outline"
                style={{
                  backgroundColor: `${config.color}15`,
                  borderColor: `${config.color}50`,
                  color: config.color
                }}
                className="text-[10px] px-1.5 py-0.5"
              >
                {config.label}
              </Badge>
            </div>
            <h4 className="font-semibold text-sm leading-tight">
              {formatDisplayText(mco.nome_evento)}
            </h4>
          </div>

          {/* Informações */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{formatDisplayText(mco.cliente_nome)}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{formatDisplayText(mco.cidade)}/{mco.uf}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
              <span>
                {format(new Date(mco.data_inicial), "dd/MM/yy", { locale: ptBR })}
              </span>
            </div>
          </div>

          {/* Porte */}
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] px-2 py-0.5 w-fit",
              mco.porte === 'Grande' && "bg-purple-500/10 border-purple-500/30 text-purple-700",
              mco.porte === 'Médio' && "bg-blue-500/10 border-blue-500/30 text-blue-700",
              mco.porte === 'Pequeno' && "bg-gray-500/10 border-gray-500/30 text-gray-700"
            )}
          >
            Porte: {mco.porte || "-"}
          </Badge>

          {/* Métricas */}
          <div className="pt-2 border-t space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs">Custo</span>
              <span className="text-xs font-semibold">
                {formatCurrency(mco.custo_operacional_efetivo || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs">COT</span>
              <span
                className={cn(
                  "text-xs font-semibold",
                  mco.cot > 30 ? "text-red-600" : mco.cot > 20 ? "text-amber-600" : "text-green-600"
                )}
              >
                {mco.cot > 0 ? `${mco.cot.toFixed(1)}%` : '-'}
              </span>
            </div>

            {mco.publico_estimado && (
              <div className="flex items-center justify-between">
                <span className="text-xs">Público</span>
                <span className="text-xs font-semibold">
                  {parseInt(mco.publico_estimado).toLocaleString('pt-BR')}
                </span>
              </div>
            )}
          </div>

          {/* Ação */}
          {onView && (
            <Button
              size="sm"
              variant="outline"
              className="w-full mt-2"
              onClick={() => onView(mco)}
            >
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              Ver Detalhes
            </Button>
          )}
        </div>
      </Popup>
    </Marker>
  )
}

export function MCOMapView({ mcos, onView }: MCOMapViewProps) {
  const stats = useMemo(() => {
    const total = mcos.length
    const totalCusto = mcos.reduce((sum, mco) => sum + (mco.custo_operacional_efetivo || 0), 0)
    const byStatus = {
      pendente: mcos.filter(m => m.status === 'pendente').length,
      aprovado: mcos.filter(m => m.status === 'aprovado').length,
      rejeitado: mcos.filter(m => m.status === 'rejeitado').length,
    }
    const byRegion = mcos.reduce((acc, mco) => {
      const region = mco.uf
      acc[region] = (acc[region] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return { total, totalCusto, byStatus, byRegion }
  }, [mcos])

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="space-y-1">
              <span className="text-xs text-foreground">Total de MCOs</span>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-1">
              <span className="text-xs text-foreground">Custo Total</span>
              <p className="text-xl font-bold">{formatCurrency(stats.totalCusto)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-1">
              <span className="text-xs text-foreground">Estados</span>
              <p className="text-2xl font-bold">{Object.keys(stats.byRegion).length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-1">
              <span className="text-xs text-foreground">Por Status</span>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-xs">{stats.byStatus.pendente}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-xs">{stats.byStatus.aprovado}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-xs">{stats.byStatus.rejeitado}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Legenda */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Legenda
              </span>
              <div className="flex items-center gap-4 mt-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-amber-500 border-2 border-white shadow" />
                  <span>Pendente</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow" />
                  <span>Aprovado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow" />
                  <span>Rejeitado</span>
                </div>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Tamanho = Porte
              </span>
              <div className="flex items-center gap-3 mt-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-gray-400 border border-white shadow" />
                  <span>Pequeno</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-gray-400 border border-white shadow" />
                  <span>Médio</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-gray-400 border border-white shadow" />
                  <span>Grande</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map */}
      <Card>
        <CardContent className="p-0">
          <div className="h-[600px] w-full rounded-lg overflow-hidden">
            {mcos.length === 0 ? (
              <div className="h-full flex items-center justify-center bg-muted">
                <div className="text-center space-y-2">
                  <MapPin className="h-12 w-12 text-foreground mx-auto" />
                  <p className="text-sm text-foreground">
                    Nenhuma MCO para exibir no mapa
                  </p>
                </div>
              </div>
            ) : (
              <MapContainer
                center={[BRAZIL_CENTER.lat, BRAZIL_CENTER.lng]}
                zoom={BRAZIL_ZOOM}
                style={{ height: '100%', width: '100%' }}
                className="z-0"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {mcos.map((mco) => (
                  <MCOMarker key={mco.id} mco={mco} onView={onView} />
                ))}
              </MapContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
