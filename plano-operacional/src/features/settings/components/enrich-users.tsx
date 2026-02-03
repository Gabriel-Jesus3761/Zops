import { useState } from 'react'
import { RefreshCw, AlertCircle, CheckCircle2, XCircle, Database, Users, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { ClickUpConfig, EnrichUsersResponse, ProgressUpdate } from '../types/clickup'

export function EnrichUsers() {
  const [config, setConfig] = useState<ClickUpConfig>({
    useEnvVars: true,
    listId1: '',
    listId2: '',
  })
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<ProgressUpdate | null>(null)
  const [result, setResult] = useState<EnrichUsersResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleEnrich = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    setProgress({ status: 'starting', message: 'Iniciando processo...' })

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 300000) // 5 minutos

    try {
      const payload = config.useEnvVars
        ? { useEnvVars: true }
        : {
            listId1: config.listId1,
            listId2: config.listId2,
          }

      if (!config.useEnvVars && (!config.listId1 || !config.listId2)) {
        throw new Error('IDs das listas são obrigatórios')
      }

      setProgress({ status: 'fetching', message: 'Buscando dados do ClickUp...', progress: 50 })

      const response = await fetch(
        'https://southamerica-east1-zops-mobile.cloudfunctions.net/enrichUsersWithClickUpData',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        }
      )

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error('Erro ao enriquecer usuários')
      }

      const data = await response.json()
      setResult(data)
      setProgress({ status: 'complete', message: 'Processo concluído!', progress: 100 })
    } catch (err) {
      clearTimeout(timeoutId)
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Timeout: A operação levou mais de 5 minutos')
        setProgress({ status: 'error', message: 'Timeout excedido' })
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
        setError(errorMessage)
        setProgress({ status: 'error', message: errorMessage })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Enriquecer Dados de Usuários
          </CardTitle>
          <CardDescription>
            Atualiza os dados de usuários existentes com informações adicionais do ClickUp. Apenas
            usuários já cadastrados serão atualizados.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="useEnvVarsEnrich"
                checked={config.useEnvVars}
                onChange={(e) => setConfig({ ...config, useEnvVars: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="useEnvVarsEnrich">Usar variáveis de ambiente</Label>
            </div>
          </div>

          {!config.useEnvVars && (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="enrichListId1">ID da Lista 1</Label>
                <Input
                  id="enrichListId1"
                  value={config.listId1}
                  onChange={(e) => setConfig({ ...config, listId1: e.target.value })}
                  placeholder="123456789"
                />
              </div>
              <div>
                <Label htmlFor="enrichListId2">ID da Lista 2</Label>
                <Input
                  id="enrichListId2"
                  value={config.listId2}
                  onChange={(e) => setConfig({ ...config, listId2: e.target.value })}
                  placeholder="987654321"
                />
              </div>
            </div>
          )}

          <Button onClick={handleEnrich} disabled={loading} className="w-full">
            {loading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Enriquecendo...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Iniciar Enriquecimento
              </>
            )}
          </Button>

          {progress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{progress.message}</span>
                {progress.progress !== undefined && (
                  <span className="font-medium">{progress.progress}%</span>
                )}
              </div>
              {progress.progress !== undefined && (
                <Progress value={progress.progress} className="h-2" />
              )}
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {result && result.success && (
        <>
          {/* Resumo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Resumo do Enriquecimento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Database className="h-4 w-4" />
                    Tarefas Processadas
                  </div>
                  <div className="mt-2 text-2xl font-bold">
                    {result.data.summary.totalTasks}
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    Total de Usuários
                  </div>
                  <div className="mt-2 text-2xl font-bold">
                    {result.data.summary.totalUsers}
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    Usuários Atualizados
                  </div>
                  <div className="mt-2 text-2xl font-bold text-green-600">
                    {result.data.summary.updatedUsers}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Erros */}
          {result.errors && result.errors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-5 w-5" />
                  Erros Encontrados
                </CardTitle>
                <CardDescription>
                  {result.errors.length} erro(s) ocorrido(s) durante o enriquecimento
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

          {result.data.summary.errors > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {result.data.summary.errors} erro(s) encontrado(s). Verifique os detalhes acima.
              </AlertDescription>
            </Alert>
          )}
        </>
      )}

      {result && !result.success && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>Falha ao enriquecer usuários. Tente novamente.</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
