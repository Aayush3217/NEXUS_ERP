import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../services/api';
import { useAuth } from '../store/authContext';
import { useToast } from '../store/toastContext';
import { Search, Plus, Filter, Edit2, Trash2, ShieldAlert, X } from 'lucide-react';
import { 
  Button, Input, Select, Badge, Card, PageHeader, EmptyState, Skeleton 
} from '../components/UI';
import { Pagination } from '../components/Pagination';

// Validation Schema
const ProductFormSchema = z.object({
  productName: z.string().min(1, 'Product name is required'),
  sku: z.string().min(1, 'SKU code is required'),
  category: z.string().min(1, 'Category is required'),
  unitPrice: z.coerce.number().min(0, 'Price must be non-negative'),
  currentStock: z.coerce.number().int().min(0, 'Current stock must be non-negative'),
  minimumStock: z.coerce.number().int().min(0, 'Minimum stock must be non-negative'),
  warehouseLocation: z.string().min(1, 'Warehouse location is required'),
});

export const Products = () => {
  const { user } = useAuth();
  const { success, error: showToastError } = useToast();

  // Data States
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Filter States
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [lowStock, setLowStock] = useState(false);

  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(ProductFormSchema),
    defaultValues: {
      productName: '',
      sku: '',
      category: '',
      unitPrice: 0,
      currentStock: 0,
      minimumStock: 0,
      warehouseLocation: '',
    }
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/products', {
        params: {
          page,
          limit: 10,
          search,
          category: category || undefined,
          lowStock: lowStock ? 'true' : undefined,
        }
      });
      if (res.data.success) {
        setProducts(res.data.data);
        setTotalPages(res.data.pagination.totalPages);
        setTotalProducts(res.data.pagination.total);
      }
    } catch (err) {
      showToastError('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, category, lowStock]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleOpenAdd = () => {
    reset({
      productName: '',
      sku: '',
      category: '',
      unitPrice: 0,
      currentStock: 0,
      minimumStock: 0,
      warehouseLocation: '',
    });
    setEditingId(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    reset({
      productName: product.productName,
      sku: product.sku,
      category: product.category,
      unitPrice: product.unitPrice,
      currentStock: product.currentStock,
      minimumStock: product.minimumStock,
      warehouseLocation: product.warehouseLocation,
    });
    setEditingId(product.id);
    setModalOpen(true);
  };

  const handleFormSubmit = async (data) => {
    try {
      if (editingId) {
        // Edit Product
        const res = await api.put(`/api/products/${editingId}`, data);
        if (res.data.success) {
          success('Product catalogue updated.');
          setModalOpen(false);
          fetchProducts();
        }
      } else {
        // Add Product
        const res = await api.post('/api/products', data);
        if (res.data.success) {
          success('Product added successfully.');
          setModalOpen(false);
          setPage(1);
          fetchProducts();
        }
      }
    } catch (err) {
      showToastError(err.response?.data?.message || 'Error processing request');
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete product '${name}'?`)) {
      try {
        const res = await api.delete(`/api/products/${id}`);
        if (res.data.success) {
          success('Product deleted.');
          fetchProducts();
        }
      } catch (err) {
        showToastError('Could not delete product');
      }
    }
  };

  const getStockBadge = (stock, minStock) => {
    if (stock === 0) {
      return <Badge variant="danger">OUT OF STOCK</Badge>;
    }
    if (stock <= minStock) {
      return <Badge variant="warning">LOW STOCK</Badge>;
    }
    return <Badge variant="success">IN STOCK</Badge>;
  };

  const isAdmin = user.role === 'ADMIN';

  return (
    <div>
      <PageHeader
        title="Products Catalogue"
        subtitle="View, search, and manage products, unit pricing and warehouse storage racks."
        actions={
          isAdmin && (
            <Button onClick={handleOpenAdd} className="font-bold flex gap-2">
              <Plus className="w-4 h-4" /> Add Product
            </Button>
          )
        }
      />

      {/* Filter and search bar */}
      <Card className="mb-6">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-end gap-4">
          <div className="flex-1 w-full">
            <Input
              label="Search Catalogue"
              placeholder="Search by product name, SKU code, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-full md:w-48">
            <Input
              label="Category"
              placeholder="e.g. Electricals"
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            />
          </div>
          <div className="w-full md:w-auto flex items-center h-10 mb-0.5">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-gray-600">
              <input
                type="checkbox"
                checked={lowStock}
                onChange={(e) => { setLowStock(e.target.checked); setPage(1); }}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded-lg focus:ring-primary-500 cursor-pointer"
              />
              <span className="flex items-center gap-1">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                Low Stock Only
              </span>
            </label>
          </div>
          <Button type="submit" variant="secondary" className="w-full md:w-auto flex gap-2">
            <Search className="w-4 h-4" /> Search
          </Button>
        </form>
      </Card>

      {/* Grid catalogue */}
      {loading ? (
        <Card className="p-0">
          <div className="p-6">
            <Skeleton className="h-10 w-full rounded-lg" count={5} />
          </div>
        </Card>
      ) : products.length === 0 ? (
        <EmptyState
          title="No products found"
          description="Adjust your search criteria or register a new product to list."
          action={
            isAdmin && (
              <Button onClick={handleOpenAdd}>Add Product</Button>
            )
          }
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-left">
              <thead className="bg-gray-50/70 text-gray-500 uppercase tracking-widest text-[10px] font-bold">
                <tr>
                  <th className="px-6 py-4">Product Name</th>
                  <th className="px-6 py-4">SKU Code</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4 text-right font-semibold">Unit Price</th>
                  <th className="px-6 py-4 text-right">Available Stock</th>
                  <th className="px-6 py-4 text-right">Min Stock</th>
                  <th className="px-6 py-4">Warehouse Row</th>
                  <th className="px-6 py-4">Status</th>
                  {isAdmin && <th className="px-6 py-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm font-medium text-gray-700 bg-white">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-800">{product.productName}</td>
                    <td className="px-6 py-4 text-xs font-mono text-gray-500">{product.sku}</td>
                    <td className="px-6 py-4"><Badge variant="neutral">{product.category}</Badge></td>
                    <td className="px-6 py-4 text-right text-gray-500 font-semibold">
                      ₹{product.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right font-bold">{product.currentStock}</td>
                    <td className="px-6 py-4 text-right text-gray-400">{product.minimumStock}</td>
                    <td className="px-6 py-4 text-xs text-gray-500">{product.warehouseLocation}</td>
                    <td className="px-6 py-4">{getStockBadge(product.currentStock, product.minimumStock)}</td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-1.5">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="p-2"
                            onClick={() => handleOpenEdit(product)}
                          >
                            <Edit2 className="w-4 h-4 text-gray-500 hover:text-amber-600" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="p-2"
                            onClick={() => handleDelete(product.id, product.productName)}
                          >
                            <Trash2 className="w-4 h-4 text-gray-400 hover:text-rose-600" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </Card>
      )}

      {/* Product Drawer Add/Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-gray-900/40 backdrop-blur-xs animate-fade-in">
          <div onClick={() => setModalOpen(false)} className="absolute inset-0" />
          
          <div className="relative bg-white w-full max-w-lg h-full shadow-2xl flex flex-col justify-between border-l border-gray-100 transform translate-x-0 transition-transform duration-300 animate-slide-left">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-bold text-gray-800 text-lg">
                {editingId ? 'Modify Product Details' : 'Register New Product'}
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <form id="product-form" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
                <Input
                  label="Product Title"
                  placeholder="e.g. Standard Wire Bundle 10m"
                  error={errors.productName?.message}
                  {...register('productName')}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="SKU Code"
                    placeholder="e.g. ELEC-WIR-001"
                    error={errors.sku?.message}
                    {...register('sku')}
                    disabled={editingId !== null} // SKU shouldn't be edited once generated
                  />
                  <Input
                    label="Product Category"
                    placeholder="e.g. Electricals"
                    error={errors.category?.message}
                    {...register('category')}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Unit Price (INR)"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    error={errors.unitPrice?.message}
                    {...register('unitPrice')}
                  />
                  <Input
                    label="Current Stock"
                    type="number"
                    placeholder="0"
                    error={errors.currentStock?.message}
                    {...register('currentStock')}
                    disabled={editingId !== null} // Stock levels for existing items must be managed via stock movements
                  />
                  <Input
                    label="Minimum Stock"
                    type="number"
                    placeholder="0"
                    error={errors.minimumStock?.message}
                    {...register('minimumStock')}
                  />
                </div>

                <Input
                  label="Warehouse Location"
                  placeholder="e.g. Aisle B-Shelf 4"
                  error={errors.warehouseLocation?.message}
                  {...register('warehouseLocation')}
                />
              </form>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3 shrink-0">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                form="product-form" 
                variant="primary" 
                className="font-bold px-6"
                loading={isSubmitting}
              >
                Save Product
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Products;
