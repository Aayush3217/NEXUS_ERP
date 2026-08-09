import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/authContext';
import { ToastProvider } from './store/toastContext';
import { ThemeProvider } from './store/themeContext';
import { AuthLayout } from './layouts/AuthLayout';
import { DashboardLayout } from './layouts/DashboardLayout';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Customers } from './pages/Customers';
import { CustomerDetail } from './pages/CustomerDetail';
import { Products } from './pages/Products';
import { Inventory } from './pages/Inventory';
import { Challans } from './pages/Challans';
import { ChallanNew } from './pages/ChallanNew';
import { ChallanDetail } from './pages/ChallanDetail';
import { Users } from './pages/Users';
import { Profile } from './pages/Profile';

// Route Guard for Admin Only Pages
const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  
  if (user && user.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// Route Guard for Inventory Access (Warehouse + Admin)
const InventoryRoute = ({ children }) => {
  const { user } = useAuth();
  
  if (user && user.role !== 'ADMIN' && user.role !== 'WAREHOUSE') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// Route Guard for Customer Access (Admin + Sales + Accounts)
const CustomerRoute = ({ children }) => {
  const { user } = useAuth();
  
  if (user && user.role === 'WAREHOUSE') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

export const App = () => {
  return (
    <Router>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <Routes>
              {/* Public/Auth Routes */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<Navigate to="/login" replace />} />
              </Route>

              {/* Protected Operations Portal Routes */}
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                
                <Route 
                  path="/customers" 
                  element={
                    <CustomerRoute>
                      <Customers />
                    </CustomerRoute>
                  } 
                />
                <Route 
                  path="/customers/:id" 
                  element={
                    <CustomerRoute>
                      <CustomerDetail />
                    </CustomerRoute>
                  } 
                />
                
                <Route path="/products" element={<Products />} />
                
                <Route 
                  path="/inventory" 
                  element={
                    <InventoryRoute>
                      <Inventory />
                    </InventoryRoute>
                  } 
                />
                
                <Route path="/challans" element={<Challans />} />
                <Route path="/challans/new" element={<ChallanNew />} />
                <Route path="/challans/:id" element={<ChallanDetail />} />
                
                <Route 
                  path="/users" 
                  element={
                    <AdminRoute>
                      <Users />
                    </AdminRoute>
                  } 
                />
                
                <Route path="/profile" element={<Profile />} />
              </Route>

              {/* Fallback redirect */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </Router>
  );
};
export default App;
