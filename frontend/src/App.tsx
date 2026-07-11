import { Routes, Route, Navigate } from 'react-router-dom'
import { MainLayout } from './layouts/MainLayout'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { Dashboard } from './pages/Dashboard/Dashboard'
import { Login } from './pages/Login/Login'
import { ClientsPage } from './features/clients/pages/ClientsPage'
import { ClientDetailPage } from './features/clients/pages/ClientDetailPage'
import { SalesTaxPage } from './features/sales-tax/pages/SalesTaxPage'
import { WithholdingPage } from './features/withholding/pages/WithholdingPage'
import { DocumentsPage } from './features/documents/pages/DocumentsPage'
import { ComplianceViewPage } from './features/documents/pages/ComplianceViewPage'
import { TasksPage } from './features/tasks/pages/TasksPage'
import { ReportsPage } from './features/reports/pages/ReportsPage'
import { SettingsPage } from './features/settings/pages/SettingsPage'
import { BackupPage } from './features/backup/pages/BackupPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/clients/:clientId" element={<ClientDetailPage />} />
        <Route path="/client" element={<Navigate to="/clients" replace />} />
        <Route path="/sales-tax" element={<SalesTaxPage />} />
        <Route path="/withholding" element={<WithholdingPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/document" element={<Navigate to="/documents" replace />} />
        <Route path="/compliance" element={<ComplianceViewPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/backups" element={<BackupPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
