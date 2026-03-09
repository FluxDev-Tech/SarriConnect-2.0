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
  Clock,
  Store,
  ArrowRight
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
            <div className={cn(
              "p-3 rounded-xl transition-transform group-hover:scale-110",
              sale.paymentType === 'cash' ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
            )}>
              {sale.paymentType === 'cash' ? <Banknote className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
            </div>
            <div>
              <p className="font-bold text-gray-900 truncate max-w-[150px]">{sale.customerName || 'Walk-in'}</p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-gray-500">{new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                <span className="h-1 w-1 rounded-full bg-gray-300" />
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight line-clamp-1 max-w-[100px]">{sale.items}</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="font-black text-gray-900">{formatCurrency(sale.totalPrice)}</p>
            <div className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider",
              sale.paymentType === 'cash' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
            )}>
              {sale.paymentType}
            </div>
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
    className="bento-card p-6 stat-card-glow"
  >
    <div className="flex items-center justify-between mb-4">
      <div className={cn("p-3 rounded-2xl shadow-lg", color)}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      {trend && (
        <div className={cn(
          "flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
          trend > 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
        )}>
          {trend > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
    <h3 className="text-3xl font-black text-slate-900">{value}</h3>
  </motion.div>
);

export const Dashboard = () => {
  const navigate = useNavigate();
  const { stats, fetchStats, fetchProducts } = useStore();

  React.useEffect(() => {
    fetchStats();
    fetchProducts();
  }, [fetchStats, fetchProducts]);

  if (!stats) return <div className="animate-pulse space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-100 rounded-[2rem]" />)}
    </div>
    <div className="h-96 bg-slate-100 rounded-[2rem]" />
  </div>;

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900">Store Overview</h2>
          <p className="text-slate-500 font-medium mt-1">Real-time performance analytics for your store</p>
        </div>
        <Button 
          onClick={() => navigate('/pos')} 
          className="h-14 px-8 rounded-2xl bg-brand-600 hover:bg-brand-700 shadow-xl shadow-brand-200/50 text-base font-bold"
        >
          <ShoppingCart className="mr-3 h-5 w-5" />
          Open POS Terminal
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Cash Sales" 
          value={formatCurrency(stats.cashRevenue)} 
          icon={Banknote} 
          color="bg-emerald-500"
          delay={0.1}
        />
        <StatCard 
          title="Utang (Debts)" 
          value={formatCurrency(stats.debtRevenue)} 
          icon={Clock} 
          color="bg-rose-500"
          delay={0.2}
        />
        <StatCard 
          title="Total Revenue" 
          value={formatCurrency(stats.totalRevenue)} 
          icon={TrendingUp} 
          color="bg-brand-500"
          delay={0.3}
        />
        <StatCard 
          title="Inventory" 
          value={stats.totalProducts} 
          icon={Package} 
          color="bg-amber-500"
          delay={0.4}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-8 bento-card p-8"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Revenue Analytics</h3>
              <p className="text-sm text-slate-400 font-medium">Cash vs Utang comparison</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold text-slate-500">Cash</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-rose-500" />
                <span className="text-xs font-bold text-slate-500">Utang</span>
              </div>
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.dailySales}>
                <defs>
                  <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDebt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
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
                  formatter={(value: number) => [formatCurrency(value), '']}
                />
                <Area type="monotone" dataKey="cash" name="Cash" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorCash)" />
                <Area type="monotone" dataKey="debt" name="Utang" stroke="#f43f5e" strokeWidth={4} fillOpacity={1} fill="url(#colorDebt)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="lg:col-span-4 bento-card p-8 flex flex-col"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-slate-900">Recent Activity</h3>
            <Link to="/sales" className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
              <ArrowUpRight className="h-5 w-5 text-slate-400" />
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 -mr-2">
            <RecentSalesList />
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bento-card p-8"
        >
          <h3 className="text-xl font-bold text-slate-900 mb-8">Top Selling Products</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.topProducts} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 11, fill: '#64748b', fontWeight: 600}} 
                  width={120} 
                />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="totalSold" radius={[0, 12, 12, 0]} barSize={24}>
                  {stats.topProducts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#3354ff', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'][index % 5]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bento-card p-8 bg-brand-600 text-white relative overflow-hidden group"
        >
          <div className="relative z-10 h-full flex flex-col">
            <div className="bg-white/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
              <Store className="h-8 w-8" />
            </div>
            <h3 className="text-3xl font-black mb-4 leading-tight">Ready to serve<br/>your customers?</h3>
            <p className="text-brand-100 font-medium mb-8 max-w-[280px]">Quickly record sales, manage inventory, and track customer debts in one place.</p>
            <div className="mt-auto">
              <Button 
                onClick={() => navigate('/pos')}
                className="bg-white text-brand-600 hover:bg-brand-50 h-14 px-8 rounded-2xl font-bold text-base shadow-xl shadow-black/10"
              >
                Launch POS Terminal
                <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute right-10 top-10 w-32 h-32 bg-brand-400/20 rounded-full blur-2xl" />
        </motion.div>
      </div>
    </div>
  );
};
