import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../services/api';
import { useAuth } from '../store/authContext';
import { useToast } from '../store/toastContext';
import { ArrowLeft, User, Phone, Mail, Building, MapPin, ClipboardList, Calendar, Plus, Clock } from 'lucide-react';
import { 
  Button, Input, Textarea, Badge, Card, PageHeader, Skeleton, EmptyState 
} from '../components/UI';

// Follow Up validation schema
const FollowUpFormSchema = z.object({
  note: z.string().min(1, 'Note cannot be empty'),
  followUpDate: z.string().min(1, 'Follow-up date is required').transform(val => new Date(val).toISOString()),
});

export const CustomerDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { success, error: showToastError } = useToast();

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingFollowUp, setAddingFollowUp] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(FollowUpFormSchema),
    defaultValues: {
      note: '',
      followUpDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16), // Tomorrow default
    }
  });

  const fetchCustomerDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/customers/${id}`);
      if (res.data.success) {
        setCustomer(res.data.data);
      }
    } catch (err) {
      showToastError('Failed to load customer details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerDetails();
  }, [id]);

  const handleAddFollowUp = async (data) => {
    setAddingFollowUp(true);
    try {
      const res = await api.post(`/api/customers/${id}/follow-ups`, data);
      if (res.data.success) {
        success('Follow-up activity recorded.');
        reset({
          note: '',
          followUpDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
        });
        fetchCustomerDetails(); // Refresh details & timeline
      }
    } catch (err) {
      showToastError(err.response?.data?.message || 'Error saving follow-up');
    } finally {
      setAddingFollowUp(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 rounded-2xl lg:col-span-1" />
          <Skeleton className="h-96 rounded-2xl lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <EmptyState
        title="Customer not found"
        description="The customer file you requested might have been deleted or does not exist."
        action={
          <Link to="/customers">
            <Button variant="secondary">Back to Customers</Button>
          </Link>
        }
      />
    );
  }

  const canAddActivity = user.role === 'ADMIN' || user.role === 'SALES';

  return (
    <div className="space-y-6">
      {/* Back Header */}
      <div>
        <Link to="/customers" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 font-semibold mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Customers Registry
        </Link>
        <PageHeader 
          title={customer.customerName} 
          subtitle={`${customer.businessName} • ${customer.customerType}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Contact Information Cards */}
        <div className="space-y-6 lg:col-span-1">
          <Card title="Customer Profile Details">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Contact Person</p>
                  <p className="text-sm font-semibold text-gray-800">{customer.customerName}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Building className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Company Name</p>
                  <p className="text-sm font-semibold text-gray-800">{customer.businessName}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Mobile Number</p>
                  <p className="text-sm font-semibold text-gray-800">{customer.mobile}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Email Address</p>
                  <p className="text-sm font-semibold text-gray-800 break-all">{customer.email || '—'}</p>
                </div>
              </div>

              {customer.gstNumber && (
                <div className="flex items-start gap-3">
                  <ClipboardList className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">GSTIN Number</p>
                    <p className="text-sm font-mono font-semibold text-gray-800">{customer.gstNumber}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Billing / Shipping Address</p>
                  <p className="text-sm text-gray-600 leading-relaxed mt-0.5">{customer.address}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Lead Status</span>
                  <Badge variant={customer.status === 'ACTIVE' ? 'success' : customer.status === 'LEAD' ? 'info' : 'danger'} className="mt-1">
                    {customer.status}
                  </Badge>
                </div>
                {customer.followUpDate && (
                  <div className="text-right">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Scheduled follow-up</span>
                    <span className="text-xs font-semibold text-gray-600 flex items-center gap-1 mt-1 justify-end">
                      <Calendar className="w-3.5 h-3.5 text-primary-500" />
                      {new Date(customer.followUpDate).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {customer.notes && (
            <Card title="Notes">
              <p className="text-sm text-gray-600 leading-relaxed italic">{customer.notes}</p>
            </Card>
          )}
        </div>

        {/* Right Side: Follow-up Activity Logger & Timeline */}
        <div className="space-y-6 lg:col-span-2">
          {/* Logger */}
          {canAddActivity && (
            <Card title="Add CRM Activity Log">
              <form onSubmit={handleSubmit(handleAddFollowUp)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Next Follow-up Date</label>
                    <input
                      type="datetime-local"
                      className="w-full px-3.5 py-2 text-sm text-gray-900 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
                      {...register('followUpDate')}
                    />
                    {errors.followUpDate?.message && <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.followUpDate.message}</p>}
                  </div>
                </div>

                <Textarea
                  label="Timeline Note"
                  placeholder="Record summary of the call or email conversation..."
                  error={errors.note?.message}
                  {...register('note')}
                />

                <div className="flex justify-end">
                  <Button type="submit" variant="primary" className="font-bold flex gap-2" loading={addingFollowUp}>
                    <Plus className="w-4 h-4" /> Save Timeline Entry
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Timeline */}
          <Card title="CRM Activity Timeline">
            {customer.followUps.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm font-medium">
                No timeline records logged for this customer.
              </div>
            ) : (
              <div className="relative pl-6 border-l-2 border-gray-100 space-y-6 py-2 ml-4">
                {customer.followUps.map((fu) => (
                  <div key={fu.id} className="relative">
                    {/* Circle Node Icon */}
                    <div className="absolute -left-[31px] top-1 p-1 bg-white rounded-full border-2 border-primary-500">
                      <Clock className="w-3 h-3 text-primary-500" />
                    </div>
                    
                    <div className="bg-gray-50/50 hover:bg-gray-50 border border-gray-50 rounded-2xl p-4 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                        <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
                          Logged by <span className="text-gray-700 font-extrabold">{fu.creator.name}</span>
                        </span>
                        <span className="text-xs text-gray-400 font-semibold">
                          {new Date(fu.createdAt).toLocaleString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-700 leading-relaxed">{fu.note}</p>
                      
                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-1.5 text-xs text-gray-500 font-semibold">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        Next Follow-up scheduled: <span className="text-primary-600 font-bold">
                          {new Date(fu.followUpDate).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
export default CustomerDetail;
