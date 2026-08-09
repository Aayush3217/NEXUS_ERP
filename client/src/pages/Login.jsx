import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authContext';
import { useToast } from '../store/toastContext';
import { 
  Eye, 
  EyeOff, 
  Warehouse, 
  Shield, 
  Users, 
  Receipt,
  TriangleAlert,
  CheckCircle,
  CalendarClock,
  Sparkles
} from 'lucide-react';
import { Button, Input, Badge } from '../components/UI';

const LoginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const Login = () => {
  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: '', password: '' }
  });

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const res = await login(data.email, data.password);
      if (res && res.success) {
        success('Access authorized. Welcome back to Nexus ERP.');
        navigate('/dashboard');
      }
    } catch (err) {
      error(err.response?.data?.message || 'Login failed. Please verify credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const demoAccounts = [
    { label: 'Admin', email: 'admin@example.com', password: 'Admin@123', icon: Shield, role: 'ADMIN', color: 'border-rose-500/30 text-rose-400 bg-rose-500/5' },
    { label: 'Sales', email: 'sales@example.com', password: 'Sales@123', icon: Users, role: 'SALES', color: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5' },
    { label: 'Warehouse', email: 'warehouse@example.com', password: 'Warehouse@123', icon: Warehouse, role: 'WAREHOUSE', color: 'border-amber-500/30 text-amber-400 bg-amber-500/5' },
    { label: 'Accounts', email: 'accounts@example.com', password: 'Accounts@123', icon: Receipt, role: 'ACCOUNTS', color: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/5' },
  ];

  const handleFillDemo = (account) => {
    setValue('email', account.email);
    setValue('password', account.password);
    setSelectedRole(account.role);
  };

  return (
    <div className="min-h-screen flex w-full bg-bg text-textPrimary overflow-hidden">
      
      {/* LEFT 55% BRAND PANE (Desktop Only) */}
      <div 
        className="hidden lg:flex lg:w-[55%] bg-[#080B12] border-r border-border flex-col justify-between p-12 relative overflow-hidden"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      >
        {/* Subtle grid visual effect overlays */}
        <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-gradient-primary opacity-5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-gradient-purple opacity-5 blur-[100px] rounded-full pointer-events-none" />

        {/* Brand Header */}
        <div className="flex items-center gap-3 z-10">
          <div className="p-2.5 bg-gradient-primary rounded text-white shadow-lg shadow-primary-500/20">
            <Warehouse className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-extrabold text-white text-base tracking-tight leading-none">NEXUS ERP</h2>
            <p className="text-[9px] text-textSecondary font-bold uppercase tracking-widest mt-1">Distribution Portal</p>
          </div>
        </div>

        {/* Middle Brand Statement */}
        <div className="my-auto max-w-lg z-10 space-y-6">
          <div className="space-y-3">
            <span className="text-[10px] font-bold tracking-widest text-primary-500 uppercase bg-primary-500/10 px-3 py-1 rounded-full border border-primary-500/10">
              Enterprise Operations
            </span>
            <h1 className="text-3xl font-black text-white tracking-tight leading-tight">
              Run your distribution business smarter.
            </h1>
            <p className="text-sm text-textSecondary leading-relaxed">
              Manage customers, warehouse inventory levels, log follow-up CRM timelines, and issue sales challans from one powerful B2B workspace.
            </p>
          </div>

          {/* Interactive Floating Preview Cards */}
          <div className="space-y-3 mt-8">
            {/* Low stock preview card */}
            <div className="flex items-center gap-4 p-3.5 bg-[#111827]/70 border border-white/5 rounded-xl shadow-lg hover:border-white/10 transition-colors w-72 backdrop-blur-xs">
              <div className="p-2 rounded bg-warning-500/10 text-warning-500 shrink-0">
                <TriangleAlert className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-textSecondary uppercase tracking-wider">Stock Shortages</p>
                <p className="text-sm font-extrabold text-white">24 Low Stock Items</p>
              </div>
              <Badge variant="warning">Alert</Badge>
            </div>

            {/* Invoices confirmed preview card */}
            <div className="flex items-center gap-4 p-3.5 bg-[#111827]/70 border border-white/5 rounded-xl shadow-lg hover:border-white/10 transition-colors w-80 translate-x-6 backdrop-blur-xs">
              <div className="p-2 rounded bg-primary-500/10 text-primary-500 shrink-0">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-textSecondary uppercase tracking-wider">Order Dispatches</p>
                <p className="text-sm font-extrabold text-white">186 Confirmed Challans</p>
              </div>
              <Badge variant="success">+15.3%</Badge>
            </div>

            {/* CRM schedules preview card */}
            <div className="flex items-center gap-4 p-3.5 bg-[#111827]/70 border border-white/5 rounded-xl shadow-lg hover:border-white/10 transition-colors w-72 backdrop-blur-xs">
              <div className="p-2 rounded bg-gradient-purple text-white shrink-0">
                <CalendarClock className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-textSecondary uppercase tracking-wider">CRM Timeline</p>
                <p className="text-sm font-extrabold text-white">12 Follow-ups Today</p>
              </div>
              <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-[10px] text-textSecondary/60 font-semibold z-10">
          © {new Date().getFullYear()} Nexus ERP Solutions. All rights reserved.
        </div>
      </div>

      {/* RIGHT 45% LOGIN INTERACTIVE SCREEN */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center items-center px-6 sm:px-12 py-12 bg-bg relative">
        <div className="w-full max-w-md">
          {/* Mobile Logo Brand */}
          <div className="flex lg:hidden items-center gap-2.5 mb-8 justify-center">
            <div className="p-2 bg-gradient-primary rounded text-white shrink-0">
              <Warehouse className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h1 className="text-sm font-black text-textPrimary leading-none">NEXUS ERP</h1>
              <p className="text-[8px] text-textSecondary font-bold uppercase tracking-widest mt-1">Distribution Portal</p>
            </div>
          </div>

          {/* Login Card */}
          <div className="bg-[#111827]/85 border border-white/10 dark:border-border p-8 rounded-[16px] shadow-[0_20px_60px_rgba(0,0,0,0.35)] space-y-6 backdrop-blur-md">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Welcome Back</h2>
              <p className="text-xs text-textSecondary mt-1">Sign in to continue to your distribution workspace.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="e.g. admin@example.com"
                error={errors.email?.message}
                className="h-11 bg-[#151B27] border-white/5 text-white placeholder-gray-500 focus:ring-primary-500/50"
                {...register('email')}
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  error={errors.password?.message}
                  className="h-11 bg-[#151B27] border-white/5 text-white placeholder-gray-500 focus:ring-primary-500/50"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-8.5 text-textSecondary hover:text-white transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center justify-between text-xs font-semibold pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-textSecondary hover:text-white">
                  <input type="checkbox" className="rounded bg-[#151B27] border-white/10 text-primary-500 focus:ring-0 focus:ring-offset-0" />
                  <span>Remember me</span>
                </label>
                <a href="#forgot" className="text-primary-400 hover:underline">Forgot password?</a>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full h-11 font-bold mt-3 bg-gradient-primary hover:opacity-95"
                loading={submitting}
              >
                Sign In
              </Button>
            </form>

            {/* Quick Demo Switcher Cards */}
            <div className="pt-5 border-t border-white/5">
              <div className="flex items-center gap-2 mb-3 text-[10px] font-bold text-textSecondary uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5 text-primary-500" />
                <span>Select Demo Account</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2.5">
                {demoAccounts.map((account) => {
                  const Icon = account.icon;
                  const isSelected = selectedRole === account.role;
                  return (
                    <button
                      key={account.label}
                      type="button"
                      onClick={() => handleFillDemo(account)}
                      className={`flex items-center gap-3 p-2.5 rounded-lg border text-left transition-all duration-150 text-xs font-semibold focus:outline-none hover:-translate-y-[2px] ${
                        isSelected
                          ? `border-primary-500 shadow-[0_0_12px_rgba(59,130,246,0.25)] bg-primary-500/10 text-white`
                          : 'border-white/5 hover:border-white/15 bg-[#151B27] text-textSecondary hover:text-white'
                      }`}
                    >
                      <div className={`p-1.5 rounded shrink-0 ${account.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="block font-bold text-white leading-none mb-0.5">{account.label}</span>
                        <span className="block text-[8px] text-textSecondary font-semibold leading-none">{account.role}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Login;
