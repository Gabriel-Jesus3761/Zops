// Coordenadas das principais cidades brasileiras
export const brazilCitiesCoordinates: Record<string, { lat: number; lng: number }> = {
  // Capitais e principais cidades
  'São Paulo-SP': { lat: -23.5505, lng: -46.6333 },
  'Rio de Janeiro-RJ': { lat: -22.9068, lng: -43.1729 },
  'Belo Horizonte-MG': { lat: -19.9167, lng: -43.9345 },
  'Brasília-DF': { lat: -15.7939, lng: -47.8828 },
  'Salvador-BA': { lat: -12.9714, lng: -38.5014 },
  'Fortaleza-CE': { lat: -3.7172, lng: -38.5433 },
  'Curitiba-PR': { lat: -25.4297, lng: -49.2719 },
  'Recife-PE': { lat: -8.0476, lng: -34.8770 },
  'Porto Alegre-RS': { lat: -30.0346, lng: -51.2177 },
  'Manaus-AM': { lat: -3.1190, lng: -60.0217 },
  'Belém-PA': { lat: -1.4558, lng: -48.4902 },
  'Goiânia-GO': { lat: -16.6869, lng: -49.2648 },
  'Guarulhos-SP': { lat: -23.4538, lng: -46.5333 },
  'Campinas-SP': { lat: -22.9099, lng: -47.0626 },
  'São Luís-MA': { lat: -2.5307, lng: -44.3068 },
  'São Gonçalo-RJ': { lat: -22.8268, lng: -43.0534 },
  'Maceió-AL': { lat: -9.6658, lng: -35.7353 },
  'Duque de Caxias-RJ': { lat: -22.7858, lng: -43.3054 },
  'Natal-RN': { lat: -5.7945, lng: -35.2110 },
  'Teresina-PI': { lat: -5.0892, lng: -42.8019 },
  'Campo Grande-MS': { lat: -20.4697, lng: -54.6201 },
  'Nova Iguaçu-RJ': { lat: -22.7592, lng: -43.4511 },
  'São Bernardo do Campo-SP': { lat: -23.6914, lng: -46.5647 },
  'João Pessoa-PB': { lat: -7.1195, lng: -34.8450 },
  'Santo André-SP': { lat: -23.6639, lng: -46.5333 },
  'Osasco-SP': { lat: -23.5329, lng: -46.7919 },
  'Jaboatão dos Guararapes-PE': { lat: -8.1137, lng: -35.0147 },
  'São José dos Campos-SP': { lat: -23.1791, lng: -45.8872 },
  'Ribeirão Preto-SP': { lat: -21.1704, lng: -47.8103 },
  'Uberlândia-MG': { lat: -18.9113, lng: -48.2622 },
  'Contagem-MG': { lat: -19.9320, lng: -44.0540 },
  'Sorocaba-SP': { lat: -23.5015, lng: -47.4526 },
  'Aracaju-SE': { lat: -10.9472, lng: -37.0731 },
  'Feira de Santana-BA': { lat: -12.2664, lng: -38.9663 },
  'Cuiabá-MT': { lat: -15.6014, lng: -56.0979 },
  'Joinville-SC': { lat: -26.3045, lng: -48.8487 },
  'Juiz de Fora-MG': { lat: -21.7642, lng: -43.3502 },
  'Londrina-PR': { lat: -23.3045, lng: -51.1696 },
  'Aparecida de Goiânia-GO': { lat: -16.8173, lng: -49.2437 },
  'Porto Velho-RO': { lat: -8.7612, lng: -63.9004 },
  'Ananindeua-PA': { lat: -1.3656, lng: -48.3720 },
  'Serra-ES': { lat: -20.1287, lng: -40.3075 },
  'Niterói-RJ': { lat: -22.8833, lng: -43.1036 },
  'Belford Roxo-RJ': { lat: -22.7641, lng: -43.3995 },
  'Campos dos Goytacazes-RJ': { lat: -21.7622, lng: -41.3182 },
  'Caxias do Sul-RS': { lat: -29.1634, lng: -51.1797 },
  'Macapá-AP': { lat: 0.0389, lng: -51.0664 },
  'Vila Velha-ES': { lat: -20.3297, lng: -40.2925 },
  'Florianópolis-SC': { lat: -27.5954, lng: -48.5480 },
  'Mauá-SP': { lat: -23.6678, lng: -46.4612 },
  'São João de Meriti-RJ': { lat: -22.8040, lng: -43.3720 },
  'Santos-SP': { lat: -23.9618, lng: -46.3322 },
  'Mogi das Cruzes-SP': { lat: -23.5225, lng: -46.1883 },
  'Diadema-SP': { lat: -23.6861, lng: -46.6228 },
  'Betim-MG': { lat: -19.9681, lng: -44.1983 },
  'Jundiaí-SP': { lat: -23.1864, lng: -46.8842 },
  'Carapicuíba-SP': { lat: -23.5225, lng: -46.8356 },
  'Piracicaba-SP': { lat: -22.7253, lng: -47.6492 },
  'Cariacica-ES': { lat: -20.2620, lng: -40.4165 },
  'Bauru-SP': { lat: -22.3147, lng: -49.0608 },
  'Montes Claros-MG': { lat: -16.7352, lng: -43.8619 },
  'Olinda-PE': { lat: -8.0089, lng: -34.8553 },
  'Vitória-ES': { lat: -20.3155, lng: -40.3128 },
  'Canoas-RS': { lat: -29.9177, lng: -51.1844 },
  'Pelotas-RS': { lat: -31.7654, lng: -52.3376 },
  'Itaquaquecetuba-SP': { lat: -23.4864, lng: -46.3483 },
  'Caruaru-PE': { lat: -8.2837, lng: -35.9761 },
  'Vitória da Conquista-BA': { lat: -14.8615, lng: -40.8442 },
  'Blumenau-SC': { lat: -26.9194, lng: -49.0661 },
  'Ponta Grossa-PR': { lat: -25.0916, lng: -50.1668 },
  'Boa Vista-RR': { lat: 2.8235, lng: -60.6758 },
  'Franca-SP': { lat: -20.5386, lng: -47.4008 },
  'Paulista-PE': { lat: -7.9406, lng: -34.8728 },
  'Petrolina-PE': { lat: -9.3891, lng: -40.5030 },
  'Cascavel-PR': { lat: -24.9555, lng: -53.4552 },
  'Petrópolis-RJ': { lat: -22.5051, lng: -43.1788 },
  'Praia Grande-SP': { lat: -24.0059, lng: -46.4128 },
  'Rio Branco-AC': { lat: -9.9747, lng: -67.8243 },
  'Suzano-SP': { lat: -23.5425, lng: -46.3108 },
  'Taubaté-SP': { lat: -23.0262, lng: -45.5555 },
  'Guarujá-SP': { lat: -23.9933, lng: -46.2564 },
  'Limeira-SP': { lat: -22.5647, lng: -47.4017 },
  'Palmas-TO': { lat: -10.1847, lng: -48.3336 },
  'Gravataí-RS': { lat: -29.9439, lng: -50.9911 },
  'Taboão da Serra-SP': { lat: -23.6092, lng: -46.7586 },
  'Várzea Grande-MT': { lat: -15.6467, lng: -56.1326 },
  'Embu das Artes-SP': { lat: -23.6489, lng: -46.8519 },
}

/**
 * Obtém as coordenadas de uma cidade brasileira
 * @param city Nome da cidade
 * @param state Sigla do estado (UF)
 * @returns Coordenadas lat/lng ou coordenadas do Brasil (centro) se não encontrado
 */
export function getCityCoordinates(city: string, state: string): { lat: number; lng: number } {
  const key = `${city}-${state}`

  // Retorna coordenadas da cidade se encontrada
  if (brazilCitiesCoordinates[key]) {
    return brazilCitiesCoordinates[key]
  }

  // Fallback: centro geográfico do Brasil
  return { lat: -14.2350, lng: -51.9253 }
}

/**
 * Centro geográfico do Brasil para o mapa
 */
export const BRAZIL_CENTER = { lat: -14.2350, lng: -51.9253 }

/**
 * Zoom padrão para visualização do Brasil completo
 */
export const BRAZIL_ZOOM = 4
