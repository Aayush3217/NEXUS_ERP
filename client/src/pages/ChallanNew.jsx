import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../store/toastContext';
import { 
  ArrowLeft, 
  Trash2, 
  Layers, 
  AlertCircle, 
  Check, 
  Search, 
  User, 
  Package, 
  Receipt,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { Button, Input, Card, Badge } from '../components/UI';

export const ChallanNew = () => {
  const { success, error: showToastError } = useToast();
  const navigate = useNavigate();

  // Step state
  const [activeStep, setActiveStep] = useState(1);

  // Master Lists
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [customerId, setCustomerId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [items, setItems] = useState([
    { productId: '', sku: '', unitPrice: 0, currentStock: 0, quantity: 1, totalPrice: 0 },
  ]);

  const fetchFormAssets = async () => {
    setLoading(true);
    try {
      const [custRes, prodRes] = await Promise.all([
        api.get('/api/customers', { params: { limit: 100, status: 'ACTIVE' } }),
        api.get('/api/products', { params: { limit: 100 } }),
      ]);
      if (custRes.data.success) {
        setCustomers(custRes.data.data);
      }
      if (prodRes.data.success) {
        setProducts(prodRes.data.data);
      }
    } catch (err) {
      showToastError('Failed to load customers/products assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFormAssets();
  }, []);

  const handleAddRow = () => {
    setItems((prev) => [
      ...prev,
      { productId: '', sku: '', unitPrice: 0, currentStock: 0, quantity: 1, totalPrice: 0 },
    ]);
  };

  const handleRemoveRow = (index) => {
    if (items.length === 1) {
      showToastError('Challan must contain at least one item');
      return;
    }
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleRowChange = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      const row = { ...updated[index] };

      if (field === 'productId') {
        const prod = products.find((p) => p.id === value);
        if (prod) {
          row.productId = value;
          row.sku = prod.sku;
          row.unitPrice = prod.unitPrice;
          row.currentStock = prod.currentStock;
          row.totalPrice = prod.unitPrice * row.quantity;
        } else {
          row.productId = '';
          row.sku = '';
          row.unitPrice = 0;
          row.currentStock = 0;
          row.totalPrice = 0;
        }
      } else if (field === 'quantity') {
        const qty = Math.max(1, parseInt(value) || 0);
        row.quantity = qty;
        row.totalPrice = row.unitPrice * qty;
      }

      updated[index] = row;
      return updated;
    });
  };

  // Calculations
  const selectedCustomer = customers.find(c => c.id === customerId);
  const totalQuantity = items.reduce((acc, item) => acc + (item.productId ? item.quantity : 0), 0);
  const grandTotal = items.reduce((acc, item) => acc + (item.productId ? item.totalPrice : 0), 0);
  const selectedItemsCount = items.filter(item => item.productId).length;

  const filteredCustomers = customers.filter(c => 
    c.businessName.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.customerName.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const saveChallanFlow = async (isConfirmRequest = false) => {
    if (!customerId) {
      showToastError('Please select a customer first');
      setActiveStep(1);
      return;
    }

    const payloadItems = items
      .filter(item => item.productId)
      .map(item => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

    if (payloadItems.length === 0) {
      showToastError('Please add at least one valid product');
      setActiveStep(2);
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create the Challan draft
      const res = await api.post('/api/challans', {
        customerId,
        items: payloadItems,
      });

      if (res.data.success && res.data.data) {
        const challanId = res.data.data.id;
        
        if (isConfirmRequest) {
          // 2. Immediately trigger confirmation if chosen
          try {
            await api.put(`/api/challans/${challanId}/confirm`);
            success('Sales Challan created & confirmed successfully.');
          } catch (confirmErr) {
            showToastError(confirmErr.response?.data?.message || 'Challan created as draft, but stock confirmation failed.');
          }
        } else {
          success('Sales Challan draft created successfully.');
        }

        navigate(`/challans/${challanId}`);
      }
    } catch (err) {
      showToastError(err.response?.data?.message || 'Failed to generate challan');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 rounded-lg" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const stepsList = [
    { number: 1, label: 'Customer' },
    { number: 2, label: 'Products' },
    { number: 3, label: 'Review' },
    { number: 4, label: 'Confirm' }
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <Link to="/challans" className="inline-flex items-center gap-2 text-xs font-bold text-textSecondary hover:text-white mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Challans Ledger
        </Link>
        <PageHeader 
          title="New Sales Challan workflow" 
          subtitle="Generate a digital delivery document. Item costs snapshot instantly."
        />
      </div>

      {/* 21. STEP INDICATOR BAR */}
      <div className="bg-[#111827] border border-white/5 rounded-xl p-4 flex items-center justify-between shadow-sm">
        {stepsList.map((step, idx) => {
          const isCompleted = activeStep > step.number;
          const isActive = activeStep === step.number;
          return (
            <React.Fragment key={step.number}>
              {idx > 0 && <div className={`flex-1 h-0.5 mx-4 rounded ${isCompleted ? 'bg-gradient-primary' : 'bg-white/10'}`} />}
              <button 
                type="button"
                onClick={() => {
                  if (step.number === 1 || (step.number === 2 && customerId) || (step.number === 3 && customerId && selectedItemsCount > 0)) {
                    setActiveStep(step.number);
                  }
                }}
                className={`flex items-center gap-2 text-xs font-bold focus:outline-none transition-all duration-150 ${
                  isActive 
                    ? 'text-white scale-102' 
                    : isCompleted 
                    ? 'text-primary-400' 
                    : 'text-gray-500 pointer-events-none'
                }`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center font-extrabold text-[10px] ${
                  isActive 
                    ? 'bg-gradient-primary text-white shadow-md shadow-primary-500/10' 
                    : isCompleted 
                    ? 'bg-primary-500/15 text-primary-400 border border-primary-500/20' 
                    : 'bg-white/5 text-gray-500 border border-white/10'
                }`}>
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : step.number}
                </span>
                <span>{step.label}</span>
              </button>
            </React.Fragment>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* LEFT COLUMN: ACTIVE STEP LAYOUT */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* STEP 1: CUSTOMER SELECTION */}
          {activeStep === 1 && (
            <Card title="Step 1: Select Billing Customer">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search by business name or contact..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-xs bg-[#0D111A] border border-white/5 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                
                <div className="max-h-60 overflow-y-auto space-y-1.5 border border-white/5 rounded-lg p-2 bg-[#0D111A]/40">
                  {filteredCustomers.length === 0 ? (
                    <div className="text-center py-6 text-xs text-textSecondary">No active customers match query.</div>
                  ) : (
                    filteredCustomers.map((c) => {
                      const isSelected = customerId === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setCustomerId(c.id);
                            setActiveStep(2);
                          }}
                          className={`w-full text-left p-3 rounded-lg border text-xs font-semibold flex items-center justify-between transition-colors ${
                            isSelected 
                              ? 'border-primary-500 bg-primary-500/10 text-white' 
                              : 'border-white/5 hover:bg-white/5 text-gray-300'
                          }`}
                        >
                          <div>
                            <span className="block font-bold text-white mb-0.5">{c.businessName}</span>
                            <span className="block text-[10px] text-gray-500 font-normal">{c.customerName} • {c.mobile}</span>
                          </div>
                          <Badge variant="neutral">{c.customerType}</Badge>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* STEP 2: PRODUCT SELECTION */}
          {activeStep === 2 && (
            <Card title="Step 2: Add Dispatch Products">
              <div className="space-y-4">
                <div className="space-y-3">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3.5 bg-[#0D111A]/40 border border-white/5 rounded-lg relative group">
                      
                      {/* Product Selector */}
                      <div className="flex-1 w-full">
                        <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">Product</label>
                        <select
                          className="w-full px-3 py-2 text-xs bg-[#111827] border border-white/5 rounded-lg focus:outline-none"
                          value={item.productId}
                          onChange={(e) => handleRowChange(idx, 'productId', e.target.value)}
                        >
                          <option value="">Select product SKU...</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>{p.productName}</option>
                          ))}
                        </select>
                      </div>

                      {/* Stock Check info */}
                      {item.productId && (
                        <div className="w-24 sm:text-center text-left">
                          <span className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">Available</span>
                          <span className={`text-xs font-bold ${item.currentStock === 0 ? 'text-rose-400' : 'text-gray-300'}`}>
                            {item.currentStock} units
                          </span>
                        </div>
                      )}

                      {/* Price info */}
                      {item.productId && (
                        <div className="w-24 sm:text-right text-left">
                          <span className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">Price</span>
                          <span className="text-xs text-textSecondary font-bold">
                            ₹{item.unitPrice}
                          </span>
                        </div>
                      )}

                      {/* Quantity Input */}
                      <div className="w-24">
                        <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">Quantity</label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleRowChange(idx, 'quantity', e.target.value)}
                          className="h-8.5 text-right text-xs bg-[#111827] border-white/5"
                        />
                      </div>

                      {/* Total */}
                      {item.productId && (
                        <div className="w-24 text-right">
                          <span className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">Subtotal</span>
                          <span className="text-xs font-extrabold text-white">
                            ₹{item.totalPrice}
                          </span>
                        </div>
                      )}

                      {/* Trash action */}
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(idx)}
                        className="p-1.5 text-gray-500 hover:text-rose-400 rounded hover:bg-white/5 shrink-0 self-end sm:self-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="secondary" 
                    size="sm" 
                    onClick={handleAddRow}
                  >
                    + Add Product Row
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* STEP 3: REVIEW DETAILS */}
          {activeStep === 3 && (
            <Card title="Step 3: Review Order Ledger Details">
              <div className="space-y-4 text-xs font-semibold text-textSecondary">
                
                {/* Billing Summary */}
                <div className="p-4 bg-[#0D111A]/40 border border-white/5 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Business/Shop Name:</span>
                    <span className="text-white font-extrabold">{selectedCustomer?.businessName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Primary Contact:</span>
                    <span className="text-white">{selectedCustomer?.customerName} • {selectedCustomer?.mobile}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Registered Type:</span>
                    <Badge variant="neutral">{selectedCustomer?.customerType}</Badge>
                  </div>
                </div>

                {/* Items Checkout list */}
                <div className="border border-white/5 rounded-lg overflow-hidden">
                  <div className="bg-[#0D111A] px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider flex justify-between">
                    <span>Selected Products</span>
                    <span>Row Totals</span>
                  </div>
                  <div className="divide-y divide-white/5 bg-[#111827]">
                    {items.filter(item => item.productId).map((item, idx) => {
                      const prod = products.find(p => p.id === item.productId);
                      return (
                        <div key={idx} className="px-4 py-3 flex justify-between items-center text-xs">
                          <div>
                            <span className="block font-bold text-white">{prod?.productName}</span>
                            <span className="block text-[10px] text-gray-500 font-normal mt-0.5">
                              {item.quantity} units x ₹{item.unitPrice} • SKU: {item.sku}
                            </span>
                          </div>
                          <span className="font-extrabold text-white">₹{item.totalPrice}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* STEP 4: CONFIRMATION PANEL (Confirm Sales Challan Modal) */}
          {activeStep === 4 && (
            <Card title="Step 4: Confirm Sales Challan Deductions">
              <div className="text-center p-6 space-y-5 bg-[#0D111A]/20 border border-dashed border-white/10 rounded-lg">
                <div className="w-12 h-12 rounded-full bg-primary-500/10 text-primary-400 flex items-center justify-center mx-auto shadow-md">
                  <Receipt className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Confirm Sales Challan?</h3>
                  <p className="text-xs text-textSecondary max-w-sm mx-auto leading-normal">
                    This will deduct the selected quantities from physical warehouse inventory.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-[#111827] border border-white/5 rounded-lg p-3 max-w-md mx-auto text-left text-xs font-semibold">
                  <div>
                    <span className="block text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">Total SKU</span>
                    <span className="text-white font-extrabold">{selectedItemsCount} items</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">Quantity</span>
                    <span className="text-white font-extrabold">{totalQuantity} units</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">Grand Total</span>
                    <span className="text-primary-400 font-black">₹{grandTotal}</span>
                  </div>
                </div>

                {/* Stock deficiency warnings */}
                {items.some(item => item.productId && item.quantity > item.currentStock) && (
                  <div className="flex gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 text-left text-xs font-semibold leading-relaxed max-w-md mx-auto">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                    <div>
                      One or more lines request quantities exceeding stock limits. Confirmation will abort. Please save as a DRAFT.
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

        </div>

        {/* RIGHT COLUMN: REAL-TIME SUMMARY CARD */}
        <div className="space-y-6">
          <Card title="Checkout Summary">
            <div className="space-y-4 text-xs font-semibold text-textSecondary">
              <div>
                <span className="block text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Customer Details</span>
                {customerId ? (
                  <div className="p-2.5 bg-bg/50 border border-white/5 rounded-lg">
                    <p className="font-bold text-white">{selectedCustomer?.businessName}</p>
                    <p className="text-[10px] text-textSecondary mt-0.5">{selectedCustomer?.customerName}</p>
                  </div>
                ) : (
                  <p className="text-gray-500 font-normal italic">No customer selected.</p>
                )}
              </div>

              <div>
                <span className="block text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Summary Metrics</span>
                <div className="space-y-1.5 p-2.5 bg-bg/50 border border-white/5 rounded-lg">
                  <div className="flex justify-between">
                    <span>Distinct SKUs:</span>
                    <span className="text-white">{selectedItemsCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Quantity:</span>
                    <span className="text-white">{totalQuantity} units</span>
                  </div>
                  <div className="flex justify-between border-t border-white/5 pt-1.5 font-bold text-textPrimary">
                    <span>Subtotal:</span>
                    <span className="text-white">₹{grandTotal}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/5 pt-4 space-y-2">
                {activeStep < 4 ? (
                  <div className="flex justify-between gap-2">
                    {activeStep > 1 && (
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => setActiveStep(activeStep - 1)}
                        className="w-full flex items-center justify-center gap-1.5"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Back</span>
                      </Button>
                    )}
                    <Button 
                      variant="primary" 
                      size="sm"
                      onClick={() => {
                        if (activeStep === 1 && !customerId) {
                          showToastError('Please select a customer');
                          return;
                        }
                        if (activeStep === 2 && selectedItemsCount === 0) {
                          showToastError('Please select at least one valid product');
                          return;
                        }
                        setActiveStep(activeStep + 1);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 bg-gradient-primary"
                    >
                      <span>Continue</span>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Button 
                      onClick={() => saveChallanFlow(false)}
                      variant="secondary"
                      className="w-full font-bold"
                      loading={submitting}
                    >
                      Save Draft
                    </Button>
                    <Button 
                      onClick={() => saveChallanFlow(true)}
                      variant="primary"
                      className="w-full font-bold bg-gradient-primary"
                      loading={submitting}
                      disabled={items.some(item => item.productId && item.quantity > item.currentStock)}
                    >
                      Confirm Challan
                    </Button>
                    <button 
                      type="button"
                      onClick={() => setActiveStep(3)}
                      className="w-full text-center text-[10px] text-gray-500 hover:text-white uppercase font-bold tracking-wider py-1 block"
                    >
                      Back to Review
                    </button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
};
export default ChallanNew;
