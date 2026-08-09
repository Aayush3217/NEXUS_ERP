import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  Search, 
  Building2, 
  Package, 
  FileText, 
  LayoutDashboard,
  UserPlus,
  PlusCircle,
  FilePlus2,
  UserCog,
  Warehouse,
  ArrowRight,
  X 
} from 'lucide-react';

export const CommandPalette = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [query, setQuery] = useState('');
  const [dbResults, setDbResults] = useState({ customers: [], products: [], challans: [] });
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Hardcoded standard workspace commands
  const defaultCommands = [
    { label: 'Go to Dashboard', icon: LayoutDashboard, path: '/dashboard', category: 'Navigation' },
    { label: 'Go to Customers Directory', icon: Building2, path: '/customers', category: 'Navigation' },
    { label: 'Go to Products Catalog', icon: Package, path: '/products', category: 'Navigation' },
    { label: 'Go to Inventory Levels', icon: Warehouse, path: '/inventory', category: 'Navigation' },
    { label: 'Create New Customer', icon: UserPlus, path: '/customers', category: 'Quick Actions' },
    { label: 'Add New Product', icon: PlusCircle, path: '/products', category: 'Quick Actions' },
    { label: 'Create Sales Challan', icon: FilePlus2, path: '/challans/new', category: 'Quick Actions' },
    { label: 'View Challans Ledger', icon: FileText, path: '/challans', category: 'Navigation' },
    { label: 'Open Settings & Appearance', icon: UserCog, path: '/profile', category: 'Navigation' },
  ];

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setDbResults({ customers: [], products: [], challans: [] });
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle Ctrl+K shortcut and keyboard selection controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        onClose();
      }
      
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      }

      const totalItems = getFlatList().length;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % totalItems);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const flatList = getFlatList();
        if (flatList[selectedIndex]) {
          const item = flatList[selectedIndex];
          handleSelectItem(item.path, item.label);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, query, dbResults]);

  // Search database for queries
  useEffect(() => {
    if (!query.trim()) {
      setDbResults({ customers: [], products: [], challans: [] });
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        const [custRes, prodRes, chalRes] = await Promise.all([
          api.get('/api/customers', { params: { search: query, limit: 3 } }),
          api.get('/api/products', { params: { search: query, limit: 3 } }),
          api.get('/api/challans', { params: { search: query, limit: 3 } }),
        ]);

        setDbResults({
          customers: custRes.data.success ? custRes.data.data : [],
          products: prodRes.data.success ? prodRes.data.data : [],
          challans: chalRes.data.success ? chalRes.data.data : [],
        });
        setSelectedIndex(0); // reset index on results change
      } catch (err) {
        console.error('Command search failed', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  // Filter commands by query
  const filteredCommands = defaultCommands.filter(cmd => 
    cmd.label.toLowerCase().includes(query.toLowerCase())
  );

  // Flattened array for arrow key navigations
  const getFlatList = () => {
    const list = [...filteredCommands];
    dbResults.customers.forEach(c => {
      list.push({ label: `Customer: ${c.businessName}`, path: `/customers/${c.id}`, icon: Building2, category: 'Database Records' });
    });
    dbResults.products.forEach(p => {
      list.push({ label: `Product: ${p.productName}`, path: '/products', icon: Package, category: 'Database Records' });
    });
    dbResults.challans.forEach(ch => {
      list.push({ label: `Challan: ${ch.challanNumber}`, path: `/challans/${ch.id}`, icon: FileText, category: 'Database Records' });
    });
    return list;
  };

  const handleSelectItem = (path, name) => {
    onClose();
    navigate(path);
  };

  if (!isOpen) return null;

  const flatList = getFlatList();

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-xs animate-fade-in">
      <div onClick={onClose} className="absolute inset-0" />

      <div className="relative w-full max-w-lg bg-[#111827] border border-white/10 rounded-xl shadow-[0_24px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col text-gray-200 animate-zoom-in">
        {/* Search header box */}
        <div className="flex items-center px-4 border-b border-white/5 h-12 bg-black/20">
          <Search className="w-4 h-4 text-gray-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search commands, customers, products..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-0 outline-none text-xs text-white placeholder-gray-500 focus:ring-0 focus:outline-none"
          />
          {loading && (
            <span className="text-[9px] text-gray-500 mr-2 font-bold uppercase tracking-wider animate-pulse">Querying...</span>
          )}
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-white p-1 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable commands list */}
        <div className="max-h-[320px] overflow-y-auto p-2 space-y-3">
          {flatList.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-500">
              No matching commands or database records found.
            </div>
          ) : (
            <div>
              {/* Group items by category for visual structure */}
              {['Quick Actions', 'Navigation', 'Database Records'].map((category) => {
                const categoryItems = flatList.filter(item => item.category === category);
                if (categoryItems.length === 0) return null;

                return (
                  <div key={category} className="mb-2.5">
                    <span className="block px-3 py-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                      {category}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {categoryItems.map((item) => {
                        const globalIndex = flatList.indexOf(item);
                        const isSelected = selectedIndex === globalIndex;
                        const Icon = item.icon;

                        return (
                          <button
                            key={globalIndex}
                            onClick={() => handleSelectItem(item.path, item.label)}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                            className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg flex items-center justify-between transition-colors ${
                              isSelected 
                                ? 'bg-gradient-primary text-white shadow-xs' 
                                : 'hover:bg-white/5 text-gray-300'
                            }`}
                          >
                            <span className="flex items-center gap-2.5">
                              <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
                              <span>{item.label}</span>
                            </span>
                            {isSelected && <ArrowRight className="w-3.5 h-3.5 text-white animate-pulse" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Keyboard helper footer */}
        <div className="h-9 px-4 border-t border-white/5 bg-black/30 flex items-center justify-between text-[10px] text-gray-500">
          <span className="flex items-center gap-1.5">
            <span>Navigation:</span>
            <kbd className="bg-gray-800 px-1 border border-white/5 rounded font-mono">↑↓</kbd>
            <span>Execute:</span>
            <kbd className="bg-gray-800 px-1 border border-white/5 rounded font-mono">Enter</kbd>
          </span>
          <span>Esc to exit</span>
        </div>
      </div>
    </div>
  );
};
