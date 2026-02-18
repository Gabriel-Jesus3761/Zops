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
            path: 'aparencia',
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
            path: 'clientes',
            element: null,
          },
          {
            path: 'locais-eventos',
            element: null,
          },
          {
            path: 'etapas-projeto',
            element: null,
          },
          // MCO Parâmetros - rotas diretas (flatten)
          {
            path: 'clusters',
            element: null,
          },
          {
            path: 'filiais',
            element: null,
          },
          {
            path: 'cargos',
            element: null,
          },
          {
            path: 'modalidades',
            element: null,
          },
          {
            path: 'jornadas',
            element: null,
          },
          {
            path: 'parametros-diarias',
            element: null,
          },
          {
            path: 'ite-por-cluster',
            element: null,
          },
          {
            path: 'cargos-x-cluster',
            element: null,
          },
          {
            path: 'times-por-etapa',
            element: null,
          },
          // Alimentação
          {
            path: 'parametros-alimentacao',
            element: null,
          },
          // Hospedagem
          {
            path: 'base-custo-hospedagem',
            element: null,
          },
          {
            path: 'matriz-hospedagem',
            element: null,
          },
          // Transporte
          {
            path: 'parametros-transporte',
            element: null,
          },
          // Frete
          {
            path: 'parametros-frete',
            element: null,
          },
          {
            path: 'notificacoes',
            element: null,
          },
          {
            path: 'seguranca',
            element: null,
          },
          // Redirects de compatibilidade (rotas antigas)
          {
            path: 'mco-parametros',
            element: <Navigate to="/configuracoes/clusters" replace />,
          },
          {
            path: 'mco-parametros/clusters',
            element: <Navigate to="/configuracoes/clusters" replace />,
          },
          {
            path: 'mco-parametros/filiais',
            element: <Navigate to="/configuracoes/filiais" replace />,
          },
          {
            path: 'mco-parametros/cargos',
            element: <Navigate to="/configuracoes/cargos" replace />,
          },
          {
            path: 'mco-parametros/modalidades',
            element: <Navigate to="/configuracoes/modalidades" replace />,
          },
          {
            path: 'mco-parametros/jornadas',
            element: <Navigate to="/configuracoes/jornadas" replace />,
          },
          {
            path: 'mco-parametros/dimensionamento',
            element: <Navigate to="/configuracoes/cargos-x-cluster" replace />,
          },
          {
            path: 'dimensionamento',
            element: <Navigate to="/configuracoes/cargos-x-cluster" replace />,
          },
          {
            path: 'diarias-go-live',
            element: <Navigate to="/configuracoes/parametros-diarias" replace />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
], { basename: '/Zops' })
