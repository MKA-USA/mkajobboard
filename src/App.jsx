import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import JobListingPage from './pages/JobListingPage';
import JobDetailPage from './pages/JobDetailPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ProtectedRoute from './components/ProtectedRoute';
import NotFoundPage from './pages/NotFoundPage';
import SupabaseTest from './components/SupabaseTest';
import FirstAdminBootstrap from './components/FirstAdminBootstrap';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="jobs" element={<JobListingPage />} />
        <Route path="jobs/:id" element={<JobDetailPage />} />
        <Route path="admin/login" element={<AdminLoginPage />} />
        <Route path="supabase-test" element={<SupabaseTest />} />
        <Route path="admin/bootstrap" element={<FirstAdminBootstrap />} />
        <Route 
          path="admin/dashboard" 
          element={
            <ProtectedRoute>
              <AdminDashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
