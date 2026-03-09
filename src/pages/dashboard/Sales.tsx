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
  LayoutGrid
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { formatCurrency, cn } from '../../utils/helpers';
import { Button } from '../../components/ui/Button';
import api from '../../services/api';
import { Sale } from '../../types';

export const SalesHistory = () => {
  const [sales, setSales] = React.useState<Sale[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeTab, setActiveTab] = React.useState<'all' | 'cash' | 'debt'>('all');

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
  }, [fetchSales]);

  const filteredSales = sales.filter(s => {
    const matchesSearch = s.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         s.items?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || s.paymentType === activeTab;
    return matchesSearch && matchesTab;
  });

  const filteredTotal = filteredSales.reduce((sum, s) => sum + s.totalPrice, 0);
  const cashTotal = sales.filter(s => s.paymentType === 'cash').reduce((sum, s) => sum + s.totalPrice, 0);
  const debtTotal = sales.filter(s => s.paymentType === 'debt').reduce((sum, s) => sum + s.totalPrice, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Sales History</h2>
          <p className="text-gray-500">View and track all your transactions</p>
        </div>
        <div className="flex gap-3">
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

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by customer or items..."
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-100 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-4 border-r border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Filtered Total</p>
            <p className="text-lg font-black text-indigo-600">{formatCurrency(filteredTotal)}</p>
          </div>
          <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm w-full md:w-auto">
          <button 
            onClick={() => setActiveTab('all')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
              activeTab === 'all' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "text-gray-500 hover:bg-gray-50"
            )}
          >
            <LayoutGrid className="h-4 w-4" />
            All
          </button>
          <button 
            onClick={() => setActiveTab('cash')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
              activeTab === 'cash' ? "bg-emerald-600 text-white shadow-lg shadow-emerald-100" : "text-gray-500 hover:bg-gray-50"
            )}
          >
            <Banknote className="h-4 w-4" />
            Cash
          </button>
          <button 
            onClick={() => setActiveTab('debt')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
              activeTab === 'debt' ? "bg-rose-600 text-white shadow-lg shadow-rose-100" : "text-gray-500 hover:bg-gray-50"
            )}
          >
            <Clock className="h-4 w-4" />
            Utang
          </button>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                [1,2,3,4,5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-4"><div className="h-8 bg-gray-100 rounded-xl w-full" /></td>
                  </tr>
                ))
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
