import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../store/authContext';
import { useToast } from '../store/toastContext';
import { FileText, Search, Plus, Eye, Calendar, User } from 'lucide-react';
import { 
  Button, Input, Select, Badge, Card, PageHeader, EmptyState, Skeleton 
} from '../components/UI';
import { Pagination } from '../components/Pagination';
import { ChallanStatus } from '@prisma/client';

export const Challans = () => {
  const { user } = useAuth();
  const { error: showToastError } = useToast();

  const [challans, setChallans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filter States
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const fetchChallans = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/challans', {
        params: {
          page,
          limit: 10,
          search,
          status: status || undefined,
        }
      });
      if (res.data.success) {
        setChallans(res.data.data);
        setTotalPages(res.data.pagination.totalPages);
      }
    } catch (err) {
      showToastError('Failed to fetch sales challans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallans();
  }, [page, status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchChallans();
  };

  const getStatusBadge = (s) => {
    if (s === 'CONFIRMED') return <Badge variant="success">CONFIRMED</Badge>;
    if (s === 'CANCELLED') return <Badge variant="danger">CANCELLED</Badge>;
    return <Badge variant="warning">DRAFT</Badge>;
  };

  const canCreate = user.role === 'ADMIN' || user.role === 'SALES';

  return (
    <div>
      <PageHeader
        title="Sales Challans"
        subtitle="Manage wholesale orders, draft challan sheets, and issue finalized dispatch receipts."
        actions={
          canCreate && (
            <Link to="/challans/new">
              <Button className="font-bold flex gap-2">
                <Plus className="w-4 h-4" /> Create Challan
              </Button>
            </Link>
          )
        }
      />

      {/* Filter panel */}
      <Card className="mb-6">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-end gap-4">
          <div className="flex-1 w-full">
            <Input
              label="Search Challans"
              placeholder="Search by challan number, customer business name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-full md:w-48">
            <Select
              label="Status"
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              options={[
                { value: 'DRAFT', label: 'Draft' },
                { value: 'CONFIRMED', label: 'Confirmed' },
                { value: 'CANCELLED', label: 'Cancelled' },
              ]}
              placeholder="All Statuses"
            />
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
      ) : challans.length === 0 ? (
        <EmptyState
          title="No challans found"
          description="Adjust your search criteria or write a new sales challan draft order."
          action={
            canCreate && (
              <Link to="/challans/new">
                <Button>Create Challan</Button>
              </Link>
            )
          }
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-left">
              <thead className="bg-gray-50/70 text-gray-500 uppercase tracking-widest text-[10px] font-bold">
                <tr>
                  <th className="px-6 py-4">Challan Number</th>
                  <th className="px-6 py-4">Customer Business</th>
                  <th className="px-6 py-4 text-right">Items Quantity</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Created By</th>
                  <th className="px-6 py-4">Created Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm font-medium text-gray-700 bg-white">
                {challans.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-primary-600">
                      <Link to={`/challans/${c.id}`} className="hover:underline">
                        {c.challanNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-800">
                      {c.customer.businessName}
                      <span className="block text-xs text-gray-400 font-normal mt-0.5">{c.customer.customerName}</span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-800">{c.totalQuantity} units</td>
                    <td className="px-6 py-4">{getStatusBadge(c.status)}</td>
                    <td className="px-6 py-4 text-xs text-gray-500">{c.creator?.name || '—'}</td>
                    <td className="px-6 py-4 text-xs text-gray-400">
                      {new Date(c.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/challans/${c.id}`}>
                        <Button variant="secondary" size="sm" className="flex gap-1.5 ml-auto">
                          <Eye className="w-4 h-4" /> View Details
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </Card>
      )}
    </div>
  );
};
export default Challans;
