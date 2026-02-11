import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useLocaisEventos } from '../../hooks/use-locais-eventos'
import { TIPOS_LOCAL, type LocalEvento, type TipoLocal } from '../../types/local-evento'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface LocalEventoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingLocal?: LocalEvento | null
  onSuccess?: () => void
}

interface FormData {
  nome: string
  apelido: string
  tipo: TipoLocal
  cidade: string
  uf: string
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  capacidade_maxima: string
  capacidade_sentado: string
  capacidade_em_pe: string
  tem_cobertura: boolean
  tem_ar_condicionado: boolean
  tem_estacionamento: boolean
  vagas_estacionamento: string
  tem_acessibilidade: boolean
  contato_nome: string
  contato_telefone: string
  contato_email: string
  observacoes: string
  ativo: boolean
}

const INITIAL_FORM_DATA: FormData = {
  nome: '',
  apelido: '',
  tipo: 'outro',
  cidade: '',
  uf: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  capacidade_maxima: '',
  capacidade_sentado: '',
  capacidade_em_pe: '',
  tem_cobertura: false,
  tem_ar_condicionado: false,
  tem_estacionamento: false,
  vagas_estacionamento: '',
  tem_acessibilidade: false,
  contato_nome: '',
  contato_telefone: '',
  contato_email: '',
  observacoes: '',
  ativo: true,
}

const UF_OPTIONS = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
]

export function LocalEventoModal({
  open,
  onOpenChange,
  editingLocal,
  onSuccess,
}: LocalEventoModalProps) {
  const { createLocal, updateLocal, isCreating, isUpdating } = useLocaisEventos()
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA)
  const [isFetchingCep, setIsFetchingCep] = useState(false)

  const isEditing = !!editingLocal
  const isLoading = isCreating || isUpdating

  useEffect(() => {
    if (open) {
      if (editingLocal) {
        setFormData({
          nome: editingLocal.nome || '',
          apelido: editingLocal.apelido || '',
          tipo: (editingLocal.tipo as TipoLocal) || 'outro',
          cidade: editingLocal.cidade || '',
          uf: editingLocal.uf || '',
          cep: formatCep(editingLocal.cep || ''),
          logradouro: editingLocal.logradouro || '',
          numero: editingLocal.numero || '',
          complemento: editingLocal.complemento || '',
          bairro: editingLocal.bairro || '',
          capacidade_maxima: editingLocal.capacidade_maxima?.toString() || '',
          capacidade_sentado: editingLocal.capacidade_sentado?.toString() || '',
          capacidade_em_pe: editingLocal.capacidade_em_pe?.toString() || '',
          tem_cobertura: editingLocal.tem_cobertura || false,
          tem_ar_condicionado: editingLocal.tem_ar_condicionado || false,
          tem_estacionamento: editingLocal.tem_estacionamento || false,
          vagas_estacionamento: editingLocal.vagas_estacionamento?.toString() || '',
          tem_acessibilidade: editingLocal.tem_acessibilidade || false,
          contato_nome: editingLocal.contato_nome || '',
          contato_telefone: editingLocal.contato_telefone || '',
          contato_email: editingLocal.contato_email || '',
          observacoes: editingLocal.observacoes || '',
          ativo: editingLocal.ativo ?? true,
        })
      } else {
        setFormData(INITIAL_FORM_DATA)
      }
    }
  }, [open, editingLocal])

  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 8)
    if (numbers.length > 5) {
      return `${numbers.slice(0, 5)}-${numbers.slice(5)}`
    }
    return numbers
  }

  const formatTelefone = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11)
    if (numbers.length > 10) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`
    } else if (numbers.length > 6) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`
    } else if (numbers.length > 2) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
    }
    return numbers
  }

  const fetchCepData = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '')
    if (cleanCep.length !== 8) return

    setIsFetchingCep(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
      const data = await response.json()

      if (data.erro) {
        toast.error('CEP não encontrado')
        return
      }

      setFormData((prev) => ({
        ...prev,
        logradouro: data.logradouro || prev.logradouro,
        bairro: data.bairro || prev.bairro,
        cidade: data.localidade || prev.cidade,
        uf: data.uf || prev.uf,
      }))
    } catch (error) {
      console.error('Erro ao buscar CEP:', error)
    } finally {
      setIsFetchingCep(false)
    }
  }

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    if (field === 'cep') {
      const formatted = formatCep(value as string)
      setFormData((prev) => ({ ...prev, cep: formatted }))
      if (formatted.replace(/\D/g, '').length === 8) {
        fetchCepData(formatted)
      }
    } else if (field === 'contato_telefone') {
      setFormData((prev) => ({ ...prev, contato_telefone: formatTelefone(value as string) }))
    } else if (field === 'uf') {
      setFormData((prev) => ({ ...prev, uf: (value as string).toUpperCase().slice(0, 2) }))
    } else if (field === 'nome') {
      // Title case para nome
      const titleCase = (value as string)
        .toLowerCase()
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
      setFormData((prev) => ({ ...prev, nome: titleCase }))
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }))
    }
  }

  const handleSave = async () => {
    // Validações
    if (!formData.nome.trim()) {
      toast.error('Nome é obrigatório')
      return
    }
    if (!formData.cidade.trim()) {
      toast.error('Cidade é obrigatória')
      return
    }
    if (!formData.uf.trim() || formData.uf.length !== 2) {
      toast.error('UF é obrigatória (2 caracteres)')
      return
    }

    const data = {
      nome: formData.nome.trim(),
      apelido: formData.apelido.trim() || undefined,
      tipo: formData.tipo,
      cidade: formData.cidade.trim(),
      uf: formData.uf.toUpperCase(),
      cep: formData.cep.replace(/\D/g, '') || undefined,
      logradouro: formData.logradouro.trim() || undefined,
      numero: formData.numero.trim() || undefined,
      complemento: formData.complemento.trim() || undefined,
      bairro: formData.bairro.trim() || undefined,
      capacidade_maxima: formData.capacidade_maxima ? parseInt(formData.capacidade_maxima) : undefined,
      capacidade_sentado: formData.capacidade_sentado ? parseInt(formData.capacidade_sentado) : undefined,
      capacidade_em_pe: formData.capacidade_em_pe ? parseInt(formData.capacidade_em_pe) : undefined,
      tem_cobertura: formData.tem_cobertura,
      tem_ar_condicionado: formData.tem_ar_condicionado,
      tem_estacionamento: formData.tem_estacionamento,
      vagas_estacionamento: formData.vagas_estacionamento
        ? parseInt(formData.vagas_estacionamento)
        : undefined,
      tem_acessibilidade: formData.tem_acessibilidade,
      contato_nome: formData.contato_nome.trim() || undefined,
      contato_telefone: formData.contato_telefone.trim() || undefined,
      contato_email: formData.contato_email.trim() || undefined,
      observacoes: formData.observacoes.trim() || undefined,
      ativo: formData.ativo,
    }

    try {
      if (isEditing && editingLocal) {
        await updateLocal({ id: editingLocal.id, data })
      } else {
        await createLocal(data as any)
      }
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      // Erro já tratado no hook
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Local' : 'Novo Local de Evento'}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basico" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basico">Básico</TabsTrigger>
            <TabsTrigger value="localizacao">Localização</TabsTrigger>
            <TabsTrigger value="infraestrutura">Infra</TabsTrigger>
            <TabsTrigger value="contato">Contato</TabsTrigger>
          </TabsList>

          <TabsContent value="basico" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Local *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => handleChange('nome', e.target.value)}
                placeholder="Ex: Allianz Parque"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apelido">Apelido</Label>
              <Input
                id="apelido"
                value={formData.apelido}
                onChange={(e) => handleChange('apelido', e.target.value)}
                placeholder="Ex: Palestra Itália"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo *</Label>
              <Select value={formData.tipo} onValueChange={(v) => handleChange('tipo', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_LOCAL.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacidade_maxima">Capacidade Máxima</Label>
                <Input
                  id="capacidade_maxima"
                  type="number"
                  value={formData.capacidade_maxima}
                  onChange={(e) => handleChange('capacidade_maxima', e.target.value)}
                  placeholder="Ex: 50000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacidade_sentado">Cap. Sentado</Label>
                <Input
                  id="capacidade_sentado"
                  type="number"
                  value={formData.capacidade_sentado}
                  onChange={(e) => handleChange('capacidade_sentado', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacidade_em_pe">Cap. Em Pé</Label>
                <Input
                  id="capacidade_em_pe"
                  type="number"
                  value={formData.capacidade_em_pe}
                  onChange={(e) => handleChange('capacidade_em_pe', e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(v) => handleChange('ativo', v)}
              />
              <Label htmlFor="ativo">Local ativo</Label>
            </div>
          </TabsContent>

          <TabsContent value="localizacao" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade *</Label>
                <Input
                  id="cidade"
                  value={formData.cidade}
                  onChange={(e) => handleChange('cidade', e.target.value)}
                  placeholder="Ex: São Paulo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="uf">UF *</Label>
                <Select value={formData.uf} onValueChange={(v) => handleChange('uf', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {UF_OPTIONS.map((uf) => (
                      <SelectItem key={uf} value={uf}>
                        {uf}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cep">CEP</Label>
              <div className="relative">
                <Input
                  id="cep"
                  value={formData.cep}
                  onChange={(e) => handleChange('cep', e.target.value)}
                  placeholder="00000-000"
                />
                {isFetchingCep && (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logradouro">Endereço</Label>
              <Input
                id="logradouro"
                value={formData.logradouro}
                onChange={(e) => handleChange('logradouro', e.target.value)}
                placeholder="Ex: Rua Turiassú"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numero">Número</Label>
                <Input
                  id="numero"
                  value={formData.numero}
                  onChange={(e) => handleChange('numero', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="complemento">Complemento</Label>
                <Input
                  id="complemento"
                  value={formData.complemento}
                  onChange={(e) => handleChange('complemento', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bairro">Bairro</Label>
              <Input
                id="bairro"
                value={formData.bairro}
                onChange={(e) => handleChange('bairro', e.target.value)}
              />
            </div>
          </TabsContent>

          <TabsContent value="infraestrutura" className="mt-4 space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="tem_cobertura">Cobertura</Label>
                <Switch
                  id="tem_cobertura"
                  checked={formData.tem_cobertura}
                  onCheckedChange={(v) => handleChange('tem_cobertura', v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="tem_ar_condicionado">Ar Condicionado</Label>
                <Switch
                  id="tem_ar_condicionado"
                  checked={formData.tem_ar_condicionado}
                  onCheckedChange={(v) => handleChange('tem_ar_condicionado', v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="tem_acessibilidade">Acessibilidade</Label>
                <Switch
                  id="tem_acessibilidade"
                  checked={formData.tem_acessibilidade}
                  onCheckedChange={(v) => handleChange('tem_acessibilidade', v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="tem_estacionamento">Estacionamento</Label>
                <Switch
                  id="tem_estacionamento"
                  checked={formData.tem_estacionamento}
                  onCheckedChange={(v) => handleChange('tem_estacionamento', v)}
                />
              </div>

              {formData.tem_estacionamento && (
                <div className="space-y-2 border-l-2 border-muted pl-4">
                  <Label htmlFor="vagas_estacionamento">Vagas de Estacionamento</Label>
                  <Input
                    id="vagas_estacionamento"
                    type="number"
                    value={formData.vagas_estacionamento}
                    onChange={(e) => handleChange('vagas_estacionamento', e.target.value)}
                    placeholder="Ex: 2000"
                  />
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="contato" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contato_nome">Nome do Contato</Label>
              <Input
                id="contato_nome"
                value={formData.contato_nome}
                onChange={(e) => handleChange('contato_nome', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contato_telefone">Telefone</Label>
                <Input
                  id="contato_telefone"
                  value={formData.contato_telefone}
                  onChange={(e) => handleChange('contato_telefone', e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contato_email">Email</Label>
                <Input
                  id="contato_email"
                  type="email"
                  value={formData.contato_email}
                  onChange={(e) => handleChange('contato_email', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => handleChange('observacoes', e.target.value)}
                rows={4}
                placeholder="Informações adicionais sobre o local..."
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Salvar' : 'Criar Local'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
