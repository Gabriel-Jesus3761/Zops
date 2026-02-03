import { createBrowserRouter, Navigate, useRouteError } from 'react-router-dom'
import { LoginPage, ProtectedRoute } from '@/features/auth'
import { DashboardHome } from '@/features/dashboard'
import { SettingsPage } from '@/features/settings'
import { GestaoInventarioPage, ConfiguracoesSistema } from '@/features/gestao-inventario'
import { PlanoOperacionalPage } from '@/features/plano-operacional'
import { MCOListPage, MCOWizardPage, MCOResumoPage, MCODetalhesPage, MCOEditPage, HubspotPage } from '@/features/planejamento'
import { CadastroHome, AtivoSerializadoForm, AtivoNaoSerializadoForm, InsumoForm, SkuPatternsConfig, SerialPatternsConfig, SkuBindingsConfig, GestaoAtivosTeste } from '@/features/cadastro'
import { MainLayout } from '@/components/layouts/main-layout'
import { DefaultErrorFallback } from '@/components/ui/error-boundary'

function RouteErrorBoundary() {
  const error = useRouteError() as Error
  return <DefaultErrorFallback error={error} onReset={() => window.location.href = '/'} />
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardHome />,
      },
      {
        path: 'gestao-inventario',
        element: <GestaoInventarioPage />,
      },
      {
        path: 'gestao-inventario/configuracoes',
        element: <ConfiguracoesSistema />,
      },
      {
        path: 'go-live/plano-operacional',
        element: <PlanoOperacionalPage />,
      },
      {
        path: 'logistica/cadastro',
        element: <CadastroHome />,
      },
      {
        path: 'logistica/cadastro/ativo-serializado',
        element: <AtivoSerializadoForm />,
      },
      {
        path: 'logistica/cadastro/ativo-nao-serializado',
        element: <AtivoNaoSerializadoForm />,
      },
      {
        path: 'logistica/cadastro/insumo',
        element: <InsumoForm />,
      },
      {
        path: 'logistica/cadastro/sku-patterns',
        element: <SkuPatternsConfig />,
      },
      {
        path: 'logistica/cadastro/serial-patterns',
        element: <SerialPatternsConfig />,
      },
      {
        path: 'logistica/cadastro/sku-bindings',
        element: <SkuBindingsConfig />,
      },
      {
        path: 'logistica/cadastro/gestao-ativos-teste',
        element: <GestaoAtivosTeste />,
      },
      {
        path: 'planejamento/mcos',
        element: <MCOListPage />,
      },
      {
        path: 'planejamento/mcos/nova',
        element: <MCOWizardPage />,
      },
      {
        path: 'planejamento/mcos/:id/editar',
        element: <MCOEditPage />,
      },
      {
        path: 'planejamento/mcos/:id/resumo',
        element: <MCOResumoPage />,
      },
      {
        path: 'planejamento/mcos/:id/detalhes',
        element: <MCODetalhesPage />,
      },
      {
        path: 'planejamento/hubspot',
        element: <HubspotPage />,
      },
      {
        path: 'logistica/gestao-ativos',
        element: <GestaoInventarioPage />,
      },
      {
        path: 'configuracoes',
        element: <SettingsPage />,
        children: [
          {
            index: true,
            element: <Navigate to="/configuracoes/geral" replace />,
          },
          {
            path: 'geral',
            element: null,
          },
          {
            path: 'usuarios',
            element: null,
            children: [
              {
                index: true,
                element: <Navigate to="/configuracoes/usuarios/gerenciar" replace />,
              },
              {
                path: 'gerenciar',
                element: null,
              },
              {
                path: 'sincronizar',
                element: null,
              },
              {
                path: 'enriquecer',
                element: null,
              },
            ],
          },
          {
            path: 'notificacoes',
            element: null,
          },
          {
            path: 'seguranca',
            element: null,
          },
          {
            path: 'aparencia',
            element: null,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])
