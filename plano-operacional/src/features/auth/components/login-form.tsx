import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Mail, Lock, FileText } from 'lucide-react'
import { loginSchema, type LoginFormData } from '../schemas/login.schema'

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => void
  isLoading?: boolean
  showOsField?: boolean
}

export function LoginForm({
  onSubmit,
  isLoading = false,
  showOsField = true,
}: LoginFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {showOsField && (
        <div>
          <label
            htmlFor="os"
            className="block text-sm font-medium text-foreground"
          >
            Ordem de Serviço{' '}
            <span className="font-normal text-muted-foreground">(opcional)</span>
          </label>
          <div className="relative mt-2">
            <FileText className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="os"
              type="text"
              placeholder="Ex: 12345"
              autoComplete="off"
              className="block w-full rounded-md border-0 bg-muted/50 py-2 pl-10 pr-3 text-foreground placeholder:text-muted-foreground ring-1 ring-inset ring-border focus:ring-2 focus:ring-[#0050C3] dark:bg-white/5 dark:ring-white/10"
              {...register('os')}
            />
          </div>
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-foreground"
        >
          Email
        </label>
        <div className="relative mt-2">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="email"
            type="email"
            placeholder="voce@empresa.com"
            autoComplete="email"
            className="block w-full rounded-md border-0 bg-muted/50 py-2 pl-10 pr-3 text-foreground placeholder:text-muted-foreground ring-1 ring-inset ring-border focus:ring-2 focus:ring-[#0050C3] dark:bg-white/5 dark:ring-white/10"
            {...register('email')}
          />
        </div>
        {errors.email && (
          <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-foreground"
        >
          Senha
        </label>
        <div className="relative mt-2">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            className="block w-full rounded-md border-0 bg-muted/50 py-2 pl-10 pr-3 text-foreground placeholder:text-muted-foreground ring-1 ring-inset ring-border focus:ring-2 focus:ring-[#0050C3] dark:bg-white/5 dark:ring-white/10"
            {...register('password')}
          />
        </div>
        {errors.password && (
          <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <input
            id="remember"
            type="checkbox"
            className="h-4 w-4 rounded border-border bg-muted/50 text-[#0050C3] focus:ring-[#0050C3] dark:bg-white/5 dark:border-white/10"
          />
          <label htmlFor="remember" className="text-sm text-muted-foreground">
            Lembrar de mim
          </label>
        </div>
        <button
          type="button"
          className="text-sm font-medium text-[#0050C3] hover:text-[#0066F5]"
        >
          Esqueceu a senha?
        </button>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="flex w-full items-center justify-center rounded-md bg-[#0050C3] px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#0066F5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0050C3] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Entrando...
          </>
        ) : (
          'Entrar'
        )}
      </button>
    </form>
  )
}
