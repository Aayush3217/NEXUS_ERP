import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../store/authContext';
import { Loader2 } from 'lucide-react';

export const AuthLayout = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  // Redirect to dashboard if already authenticated
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="h-screen bg-gray-50">
      <Outlet />
    </div>
  );
};
export default AuthLayout;
