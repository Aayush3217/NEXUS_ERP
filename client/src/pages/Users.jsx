import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../services/api';
import { useToast } from '../store/toastContext';
import { useAuth } from '../store/authContext';
import { Plus, Search, Edit2, Trash2, Shield, UserPlus, X } from 'lucide-react';
import { 
  Button, Input, Select, Badge, Card, PageHeader, EmptyState, Skeleton 
} from '../components/UI';

// Form validation schema
const UserFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  passwordHash: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  role: z.enum(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'], { errorMap: () => ({ message: 'Select user role' }) }),
  isActive: z.boolean().default(true),
});

export const Users = () => {
  const { user: currentUser } = useAuth();
  const { success, error: showToastError } = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(UserFormSchema),
    defaultValues: {
      name: '',
      email: '',
      passwordHash: '',
      role: 'SALES',
      isActive: true,
    }
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/users');
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err) {
      showToastError('Failed to fetch platform users directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenAdd = () => {
    reset({
      name: '',
      email: '',
      passwordHash: '',
      role: 'SALES',
      isActive: true,
    });
    setEditingId(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    reset({
      name: user.name,
      email: user.email,
      passwordHash: '', // don't fill hashed password
      role: user.role,
      isActive: user.isActive,
    });
    setEditingId(user.id);
    setModalOpen(true);
  };

  const handleFormSubmit = async (data) => {
    // Validate password for new creation
    if (!editingId && !data.passwordHash) {
      showToastError('Password is required for new users');
      return;
    }

    try {
      if (editingId) {
        // Edit User
        const payload = { ...data };
        if (!payload.passwordHash) {
          delete payload.passwordHash; // Don't change password if empty
        }
        const res = await api.put(`/api/users/${editingId}`, payload);
        if (res.data.success) {
          success('User details updated.');
          setModalOpen(false);
          fetchUsers();
        }
      } else {
        // Create User
        const res = await api.post('/api/users', data);
        if (res.data.success) {
          success('New user credential registered.');
          setModalOpen(false);
          fetchUsers();
        }
      }
    } catch (err) {
      showToastError(err.response?.data?.message || 'Error processing request');
    }
  };

  const handleDelete = async (id, name) => {
    if (id === currentUser.id) {
      showToastError('You cannot delete your own logged-in account!');
      return;
    }

    if (window.confirm(`Are you sure you want to delete user login for '${name}'?`)) {
      try {
        const res = await api.delete(`/api/users/${id}`);
        if (res.data.success) {
          success('User login deleted.');
          fetchUsers();
        }
      } catch (err) {
        showToastError('Could not delete user account');
      }
    }
  };

  return (
    <div>
      <PageHeader
        title="Portal Users Directory"
        subtitle="Manage employee logins, reset security passwords, and assign authorization roles."
        actions={
          <Button onClick={handleOpenAdd} className="font-bold flex gap-2">
            <UserPlus className="w-4 h-4" /> Add User Account
          </Button>
        }
      />

      {/* Grid catalogue */}
      {loading ? (
        <Card className="p-0">
          <div className="p-6">
            <Skeleton className="h-10 w-full rounded-lg" count={5} />
          </div>
        </Card>
      ) : users.length === 0 ? (
        <EmptyState
          title="No users registered"
          description="Register user accounts to grant operational access."
          action={<Button onClick={handleOpenAdd}>Add User Account</Button>}
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-left">
              <thead className="bg-gray-50/70 text-gray-500 uppercase tracking-widest text-[10px] font-bold">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role Badge</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm font-medium text-gray-700 bg-white">
                {users.map((userItem) => (
                  <tr key={userItem.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-800 flex items-center gap-2">
                      {userItem.id === currentUser.id && (
                        <Badge variant="info" className="px-1.5 py-0">You</Badge>
                      )}
                      {userItem.name}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{userItem.email}</td>
                    <td className="px-6 py-4">
                      <Badge 
                        variant={
                          userItem.role === 'ADMIN' 
                            ? 'danger' 
                            : userItem.role === 'SALES' 
                            ? 'success' 
                            : userItem.role === 'WAREHOUSE' 
                            ? 'warning' 
                            : 'info'
                        }
                      >
                        {userItem.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={userItem.isActive ? 'success' : 'neutral'}>
                        {userItem.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-1.5">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="p-2"
                          onClick={() => handleOpenEdit(userItem)}
                        >
                          <Edit2 className="w-4 h-4 text-gray-500 hover:text-amber-600" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="p-2"
                          onClick={() => handleDelete(userItem.id, userItem.name)}
                          disabled={userItem.id === currentUser.id}
                        >
                          <Trash2 className="w-4 h-4 text-gray-400 hover:text-rose-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* User Drawer Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-gray-900/40 backdrop-blur-xs animate-fade-in">
          <div onClick={() => setModalOpen(false)} className="absolute inset-0" />
          
          <div className="relative bg-white w-full max-w-lg h-full shadow-2xl flex flex-col justify-between border-l border-gray-100 transform translate-x-0 transition-transform duration-300 animate-slide-left">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-bold text-gray-800 text-lg">
                {editingId ? 'Modify User Details' : 'Register New User Account'}
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <form id="user-form" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
                <Input
                  label="Employee Name"
                  placeholder="e.g. Vikram Singh"
                  error={errors.name?.message}
                  {...register('name')}
                />

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="e.g. vikram@example.com"
                  error={errors.email?.message}
                  {...register('email')}
                />

                <Input
                  label={editingId ? "Reset Password (Leave blank to keep current)" : "Password"}
                  type="password"
                  placeholder="••••••••"
                  error={errors.passwordHash?.message}
                  {...register('passwordHash')}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Access Authorization Role"
                    error={errors.role?.message}
                    options={[
                      { value: 'ADMIN', label: 'Admin (Full Access)' },
                      { value: 'SALES', label: 'Sales (Customers & Challans)' },
                      { value: 'WAREHOUSE', label: 'Warehouse (Products & Movements)' },
                      { value: 'ACCOUNTS', label: 'Accounts (View Invoices & Finance)' },
                    ]}
                    {...register('role')}
                  />
                  <Select
                    label="Status"
                    error={errors.isActive?.message}
                    options={[
                      { value: 'true', label: 'Active User' },
                      { value: 'false', label: 'Deactivated User' },
                    ]}
                    {...register('isActive', {
                      setValueAs: (v) => v === 'true' || v === true
                    })}
                  />
                </div>
              </form>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3 shrink-0">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                form="user-form" 
                variant="primary" 
                className="font-bold px-6"
                loading={isSubmitting}
              >
                Save Account
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Users;
