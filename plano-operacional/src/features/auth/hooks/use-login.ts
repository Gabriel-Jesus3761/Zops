import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
// import { signInWithCustomToken } from 'firebase/auth' // Temporariamente desabilitado
import { toast } from 'sonner'
import { useAuth } from './use-auth'
import { authService } from '../services/auth.service'
// import { auth } from '@/config/firebase' // Temporariamente desabilitado
import type { LoginFormData } from '../schemas/login.schema'
import type { Permission } from '../types'

export function useLogin() {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const pipeIdFromUrl = searchParams.get('pipeId')

  const { setUser, setToken, setPipeId } = useAuth()

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true)

    try {
      const response = await authService.login({
        email: data.email,
        password: data.password,
        os: data.os,
      })

      const targetPipeId = data.os?.trim() || pipeIdFromUrl?.trim() || ''
      const isAdmin = authService.isAdminPermission(response.permission as Permission)

      let permissionEvento: string = response.permission

      // Se não é admin, precisa verificar se está escalado no evento
      if (!isAdmin) {
        if (!targetPipeId) {
          toast.error('Você não está escalado para nenhum evento', {
            description: 'Entre em contato com o responsável pelo evento.',
          })
          setIsLoading(false)
          return
        }

        const verification = await authService.verifyUserInEvento(
          response.user,
          targetPipeId
        )

        if (!verification.isEscalado) {
          toast.error('Você não está escalado para este evento', {
            description: 'Verifique com o responsável se você foi adicionado à equipe.',
          })
          setIsLoading(false)
          return
        }

        permissionEvento = verification.permissionEvento
      }

      // ⚠️ TEMPORÁRIO: Firebase Auth desabilitado até Cloud Function retornar Custom Token
      // TODO: Descomentar quando employeeLogin retornar token gerado com admin.auth().createCustomToken()
      // Ver: plano-operacional/SEGURANCA_PRODUCAO.md

      // try {
      //   await signInWithCustomToken(auth, response.token)
      //   console.log('✅ Usuário autenticado no Firebase Auth')
      // } catch (authError) {
      //   console.error('⚠️ Erro ao autenticar no Firebase:', authError)
      // }

      // Salvar dados no store
      setUser({
        id: response.userId,
        name: response.user,
        email: data.email.toLowerCase().trim(),
        permission: response.permission as Permission,
        permissionEvento,
      })

      setToken(response.token)

      if (targetPipeId) {
        setPipeId(targetPipeId)
      }

      toast.success('Login realizado com sucesso!', {
        description: `Bem-vindo, ${response.user}!`,
      })

      // Navegar para o dashboard
      navigate(targetPipeId ? `/?pipeId=${targetPipeId}` : '/')
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro ao realizar login'
      toast.error('Falha no login', { description: message })
    } finally {
      setIsLoading(false)
    }
  }

  return {
    handleLogin,
    isLoading,
    pipeIdFromUrl,
  }
}
