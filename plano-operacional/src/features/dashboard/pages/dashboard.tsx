import { useAuth } from '@/features/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LogOut, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function DashboardPage() {
  const { user, pipeId, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Bem-vindo ao sistema Z.Ops
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Usuário Logado</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="text-sm text-muted-foreground">Nome:</span>
                <p className="font-medium">{user?.name}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Email:</span>
                <p className="font-medium">{user?.email}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Permissão:</span>
                <p className="font-medium capitalize">{user?.permission}</p>
              </div>
              {user?.permissionEvento && (
                <div>
                  <span className="text-sm text-muted-foreground">Função no Evento:</span>
                  <p className="font-medium">{user.permissionEvento}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {pipeId && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Evento Atual</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <span className="text-sm text-muted-foreground">Pipe ID:</span>
                  <p className="font-mono font-medium">{pipeId}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Módulos do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Os módulos estarão disponíveis aqui conforme forem implementados.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
