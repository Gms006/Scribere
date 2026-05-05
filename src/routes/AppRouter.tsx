import { Navigate, Route, Routes } from 'react-router-dom'

import ProtectedRoute from '@/components/ProtectedRoute'
import GuiaDetalhe from '@/features/guias/components/GuiaDetalhe'
import GuiaForm from '@/features/guias/components/GuiaForm'
import GuiasPage from '@/features/guias/pages/GuiasPage'
import AppPage from '@/pages/App'
import LoginPage from '@/pages/Login'

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/guias"
        element={
          <ProtectedRoute>
            <GuiasPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/guias/novo"
        element={
          <ProtectedRoute>
            <div className="min-h-screen bg-slate-50 p-4 md:p-8">
              <div className="mx-auto w-full max-w-5xl">
                <GuiaForm />
              </div>
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/guias/:id"
        element={
          <ProtectedRoute>
            <div className="min-h-screen bg-slate-50 p-4 md:p-8">
              <div className="mx-auto w-full max-w-5xl">
                <GuiaDetalhe />
              </div>
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/guias/:id/editar"
        element={
          <ProtectedRoute>
            <div className="min-h-screen bg-slate-50 p-4 md:p-8">
              <div className="mx-auto w-full max-w-5xl">
                <GuiaForm />
              </div>
            </div>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default AppRouter
