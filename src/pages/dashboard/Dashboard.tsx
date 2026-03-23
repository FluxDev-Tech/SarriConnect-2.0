import React from 'react';
import { 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  AlertTriangle,
  Minus,
  Users,
  Banknote,
  Clock
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { useStore } from '../../store/useStore';
import { formatCurrency, cn } from '../../utils/helpers';
import { Button } from '../../components/ui/Button';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Sale } from '../../types';

const RecentSalesList = () => {
  const [sales, setSales] = React.useState<Sale[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchRecent = async () => {
      try {
        const res = await api.get('/sales');
        setSales(res.data.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecent();
  }, []);

  if (loading) return <div className="space-y-3">
    {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-50 animate-pulse rounded-2xl" />)}
  </div>;

  return (
    <div className="space-y-3">
      {sales.map((sale) => (
        <div key={sale.id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 border border-gray-100 hover:bg-gray-50 transition-all group">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl transition-transform group-hover:scale-110 bg-brand-100 text-brand-600">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-gray-900 truncate max-w-[150px]">Transaction #{sale.id}</p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-gray-500">{new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                <span className="h-1 w-1 rounded-full bg-gray-300" />
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight line-clamp-1 max-w-[100px]">{sale.items}</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="font-black text-gray-900">{formatCurrency(sale.totalPrice)}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, trend, color, delay = 0 }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="bento-card p-4 sm:p-6 stat-card-glow"
  >
    <div className="flex items-center justify-between mb-3 sm:mb-4">
      <div className={cn("p-2.5 sm:p-3 rounded-xl sm:rounded-2xl shadow-lg", color)}>
        <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
      </div>
      {trend && (
        <div className={cn(
          "flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider",
          trend > 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
        )}>
          {trend > 0 ? <ArrowUpRight className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> : <ArrowDownRight className="h-2.5 w-2.5 sm:h-3 sm:w-3" />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5 sm:mb-1">{title}</p>
    <h3 className="text-2xl sm:text-3xl font-black text-slate-900">{value}</h3>
  </motion.div>
);

export const Dashboard = () => {
  const navigate = useNavigate();
  const { stats, fetchStats, fetchProducts, products } = useStore();

  React.useEffect(() => {
    fetchStats();
    fetchProducts();
  }, [fetchStats, fetchProducts]);

  const lowStockCount = (products || []).filter(p => p.stock <= 5).length;
  const avgOrderValue = stats ? (stats.totalRevenue / (stats.totalSalesCount || 1)) : 0;
  const chartData = (stats?.dailySales || []).map(d => ({ ...d, total: (d.cash || 0) + (d.debt || 0) }));
  const topProductsData = stats?.topProducts || [];

  const COLORS = ['#3354ff', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4'];

  if (!stats) return <div className="animate-pulse space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-100 rounded-2xl" />)}
    </div>
    <div className="h-96 bg-slate-100 rounded-2xl" />
  </div>;

  return (
    <div className="space-y-10">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl lg:text-4xl font-black text-slate-900">Store Overview</h2>
          <p className="text-slate-500 font-medium mt-1 text-sm lg:text-base">Real-time performance analytics for your store</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard 
          title="Total Sales" 
          value={stats.totalSalesCount} 
          icon={ShoppingCart} 
          color="bg-brand-500"
          trend={12}
          delay={0.1}
        />
        <StatCard 
          title="Avg. Order Value" 
          value={formatCurrency(avgOrderValue)} 
          icon={DollarSign} 
          color="bg-emerald-500"
          trend={5}
          delay={0.2}
        />
        <StatCard 
          title="Revenue" 
          value={formatCurrency(stats.totalRevenue)} 
          icon={TrendingUp} 
          color="bg-indigo-500"
          trend={8}
          delay={0.3}
        />
        <Link to="/inventory" className="block">
          <StatCard 
            title="Low Stock Items" 
            value={lowStockCount} 
            icon={AlertTriangle} 
            color={lowStockCount > 0 ? "bg-rose-500" : "bg-slate-400"}
            delay={0.4}
          />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-8 bento-card p-6 lg:p-8"
        >
          <div className="flex items-center justify-between mb-6 lg:mb-8">
            <div>
              <h3 className="text-lg lg:text-xl font-bold text-slate-900">Revenue Analytics</h3>
              <p className="text-xs lg:text-sm text-slate-400 font-medium">Daily revenue performance</p>
            </div>
          </div>
          <div className="h-[250px] sm:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3354ff" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#3354ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 700}} 
                  dy={15} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 700}} 
                  dx={-15} 
                />
                <Tooltip 
                  cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }}
                  contentStyle={{ 
                    borderRadius: '24px', 
                    border: 'none', 
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                    padding: '16px'
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                />
                <Area type="monotone" dataKey="total" name="Revenue" stroke="#3354ff" strokeWidth={4} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="lg:col-span-4 bento-card p-6 lg:p-8 flex flex-col"
        >
          <div className="flex items-center justify-between mb-6 lg:mb-8">
            <h3 className="text-lg lg:text-xl font-bold text-slate-900">Recent Activity</h3>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 -mr-2 max-h-[400px] lg:max-h-none">
            <RecentSalesList />
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bento-card p-6 lg:p-8"
        >
          <h3 className="text-lg lg:text-xl font-bold text-slate-900 mb-1 lg:mb-2">Top Selling Products</h3>
          <p className="text-xs lg:text-sm text-slate-400 font-medium mb-6 lg:mb-8">Most popular items by volume</p>
          <div className="h-[250px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProductsData} layout="vertical" margin={{ left: 0, right: 20 }}>
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 9, fill: '#64748b', fontWeight: 600}} 
                  width={80} 
                />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="totalSold" radius={[0, 12, 12, 0]} barSize={20}>
                  {topProductsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
