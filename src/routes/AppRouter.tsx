import { Navigate, Route, Routes } from 'react-router-dom'

import ProtectedRoute from '@/components/ProtectedRoute'
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
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default AppRouter
