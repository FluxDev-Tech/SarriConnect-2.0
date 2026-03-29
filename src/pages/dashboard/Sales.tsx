import React from 'react';
import { 
  Search, 
  Download, 
  Eye, 
  Calendar,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Receipt as ReceiptIcon,
  Trash2,
  CheckCircle2,
  Clock,
  Banknote,
  X
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { formatCurrency, cn } from '../../utils/helpers';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Receipt } from '../../components/dashboard/Receipt';
import api from '../../services/api';
import { Sale } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

export const Sales = () => {
  const { receiptSettings, fetchReceiptSettings } = useStore();
  const [sales, setSales] = React.useState<Sale[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeTab, setActiveTab] = React.useState<'cash' | 'debt'>('cash');
  const [dateFilter, setDateFilter] = React.useState<'today' | 'week' | 'month' | 'year'>('today');
  const [selectedSale, setSelectedSale] = React.useState<Sale | null>(null);
  const [showReceipt, setShowReceipt] = React.useState(false);

  const fetchSales = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/sales', {
        params: {
          type: activeTab,
          period: dateFilter
        }
      });
      setSales(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchSales();
    fetchReceiptSettings();
  }, [activeTab, dateFilter]);

  const filteredSales = sales.filter(sale => 
    sale.id.toString().includes(searchQuery) ||
    sale.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (Array.isArray(sale.items) && sale.items.some(item => 
      item.product?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    ))
  );

  const stats = {
    totalOrders: sales.length,
    totalRevenue: sales.reduce((sum, s) => sum + s.totalPrice, 0),
    cashInflow: sales.filter(s => s.paymentType === 'cash').reduce((sum, s) => sum + s.totalPrice, 0),
    pendingDebts: sales.filter(s => s.paymentType === 'debt' && !s.isPaid).reduce((sum, s) => sum + s.totalPrice, 0)
  };

  const handleExport = () => {
    const headers = ['Order ID', 'Date', 'Type', 'Customer', 'Total', 'Status'];
    const data = filteredSales.map(s => [
      `#${s.id}`,
      new Date(s.createdAt).toLocaleDateString(),
      s.paymentType.toUpperCase(),
      s.customerName || 'Walk-in',
      s.totalPrice,
      s.paymentType === 'debt' ? (s.isPaid ? 'PAID' : 'PENDING') : 'PAID'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...data.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${dateFilter}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Sales History</h2>
          <p className="text-slate-500 text-sm">View and manage your store transactions</p>
        </div>
        <Button 
          onClick={handleExport}
          variant="secondary"
          className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {[
          { label: 'Total Orders', value: stats.totalOrders, icon: ReceiptIcon, color: 'blue' },
          { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: Banknote, color: 'emerald' },
          { label: 'Cash Inflow', value: formatCurrency(stats.cashInflow), icon: CheckCircle2, color: 'indigo' },
          { label: 'Pending Debts', value: formatCurrency(stats.pendingDebts), icon: Clock, color: 'rose' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-none border border-slate-100 shadow-sm flex items-center gap-4 group hover:shadow-xl transition-all duration-300">
            <div className={cn(
              "p-4 rounded-none shadow-lg shrink-0 group-hover:scale-110 transition-transform duration-500",
              stat.color === 'blue' && "bg-blue-500 shadow-blue-200",
              stat.color === 'emerald' && "bg-emerald-500 shadow-emerald-200",
              stat.color === 'indigo' && "bg-indigo-500 shadow-indigo-200",
              stat.color === 'rose' && "bg-rose-500 shadow-rose-200"
            )}>
              <stat.icon className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
              <h3 className="text-2xl font-black text-slate-900 truncate tracking-tight">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-none border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Order ID or Customer..."
              className="w-full pl-10 pr-4 py-2 rounded-none border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {(['today', 'week', 'month', 'year'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setDateFilter(period)}
                className={cn(
                  "px-4 py-2 rounded-none text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap",
                  dateFilter === period
                    ? "bg-slate-900 text-white"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                )}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        <div className="flex border-b border-slate-100">
          {[
            { id: 'cash', label: 'Cash Sales', icon: Banknote },
            { id: 'debt', label: 'Utang Records', icon: Clock }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all relative",
                activeTab === tab.id
                  ? "text-brand-600"
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Sales List */}
      <div className="bg-white rounded-none border border-slate-100 shadow-sm overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order ID</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date & Time</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-8 py-5">
                      <div className="h-4 bg-slate-100 rounded-none w-full"></div>
                    </td>
                  </tr>
                ))
              ) : filteredSales.length > 0 ? (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className={cn(
                    "transition-all duration-300 border-l-4",
                    sale.paymentType === 'cash' 
                      ? "hover:bg-emerald-50/30 border-l-emerald-500" 
                      : "hover:bg-rose-50/30 border-l-rose-500"
                  )}>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2.5 rounded-none shadow-sm",
                          sale.paymentType === 'cash' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                        )}>
                          {sale.paymentType === 'cash' ? <Banknote className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                        </div>
                        <span className="font-mono text-xs font-black text-slate-400">#{sale.id}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900">
                          {new Date(sale.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                          {new Date(sale.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900">{sale.customerName || 'Walk-in Customer'}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          {sale.customerPhone && <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{sale.customerPhone}</span>}
                          {sale.customerAddress && <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest line-clamp-1">• {sale.customerAddress}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <span className={cn(
                        "text-base font-black tracking-tight",
                        sale.paymentType === 'cash' ? "text-emerald-600" : "text-rose-600"
                      )}>{formatCurrency(sale.totalPrice)}</span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className={cn(
                        "inline-flex items-center px-4 py-1.5 rounded-none text-[9px] font-black uppercase tracking-widest shadow-sm",
                        sale.paymentType === 'cash' || sale.isPaid
                          ? "bg-emerald-500 text-white"
                          : "bg-rose-500 text-white"
                      )}>
                        {sale.paymentType === 'cash' || sale.isPaid ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button
                        onClick={() => {
                          setSelectedSale(sale);
                          setShowReceipt(true);
                        }}
                        className="p-3 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-none transition-all active:scale-95"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-300">
                      <ReceiptIcon className="h-16 w-16 mb-4 opacity-20" />
                      <p className="text-sm font-black uppercase tracking-widest">No transactions found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="lg:hidden p-4 space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 bg-slate-50 rounded-none animate-pulse" />
            ))
          ) : filteredSales.length > 0 ? (
            filteredSales.map((sale) => (
              <div 
                key={sale.id}
                onClick={() => {
                  setSelectedSale(sale);
                  setShowReceipt(true);
                }}
                className={cn(
                  "p-5 rounded-none border-2 transition-all active:scale-[0.98]",
                  sale.paymentType === 'cash' 
                    ? "bg-emerald-50/30 border-emerald-100" 
                    : "bg-rose-50/30 border-rose-100"
                )}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2.5 rounded-none shadow-sm",
                      sale.paymentType === 'cash' ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                    )}>
                      {sale.paymentType === 'cash' ? <Banknote className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                    </div>
                    <div>
                      <span className="font-mono text-[10px] font-black text-slate-400 block">#{sale.id}</span>
                      <span className="text-xs font-black text-slate-900">
                        {new Date(sale.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <span className={cn(
                    "px-3 py-1 rounded-none text-[8px] font-black uppercase tracking-widest shadow-sm",
                    sale.paymentType === 'cash' || sale.isPaid
                      ? "bg-emerald-500 text-white"
                      : "bg-rose-500 text-white"
                  )}>
                    {sale.paymentType === 'cash' || sale.isPaid ? 'Paid' : 'Pending'}
                  </span>
                </div>
                
                <div className="flex items-end justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-slate-900">{sale.customerName || 'Walk-in Customer'}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate max-w-[150px]">
                      {sale.customerPhone || 'No Phone'} • {sale.customerAddress || 'No Address'}
                    </span>
                  </div>
                  <span className={cn(
                    "text-xl font-black tracking-tight",
                    sale.paymentType === 'cash' ? "text-emerald-600" : "text-rose-600"
                  )}>{formatCurrency(sale.totalPrice)}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center">
              <ReceiptIcon className="h-12 w-12 mx-auto mb-4 text-slate-200" />
              <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No transactions found</p>
            </div>
          )}
        </div>
      </div>

      {/* Receipt Modal */}
      <Modal
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
        title="Transaction Details"
      >
        {selectedSale && receiptSettings && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-none border border-slate-100">
              <Receipt 
                settings={receiptSettings}
                items={Array.isArray(selectedSale.items) ? selectedSale.items.map(item => ({
                  name: item.product?.name || 'Unknown Product',
                  quantity: item.quantity,
                  price: item.price
                })) : []}
                subtotal={selectedSale.subtotal}
                discount={selectedSale.discount}
                total={selectedSale.totalPrice}
                receivedAmount={selectedSale.receivedAmount || selectedSale.totalPrice}
                change={selectedSale.change || 0}
                paymentType={selectedSale.paymentType}
                date={selectedSale.createdAt}
              />
            </div>
            <div className="flex gap-3">
              <Button 
                className="flex-1" 
                onClick={() => window.print()}
              >
                Print Receipt
              </Button>
              <Button 
                variant="secondary" 
                className="flex-1"
                onClick={() => setShowReceipt(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
