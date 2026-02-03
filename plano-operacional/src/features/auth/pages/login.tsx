import { LoginForm } from '../components/login-form'
import { useLogin } from '../hooks/use-login'
import { ThemeToggle } from '@/components/theme-toggle'
import { LoginCarousel } from '../components/login-carousel'

export function LoginPage() {
  const { handleLogin, isLoading } = useLogin()

  return (
    <div className="flex min-h-screen">
      {/* Left side - Form */}
      <div className="relative flex w-full flex-col justify-center bg-background px-6 py-12 lg:w-1/2 lg:px-16 xl:px-24">
        {/* Background pattern - Light mode (Waves) */}
        <div className="absolute inset-0 overflow-hidden opacity-100 dark:opacity-0">
          {/* Soft gradient base */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0E8DF3]/[0.03] via-transparent to-[#0E8DF3]/[0.06]" />
          {/* Waves pattern - 3 tons de #0E8DF3 */}
          {/* Onda 1 - Tom escuro */}
          <svg
            className="absolute bottom-0 left-0 w-full"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
            style={{ height: '60%' }}
          >
            <path
              fill="#0A6FC2"
              fillOpacity="0.12"
              d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,218.7C672,235,768,245,864,234.7C960,224,1056,192,1152,181.3C1248,171,1344,181,1392,186.7L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            />
          </svg>
          {/* Onda 2 - Tom base */}
          <svg
            className="absolute bottom-0 left-0 w-full"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
            style={{ height: '45%' }}
          >
            <path
              fill="#0E8DF3"
              fillOpacity="0.10"
              d="M0,160L48,176C96,192,192,224,288,218.7C384,213,480,171,576,165.3C672,160,768,192,864,197.3C960,203,1056,181,1152,165.3C1248,149,1344,139,1392,133.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            />
          </svg>
          {/* Onda 3 - Tom claro */}
          <svg
            className="absolute bottom-0 left-0 w-full"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
            style={{ height: '30%' }}
          >
            <path
              fill="#5BB5F7"
              fillOpacity="0.08"
              d="M0,288L48,272C96,256,192,224,288,213.3C384,203,480,213,576,229.3C672,245,768,267,864,261.3C960,256,1056,224,1152,208C1248,192,1344,192,1392,192L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            />
          </svg>
          {/* Decorative glow */}
          <div className="absolute -right-20 top-1/3 h-72 w-72 rounded-full bg-[#0E8DF3]/[0.05] blur-3xl" />
        </div>

        {/* Background pattern - Dark mode */}
        <div className="absolute inset-0 overflow-hidden opacity-0 dark:opacity-100">
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.05] via-transparent to-primary/[0.08]" />
          {/* Grid pattern */}
          <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="login-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" className="stroke-primary/[0.08]" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#login-grid)" />
          </svg>
          {/* Decorative circles */}
          <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-primary/[0.08] blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-primary/[0.06] blur-3xl" />
        </div>
        {/* Theme Toggle */}
        <div className="absolute right-4 top-4 z-10">
          <ThemeToggle />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-sm">
          {/* Logo */}
          <div className="mb-10">
            <div className="App-logo flex h-10 w-10 items-center justify-center rounded-lg bg-[#0050C3]">
              <span className="text-lg font-bold text-white">Z</span>
            </div>
          </div>

          {/* Header */}
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Acesse sua conta
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sistema de gestão operacional Z.Ops
          </p>

          {/* Form */}
          <div className="mt-8">
            <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
          </div>
        </div>
      </div>

      {/* Right side - Image (hidden on mobile) */}
      <div className="relative hidden lg:block lg:w-1/2">
        <LoginCarousel />
      </div>
    </div>
  )
}
