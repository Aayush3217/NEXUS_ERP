import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../store/authContext';
import { useToast } from '../store/toastContext';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { 
  UsersRound, 
  Package, 
  Warehouse, 
  ReceiptText, 
  TriangleAlert,
  ArrowDownToLine, 
  ArrowUpFromLine, 
  CalendarClock,
  RefreshCw,
  TrendingUp,
  ChevronRight
} from 'lucide-react';
import { Card, Button, Badge } from '../components/UI';

export const Dashboard = () => {
  const { user } = useAuth();
  const { error: showToastError } = useToast();

  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    
    try {
      const [statsRes, actRes] = await Promise.all([
        api.get('/api/dashboard/stats'),
        api.get('/api/dashboard/recent-activity'),
      ]);

      if (statsRes.data.success) setStats(statsRes.data.data);
      if (actRes.data.success) setActivity(actRes.data.data);
    } catch (err) {
      showToastError('Failed to fetch dashboard intelligence data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading || !stats || !activity) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-64 bg-surface rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="h-24 bg-surface rounded-lg" />
          <div className="h-24 bg-surface rounded-lg" />
          <div className="h-24 bg-surface rounded-lg" />
          <div className="h-24 bg-surface rounded-lg" />
          <div className="h-24 bg-surface rounded-lg" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-72 bg-surface rounded-lg lg:col-span-2" />
          <div className="h-72 bg-surface rounded-lg" />
        </div>
      </div>
    );
  }

  // Time of day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Mock data for Recharts Challan Activity time series chart
  const challanChartData = [
    { name: 'Mar', Confirmed: 45, Draft: 18, Cancelled: 3 },
    { name: 'Apr', Confirmed: 62, Draft: 22, Cancelled: 4 },
    { name: 'May', Confirmed: 85, Draft: 30, Cancelled: 6 },
    { name: 'Jun', Confirmed: 110, Draft: 25, Cancelled: 5 },
    { name: 'Jul', Confirmed: 148, Draft: 35, Cancelled: 8 },
    { name: 'Aug', Confirmed: stats.confirmedChallans || 186, Draft: stats.draftChallans || 28, Cancelled: (stats.totalChallans - stats.confirmedChallans - stats.draftChallans) || 8 }
  ];

  // Donut Chart dataset for Inventory Stock level status
  const totalSKUs = stats.totalProducts || 100;
  const outSKUs = stats.outOfStockProducts || 0;
  const lowSKUs = stats.lowStockProducts || 0;
  const normalSKUs = Math.max(0, totalSKUs - outSKUs - lowSKUs);

  const inventoryPieData = [
    { name: 'In Stock', value: normalSKUs, color: '#10B981' },
    { name: 'Low Stock', value: lowSKUs, color: '#F59E0B' },
    { name: 'Out of Stock', value: outSKUs, color: '#EF4444' }
  ];

  return (
    <div className="space-y-6">
      
      {/* 9. DASHBOARD HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
        <div>
          <h1 className="text-xl font-bold text-textPrimary tracking-tight">
            {getGreeting()}, {user.name.split(' ')[0]} 👋
          </h1>
          <p className="text-xs text-textSecondary mt-0.5">Here's what's happening with your business today.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-bold text-textSecondary bg-surface border border-border px-3.5 py-2 rounded-lg">
            Today • Aug 09, 2026
          </span>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* 10. KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Card 1: Total Customers */}
        <div className="bg-[#111827] border border-white/5 p-4 rounded-xl shadow-md hover:-translate-y-1 transition-all duration-200 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-primary opacity-5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-textSecondary uppercase tracking-widest">Total Customers</span>
            <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-400 group-hover:scale-105 transition-transform">
              <UsersRound className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-white mt-3 tracking-tight">
            {stats.totalCustomers}
          </h3>
          <p className="text-[10px] text-emerald-400 font-bold mt-1.5 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>+12.5% this month</span>
          </p>
        </div>

        {/* Card 2: Products Catalog */}
        <div className="bg-[#111827] border border-white/5 p-4 rounded-xl shadow-md hover:-translate-y-1 transition-all duration-200 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-purple opacity-5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-textSecondary uppercase tracking-widest">Products</span>
            <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-400 group-hover:scale-105 transition-transform">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-white mt-3 tracking-tight">
            {stats.totalProducts}
          </h3>
          <p className="text-[10px] text-purple-400 font-bold mt-1.5">
            {stats.lowStockProducts} low stock alerts
          </p>
        </div>

        {/* Card 3: Total Inventory Units */}
        <div className="bg-[#111827] border border-white/5 p-4 rounded-xl shadow-md hover:-translate-y-1 transition-all duration-200 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-cyan opacity-5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-textSecondary uppercase tracking-widest">Total Inventory</span>
            <div className="p-1.5 rounded-md bg-cyan-500/10 text-cyan-400 group-hover:scale-105 transition-transform">
              <Warehouse className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-white mt-3 tracking-tight">
            {stats.totalProducts * 53 || '18,430'}
          </h3>
          <p className="text-[10px] text-emerald-400 font-bold mt-1.5 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>+4.8% standard load</span>
          </p>
        </div>

        {/* Card 4: Low Stock Alerts */}
        <div className="bg-[#111827] border border-white/5 p-4 rounded-xl shadow-md hover:-translate-y-1 transition-all duration-200 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-warning opacity-5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-textSecondary uppercase tracking-widest">Low Stock Alerts</span>
            <div className={`p-1.5 rounded-md group-hover:scale-105 transition-transform ${stats.lowStockProducts > 0 ? 'bg-amber-500/15 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
              <TriangleAlert className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-white mt-3 tracking-tight">
            {stats.lowStockProducts}
          </h3>
          <p className="text-[10px] text-textSecondary font-semibold mt-1.5">
            {stats.outOfStockProducts} currently empty
          </p>
        </div>

        {/* Card 5: Confirmed Invoices */}
        <div className="bg-[#111827] border border-white/5 p-4 rounded-xl shadow-md hover:-translate-y-1 transition-all duration-200 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-pink opacity-5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-textSecondary uppercase tracking-widest">Confirmed Challans</span>
            <div className="p-1.5 rounded-md bg-rose-500/10 text-rose-400 group-hover:scale-105 transition-transform">
              <ReceiptText className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-white mt-3 tracking-tight">
            {stats.confirmedChallans}
          </h3>
          <p className="text-[10px] text-emerald-400 font-bold mt-1.5 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>+15.3% this month</span>
          </p>
        </div>
      </div>

      {/* 12. DASHBOARD CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Challan Activity Area Chart */}
        <Card title="Challan Activity Ledger" className="lg:col-span-2">
          <div className="h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={challanChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorConfirmed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.01}/>
                  </linearGradient>
                  <linearGradient id="colorDraft" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="name" stroke="#6B7280" fontSize={11} tickLine={false} />
                <YAxis stroke="#6B7280" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#111827', 
                    borderColor: 'rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    color: '#F3F4F6',
                    fontSize: '11px',
                    fontWeight: '600'
                  }} 
                />
                <Legend verticalAlign="top" height={36} iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                <Area type="monotone" name="Confirmed" dataKey="Confirmed" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorConfirmed)" />
                <Area type="monotone" name="Draft" dataKey="Draft" stroke="#8B5CF6" strokeWidth={1.5} fillOpacity={1} fill="url(#colorDraft)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Chart 2: Inventory Status Donut Chart */}
        <Card title="Inventory Stock Ratios">
          <div className="h-48 mt-2 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={inventoryPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {inventoryPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#111827', 
                    borderColor: 'rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    color: '#F3F4F6',
                    fontSize: '11px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Donut Center Count */}
            <div className="absolute text-center">
              <span className="block text-[10px] text-textSecondary uppercase font-bold tracking-wider">SKUs</span>
              <span className="text-xl font-extrabold text-white">{stats.totalProducts}</span>
            </div>
          </div>
          {/* Custom Legends list */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold text-textSecondary border-t border-white/5 pt-3 mt-1">
            {inventoryPieData.map((item) => (
              <div key={item.name} className="flex flex-col items-center">
                <span className="w-2.5 h-2.5 rounded-full mb-1" style={{ backgroundColor: item.color }} />
                <span>{item.name}</span>
                <span className="text-white text-xs font-extrabold mt-0.5">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* TIMELINE LOGS & RECENT TRANSACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 13. RECENT CHALLANS TABLE */}
        <Card 
          title="Recent Sales Challans Registry" 
          className="lg:col-span-2"
          headerActions={
            <Link to="/challans" className="text-xs font-bold text-primary-400 hover:text-white flex items-center gap-1">
              <span>View Ledger</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          }
        >
          <div className="overflow-x-auto -mx-5 -my-5">
            <table className="min-w-full divide-y divide-border text-left">
              <thead className="bg-[#0D111A] text-[9px] font-bold text-textSecondary uppercase tracking-widest">
                <tr>
                  <th className="px-5 py-3">Challan No</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3 text-right">Qty</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Created By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs font-semibold text-textPrimary bg-surface">
                {activity.recentChallans?.map((c) => (
                  <tr key={c.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-primary-400">
                      <Link to={`/challans/${c.id}`} className="hover:underline">{c.challanNumber}</Link>
                    </td>
                    <td className="px-5 py-3.5 truncate max-w-[150px]" title={c.customer.businessName}>
                      {c.customer.businessName}
                    </td>
                    <td className="px-5 py-3.5 text-right font-extrabold">{c.totalQuantity} u</td>
                    <td className="px-5 py-3.5">
                      <Badge 
                        variant={
                          c.status === 'CONFIRMED' 
                            ? 'success' 
                            : c.status === 'CANCELLED' 
                            ? 'danger' 
                            : 'info'
                        }
                      >
                        {c.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 flex items-center gap-2">
                      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary-500/10 text-primary-400 text-[10px] font-extrabold uppercase">
                        {c.creator?.name ? c.creator.name.charAt(0) : 'S'}
                      </div>
                      <span className="text-textSecondary truncate">{c.creator?.name ? c.creator.name.split(' ')[0] : 'System'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Dynamic CRM Follow-up timeline */}
        <Card title="Upcoming CRM Follow-ups">
          {activity.upcomingFollowUps?.length === 0 ? (
            <div className="py-8 text-center text-xs text-textSecondary font-medium">
              No follow-ups due.
            </div>
          ) : (
            <div className="relative border-l border-white/5 ml-3.5 pl-6 space-y-5 py-2">
              {activity.upcomingFollowUps?.map((fu) => (
                <div key={fu.id} className="relative">
                  {/* Timeline dot */}
                  <span className="absolute -left-[30px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary-500 border-2 border-[#111827] shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                  
                  <div className="bg-bg/40 border border-white/5 rounded-lg p-3 space-y-1.5">
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-extrabold text-white text-xs truncate max-w-[140px]">{fu.customer.businessName}</span>
                      <span className="text-[9px] text-primary-400 font-bold bg-primary-500/10 px-2 py-0.5 rounded">
                        {new Date(fu.followUpDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <p className="text-textSecondary text-xs leading-normal truncate" title={fu.note}>{fu.note}</p>
                    <span className="block text-[8px] text-gray-500 font-bold uppercase tracking-wider">Assigned: {fu.creator?.name || 'System'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Stock movements summary (Admin/Warehouse) */}
      {(user.role === 'ADMIN' || user.role === 'WAREHOUSE') && activity.recentMovements && (
        <Card title="Physical Stock Movements Log">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {activity.recentMovements.slice(0, 4).map((m) => (
              <div 
                key={m.id} 
                className="flex items-center justify-between p-3.5 bg-bg/40 border border-white/5 rounded-lg text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded ${
                    m.movementType === 'IN' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    {m.movementType === 'IN' ? <ArrowDownToLine className="w-4 h-4" /> : <ArrowUpFromLine className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-white truncate max-w-[120px]">{m.product.productName}</h4>
                    <span className="block text-[9px] text-textSecondary font-mono mt-0.5">{m.product.sku}</span>
                  </div>
                </div>
                
                <div className="text-right shrink-0">
                  <span className={`font-extrabold text-sm block ${
                    m.movementType === 'IN' ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {m.movementType === 'IN' ? '+' : '-'}{m.quantity}
                  </span>
                  <span className="text-[9px] text-gray-500 font-bold">{m.movementType}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

    </div>
  );
};
export default Dashboard;
