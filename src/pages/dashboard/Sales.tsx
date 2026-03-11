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
  X
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
      setSales(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchSales();
    fetchReceiptSettings();
  }, [fetchSales, fetchReceiptSettings]);

  const handleViewDetails = async (saleId: number) => {
    setIsDetailsLoading(true);
    try {
      const res = await api.get(`/sales/${saleId}`);
      setSelectedSale(res.data);
      setIsModalOpen(true);
    } catch (err) {
      console.error(err);
      // Fallback: use data from list if detail fetch fails
      const sale = sales.find(s => s.id === saleId);
      if (sale) {
        setSelectedSale({
          ...sale,
          items: [] // We don't have structured items here
        });
        setIsModalOpen(true);
      }
    } finally {
      setIsDetailsLoading(false);
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Sales History</h2>
          <p className="text-gray-500">View and track all your transactions</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100 flex items-center gap-3">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <Package className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Total Sales</p>
              <p className="text-lg font-black text-indigo-700">{filteredSales.length}</p>
            </div>
          </div>
          <div className="bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100 flex items-center gap-3">
            <div className="bg-emerald-600 p-1.5 rounded-lg">
              <DollarSign className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Cash Total</p>
              <p className="text-lg font-black text-emerald-700">{formatCurrency(cashTotal)}</p>
            </div>
          </div>
          <div className="bg-rose-50 px-4 py-2 rounded-2xl border border-rose-100 flex items-center gap-3">
            <div className="bg-rose-600 p-1.5 rounded-lg">
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
          <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
            {[
              { id: 'all', label: 'All', icon: LayoutGrid, activeClass: 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' },
              { id: 'cash', label: 'Cash', icon: Banknote, activeClass: 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' },
              { id: 'debt', label: 'Utang', icon: Clock, activeClass: 'bg-rose-600 text-white shadow-lg shadow-rose-100' }
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
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
          <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto max-w-full">
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
            <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-left-2">
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent border-none text-[10px] font-bold text-gray-600 focus:ring-0 px-2 py-1"
              />
              <span className="text-gray-300 text-[10px] font-bold">TO</span>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent border-none text-[10px] font-bold text-gray-600 focus:ring-0 px-2 py-1"
              />
            </div>
          )}

          {/* Sorting Dropdown */}
          <div className="relative group">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="appearance-none bg-white pl-10 pr-10 py-2 rounded-2xl border border-gray-100 shadow-sm text-xs font-bold text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="price-desc">Highest Price</option>
              <option value="price-asc">Lowest Price</option>
            </select>
            <ArrowUpDown className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          </div>

          <div className="ml-auto px-4 py-2 bg-indigo-50 rounded-2xl border border-indigo-100">
            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Filtered Total</p>
            <p className="text-sm font-black text-indigo-600">{formatCurrency(filteredTotal)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Items</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Total</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                [1,2,3,4,5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-4"><div className="h-8 bg-gray-100 rounded-xl w-full" /></td>
                  </tr>
                ))
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="bg-gray-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="h-8 w-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">No sales found</h3>
                    <p className="text-gray-500">Try adjusting your filters or record a new sale.</p>
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900">{new Date(sale.createdAt).toLocaleDateString()}</span>
                        <span className="text-xs text-gray-400">{new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 line-clamp-1 max-w-xs font-medium">{sale.items}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-gray-900">{sale.customerName || 'Walk-in'}</span>
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
                      <span className="font-black text-gray-900">{formatCurrency(sale.totalPrice)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="rounded-xl h-9 px-4 font-bold text-xs"
                        onClick={() => handleViewDetails(sale.id)}
                        isLoading={isDetailsLoading && selectedSale?.id === sale.id}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1.5" />
                        Details
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sale Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <span className="text-lg">📄</span>
            <span>Sale Details</span>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="bg-slate-50 p-6 rounded-[2rem] overflow-hidden border border-slate-100">
            {selectedSale && receiptSettings && (
              <Receipt 
                settings={receiptSettings}
                items={selectedSale.itemsList || []}
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
            {!selectedSale?.itemsList && selectedSale && (
              <div className="text-center py-8 space-y-2">
                <p className="text-slate-400 text-sm font-medium">Detailed item list not available for this legacy record.</p>
                <p className="text-slate-900 font-bold">Total: {formatCurrency(selectedSale.totalPrice)}</p>
              </div>
            )}
          </div>

          <div className="flex gap-3 no-print">
            <Button 
              className="flex-[2] h-14 rounded-2xl font-black text-sm uppercase tracking-widest bg-brand-600 hover:bg-brand-700 shadow-lg shadow-brand-200" 
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
