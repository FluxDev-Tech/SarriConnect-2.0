import React from 'react';
import { 
  Search, 
  Calendar, 
  DollarSign, 
  CreditCard,
  Users,
  ArrowRight,
  Filter,
  Package,
  Clock,
  Banknote,
  LayoutGrid,
  ArrowUpDown,
  Download,
  ChevronDown,
  CalendarDays,
  Eye,
  Printer,
  X,
  CheckCircle2,
  Receipt as ReceiptIcon
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { formatCurrency, cn } from '../../utils/helpers';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Receipt } from '../../components/dashboard/Receipt';
import api from '../../services/api';
import { Sale } from '../../types';

export const SalesHistory = () => {
  const { receiptSettings, fetchReceiptSettings } = useStore();
  const [sales, setSales] = React.useState<Sale[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeTab, setActiveTab] = React.useState<'all' | 'cash' | 'debt'>('all');
  const [dateFilter, setDateFilter] = React.useState<'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom'>('all');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [sortBy, setSortBy] = React.useState<'date-desc' | 'date-asc' | 'price-desc' | 'price-asc'>('date-desc');
  const [selectedSale, setSelectedSale] = React.useState<any>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isDetailsLoading, setIsDetailsLoading] = React.useState(false);

  const fetchSales = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/sales');
      setSales(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setSales([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchSales();
    fetchReceiptSettings();
  }, [fetchSales, fetchReceiptSettings]);

  const handleViewDetails = async (saleId: number) => {
    // Open modal immediately with basic info
    const basicSale = sales.find(s => s.id === saleId);
    if (basicSale) {
      setSelectedSale({
        ...basicSale,
        itemsList: null // Signal that we are loading details
      });
      setIsModalOpen(true);
    }

    setIsDetailsLoading(true);
    try {
      const res = await api.get(`/sales/${saleId}`);
      setSelectedSale(res.data);
    } catch (err) {
      console.error(err);
      // Fallback: if detail fetch fails, we already have basicSale set
    } finally {
      setIsDetailsLoading(false);
    }
  };

  const handleMarkAsPaid = async (saleId: number) => {
    try {
      await api.put(`/sales/${saleId}/pay`);
      // Update local state
      setSales(prev => prev.map(s => s.id === saleId ? { ...s, paymentType: 'cash' } : s));
      if (selectedSale?.id === saleId) {
        setSelectedSale({ ...selectedSale, paymentType: 'cash' });
      }
      // Refresh stats in store
      useStore.getState().fetchStats();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredSales = React.useMemo(() => {
    let result = sales.filter(s => {
      const matchesSearch = s.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           s.items?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTab = activeTab === 'all' || s.paymentType === activeTab;
      
      // Date filtering
      const saleDate = new Date(s.createdAt);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      const lastMonth = new Date(today);
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      let matchesDate = true;
      if (dateFilter === 'today') matchesDate = saleDate >= today;
      else if (dateFilter === 'yesterday') matchesDate = saleDate >= yesterday && saleDate < today;
      else if (dateFilter === 'week') matchesDate = saleDate >= lastWeek;
      else if (dateFilter === 'month') matchesDate = saleDate >= lastMonth;
      else if (dateFilter === 'custom') {
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        if (start) {
          start.setHours(0, 0, 0, 0);
          matchesDate = matchesDate && saleDate >= start;
        }
        if (end) {
          end.setHours(23, 59, 59, 999);
          matchesDate = matchesDate && saleDate <= end;
        }
      }

      return matchesSearch && matchesTab && matchesDate;
    });

    // Sorting
    return result.sort((a, b) => {
      if (sortBy === 'date-desc') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'date-asc') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'price-desc') return b.totalPrice - a.totalPrice;
      if (sortBy === 'price-asc') return a.totalPrice - b.totalPrice;
      return 0;
    });
  }, [sales, searchQuery, activeTab, dateFilter, sortBy]);

  const exportToCSV = () => {
    const headers = ['Date', 'Time', 'Items', 'Customer', 'Type', 'Total'];
    const data = filteredSales.map(s => [
      new Date(s.createdAt).toLocaleDateString(),
      new Date(s.createdAt).toLocaleTimeString(),
      s.items?.replace(/,/g, ';'),
      s.customerName || 'Walk-in',
      s.paymentType,
      s.totalPrice
    ]);
    
    const csvContent = [headers, ...data].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `sales_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredTotal = filteredSales.reduce((sum, s) => sum + s.totalPrice, 0);
  const cashTotal = filteredSales.filter(s => s.paymentType === 'cash').reduce((sum, s) => sum + s.totalPrice, 0);
  const debtTotal = filteredSales.filter(s => s.paymentType === 'debt').reduce((sum, s) => sum + s.totalPrice, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl lg:text-3xl font-black text-slate-900">Sales History</h2>
          <p className="text-slate-500 font-medium text-sm">View and track all your transactions</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto">
          <div className="bg-indigo-50 px-4 py-3 rounded-2xl border border-indigo-100 flex items-center gap-3 shadow-sm">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
              <Package className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Total Sales</p>
              <p className="text-lg font-black text-indigo-700">{filteredSales.length}</p>
            </div>
          </div>
          <div className="bg-emerald-50 px-4 py-3 rounded-2xl border border-emerald-100 flex items-center gap-3 shadow-sm">
            <div className="bg-emerald-600 p-2 rounded-xl shadow-lg shadow-emerald-200">
              <DollarSign className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Cash Total</p>
              <p className="text-lg font-black text-emerald-700">{formatCurrency(cashTotal)}</p>
            </div>
          </div>
          <div className="bg-rose-50 px-4 py-3 rounded-2xl border border-rose-100 flex items-center gap-3 shadow-sm">
            <div className="bg-rose-600 p-2 rounded-xl shadow-lg shadow-rose-200">
              <Users className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Utang Total</p>
              <p className="text-lg font-black text-rose-700">{formatCurrency(debtTotal)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer or items..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-100 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button 
              variant="secondary" 
              className="flex-1 md:flex-none rounded-2xl h-12 font-bold"
              onClick={exportToCSV}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Payment Type Tabs */}
          <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm w-full sm:w-auto">
            {[
              { id: 'all', label: 'All', icon: LayoutGrid, activeClass: 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' },
              { id: 'cash', label: 'Cash', icon: Banknote, activeClass: 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' },
              { id: 'debt', label: 'Utang', icon: Clock, activeClass: 'bg-rose-600 text-white shadow-lg shadow-rose-100' }
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                  activeTab === tab.id 
                    ? tab.activeClass
                    : "text-gray-500 hover:bg-gray-50"
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Date Presets */}
          <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto no-scrollbar max-w-full">
            {[
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'week', label: '7 Days' },
              { id: 'month', label: '30 Days' },
              { id: 'custom', label: 'Custom' }
            ].map((preset) => (
              <button 
                key={preset.id}
                onClick={() => setDateFilter(preset.id as any)}
                className={cn(
                  "px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap",
                  dateFilter === preset.id 
                    ? "bg-slate-900 text-white shadow-lg" 
                    : "text-gray-400 hover:text-slate-900 hover:bg-gray-50"
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {dateFilter === 'custom' && (
            <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-left-2 w-full sm:w-auto">
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex-1 bg-transparent border-none text-[10px] font-bold text-gray-600 focus:ring-0 px-2 py-1"
              />
              <span className="text-gray-300 text-[10px] font-bold">TO</span>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex-1 bg-transparent border-none text-[10px] font-bold text-gray-600 focus:ring-0 px-2 py-1"
              />
            </div>
          )}

          {/* Sorting Dropdown */}
          <div className="relative group w-full sm:w-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full sm:w-auto appearance-none bg-white pl-10 pr-10 py-2 rounded-2xl border border-gray-100 shadow-sm text-xs font-bold text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="price-desc">Highest Price</option>
              <option value="price-asc">Lowest Price</option>
            </select>
            <ArrowUpDown className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          </div>

          <div className="w-full sm:w-auto sm:ml-auto px-4 py-2 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center justify-between sm:block">
            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Filtered Total</p>
            <p className="text-sm font-black text-indigo-600">{formatCurrency(filteredTotal)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Items</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Total</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                [1,2,3,4,5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-4"><div className="h-8 bg-slate-100 rounded-xl w-full" /></td>
                  </tr>
                ))
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="bg-slate-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="h-8 w-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">No sales found</h3>
                    <p className="text-slate-500">Try adjusting your filters or record a new sale.</p>
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{new Date(sale.createdAt).toLocaleDateString()}</span>
                        <span className="text-xs text-slate-400">{new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600 line-clamp-1 max-w-xs font-medium">{sale.items}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-900">{sale.customerName || 'Walk-in'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        sale.paymentType === 'cash' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                      )}>
                        {sale.paymentType === 'cash' ? <Banknote className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                        {sale.paymentType}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-black text-slate-900">{formatCurrency(sale.totalPrice)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="rounded-xl h-9 px-4 font-bold text-xs bg-slate-100 hover:bg-brand-50 hover:text-brand-600 border-none transition-all"
                        onClick={() => handleViewDetails(sale.id)}
                        isLoading={isDetailsLoading && selectedSale?.id === sale.id}
                      >
                        <ReceiptIcon className="h-3.5 w-3.5 mr-1.5" />
                        Receipt
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-slate-50">
          {isLoading ? (
            [1,2,3].map(i => (
              <div key={i} className="p-4 animate-pulse space-y-3">
                <div className="h-4 bg-slate-100 rounded w-1/3" />
                <div className="h-10 bg-slate-100 rounded w-full" />
                <div className="flex justify-between">
                  <div className="h-4 bg-slate-100 rounded w-1/4" />
                  <div className="h-4 bg-slate-100 rounded w-1/4" />
                </div>
              </div>
            ))
          ) : filteredSales.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <div className="bg-slate-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No sales found</h3>
              <p className="text-slate-500 text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            filteredSales.map((sale) => (
              <div key={sale.id} className="p-4 space-y-4 active:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {new Date(sale.createdAt).toLocaleDateString()} • {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="font-black text-slate-900 mt-0.5">{sale.customerName || 'Walk-in'}</span>
                  </div>
                  <div className={cn(
                    "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider",
                    sale.paymentType === 'cash' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                  )}>
                    {sale.paymentType === 'cash' ? <Banknote className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                    {sale.paymentType}
                  </div>
                </div>
                
                <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                  <p className="text-xs text-slate-600 font-medium line-clamp-2">{sale.items}</p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Amount</span>
                    <span className="text-lg font-black text-brand-600">{formatCurrency(sale.totalPrice)}</span>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="rounded-xl h-10 px-5 font-black text-xs shadow-sm bg-white hover:bg-brand-50 hover:text-brand-600 border-slate-100"
                    onClick={() => handleViewDetails(sale.id)}
                    isLoading={isDetailsLoading && selectedSale?.id === sale.id}
                  >
                    <ReceiptIcon className="h-4 w-4 mr-2" />
                    Receipt
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Sale Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <ReceiptIcon className="h-5 w-5 text-brand-600" />
            <span className="font-black uppercase tracking-tight">Transaction Receipt</span>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="bg-slate-50 p-2 sm:p-6 rounded-2xl overflow-hidden border border-slate-100 relative">
            {isDetailsLoading && !selectedSale?.itemsList && (
              <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center gap-4">
                <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest">Loading Items...</p>
              </div>
            )}
            
            {selectedSale && receiptSettings && (
              <Receipt 
                settings={receiptSettings}
                items={selectedSale.itemsList || (selectedSale.items ? selectedSale.items.split(',').map((item: string) => {
                  const match = item.match(/(.+) \(x(\d+)\)/);
                  return {
                    name: match ? match[1] : item,
                    quantity: match ? parseInt(match[2]) : 1,
                    price: 0 
                  };
                }) : [])}
                subtotal={selectedSale.subtotal}
                discount={selectedSale.discount}
                total={selectedSale.totalPrice}
                receivedAmount={selectedSale.receivedAmount || selectedSale.totalPrice}
                change={selectedSale.change || 0}
                paymentType={selectedSale.paymentType}
                customerName={selectedSale.customerName}
                customerPhone={selectedSale.customerPhone}
                customerAddress={selectedSale.customerAddress}
                date={selectedSale.createdAt}
                receiptNumber={`SALE_${selectedSale.id}`}
              />
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 no-print">
            {selectedSale?.paymentType === 'debt' && (
              <Button 
                className="flex-1 h-14 rounded-2xl font-black text-sm uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200" 
                onClick={() => handleMarkAsPaid(selectedSale.id)}
              >
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Mark as Paid
              </Button>
            )}
            <Button 
              className="flex-1 h-14 rounded-2xl font-black text-sm uppercase tracking-widest bg-brand-600 hover:bg-brand-700 shadow-lg shadow-brand-200" 
              onClick={() => window.print()}
            >
              <Printer className="mr-2 h-5 w-5" />
              Print Receipt
            </Button>
            <Button 
              variant="secondary" 
              className="flex-1 h-14 rounded-2xl font-black text-sm uppercase tracking-widest bg-slate-100 border-none text-slate-600 hover:bg-slate-200" 
              onClick={() => setIsModalOpen(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
