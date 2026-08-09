import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../services/api';
import { useAuth } from '../store/authContext';
import { useToast } from '../store/toastContext';
import { Package, ArrowUpRight, ArrowDownLeft, ClipboardList, Plus, Search, HelpCircle, X } from 'lucide-react';
import { 
  Button, Input, Select, Textarea, Badge, Card, PageHeader, StatCard, EmptyState, Skeleton 
} from '../components/UI';
import { Pagination } from '../components/Pagination';

// Validation Schema
const StockMovementSchema = z.object({
  productId: z.string().uuid('Please select a product'),
  movementType: z.enum(['IN', 'OUT'], { errorMap: () => ({ message: 'Select movement type' }) }),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
  reason: z.string().min(1, 'Reason is required'),
});

export const Inventory = () => {
  const { user } = useAuth();
  const { success, error: showToastError } = useToast();

  // Active View Tab State
  const [activeTab, setActiveTab] = useState('stock'); // 'stock' | 'movements'

  // Summary Stats States
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStockUnits: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
  });

  // Table Lists States
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination States
  const [stockPage, setStockPage] = useState(1);
  const [stockTotalPages, setStockTotalPages] = useState(1);
  const [movPage, setMovPage] = useState(1);
  const [movTotalPages, setMovTotalPages] = useState(1);

  // Search/Filter States
  const [stockSearch, setStockSearch] = useState('');
  const [movSearchType, setMovSearchType] = useState('');

  // Modal Movement States
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Full list of products for dropdown selector
  const [allProductsList, setAllProductsList] = useState([]);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(StockMovementSchema),
    defaultValues: {
      productId: '',
      movementType: 'IN',
      quantity: 1,
      reason: '',
    }
  });

  const fetchStats = async () => {
    try {
      const res = await api.get('/api/inventory');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching inventory statistics', err);
    }
  };

  const fetchStockLevels = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/products', {
        params: {
          page: stockPage,
          limit: 10,
          search: stockSearch,
        }
      });
      if (res.data.success) {
        setProducts(res.data.data);
        setStockTotalPages(res.data.pagination.totalPages);
      }
    } catch (err) {
      showToastError('Failed to fetch stock levels');
    } finally {
      setLoading(false);
    }
  };

  const fetchMovementsLog = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/inventory/movements', {
        params: {
          page: movPage,
          limit: 10,
          movementType: movSearchType || undefined,
        }
      });
      if (res.data.success) {
        setMovements(res.data.data);
        setMovTotalPages(res.data.pagination.totalPages);
      }
    } catch (err) {
      showToastError('Failed to fetch stock movements log');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllProductsDropdown = async () => {
    try {
      const res = await api.get('/api/products', { params: { limit: 100 } });
      if (res.data.success) {
        setAllProductsList(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchAllProductsDropdown();
  }, []);

  useEffect(() => {
    if (activeTab === 'stock') {
      fetchStockLevels();
    } else {
      fetchMovementsLog();
    }
  }, [activeTab, stockPage, movPage, movSearchType]);

  const handleStockSearchSubmit = (e) => {
    e.preventDefault();
    setStockPage(1);
    fetchStockLevels();
  };

  const handleOpenMovementModal = (product = null) => {
    reset({
      productId: product ? product.id : '',
      movementType: 'IN',
      quantity: 1,
      reason: product ? `Restocking SKU ${product.sku}` : '',
    });
    setSelectedProduct(product);
    setModalOpen(true);
  };

  const handleMovementSubmit = async (data) => {
    try {
      const res = await api.post('/api/inventory/movements', data);
      if (res.data.success) {
        success('Stock movement logged successfully.');
        setModalOpen(false);
        fetchStats();
        if (activeTab === 'stock') {
          fetchStockLevels();
        } else {
          fetchMovementsLog();
        }
      }
    } catch (err) {
      showToastError(err.response?.data?.message || 'Stock movement request failed.');
    }
  };

  const getStockStatusText = (stock, minStock) => {
    if (stock === 0) return <Badge variant="danger">OUT OF STOCK</Badge>;
    if (stock <= minStock) return <Badge variant="warning">LOW STOCK</Badge>;
    return <Badge variant="success">IN STOCK</Badge>;
  };

  const isWarehouseUser = user.role === 'ADMIN' || user.role === 'WAREHOUSE';

  return (
    <div>
      <PageHeader
        title="Inventory Operations"
        subtitle="Monitor warehouse stock levels, configure low stock thresholds, and register stock movements."
        actions={
          isWarehouseUser && (
            <Button onClick={() => handleOpenMovementModal()} className="font-bold flex gap-2">
              <Plus className="w-4 h-4" /> Log Stock Movement
            </Button>
          )
        }
      />

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          icon={Package}
          variant="primary"
        />
        <StatCard
          title="Total Stock Units"
          value={stats.totalStockUnits}
          icon={ClipboardList}
          variant="success"
        />
        <StatCard
          title="Low Stock Warning Items"
          value={stats.lowStockProducts}
          icon={HelpCircle}
          variant="warning"
        />
        <StatCard
          title="Out of Stock Items"
          value={stats.outOfStockProducts}
          icon={X}
          variant="danger"
        />
      </div>

      {/* Inventory Health horizontal segmented visualization */}
      <Card title="Inventory Health Distribution" className="mb-6">
        <div className="space-y-4">
          <div className="h-5 w-full bg-white/5 dark:bg-black/35 rounded-full flex overflow-hidden p-0.5 border border-white/5">
            <div 
              style={{ width: `${Math.round(((stats.totalProducts - stats.lowStockProducts - stats.outOfStockProducts) / (stats.totalProducts || 1)) * 100)}%` }} 
              className="h-full bg-gradient-success rounded-l-full" 
              title="In Stock"
            />
            <div 
              style={{ width: `${Math.round((stats.lowStockProducts / (stats.totalProducts || 1)) * 100)}%` }} 
              className="h-full bg-gradient-warning" 
              title="Low Stock"
            />
            <div 
              style={{ width: `${Math.round((stats.outOfStockProducts / (stats.totalProducts || 1)) * 100)}%` }} 
              className="h-full bg-gradient-pink rounded-r-full" 
              title="Out of Stock"
            />
          </div>
          
          <div className="flex flex-wrap gap-6 text-xs font-bold text-textSecondary justify-center sm:justify-start">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-gradient-success shrink-0" />
              <span>{Math.round(((stats.totalProducts - stats.lowStockProducts - stats.outOfStockProducts) / (stats.totalProducts || 1)) * 100)}% In Stock</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-gradient-warning shrink-0" />
              <span>{Math.round((stats.lowStockProducts / (stats.totalProducts || 1)) * 100)}% Low Stock</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-gradient-pink shrink-0" />
              <span>{Math.round((stats.outOfStockProducts / (stats.totalProducts || 1)) * 100)}% Out of Stock</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Sliding View Navigation Tabs */}
      <div className="border-b border-gray-200 dark:border-white/5 mb-6 flex items-center justify-between">
        <div className="flex gap-4">
          <button
            onClick={() => { setActiveTab('stock'); setLoading(true); }}
            className={`pb-4 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'stock'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Stock Levels Grid
          </button>
          <button
            onClick={() => { setActiveTab('movements'); setLoading(true); }}
            className={`pb-4 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'movements'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Audit Stock Movements
          </button>
        </div>
      </div>

      {/* Tab 1: Stock Levels Grid */}
      {activeTab === 'stock' && (
        <div className="space-y-6">
          <Card>
            <form onSubmit={handleStockSearchSubmit} className="flex gap-4 max-w-lg">
              <Input
                placeholder="Filter by product name, SKU code, location..."
                value={stockSearch}
                onChange={(e) => setStockSearch(e.target.value)}
              />
              <Button type="submit" variant="secondary" className="flex gap-2">
                <Search className="w-4 h-4" /> Filter
              </Button>
            </form>
          </Card>

          {loading ? (
            <Card className="p-0">
              <div className="p-6">
                <Skeleton className="h-10 w-full rounded-lg" count={5} />
              </div>
            </Card>
          ) : products.length === 0 ? (
            <EmptyState title="No stock items found" description="Adjust your filters or add a new product." />
          ) : (
            <Card className="p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100 text-left">
                  <thead className="bg-gray-50/70 text-gray-500 uppercase tracking-widest text-[10px] font-bold">
                    <tr>
                      <th className="px-6 py-4">Product</th>
                      <th className="px-6 py-4">SKU Code</th>
                      <th className="px-6 py-4 text-right">Available Stock</th>
                      <th className="px-6 py-4 text-right">Min Stock</th>
                      <th className="px-6 py-4">Warehouse Location</th>
                      <th className="px-6 py-4">Status</th>
                      {isWarehouseUser && <th className="px-6 py-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm font-medium text-gray-700 bg-white">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-800">{p.productName}</td>
                        <td className="px-6 py-4 text-xs font-mono text-gray-500">{p.sku}</td>
                        <td className="px-6 py-4 text-right font-bold text-gray-800">{p.currentStock}</td>
                        <td className="px-6 py-4 text-right text-gray-400">{p.minimumStock}</td>
                        <td className="px-6 py-4 text-xs text-gray-500">{p.warehouseLocation}</td>
                        <td className="px-6 py-4">{getStockStatusText(p.currentStock, p.minimumStock)}</td>
                        {isWarehouseUser && (
                          <td className="px-6 py-4 text-right">
                            <Button 
                              variant="secondary" 
                              size="sm" 
                              onClick={() => handleOpenMovementModal(p)}
                            >
                              Adjust Stock
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={stockPage} totalPages={stockTotalPages} onPageChange={setStockPage} />
            </Card>
          )}
        </div>
      )}

      {/* Tab 2: Stock Movements Audit Log */}
      {activeTab === 'movements' && (
        <div className="space-y-6">
          <Card>
            <div className="flex gap-4 items-center">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Movement Type Filter:</span>
              <div className="flex gap-2">
                <Button
                  variant={movSearchType === '' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => { setMovSearchType(''); setMovPage(1); }}
                >
                  All Logs
                </Button>
                <Button
                  variant={movSearchType === 'IN' ? 'success' : 'secondary'}
                  size="sm"
                  onClick={() => { setMovSearchType('IN'); setMovPage(1); }}
                >
                  Stock IN
                </Button>
                <Button
                  variant={movSearchType === 'OUT' ? 'danger' : 'secondary'}
                  size="sm"
                  onClick={() => { setMovSearchType('OUT'); setMovPage(1); }}
                >
                  Stock OUT
                </Button>
              </div>
            </div>
          </Card>

          {loading ? (
            <Card className="p-0">
              <div className="p-6">
                <Skeleton className="h-10 w-full rounded-lg" count={5} />
              </div>
            </Card>
          ) : movements.length === 0 ? (
            <EmptyState title="No movements registered" description="Choose a different filter or record stock movements." />
          ) : (
            <Card className="p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100 text-left">
                  <thead className="bg-gray-50/70 text-gray-500 uppercase tracking-widest text-[10px] font-bold">
                    <tr>
                      <th className="px-6 py-4">Product Name</th>
                      <th className="px-6 py-4">SKU</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4 text-right">Quantity</th>
                      <th className="px-6 py-4">Transaction Reason</th>
                      <th className="px-6 py-4">Recorded By</th>
                      <th className="px-6 py-4">Date & Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm font-medium text-gray-700 bg-white">
                    {movements.map((m) => (
                      <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-800">{m.product.productName}</td>
                        <td className="px-6 py-4 text-xs font-mono text-gray-500">{m.product.sku}</td>
                        <td className="px-6 py-4">
                          <Badge variant={m.movementType === 'IN' ? 'success' : 'danger'} className="flex items-center gap-1 w-fit">
                            {m.movementType === 'IN' ? (
                              <>
                                <ArrowUpRight className="w-3.5 h-3.5" /> Stock IN
                              </>
                            ) : (
                              <>
                                <ArrowDownLeft className="w-3.5 h-3.5" /> Stock OUT
                              </>
                            )}
                          </Badge>
                        </td>
                        <td className={`px-6 py-4 text-right font-bold ${
                          m.movementType === 'IN' ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {m.movementType === 'IN' ? '+' : '-'}{m.quantity}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500 leading-normal max-w-xs truncate" title={m.reason}>
                          {m.reason}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-600">{m.creator.name}</td>
                        <td className="px-6 py-4 text-xs text-gray-400">
                          {new Date(m.createdAt).toLocaleString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={movPage} totalPages={movTotalPages} onPageChange={setMovPage} />
            </Card>
          )}
        </div>
      )}

      {/* Log Stock Movement Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs animate-fade-in">
          <div onClick={() => setModalOpen(false)} className="absolute inset-0" />
          
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-100 transform scale-100 transition-all duration-300 animate-zoom-in">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <h3 className="font-bold text-gray-800 text-base">Record Inventory Adjustment</h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(handleMovementSubmit)} className="p-6 space-y-4">
              <div className="w-full">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Select Product</label>
                <select
                  disabled={selectedProduct !== null}
                  className={`w-full px-3.5 py-2 text-sm text-gray-900 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 ${
                    selectedProduct ? 'bg-gray-50 border-gray-100 text-gray-400 font-bold' : ''
                  }`}
                  {...register('productId')}
                >
                  <option value="">Select product...</option>
                  {allProductsList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.productName} ({p.sku}) - Stock: {p.currentStock}
                    </option>
                  ))}
                </select>
                {errors.productId?.message && <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.productId.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Adjustment Type"
                  options={[
                    { value: 'IN', label: 'IN (Restock / Return)' },
                    { value: 'OUT', label: 'OUT (Write-off / Damage)' },
                  ]}
                  error={errors.movementType?.message}
                  {...register('movementType')}
                />
                <Input
                  label="Quantity"
                  type="number"
                  placeholder="e.g. 10"
                  error={errors.quantity?.message}
                  {...register('quantity')}
                />
              </div>

              <Textarea
                label="Adjustment Reason"
                placeholder="Describe why this stock adjustment is registered (e.g. Vendor delivery, damaged goods, inventory audit)..."
                error={errors.reason?.message}
                {...register('reason')}
              />

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-50 mt-6">
                <Button variant="secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary" 
                  className="font-bold px-6"
                  loading={isSubmitting}
                >
                  Apply Adjustment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Inventory;
