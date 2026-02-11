import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Building2,
  Search,
  Pencil,
  Eye,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Users,
  CheckCircle2,
  MapPin,
  Download,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { clientsService } from '../services/clients.service'
import type { Client } from '../types/client'
import { toast } from 'sonner'

const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]

const emptyFormData = {
  name: '',
  document: '',
  email: '',
  phone: '',
  city: '',
  state: '',
  isActive: true,
}

// Função para formatar CPF/CNPJ
const formatDocument = (value: string) => {
  // Remove tudo que não é dígito
  const numbers = value.replace(/\D/g, '')

  // CPF: 000.000.000-00
  if (numbers.length <= 11) {
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }

  // CNPJ: 00.000.000/0000-00
  return numbers
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

// Função para formatar telefone
const formatPhone = (value: string) => {
  const numbers = value.replace(/\D/g, '')

  // (00) 00000-0000 ou (00) 0000-0000
  if (numbers.length <= 10) {
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  }

  return numbers
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
}

export function ManageClients() {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [viewingClient, setViewingClient] = useState<Client | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState(emptyFormData)

  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsService.getClients(),
  })

  const stats = useMemo(() => {
    if (!data?.clients) return { total: 0, active: 0, states: 0 }
    return clientsService.getStats(data.clients)
  }, [data?.clients])

  const createMutation = useMutation({
    mutationFn: (data: Omit<Client, 'id'>) => clientsService.createClient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      setIsCreating(false)
      setFormData(emptyFormData)
      toast.success('Cliente criado com sucesso!')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar cliente')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ clientId, data }: { clientId: string; data: Partial<Client> }) =>
      clientsService.updateClient(clientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      setEditingClient(null)
      toast.success('Cliente atualizado com sucesso!')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar cliente')
    },
  })

  useEffect(() => {
    if (editingClient) {
      setFormData({
        name: editingClient.name || '',
        document: editingClient.document || '',
        email: editingClient.email || '',
        phone: editingClient.phone || '',
        city: editingClient.city || '',
        state: editingClient.state || '',
        isActive: editingClient.isActive ?? true,
      })
    }
  }, [editingClient])

  const handleEdit = (client: Client) => {
    setEditingClient(client)
  }

  const handleSaveEdit = () => {
    if (!editingClient) return

    updateMutation.mutate({
      clientId: editingClient.id,
      data: formData,
    })
  }

  const handleCreate = () => {
    createMutation.mutate(formData as Omit<Client, 'id'>)
  }

  const handleOpenCreate = () => {
    setFormData(emptyFormData)
    setIsCreating(true)
  }

  const handleCloseDialog = () => {
    setEditingClient(null)
    setIsCreating(false)
    setFormData(emptyFormData)
  }

  const filteredClients = data?.clients.filter((client) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      client.name?.toLowerCase().includes(searchLower) ||
      client.document?.toLowerCase().includes(searchLower) ||
      client.email?.toLowerCase().includes(searchLower) ||
      client.city?.toLowerCase().includes(searchLower) ||
      client.state?.toLowerCase().includes(searchLower)
    )
  })

  // Paginação
  const totalPages = Math.ceil((filteredClients?.length || 0) / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedClients = filteredClients?.slice(startIndex, endIndex)

  // Reset para página 1 quando busca mudar
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  const getPageNumbers = () => {
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const pages: (number | string)[] = [1]

    if (currentPage <= 3) {
      pages.push(2, 3, 4, 5, '...', totalPages)
    } else if (currentPage >= totalPages - 2) {
      pages.push('...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
    } else {
      pages.push('...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
    }

    return pages
  }

  const formatLocation = (city?: string, state?: string) => {
    if (city && state) return `${city}/${state}`
    if (city) return city
    if (state) return state
    return '—'
  }

  const handleViewClient = (client: Client) => {
    setViewingClient(client)
  }

  const handleDownloadPDF = () => {
    if (!viewingClient) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Cliente - ${viewingClient.name}</title>
          <style>
            @media print {
              @page {
                margin: 0.8cm;
                size: A4 portrait;
              }
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.3;
              color: #1a1a1a;
              background: #ffffff;
              position: relative;
              overflow: hidden;
            }
            .page {
              max-width: 210mm;
              min-height: 297mm;
              margin: 0 auto;
              padding: 12px 20px 15px;
              position: relative;
              page-break-after: avoid;
            }
            /* Marca d'água com imagem */
            .watermark {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 600px;
              height: 600px;
              background-image: url('/zig.png');
              background-size: contain;
              background-repeat: no-repeat;
              background-position: center;
              opacity: 0.03;
              z-index: -1;
              pointer-events: none;
            }
            /* Header minimalista */
            .header {
              border-bottom: 2px solid #0050C3;
              padding-bottom: 10px;
              margin-bottom: 18px;
            }
            .header-top {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 6px;
            }
            .company-info h1 {
              font-size: 20px;
              font-weight: 300;
              color: #1a1a1a;
              margin-bottom: 3px;
              letter-spacing: -0.5px;
            }
            .company-info .doc-type {
              font-size: 10px;
              color: #666;
              text-transform: uppercase;
              letter-spacing: 0.8px;
            }
            .date-info {
              text-align: right;
              color: #666;
            }
            .date-info .label {
              font-size: 8px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 2px;
            }
            .date-info .value {
              font-size: 10px;
              font-weight: 500;
              color: #1a1a1a;
            }
            /* Seções */
            .section {
              margin-bottom: 16px;
              page-break-inside: avoid;
            }
            .section-title {
              font-size: 9px;
              font-weight: 600;
              color: #666;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 10px;
              padding-left: 10px;
              border-left: 3px solid #0050C3;
            }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 14px 28px;
            }
            .info-item {
              padding: 0;
            }
            .info-label {
              font-size: 8px;
              color: #999;
              font-weight: 500;
              margin-bottom: 4px;
              text-transform: uppercase;
              letter-spacing: 0.7px;
            }
            .info-value {
              font-size: 12px;
              color: #1a1a1a;
              font-weight: 400;
              word-break: break-word;
              line-height: 1.3;
            }
            .info-value.highlight {
              font-weight: 500;
            }
            /* Separador */
            .separator {
              height: 1px;
              background: #e0e0e0;
              margin: 14px 0;
            }
            /* Status Badge - minimalista */
            .status-container {
              display: inline-block;
            }
            .status-badge {
              display: inline-flex;
              align-items: center;
              padding: 5px 12px;
              border-radius: 3px;
              font-size: 10px;
              font-weight: 500;
              letter-spacing: 0.5px;
              text-transform: uppercase;
              border: 1px solid;
            }
            .status-active {
              background: #f0fdf4;
              color: #166534;
              border-color: #86efac;
            }
            .status-inactive {
              background: #f9fafb;
              color: #6b7280;
              border-color: #d1d5db;
            }
            /* Footer */
            .footer {
              margin-top: 15px;
              padding-top: 6px;
              border-top: 1px solid #e0e0e0;
            }
            .footer-content {
              display: flex;
              justify-content: space-between;
              align-items: center;
              color: #999;
              font-size: 7px;
              line-height: 1.3;
            }
            .footer-left .brand {
              color: #0050C3;
              font-weight: 600;
              font-size: 8px;
              margin-bottom: 1px;
            }
            .footer-left .text {
              color: #999;
              font-size: 7px;
            }
            .footer-right {
              text-align: right;
              color: #999;
              font-size: 7px;
            }
            /* Documento ID */
            .doc-id {
              position: absolute;
              top: 20px;
              right: 20px;
              font-size: 7px;
              color: #ccc;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            @media print {
              @page {
                margin: 0;
              }
              body {
                background: white;
                margin: 0;
              }
              .page {
                padding: 12px 20px 15px;
                page-break-after: avoid;
                page-break-inside: avoid;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="watermark"></div>
          <div class="page">
            <div class="doc-id">DOC-${new Date().getTime().toString().slice(-8)}</div>

            <!-- Header -->
            <div class="header">
              <div class="header-top">
                <div class="company-info">
                  <h1>Cadastro de Cliente</h1>
                  <p class="doc-type">Informações Empresariais</p>
                </div>
                <div class="date-info">
                  <div class="label">Data de Emissão</div>
                  <div class="value">${new Date().toLocaleDateString('pt-BR')}</div>
                  <div class="value">${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>
            </div>

            <!-- Identificação -->
            <div class="section">
              <div class="section-title">Identificação</div>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Nome / Razão Social</div>
                  <div class="info-value highlight">${viewingClient.name || '—'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Documento (CNPJ/CPF)</div>
                  <div class="info-value">${viewingClient.document || '—'}</div>
                </div>
              </div>
            </div>

            <div class="separator"></div>

            <!-- Contato -->
            <div class="section">
              <div class="section-title">Informações de Contato</div>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">E-mail Corporativo</div>
                  <div class="info-value">${viewingClient.email || '—'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Telefone</div>
                  <div class="info-value">${viewingClient.phone || '—'}</div>
                </div>
              </div>
            </div>

            <div class="separator"></div>

            <!-- Localização -->
            <div class="section">
              <div class="section-title">Endereço</div>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Cidade</div>
                  <div class="info-value">${viewingClient.city || '—'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Estado</div>
                  <div class="info-value">${viewingClient.state || '—'}</div>
                </div>
              </div>
            </div>

            <div class="separator"></div>

            <!-- Status -->
            <div class="section">
              <div class="section-title">Status do Cadastro</div>
              <div class="status-container">
                <span class="status-badge ${viewingClient.isActive ? 'status-active' : 'status-inactive'}">
                  ${viewingClient.isActive ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>

            <!-- Footer -->
            <div class="footer">
              <div class="footer-content">
                <div class="footer-left">
                  <div class="brand">ZOPS</div>
                  <div class="text">Sistema de Gestão de Clientes</div>
                </div>
                <div class="footer-right">
                  <div>Documento gerado automaticamente</div>
                  <div>© ${new Date().getFullYear()} ZOPS. Todos os direitos reservados.</div>
                </div>
              </div>
            </div>
          </div>

          <script>
            window.onload = function() {
              setTimeout(() => window.print(), 100);
            }
          </script>
        </body>
      </html>
    `

    printWindow.document.write(html)
    printWindow.document.close()
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de clientes</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Clientes ativos</p>
                <p className="text-3xl font-bold">{stats.active}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Estados (UF)</p>
                <p className="text-3xl font-bold">{stats.states}</p>
              </div>
              <MapPin className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, documento ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Novo cliente
        </Button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error instanceof Error ? error.message : 'Erro ao carregar clientes'}
          </AlertDescription>
        </Alert>
      )}

      {/* Table */}
      {!isLoading && !error && filteredClients && (
        <>
          <div className="rounded-md border bg-white dark:bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-white dark:bg-card hover:bg-white dark:hover:bg-card">
                  <TableHead>Nome</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Cidade/UF</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedClients && paginatedClients.length === 0 ? (
                  <TableRow className="bg-white dark:bg-card">
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Nenhum cliente encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedClients?.map((client, index) => (
                    <TableRow
                      key={client.id}
                      className={index % 2 === 0 ? 'bg-white dark:bg-card' : 'bg-gray-50 dark:bg-muted/30'}
                    >
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell className="font-mono text-sm">{client.document || '—'}</TableCell>
                      <TableCell>{client.email || '—'}</TableCell>
                      <TableCell>{client.phone || '—'}</TableCell>
                      <TableCell>{formatLocation(client.city, client.state)}</TableCell>
                      <TableCell>
                        <Badge variant={client.isActive ? 'default' : 'secondary'}>
                          {client.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(client)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewClient(client)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Anterior
              </Button>

              <div className="flex gap-1">
                {getPageNumbers().map((page, index) => {
                  if (page === '...') {
                    return (
                      <span key={`ellipsis-${index}`} className="flex items-center px-2 text-muted-foreground">
                        ...
                      </span>
                    )
                  }
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(Number(page))}
                      className="min-w-[2.5rem]"
                    >
                      {page}
                    </Button>
                  )
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Próxima
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isCreating || !!editingClient} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 rounded-lg bg-teal-500/10">
                <Building2 className="h-5 w-5 text-teal-600" />
              </div>
              {isCreating ? 'Novo Cliente' : 'Editar Cliente'}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {isCreating
                ? 'Preencha os dados para cadastrar um novo cliente'
                : 'Atualize as informações do cliente abaixo'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Identificação */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Nome / Razão Social
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome do cliente"
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="document" className="text-sm font-medium">
                  Documento (CNPJ/CPF)
                </Label>
                <Input
                  id="document"
                  value={formData.document}
                  onChange={(e) => {
                    const formatted = formatDocument(e.target.value)
                    setFormData({ ...formData, document: formatted })
                  }}
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  className="h-10 font-mono"
                  maxLength={18}
                />
              </div>
            </div>

            {/* Contato */}
            <div className="space-y-4 pt-2 border-t">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">
                Contato
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    E-mail
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Telefone
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => {
                      const formatted = formatPhone(e.target.value)
                      setFormData({ ...formData, phone: formatted })
                    }}
                    placeholder="(00) 00000-0000"
                    className="h-10"
                    maxLength={15}
                  />
                </div>
              </div>
            </div>

            {/* Localização */}
            <div className="space-y-4 pt-2 border-t">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">
                Localização
              </p>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="city" className="text-sm font-medium">
                    Cidade
                  </Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="São Paulo"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state" className="text-sm font-medium">
                    UF
                  </Label>
                  <Select
                    value={formData.state}
                    onValueChange={(value) => setFormData({ ...formData, state: value })}
                  >
                    <SelectTrigger id="state" className="h-10">
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                    <SelectContent>
                      {BRAZILIAN_STATES.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2 pt-2 border-t">
              <Label htmlFor="status" className="text-sm font-medium pt-2 block">
                Status
              </Label>
              <Select
                value={formData.isActive ? 'active' : 'inactive'}
                onValueChange={(value) => setFormData({ ...formData, isActive: value === 'active' })}
              >
                <SelectTrigger id="status" className="h-10 w-full sm:w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-4 border-t sm:gap-2">
            <Button variant="outline" onClick={handleCloseDialog} className="flex-1 sm:flex-none">
              Cancelar
            </Button>
            <Button
              onClick={isCreating ? handleCreate : handleSaveEdit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 sm:flex-none"
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isCreating ? 'Criando...' : 'Salvando...'}
                </>
              ) : (
                isCreating ? 'Criar cliente' : 'Salvar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Client Dialog */}
      <Dialog open={!!viewingClient} onOpenChange={() => setViewingClient(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Eye className="h-5 w-5 text-blue-600" />
              </div>
              Visualizar Cliente
            </DialogTitle>
            <DialogDescription className="text-sm">
              Informações detalhadas do cliente
            </DialogDescription>
          </DialogHeader>

          {viewingClient && (
            <div className="space-y-6 py-4">
              {/* Identificação */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Identificação
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Nome / Razão Social</p>
                    <p className="text-sm font-medium">{viewingClient.name || '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Documento (CNPJ/CPF)</p>
                    <p className="text-sm font-medium font-mono">{viewingClient.document || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Contato */}
              <div className="space-y-3 pt-3 border-t">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Contato
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">E-mail</p>
                    <p className="text-sm font-medium">{viewingClient.email || '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Telefone</p>
                    <p className="text-sm font-medium">{viewingClient.phone || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Localização */}
              <div className="space-y-3 pt-3 border-t">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Localização
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Cidade</p>
                    <p className="text-sm font-medium">{viewingClient.city || '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Estado (UF)</p>
                    <p className="text-sm font-medium">{viewingClient.state || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-3 pt-3 border-t">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Status
                </p>
                <div>
                  <Badge variant={viewingClient.isActive ? 'default' : 'secondary'} className="text-sm">
                    {viewingClient.isActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>

              {/* Datas */}
              {(viewingClient.createdAt || viewingClient.updatedAt) && (
                <div className="space-y-3 pt-3 border-t">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Informações do Sistema
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    {viewingClient.createdAt && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Criado em</p>
                        <p className="text-sm font-medium">
                          {new Date(viewingClient.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    )}
                    {viewingClient.updatedAt && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Atualizado em</p>
                        <p className="text-sm font-medium">
                          {new Date(viewingClient.updatedAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setViewingClient(null)} className="flex-1 sm:flex-none">
              Fechar
            </Button>
            <Button onClick={handleDownloadPDF} className="flex-1 sm:flex-none">
              <Download className="mr-2 h-4 w-4" />
              Baixar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
