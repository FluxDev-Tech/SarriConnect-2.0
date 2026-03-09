import React from 'react';
import { 
  Calendar, 
  Download, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight,
  Receipt,
  Package,
  TrendingUp
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { formatCurrency } from '../../utils/helpers';
import api from '../../services/api';

export const Reports = () => {
  const { stats, fetchStats } = useStore();
  const [sales, setSales] = React.useState<any[]>([]);

  React.useEffect(() => {
    fetchStats();
    const fetchSales = async () => {
      const res = await api.get('/sales');
      setSales(res.data);
    };
    fetchSales();
  }, [fetchStats]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Reports & Analytics</h2>
          <p className="text-gray-500">Detailed breakdown of your store's financial health</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-gray-600 shadow-sm hover:bg-gray-50 transition-all">
            <Calendar className="h-4 w-4" />
            Select Range
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 rounded-2xl text-sm font-bold text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
            <Download className="h-4 w-4" />
            Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-indigo-50 rounded-2xl">
              <TrendingUp className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Avg. Daily Revenue</p>
              <h4 className="text-xl font-bold text-gray-900">
                {formatCurrency(stats?.totalRevenue ? stats.totalRevenue / 7 : 0)}
              </h4>
            </div>
          </div>
          <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
            <ArrowUpRight className="h-3 w-3" />
            +12.5% from last month
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-50 rounded-2xl">
              <Package className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Items Sold</p>
              <h4 className="text-xl font-bold text-gray-900">
                {stats?.topProducts.reduce((sum, p) => sum + p.totalSold, 0) || 0}
              </h4>
            </div>
          </div>
          <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
            <ArrowUpRight className="h-3 w-3" />
            +8.2% from last month
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-amber-50 rounded-2xl">
              <Receipt className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Transactions</p>
              <h4 className="text-xl font-bold text-gray-900">{stats?.totalSalesCount || 0}</h4>
            </div>
          </div>
          <div className="flex items-center gap-1 text-red-600 text-xs font-bold">
            <ArrowDownRight className="h-3 w-3" />
            -2.4% from last month
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Recent Transactions</h3>
          <button className="text-indigo-600 text-sm font-bold hover:underline">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Transaction ID</th>
                <th className="px-8 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Date & Time</th>
                <th className="px-8 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Items</th>
                <th className="px-8 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Total Amount</th>
                <th className="px-8 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-4 font-mono text-sm text-gray-500">#TXN-{sale.id.toString().padStart(5, '0')}</td>
                  <td className="px-8 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900">{new Date(sale.createdAt).toLocaleDateString()}</span>
                      <span className="text-xs text-gray-400">{new Date(sale.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <p className="text-sm text-gray-600 truncate max-w-xs">{sale.items}</p>
                  </td>
                  <td className="px-8 py-4 font-bold text-indigo-600">
                    {formatCurrency(sale.totalPrice)}
                  </td>
                  <td className="px-8 py-4 text-right">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold uppercase tracking-wide">
                      Completed
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
