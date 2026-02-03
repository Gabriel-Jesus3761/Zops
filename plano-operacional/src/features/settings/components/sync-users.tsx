import { useState } from 'react'
import { Upload, AlertCircle, CheckCircle2, XCircle, Users, UserPlus, UserX } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { ClickUpConfig, SyncUsersResponse } from '../types/clickup'

export function SyncUsers() {
  const [config, setConfig] = useState<ClickUpConfig>({
    useEnvVars: true,
    apiToken: '',
    listId1: '',
    listId2: '',
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SyncUsersResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSync = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const payload = config.useEnvVars
        ? { useEnvVars: true }
        : {
            apiToken: config.apiToken,
            listId1: config.listId1,
            listId2: config.listId2,
          }

      const response = await fetch(
        'https://southamerica-east1-zops-mobile.cloudfunctions.net/syncClickUpUsers',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )

      if (!response.ok) {
        throw new Error('Erro ao sincronizar usuários')
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Sincronizar Novos Usuários
          </CardTitle>
          <CardDescription>
            Importa novos usuários do ClickUp para o banco de dados. Usuários existentes serão
            ignorados.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="useEnvVars"
                checked={config.useEnvVars}
                onChange={(e) => setConfig({ ...config, useEnvVars: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="useEnvVars">Usar variáveis de ambiente</Label>
            </div>
          </div>

          {!config.useEnvVars && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="apiToken">Token da API do ClickUp</Label>
                <Input
                  id="apiToken"
                  type="password"
                  value={config.apiToken}
                  onChange={(e) => setConfig({ ...config, apiToken: e.target.value })}
                  placeholder="pk_..."
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="listId1">ID da Lista 1</Label>
                  <Input
                    id="listId1"
                    value={config.listId1}
                    onChange={(e) => setConfig({ ...config, listId1: e.target.value })}
                    placeholder="123456789"
                  />
                </div>
                <div>
                  <Label htmlFor="listId2">ID da Lista 2</Label>
                  <Input
                    id="listId2"
                    value={config.listId2}
                    onChange={(e) => setConfig({ ...config, listId2: e.target.value })}
                    placeholder="987654321"
                  />
                </div>
              </div>
            </div>
          )}

          <Button onClick={handleSync} disabled={loading} className="w-full">
            {loading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Sincronizando...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Iniciar Sincronização
              </>
            )}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {result && (
        <>
          {/* Resumo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Resumo da Sincronização
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    Tarefas Processadas
                  </div>
                  <div className="mt-2 text-2xl font-bold">
                    {result.summary.totalTasksProcessed}
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <UserPlus className="h-4 w-4" />
                    Novos Usuários
                  </div>
                  <div className="mt-2 text-2xl font-bold text-green-600">
                    {result.summary.newUsersCreated}
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <UserX className="h-4 w-4" />
                    Usuários Ignorados
                  </div>
                  <div className="mt-2 text-2xl font-bold text-yellow-600">
                    {result.summary.skippedUsers}
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <XCircle className="h-4 w-4" />
                    Erros
                  </div>
                  <div className="mt-2 text-2xl font-bold text-red-600">
                    {result.summary.errors}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Novos Usuários */}
          {result.newUsers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Novos Usuários Criados</CardTitle>
                <CardDescription>
                  {result.newUsers.length} usuário(s) adicionado(s) ao banco de dados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Task ID</TableHead>
                      <TableHead>Data de Criação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.newUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell className="font-mono text-xs">{user.taskId}</TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Usuários Ignorados */}
          {result.skippedUsers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Usuários Ignorados</CardTitle>
                <CardDescription>
                  {result.skippedUsers.length} usuário(s) já existente(s) no banco de dados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Motivo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.skippedUsers.map((user, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell className="text-muted-foreground">{user.reason}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Erros */}
          {result.errors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-5 w-5" />
                  Erros Encontrados
                </CardTitle>
                <CardDescription>
                  {result.errors.length} erro(s) ocorrido(s) durante a sincronização
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task ID</TableHead>
                      <TableHead>Erro</TableHead>
                      <TableHead>Detalhes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.errors.map((error, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-xs">{error.taskId || '-'}</TableCell>
                        <TableCell className="text-red-600">{error.error}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {error.details || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
