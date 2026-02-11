// types/local-evento.ts

export type TipoLocal =
  | 'arena'
  | 'estadio'
  | 'ginasio'
  | 'centro_convencoes'
  | 'parque'
  | 'praca'
  | 'outro';

export const TIPOS_LOCAL: { value: TipoLocal; label: string }[] = [
  { value: 'arena', label: 'Arena' },
  { value: 'estadio', label: 'Estádio' },
  { value: 'ginasio', label: 'Ginásio' },
  { value: 'centro_convencoes', label: 'Centro de Convenções' },
  { value: 'parque', label: 'Parque' },
  { value: 'praca', label: 'Praça' },
  { value: 'outro', label: 'Outro' },
];

export interface LocalEvento {
  id: string;

  // Básico
  nome: string;
  apelido?: string | null;
  tipo?: TipoLocal | null;

  // Localização
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade: string;
  uf: string;
  cep: string;
  latitude?: number | null;
  longitude?: number | null;

  // Capacidade
  capacidade_maxima?: number | null;
  capacidade_sentado?: number | null;
  capacidade_em_pe?: number | null;

  // Infraestrutura
  tem_cobertura?: boolean;
  tem_ar_condicionado?: boolean;
  tem_estacionamento?: boolean;
  vagas_estacionamento?: number | null;
  tem_acessibilidade?: boolean;

  // Contato
  contato_nome?: string | null;
  contato_telefone?: string | null;
  contato_email?: string | null;

  // Observações
  observacoes?: string | null;

  // Metadados
  ativo: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface LocalEventoFormData {
  nome: string;
  apelido?: string;
  tipo: TipoLocal;
  cidade: string;
  uf: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  capacidade_maxima?: number;
  capacidade_sentado?: number;
  capacidade_em_pe?: number;
  tem_cobertura: boolean;
  tem_ar_condicionado: boolean;
  tem_estacionamento: boolean;
  vagas_estacionamento?: number;
  tem_acessibilidade: boolean;
  contato_nome?: string;
  contato_telefone?: string;
  contato_email?: string;
  observacoes?: string;
  ativo: boolean;
}

export interface LocalEventoImportRow {
  nome: string;
  apelido?: string;
  tipo: string;
  cidade: string;
  uf: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  capacidade_maxima?: string | number;
  capacidade_sentado?: string | number;
  capacidade_em_pe?: string | number;
  tem_cobertura?: string;
  tem_ar_condicionado?: string;
  tem_estacionamento?: string;
  vagas_estacionamento?: string | number;
  tem_acessibilidade?: string;
  contato_nome?: string;
  contato_telefone?: string;
  contato_email?: string;
  observacoes?: string;
}

export interface ValidationError {
  linha: number;
  campo: string;
  erro: string;
  tipo: 'erro' | 'aviso';
}

export interface ImportResult {
  total: number;
  sucesso: number;
  avisos: number;
  erros: number;
  detalhes: ValidationError[];
  dadosValidos: LocalEventoFormData[];
}

export function getTipoLabel(tipo?: TipoLocal | null): string {
  if (!tipo) return 'Outro';
  const found = TIPOS_LOCAL.find(t => t.value === tipo);
  return found?.label || 'Outro';
}

export function formatCapacidade(capacidade?: number | null): string {
  if (!capacidade) return '-';
  return capacidade.toLocaleString('pt-BR');
}
