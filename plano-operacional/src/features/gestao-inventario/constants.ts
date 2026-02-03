// Gestão de Inventário - Constants
// Adapted from C:\Dev\plano-operacional\src\routes\components\GestaoInventario\constants.js

export const MAPEAMENTO_ATIVOS_SERIALIZADOS = {
  EQUIPAMENTOS: {
    tipos: ['SMARTPOS', 'POS', 'TOTEM', 'POWER_BANK', 'CELULAR', 'TABLET', 'NOTEBOOK', 'IMPRESSORA', 'CAIXA', 'CARRO', 'SERVIDOR DE MESA'],
    modelos: {
      SMARTPOS: {
        'SUNMI P2': ['Pinbank', 'PagSeguro', 'PagSeguro (Zig Tickets)', 'Safra', 'Getnet', 'BZPAY', 'Fiserv'],
        'SUNMI P2 A11': ['PagSeguro'],
        'P2 A11': ['Pinbank'],
        'SUNMI P2 MINI': ['BZPAY'],
        'PAX A910': ['Mercado Pago', 'Safra'],
        'MODERNINHA X': ['PagSeguro'],
        'MODERNINHA X A50': ['PagSeguro'],
        A930: ['PagSeguro'],
        DX8000: ['Cielo'],
        L300: ['Cielo'],
        L400: ['Cielo', 'Rede'],
        'A920 PRO': ['Paybyrd'],
        'PAX A920': ['Paybyrd', 'Netpay'],
        'PAX A50': ['PagSeguro'],
        'PAX N950': ['Mercado Pago'],
      },
      POS: {
        'PAX A77': ['Paybyrd', '(Zig Tickets)'],
        'A77 TECTOY': ['Tectoy'],
        CELULAR: ['(Zig Tickets)', 'PDV CELULAR', 'N/A'],
        PINPAD: ['Link2500'],
        'PAX SK800': ['N/A'],
      },
      TOTEM: {
        'FICHA': ['N/A'],
        'CASHLESS': ['N/A'],
      },
      'POWER BANK': {
        '10 mAh': ['N/A'],
        '21 mAh': ['N/A'],
        GENERICO: ['N/A'],
      },
      CELULAR: {
        'PDV CELULAR': ['N/A'],
      },
      TABLET: {
        'BRANCO': ['N/A'],
      },
      'SERVIDOR DE MESA': {
        'N/A': ['N/A'],
      },
      NOTEBOOK: {
        'NOTEBOOK GENERICO': ['N/A'],
        'LATITUDE 3420': ['Dell'],
        'INSPIRION 3501': ['Dell'],
        'INSPIRON 5502': ['Dell'],
        'INSPIRON 3567': ['Dell'],
        'INSPIRON 7472': ['Dell'],
        'INSPIRON 5402': ['Dell'],
        'INSPIRON 3501': ['Dell'],
        'VOSTRO 3510': ['Dell'],
        'INSPIRON 3510': ['Dell'],
        'LATITUDE 3520': ['Dell'],
        'VOSTRO 5510': ['Dell'],
        'INSPIRON 5510': ['Dell'],
      },
      IMPRESSORA: {
        'IMPRESSORA LASER': ['Laser'],
        'IMPRESSORA ZEBRA': ['Zebra'],
        'IMPRESSORA BEMATECH/BLUETOOTH/EPSON': ['Bematech/Bluetooth/Epson'],
      },
      CAIXA: {
        'AZUL': ['AZUL'],
      },
      CARRO: {
        'TRANSPORTE': ['N/A'],
      },
    },
  },
}

export const DETALHAMENTOS = {
  Good: ['Em perfeito estado'],
  Bad: [
    'Em manutenção',
    'Obsoleto',
    'Tamper',
    'Não Liga',
    'Leitor de cartão danificado',
    'Perda protocolada',
    'Perda não protocolada',
    'Possível perda',
    'Baixa na adquirente',
    'Problema de conexão',
    'Queda de EC',
    'Tela quebrada',
    'Tampa da caixa da bobina quebrada',
    'Devolvido para adquirente',
    'Problema não mapeado',
  ],
  Indisponível: ['Possível perda', 'Perda'],
}

export const CATEGORIA_PARQUE_OPTIONS = [
  'Fixo',
  'Disponível',
  'Indisponível',
  'Observação',
  'Rotativo',
  'Para Manutenção',
  'Perda',
  'Possível Perda',
  'Devolvida para adquirente',
  'Devolvida para a terceirizada',
]

export const SUBCATEGORIA_PARQUE_OPTIONS = [
  'Casas',
  'Eventos',
  'Estoque',
  'Feiras',
  'Mineirão',
  'Urbia',
  'Cliente',
  'Escritório',
  'Parques Municipais',
  'Trânsito',
  'Arenas',
  'Labels',
]

export const MAPEAMENTO_FILIAIS = {
  'São Paulo - SP (Matriz)': 'sao_paulo',
  'Rio de Janeiro - RJ': 'rio_de_janeiro',
  'Salvador - BA': 'salvador',
  'Vitória - ES': 'vitoria',
  'Belém - PA': 'belem',
  'Recife - PE': 'recife',
  'Belo Horizonte - MG': 'belo_horizonte',
  'Goiânia - GO': 'goiania',
  'Porto Alegre - RS': 'porto_alegre',
  'Fortaleza - CE': 'fortaleza',
  'Brasília - DF': 'brasilia',
  'Curitiba - PR': 'curitiba',
  'Florianópolis - SC': 'florianopolis',
  'Cuiabá - MT': 'cuiaba',
  'Manaus - AM': 'manaus',
  'GL Santos - SP': 'glsantos',
  'São Paulo Expo - SP': 'sao_paulo_expo',
  'Anhembi - SP': 'anhembi',
  'Mineirão - MG': 'mineirao',
  'Allianz Parque - SP': 'allianz_parque',
  'Pacaembu - SP': 'pacaembu',
  'Estádio Major Antônio Couto Pereira - PR': 'couto_pereira',
  'Parque Ibirapuera - SP': 'parque_ibirapuera',
  'GL Riocentro - RJ': 'gl_riocentro',
  'Automatização': 'automatizacao',
}

export const SITUACAO_OPTIONS = [
  'Ativo',
  'Inativo',
  'Em Manutenção',
  'Obsoleto',
  'Perda',
  'Devolvido',
]

// Helper functions to extract unique values
export const getTiposAtivosSerializados = (): string[] => {
  const tipos = new Set<string>()
  Object.values(MAPEAMENTO_ATIVOS_SERIALIZADOS).forEach(categoria => {
    if ('tipos' in categoria && Array.isArray(categoria.tipos)) {
      categoria.tipos.forEach(tipo => tipos.add(tipo))
    }
    if ('modelos' in categoria && typeof categoria.modelos === 'object') {
      Object.keys(categoria.modelos).forEach(tipo => tipos.add(tipo))
    }
  })
  return Array.from(tipos).sort()
}

export const getModelosAtivosSerializados = (): string[] => {
  const modelos = new Set<string>()
  Object.values(MAPEAMENTO_ATIVOS_SERIALIZADOS).forEach(categoria => {
    if ('modelos' in categoria && typeof categoria.modelos === 'object') {
      Object.values(categoria.modelos).forEach(modelosObj => {
        if (typeof modelosObj === 'object' && modelosObj !== null && !Array.isArray(modelosObj)) {
          Object.keys(modelosObj).forEach(modelo => modelos.add(modelo))
        }
      })
    }
  })
  return Array.from(modelos).sort()
}

export const getAdquirenciasAtivosSerializados = (): string[] => {
  const adquirencias = new Set<string>()
  Object.values(MAPEAMENTO_ATIVOS_SERIALIZADOS).forEach(categoria => {
    if ('modelos' in categoria && typeof categoria.modelos === 'object') {
      Object.values(categoria.modelos).forEach(modelosObj => {
        if (typeof modelosObj === 'object' && modelosObj !== null && !Array.isArray(modelosObj)) {
          Object.values(modelosObj).forEach(adqArray => {
            if (Array.isArray(adqArray)) {
              adqArray.forEach(adq => adquirencias.add(adq))
            }
          })
        }
      })
    }
  })
  return Array.from(adquirencias).sort()
}

export const getDetalhamentosAtivosSerializados = (): string[] => {
  return [...DETALHAMENTOS.Good, ...DETALHAMENTOS.Bad]
}

export const FILIAIS_LIST = Object.keys(MAPEAMENTO_FILIAIS).sort()

// Export all filter options in a single object for easy consumption
export const FILTER_OPTIONS = {
  tipo: getTiposAtivosSerializados(),
  modelo: getModelosAtivosSerializados(),
  adquirencia: getAdquirenciasAtivosSerializados(),
  alocacao: FILIAIS_LIST,
  categoria_parque: CATEGORIA_PARQUE_OPTIONS,
  subcategoria_parque: SUBCATEGORIA_PARQUE_OPTIONS,
  situacao: SITUACAO_OPTIONS,
  detalhamento: getDetalhamentosAtivosSerializados(),
}
