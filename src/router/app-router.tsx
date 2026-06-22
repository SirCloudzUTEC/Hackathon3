import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthGuard } from '../auth/auth-guard'
import { Layout } from '../components/layout'
import { LoginPage } from '../auth/login-page'
import { DashboardPage } from '../dashboard/dashboard-page'
import { TropelsPage } from '../tropels/tropels-page'
import { SignalsFeedPage } from '../signals/signals-feed-page'
import { SignalDetailPage } from '../signals/signal-detail-page'
import { SectorsPage } from '../sectors/sectors-page'
import { StoryPage } from '../sectors/story/story-page'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <AuthGuard>
            <Layout>
              <Routes>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/tropels" element={<TropelsPage />} />
                <Route path="/signals" element={<SignalsFeedPage />} />
                <Route path="/signals/:id" element={<SignalDetailPage />} />
                <Route path="/sectors" element={<SectorsPage />} />
                <Route path="/sectors/:id/story" element={<StoryPage />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Layout>
          </AuthGuard>
        }
      />
    </Routes>
  )
}
