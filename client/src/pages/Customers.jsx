import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../services/api';
import { useAuth } from '../store/authContext';
import { useToast } from '../store/toastContext';
import { Link } from 'react-router-dom';
import { Search, Plus, Filter, Eye, Edit2, Trash2, X } from 'lucide-react';
import { 
  Button, Input, Select, Textarea, Badge, Card, PageHeader, EmptyState, Skeleton 
} from '../components/UI';
import { Pagination } from '../components/Pagination';

// Validation Schema
const CustomerFormSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  mobile: z.string().min(10, 'Mobile must be at least 10 digits'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')).nullable(),
  businessName: z.string().min(1, 'Business name is required'),
  gstNumber: z.string().max(15, 'GST must be maximum 15 characters').optional().or(z.literal('')).nullable(),
  customerType: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR'], { errorMap: () => ({ message: 'Select customer type' }) }),
  status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE']).default('ACTIVE'),
  address: z.string().min(1, 'Address is required'),
  notes: z.string().optional().nullable(),
});

export const Customers = () => {
  const { user } = useAuth();
  const { success, error: showToastError } = useToast();
  
  // Data States
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);

  // Filter States
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [customerType, setCustomerType] = useState('');

  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(CustomerFormSchema),
    defaultValues: {
      customerName: '',
      mobile: '',
      email: '',
      businessName: '',
      gstNumber: '',
      customerType: 'RETAIL',
      status: 'ACTIVE',
      address: '',
      notes: '',
    }
  });

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/customers', {
        params: {
          page,
          limit: 10,
          search,
          status: status || undefined,
          customerType: customerType || undefined,
        }
      });
      if (res.data.success) {
        setCustomers(res.data.data);
        setTotalPages(res.data.pagination.totalPages);
        setTotalCustomers(res.data.pagination.total);
      }
    } catch (err) {
      showToastError('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, status, customerType]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  };

  const handleOpenAdd = () => {
    reset({
      customerName: '',
      mobile: '',
      email: '',
      businessName: '',
      gstNumber: '',
      customerType: 'RETAIL',
      status: 'ACTIVE',
      address: '',
      notes: '',
    });
    setEditingId(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (customer) => {
    reset({
      customerName: customer.customerName,
      mobile: customer.mobile,
      email: customer.email || '',
      businessName: customer.businessName,
      gstNumber: customer.gstNumber || '',
      customerType: customer.customerType,
      status: customer.status,
      address: customer.address,
      notes: customer.notes || '',
    });
    setEditingId(customer.id);
    setModalOpen(true);
  };

  const handleFormSubmit = async (data) => {
    try {
      if (editingId) {
        // Edit Customer
        const res = await api.put(`/api/customers/${editingId}`, data);
        if (res.data.success) {
          success('Customer profile updated.');
          setModalOpen(false);
          fetchCustomers();
        }
      } else {
        // Add Customer
        const res = await api.post('/api/customers', data);
        if (res.data.success) {
          success('Customer created.');
          setModalOpen(false);
          setPage(1);
          fetchCustomers();
        }
      }
    } catch (err) {
      showToastError(err.response?.data?.message || 'Error processing request');
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete customer '${name}'?`)) {
      try {
        const res = await api.delete(`/api/customers/${id}`);
        if (res.data.success) {
          success('Customer deleted.');
          fetchCustomers();
        }
      } catch (err) {
        showToastError('Could not delete customer');
      }
    }
  };

  const canEdit = user.role === 'ADMIN' || user.role === 'SALES';
  const canDelete = user.role === 'ADMIN';

  return (
    <div>
      <PageHeader
        title="Customers Registry"
        subtitle="Manage leads, distributors, retail clients and follow-up activities."
        actions={
          canEdit && (
            <Button onClick={handleOpenAdd} className="font-bold flex gap-2">
              <Plus className="w-4 h-4" /> Add Customer
            </Button>
          )
        }
      />

      {/* Filters Card */}
      <Card className="mb-6">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-end gap-4">
          <div className="flex-1 w-full">
            <Input
              label="Search Customers"
              placeholder="Search by customer name, shop name, mobile, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-full md:w-48">
            <Select
              label="Customer Type"
              value={customerType}
              onChange={(e) => { setCustomerType(e.target.value); setPage(1); }}
              options={[
                { value: 'RETAIL', label: 'Retail' },
                { value: 'WHOLESALE', label: 'Wholesale' },
                { value: 'DISTRIBUTOR', label: 'Distributor' },
              ]}
              placeholder="All Types"
            />
          </div>
          <div className="w-full md:w-48">
            <Select
              label="Status"
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              options={[
                { value: 'LEAD', label: 'Lead' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'INACTIVE', label: 'Inactive' },
              ]}
              placeholder="All Statuses"
            />
          </div>
          <Button type="submit" variant="secondary" className="w-full md:w-auto flex gap-2">
            <Search className="w-4 h-4" /> Search
          </Button>
        </form>
      </Card>

      {/* Grid List */}
      {loading ? (
        <Card className="p-0">
          <div className="p-6">
            <Skeleton className="h-10 w-full rounded-lg" count={5} />
          </div>
        </Card>
      ) : customers.length === 0 ? (
        <EmptyState
          title="No customers registered"
          description="Adjust your filters or add a new customer database entry."
          action={
            canEdit && (
              <Button onClick={handleOpenAdd}>Add Customer</Button>
            )
          }
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-left">
              <thead className="bg-gray-50/70 text-gray-500 uppercase tracking-widest text-[10px] font-bold">
                <tr>
                  <th className="px-6 py-4">Customer Name</th>
                  <th className="px-6 py-4">Business Name</th>
                  <th className="px-6 py-4">Mobile</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Next Follow-up</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm font-medium text-gray-700 bg-white">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-800">{customer.customerName}</td>
                    <td className="px-6 py-4 text-gray-500">{customer.businessName}</td>
                    <td className="px-6 py-4 text-gray-500">{customer.mobile}</td>
                    <td className="px-6 py-4">
                      <Badge variant="neutral">{customer.customerType}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge 
                        variant={
                          customer.status === 'ACTIVE' 
                            ? 'success' 
                            : customer.status === 'LEAD' 
                            ? 'info' 
                            : 'danger'
                        }
                      >
                        {customer.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {customer.followUpDate 
                        ? new Date(customer.followUpDate).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          }) 
                        : '—'
                      }
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-1.5">
                        <Link to={`/customers/${customer.id}`}>
                          <Button variant="ghost" size="sm" className="p-2">
                            <Eye className="w-4 h-4 text-gray-500 hover:text-primary-600" />
                          </Button>
                        </Link>
                        {canEdit && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="p-2"
                            onClick={() => handleOpenEdit(customer)}
                          >
                            <Edit2 className="w-4 h-4 text-gray-500 hover:text-amber-600" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="p-2"
                            onClick={() => handleDelete(customer.id, customer.customerName)}
                          >
                            <Trash2 className="w-4 h-4 text-gray-400 hover:text-rose-600" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </Card>
      )}

      {/* Slide-out / Modal Drawer for Customer Add/Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-gray-900/40 backdrop-blur-xs animate-fade-in">
          {/* Backdrop click close */}
          <div onClick={() => setModalOpen(false)} className="absolute inset-0" />
          
          <div className="relative bg-white w-full max-w-lg h-full shadow-2xl flex flex-col justify-between border-l border-gray-100 transform translate-x-0 transition-transform duration-300 animate-slide-left">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-bold text-gray-800 text-lg">
                {editingId ? 'Edit Customer Info' : 'Register New Customer'}
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <form id="customer-form" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Customer Name"
                    placeholder="e.g. Rajesh Kumar"
                    error={errors.customerName?.message}
                    {...register('customerName')}
                  />
                  <Input
                    label="Shop/Business Name"
                    placeholder="e.g. Kumar Traders"
                    error={errors.businessName?.message}
                    {...register('businessName')}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Mobile Number"
                    placeholder="e.g. 9876543210"
                    error={errors.mobile?.message}
                    {...register('mobile')}
                  />
                  <Input
                    label="Email Address"
                    placeholder="e.g. sharma@gmail.com"
                    error={errors.email?.message}
                    {...register('email')}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Customer Type"
                    error={errors.customerType?.message}
                    options={[
                      { value: 'RETAIL', label: 'Retail' },
                      { value: 'WHOLESALE', label: 'Wholesale' },
                      { value: 'DISTRIBUTOR', label: 'Distributor' },
                    ]}
                    {...register('customerType')}
                  />
                  <Select
                    label="Lead Status"
                    error={errors.status?.message}
                    options={[
                      { value: 'LEAD', label: 'Lead' },
                      { value: 'ACTIVE', label: 'Active' },
                      { value: 'INACTIVE', label: 'Inactive' },
                    ]}
                    {...register('status')}
                  />
                </div>

                <Input
                  label="GSTIN Number (Optional)"
                  placeholder="e.g. 07AAAAA1111A1Z1"
                  error={errors.gstNumber?.message}
                  {...register('gstNumber')}
                />

                <Textarea
                  label="Registered Address"
                  placeholder="Street details, Landmark, City, State..."
                  error={errors.address?.message}
                  {...register('address')}
                />

                <Textarea
                  label="Initial Notes"
                  placeholder="Notes about business requirements or discounts..."
                  error={errors.notes?.message}
                  {...register('notes')}
                />
              </form>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3 shrink-0">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                form="customer-form" 
                variant="primary" 
                className="font-bold px-6"
                loading={isSubmitting}
              >
                Save Customer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Customers;
