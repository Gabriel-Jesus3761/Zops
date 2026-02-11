/**
 * Serviço de Geocoding com Nominatim + Overpass API
 *
 * Nominatim  → busca textual, retorna coordenadas + endereço
 * Overpass   → busca pelo OSM ID, retorna tags detalhadas do local
 *              (capacidade, cobertura, tipo, estacionamento nearby, etc.)
 *
 * Ambos são gratuitos, sem autenticação e sem limite de requisições para uso leve.
 */

import type { TipoLocal } from '@/features/settings/types/local-evento'

// ─── Tipos Nominatim ─────────────────────────────────────────────────────────

interface NominatimAddress {
  road?: string
  house_number?: string
  suburb?: string
  quarter?: string
  city?: string
  town?: string
  village?: string
  municipality?: string
  state?: string
  state_code?: string
  postcode?: string
  'ISO3166-2-lvl4'?: string // ex: "BR-SP"
}

/**
 * Extrai UF confiável do address do Nominatim.
 * Prioriza ISO3166-2-lvl4 ("BR-SP" → "SP"), que não sofre
 * problemas de encoding como state_code às vezes sofre.
 */
export function extractUF(address: NominatimAddress): string {
  const iso = address['ISO3166-2-lvl4']
  if (iso) return iso.replace(/^BR-/, '')
  return (address.state_code || address.state || '').toUpperCase().slice(0, 2)
}

export interface NominatimResult {
  place_id: string
  osm_type: 'n' | 'w' | 'r' // node | way | relation
  osm_id: string
  lat: string
  lon: string
  display_name: string
  address: NominatimAddress
  class: string
  type: string
}

// ─── Tipos Overpass ──────────────────────────────────────────────────────────

interface OverpassElement {
  type: string
  id: number
  tags?: Record<string, string>
  center?: { lat: number; lon: number }
}

interface OverpassResponse {
  elements: OverpassElement[]
}

// ─── Resultado final mapeado ─────────────────────────────────────────────────

export interface LocalDetailed {
  nome: string
  cidade: string
  uf: string
  cep?: string
  logradouro?: string
  numero?: string
  bairro?: string
  latitude?: number
  longitude?: number
  capacidade_maxima?: number
  tem_cobertura?: boolean
  tem_ar_condicionado?: boolean
  tem_estacionamento?: boolean
  tem_acessibilidade?: boolean
  tipo: TipoLocal
}

// ─── Mapeamento de tags OSM → TipoLocal ─────────────────────────────────────

function mapTipoLocal(tags: Record<string, string>): TipoLocal {
  const { amenity, leisure, tourism, building } = tags

  if (amenity === 'stadium' || leisure === 'stadium' || tourism === 'stadium') return 'estadio'
  if (amenity === 'theatre' || amenity === 'arena' || leisure === 'arena') return 'arena'
  if (
    amenity === 'sports_hall' ||
    leisure === 'sports_centre' ||
    leisure === 'sports_hall' ||
    leisure === 'ice_rink'
  )
    return 'ginasio'
  if (
    amenity === 'conference_centre' ||
    amenity === 'events_venue' ||
    building === 'convention' ||
    building === 'convention_centre'
  )
    return 'centro_convencoes'
  if (leisure === 'park' || tourism === 'theme_park' || tourism === 'water_park') return 'parque'
  if (amenity === 'marketplace' || leisure === 'playground') return 'praca'

  return 'outro'
}

// ─── Nomintim: busca textual ─────────────────────────────────────────────────

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'

export async function searchNominatim(query: string): Promise<NominatimResult[]> {
  const url =
    `${NOMINATIM_BASE}/search?` +
    `q=${encodeURIComponent(query)}&` +
    `format=json&` +
    `addressdetails=1&` +
    `countrycodes=br&` +
    `limit=10`

  const res = await fetch(url, {
    headers: { 'User-Agent': 'ZopsApp/1.0' },
  })

  if (!res.ok) throw new Error('Erro na busca Nominatim')
  return res.json()
}

// ─── Nominatim: reverse geocoding (coordenadas → endereço completo) ─────────

/**
 * Dado lat/lon, retorna o address detalhado do Nominatim.
 * zoom=18 força resolução no nível de rua, que é o que precisamos
 * para obter postcode, road e house_number com maior precisão.
 */
export async function reverseGeocode(lat: number, lon: number): Promise<NominatimAddress> {
  const url =
    `${NOMINATIM_BASE}/reverse?` +
    `lat=${lat}&lon=${lon}&` +
    `format=json&` +
    `addressdetails=1&` +
    `zoom=18`

  const res = await fetch(url, {
    headers: { 'User-Agent': 'ZopsApp/1.0' },
  })

  if (!res.ok) throw new Error('Erro no reverse geocoding Nominatim')
  const data = await res.json()
  return data.address as NominatimAddress
}

// ─── Overpass: detalhes por OSM ID + estacionamento nearby ─────────────────

// Endpoint principal + mirror como fallback
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kielkonstrukt.de/api/interpreter',
]

const OSM_TYPE_MAP: Record<string, string> = {
  n: 'node',
  w: 'way',
  r: 'relation',
}

/**
 * Monta uma única query que:
 *   1. Busca o elemento principal pelo tipo+ID
 *   2. Busca estacionamentos (way/node) em raio de 500 m das coordenadas
 *
 * Retorna todos os elementos com tags + centro geométrico.
 */
function buildOverpassQuery(osmType: string, osmId: string, lat: number, lon: number): string {
  const type = OSM_TYPE_MAP[osmType] || 'node'

  return (
    '[out:json];\n' +
    '(\n' +
    `  ${type}(${osmId});\n` +
    `  way["amenity"="parking"](around:500,${lat},${lon});\n` +
    `  node["amenity"="parking"](around:500,${lat},${lon});\n` +
    ');\n' +
    'out tags center;'
  )
}

async function postOverpass(endpoint: string, body: string): Promise<OverpassResponse> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000) // 10 s max

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: controller.signal,
    })

    if (!res.ok) throw new Error(`Overpass ${res.status}`)

    // Overpass retorna 200 com corpo HTML quando há erro interno no servidor
    const text = await res.text()
    if (text.trimStart().startsWith('<')) throw new Error('Overpass retornou erro no corpo')

    const data = JSON.parse(text)
    if (data.remark && !data.elements?.length) throw new Error('Overpass remark: ' + data.remark)
    return data as OverpassResponse
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Tenta cada endpoint na lista; se o primeiro falhar (timeout / 504 / etc)
 * tenta o mirror após 1 s de espera.
 */
export async function fetchOverpassDetails(
  osmType: string,
  osmId: string,
  lat: number,
  lon: number
): Promise<OverpassResponse> {
  const body = `data=${encodeURIComponent(buildOverpassQuery(osmType, osmId, lat, lon))}`
  let lastError: Error | undefined

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      return await postOverpass(endpoint, body)
    } catch (err) {
      lastError = err as Error
      // Espera 1 s antes de tentar o próximo endpoint
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  throw lastError ?? new Error('Erro na busca Overpass')
}

// ─── Mapeamento Overpass → LocalDetailed ─────────────────────────────────────

/**
 * Recebe o resultado Nominatim (para endereço base) +
 * o resultado Overpass (para tags detalhadas e estacionamento nearby)
 * e retorna um objeto com todos os campos preenchidos.
 */
export function mapOverpassToLocal(
  nominatim: NominatimResult,
  overpass: OverpassResponse,
  reverseAddress?: NominatimAddress
): LocalDetailed {
  const lat = parseFloat(nominatim.lat)
  const lon = parseFloat(nominatim.lon)
  const osm_id_num = parseInt(nominatim.osm_id)

  // Encontrar o elemento principal (mesmo ID do Nominatim)
  const principal = overpass.elements.find((el) => el.id === osm_id_num)
  const tags = principal?.tags || {}

  // Os demais elementos são estacionamentos nearby
  const hasParking = overpass.elements.some(
    (el) => el.id !== osm_id_num && el.tags?.amenity === 'parking'
  )

  // Capacidade: a tag "capacity" pode existir no OSM
  let capacidade: number | undefined
  if (tags.capacity) {
    const num = parseInt(tags.capacity.replace(/\D/g, ''))
    if (!isNaN(num) && num > 0) capacidade = num
  }

  // Cobertura: tags "covered", "roof", ou "building" com valor específico
  const temCobertura =
    tags.covered === 'yes' ||
    (tags.roof != null && tags.roof !== 'no') ||
    tags.building === 'yes' ||
    tags.building === 'yes'

  // AC: tags "ac", "cooling"
  const temAC = tags.ac === 'yes' || tags.cooling === 'yes'

  // Acessibilidade
  const temAcessibilidade = tags.wheelchair === 'yes' || tags.wheelchair === 'designated'

  // Cidade / UF do Nominatim (fallback)
  const cidade =
    nominatim.address.city ||
    nominatim.address.town ||
    nominatim.address.village ||
    nominatim.address.municipality ||
    ''

  const uf = extractUF(nominatim.address)

  return {
    nome: tags.name || nominatim.display_name.split(',')[0].trim(),
    cidade,
    uf,
    cep: (reverseAddress?.postcode || nominatim.address.postcode)?.replace(/\D/g, '') || undefined,
    logradouro: tags['addr:street'] || reverseAddress?.road || nominatim.address.road || undefined,
    numero: tags['addr:housenumber'] || reverseAddress?.house_number || undefined,
    bairro: tags['addr:place'] || reverseAddress?.suburb || nominatim.address.suburb || nominatim.address.quarter || undefined,
    latitude: lat,
    longitude: lon,
    capacidade_maxima: capacidade,
    tem_cobertura: temCobertura || undefined,
    tem_ar_condicionado: temAC || undefined,
    tem_estacionamento: hasParking || undefined,
    tem_acessibilidade: temAcessibilidade || undefined,
    tipo: mapTipoLocal(tags),
  }
}

// ─── Função principal: busca + detalhes em uma única chamada ─────────────────

/**
 * Dado um resultado Nominatim já selecionado pelo usuário,
 * busca os detalhes no Overpass e retorna o objeto completo.
 *
 * Retorna null se o Overpass não retornar dados (fallback para dados do Nominatim apenas).
 */
export async function enrichLocalFromOverpass(result: NominatimResult): Promise<LocalDetailed> {
  const lat = parseFloat(result.lat)
  const lon = parseFloat(result.lon)

  // Reverse geocoding e Overpass em paralelo — não bloqueia um pelo outro
  const [revAddress, overpassData] = await Promise.allSettled([
    reverseGeocode(lat, lon),
    fetchOverpassDetails(result.osm_type, result.osm_id, lat, lon),
  ])

  const rev = revAddress.status === 'fulfilled' ? revAddress.value : undefined

  if (overpassData.status === 'fulfilled') {
    return mapOverpassToLocal(result, overpassData.value, rev)
  }

  // Fallback: sem Overpass, mas com reverse geocoding se disponível
  const cidade =
    rev?.city ||
    result.address.city ||
    result.address.town ||
    result.address.village ||
    result.address.municipality ||
    ''

  const uf = extractUF(rev || result.address)

  return {
    nome: result.display_name.split(',')[0].trim(),
    cidade,
    uf,
    cep: (rev?.postcode || result.address.postcode)?.replace(/\D/g, '') || undefined,
    logradouro: rev?.road || result.address.road || undefined,
    numero: rev?.house_number || undefined,
    bairro: rev?.suburb || result.address.suburb || result.address.quarter || undefined,
    latitude: lat,
    longitude: lon,
    tipo: 'outro',
  }
}
