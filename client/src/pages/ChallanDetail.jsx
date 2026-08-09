import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../store/authContext';
import { useToast } from '../store/toastContext';
import { ArrowLeft, Printer, CheckCircle, XCircle, AlertTriangle, Layers, Calendar, User } from 'lucide-react';
import { 
  Button, Badge, Card, PageHeader, Skeleton, EmptyState 
} from '../components/UI';
import { ConfirmDialog } from '../components/ConfirmDialog';

export const ChallanDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { success, error: showToastError } = useToast();

  const [challan, setChallan] = useState(null);
  const [loading, setLoading] = useState(true);

  // Transaction Action States
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const fetchChallanDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/challans/${id}`);
      if (res.data.success) {
        setChallan(res.data.data);
      }
    } catch (err) {
      showToastError('Failed to load sales challan details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallanDetails();
  }, [id]);

  const handleConfirmChallan = async () => {
    setConfirmModalOpen(false);
    setActionLoading(true);
    try {
      const res = await api.post(`/api/challans/${id}/confirm`);
      if (res.data.success) {
        success('Sales challan confirmed. Inventory levels updated.');
        fetchChallanDetails();
      }
    } catch (err) {
      // Actively show details from backend if validation failed
      showToastError(err.response?.data?.message || 'Challan confirmation failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelChallan = async () => {
    setCancelModalOpen(false);
    setActionLoading(true);
    try {
      const res = await api.post(`/api/challans/${id}/cancel`);
      if (res.data.success) {
        success('Challan draft cancelled.');
        fetchChallanDetails();
      }
    } catch (err) {
      showToastError(err.response?.data?.message || 'Failed to cancel challan');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyChallanNumber = () => {
    navigator.clipboard.writeText(challan.challanNumber);
    success(`Copied to clipboard: ${challan.challanNumber}`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 rounded-lg" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (!challan) {
    return (
      <EmptyState
        title="Challan not found"
        description="The sales challan you requested could not be located in our records."
        action={
          <Link to="/challans">
            <Button variant="secondary">Back to Challans</Button>
          </Link>
        }
      />
    );
  }

  const getStatusBadge = (s) => {
    if (s === 'CONFIRMED') return <Badge variant="success">CONFIRMED</Badge>;
    if (s === 'CANCELLED') return <Badge variant="danger">CANCELLED</Badge>;
    return <Badge variant="warning">DRAFT</Badge>;
  };

  const isDraft = challan.status === 'DRAFT';
  const canModify = isDraft && (user.role === 'ADMIN' || user.role === 'SALES');

  // Calculate prices
  const grandTotal = challan.items.reduce((acc, item) => acc + item.totalPrice, 0);

  return (
    <div className="space-y-6">
      {/* Back link - hidden when printing */}
      <div className="print:hidden">
        <Link to="/challans" className="inline-flex items-center gap-2 text-xs font-bold text-textSecondary hover:text-white mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Challans Ledger
        </Link>
        
        <PageHeader
          title={`Challan: ${challan.challanNumber}`}
          subtitle={
            <div className="flex items-center gap-2.5 mt-1">
              {getStatusBadge(challan.status)}
              <button 
                onClick={handleCopyChallanNumber}
                className="text-[10px] text-primary-400 hover:text-white bg-primary-500/10 px-2 py-0.5 rounded border border-primary-500/20 font-bold transition-colors"
                title="Copy Challan Number"
              >
                Copy No.
              </button>
            </div>
          }
          actions={
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handlePrint} className="flex gap-1.5 font-bold">
                <Printer className="w-4 h-4" /> Print
              </Button>
              
              {canModify && (
                <>
                  <Button 
                    variant="danger" 
                    onClick={() => setCancelModalOpen(true)}
                    disabled={actionLoading}
                    className="font-semibold"
                  >
                    Cancel Draft
                  </Button>
                  <Button 
                    variant="success" 
                    onClick={() => setConfirmModalOpen(true)}
                    disabled={actionLoading}
                    className="font-bold flex gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" /> Confirm Order
                  </Button>
                </>
              )}
            </div>
          }
        />
      </div>

      {/* Styled Invoice Card */}
      <Card className="print:shadow-none print:border-none p-8 max-w-4xl mx-auto bg-white border border-gray-100 shadow-lg shadow-gray-200/40">
        {/* Invoice Logo & Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-600 rounded-2xl text-white">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800 tracking-tight leading-tight">MINI ERP + CRM</h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Wholesale Distribution Portal</p>
            </div>
          </div>
          <div className="text-left sm:text-right mt-4 sm:mt-0">
            <h2 className="text-xl font-black text-gray-800 tracking-wider">DELIVERY CHALLAN</h2>
            <p className="text-xs text-gray-400 font-bold uppercase mt-1 tracking-widest">Historical Invoice Copy</p>
          </div>
        </div>

        {/* Invoice Addresses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 text-sm">
          {/* Vendor Details */}
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Issued From (Supplier)</span>
            <h4 className="font-extrabold text-gray-800 text-sm">MINI ERP SOLUTIONS PVT LTD</h4>
            <p className="text-gray-500 mt-1 leading-relaxed max-w-xs">
              Plot 104, Sector 5, IMT Manesar, Gurugram, Haryana 122051
            </p>
            <p className="text-xs text-gray-400 font-mono mt-2">GSTIN: 06AAACM2026M1Z0</p>
          </div>

          {/* Client Details */}
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Dispatched To (Consignee)</span>
            <h4 className="font-extrabold text-gray-800 text-sm">{challan.customer.businessName}</h4>
            <p className="font-semibold text-gray-600 mt-0.5">{challan.customer.customerName}</p>
            <p className="text-gray-500 mt-1 leading-relaxed max-w-xs">
              {challan.customer.address}
            </p>
            <p className="text-xs text-gray-500 mt-1">Mobile: {challan.customer.mobile}</p>
            {challan.customer.gstNumber && (
              <p className="text-xs text-gray-400 font-mono mt-1">GSTIN: {challan.customer.gstNumber}</p>
            )}
          </div>
        </div>

        {/* Challan Metadata */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-gray-50/50 border border-gray-50 mb-8 text-xs">
          <div>
            <span className="text-gray-400 font-bold uppercase tracking-wider block mb-1">Challan No:</span>
            <span className="font-extrabold text-gray-800">{challan.challanNumber}</span>
          </div>
          <div>
            <span className="text-gray-400 font-bold uppercase tracking-wider block mb-1">Date Created:</span>
            <span className="font-bold text-gray-700">
              {new Date(challan.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric'
              })}
            </span>
          </div>
          <div>
            <span className="text-gray-400 font-bold uppercase tracking-wider block mb-1">Status:</span>
            <span className="font-bold text-gray-700">{challan.status}</span>
          </div>
          <div>
            <span className="text-gray-400 font-bold uppercase tracking-wider block mb-1">Created By:</span>
            <span className="font-bold text-gray-700">{challan.creator?.name || '—'}</span>
          </div>
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto mb-8 border border-gray-100 rounded-xl overflow-hidden">
          <table className="min-w-full divide-y divide-gray-100 text-left">
            <thead className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              <tr>
                <th className="px-4 py-3 text-center" style={{ width: '40px' }}>#</th>
                <th className="px-4 py-3">Item Description</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3 text-right">Price (Snapshot)</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm font-medium text-gray-700 bg-white">
              {challan.items.map((item, idx) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 text-center text-gray-400 font-normal">{idx + 1}</td>
                  <td className="px-4 py-3 font-bold text-gray-800">{item.productNameSnapshot}</td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-400">{item.skuSnapshot}</td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    ₹{item.unitPriceSnapshot.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-800">{item.quantity}</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-800">
                    ₹{item.totalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Totals */}
        <div className="flex flex-col items-end gap-2 text-right bg-gray-50/30 p-6 rounded-2xl max-w-sm ml-auto text-sm border border-gray-50">
          <div className="flex justify-between w-full text-gray-400 font-semibold">
            <span>Total Quantity:</span>
            <span className="text-gray-700 font-extrabold">{challan.totalQuantity} units</span>
          </div>
          <div className="flex justify-between w-full text-base font-bold text-gray-800 border-t border-gray-200/50 pt-2 mt-1">
            <span>Grand Total:</span>
            <span className="text-primary-700 text-lg font-black">
              ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Signature Box (Visible on printing only or bottom footer) */}
        <div className="mt-16 pt-8 border-t border-gray-100 grid grid-cols-2 gap-12 text-center text-xs">
          <div>
            <div className="h-10 border-b border-gray-200 w-48 mx-auto" />
            <p className="mt-2 text-gray-400 font-bold uppercase tracking-wider">Authorized Officer Signature</p>
          </div>
          <div>
            <div className="h-10 border-b border-gray-200 w-48 mx-auto" />
            <p className="mt-2 text-gray-400 font-bold uppercase tracking-wider">Receiver Signature & Stamp</p>
          </div>
        </div>
      </Card>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={confirmModalOpen}
        title="Confirm Sales Challan"
        message="Confirming this challan will deduct physical inventory stock and record outgoing movements. This action is permanent and cannot be undone."
        confirmText="Confirm & Deduct Stock"
        confirmVariant="success"
        loading={actionLoading}
        onConfirm={handleConfirmChallan}
        onCancel={() => setConfirmModalOpen(false)}
      />

      <ConfirmDialog
        isOpen={cancelModalOpen}
        title="Cancel Challan Draft"
        message="Are you sure you want to cancel this draft sales challan? This action is permanent and cannot be undone."
        confirmText="Cancel Challan"
        confirmVariant="danger"
        loading={actionLoading}
        onConfirm={handleCancelChallan}
        onCancel={() => setCancelModalOpen(false)}
      />
    </div>
  );
};
export default ChallanDetail;
