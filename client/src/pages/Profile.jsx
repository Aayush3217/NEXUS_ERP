import React from 'react';
import { useAuth } from '../store/authContext';
import { useTheme } from '../store/themeContext';
import { User, Mail, Shield, CheckCircle, Sun, Moon, Monitor } from 'lucide-react';
import { Card, Badge, PageHeader } from '../components/UI';

export const Profile = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  if (!user) return null;

  // Describe role privileges to demonstrate RBAC in UI
  const getRolePrivileges = (role) => {
    switch (role) {
      case 'ADMIN':
        return [
          'Full read & write access to all modules in the ERP+CRM platform.',
          'Manage, create, edit, and delete employee portal user credentials.',
          'Manage product catalogue items, unit costs, and warehouse bins.',
          'Verify, update, and delete customer CRM data sheets.',
          'Create sales challan orders, edit drafts, and execute confirmations.'
        ];
      case 'SALES':
        return [
          'Read and write CRM client records (Add & edit customers).',
          'Record follow-up logs and manage upcoming call schedules.',
          'Create draft sales challans and add product checkout lines.',
          'Initiate challan transaction confirmations (stock levels are updated).',
          'Cannot edit or register new products, log manual inventory adjustments, or manage portal users.'
        ];
      case 'WAREHOUSE':
        return [
          'Full access to inventory logs and stock ledger registers.',
          'Execute manual inventory adjustments (Create Stock IN / OUT records).',
          'Review catalog descriptions and aisle bin locations.',
          'View confirmed sales challan dispatches for shipping coordination.',
          'Blocked from customer records, billing details, and platform users.'
        ];
      case 'ACCOUNTS':
        return [
          'View active customers, registered addresses, and GSTIN numbers.',
          'Review product details and cost cards.',
          'Review sales challans and track historical dispatch invoices.',
          'View confirmed revenue stats on the overview dashboard.',
          'Blocked from modifying product lists, adjusting physical inventory, logging CRM notes, or user management.'
        ];
      default:
        return [];
    }
  };

  const privileges = getRolePrivileges(user.role);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="My Account"
        subtitle="Manage your profile information and view your operational role credentials."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Profile Card */}
        <Card className="md:col-span-1 flex flex-col items-center text-center p-6 bg-white border border-gray-100 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-primary-100 text-primary-700 font-extrabold text-2xl flex items-center justify-center mb-4">
            {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <h3 className="font-bold text-gray-800 text-base leading-tight mb-0.5">{user.name}</h3>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-3">{user.role}</p>
          <Badge variant={user.role === 'ADMIN' ? 'danger' : user.role === 'SALES' ? 'success' : 'warning'}>
            System User
          </Badge>
        </Card>

        {/* Privileges/Info */}
        <div className="md:col-span-2 space-y-6">
          <Card title="Account Credentials">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400 shrink-0" />
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Account Holder Name</p>
                  <p className="text-sm font-semibold text-gray-700">{user.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400 shrink-0" />
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Registered Email</p>
                  <p className="text-sm font-semibold text-gray-700">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-gray-400 shrink-0" />
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Assigned Security Role</p>
                  <p className="text-sm font-semibold text-gray-700">{user.role}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Appearance Settings">
            <p className="text-xs text-textSecondary mb-3">Choose how Nexus ERP looks on your browser screen.</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg border text-xs font-semibold focus:outline-none transition-all ${
                  theme === 'light'
                    ? 'border-primary-500 bg-primary-50 text-primary-500 font-bold'
                    : 'border-border bg-surface text-textSecondary hover:bg-bg'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg border text-xs font-semibold focus:outline-none transition-all ${
                  theme === 'dark'
                    ? 'border-primary-500 bg-primary-50 text-primary-500 font-bold'
                    : 'border-border bg-surface text-textSecondary hover:bg-bg'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>Dark</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('system')}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg border text-xs font-semibold focus:outline-none transition-all ${
                  theme === 'system'
                    ? 'border-primary-500 bg-primary-50 text-primary-500 font-bold'
                    : 'border-border bg-surface text-textSecondary hover:bg-bg'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span>System</span>
              </button>
            </div>
          </Card>

          <Card title={`Role Scope Privileges: ${user.role}`}>
            <ul className="space-y-3">
              {privileges.map((priv, idx) => (
                <li key={idx} className="flex gap-2.5 items-start text-xs font-semibold text-gray-600 leading-relaxed">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{priv}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};
export default Profile;
