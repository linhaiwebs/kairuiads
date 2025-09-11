import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/DashboardLayout';
import Dashboard from './pages/Dashboard';
import FlowManagement from './pages/FlowManagement';
import CreateFlow from './pages/CreateFlow';
import Statistics from './pages/Statistics';
import ClickData from './pages/ClickData';
import AccountManagement from './pages/AccountManagement';
import CreateAccount from './pages/CreateAccount';
import EditAccount from './pages/EditAccount';
import AccountCategories from './pages/AccountCategories';
import ConversionRecords from './pages/ConversionRecords';
import FilterManagement from './pages/FilterManagement';
import CreateFilter from './pages/CreateFilter';
import EditFilter from './pages/EditFilter';
import ApiRequestLogs from './pages/ApiRequestLogs';
import EditFlow from './pages/EditFlow';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/admin/login" element={<LoginPage />} />
          <Route path="/admin" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="flows" element={<FlowManagement />} />
            <Route path="flows/create" element={<CreateFlow />} />
            <Route path="flows/edit/:id" element={<EditFlow />} />
            <Route path="statistics" element={<Statistics />} />
            <Route path="clicks" element={<ClickData />} />
            <Route path="accounts" element={<AccountManagement />} />
            <Route path="accounts/create" element={<CreateAccount />} />
            <Route path="accounts/edit/:id" element={<EditAccount />} />
            <Route path="accounts/categories" element={<AccountCategories />} />
            <Route path="conversions" element={<ConversionRecords />} />
            <Route path="filters" element={<FilterManagement />} />
            <Route path="filters/create" element={<CreateFilter />} />
            <Route path="filters/edit/:id" element={<EditFilter />} />
            <Route path="logs" element={<ApiRequestLogs />} />
          </Route>
          <Route path="/" element={<Navigate to="/admin" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;