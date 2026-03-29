import React from 'react';
import { 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  Clock,
  RotateCcw
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { motion } from 'motion/react';
import { useStore } from '../../store/useStore';
import { formatCurrency, cn } from '../../utils/helpers';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

const StatCard = ({ title, value, icon: Icon, trend, color, delay = 0 }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="bg-white p-6 rounded-none border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center gap-6 group"
  >
    <div className={cn(
      "p-4 rounded-none shadow-lg shrink-0 group-hover:scale-110 transition-transform duration-500",
      color === 'emerald' && "bg-emerald-500 shadow-emerald-200",
      color === 'blue' && "bg-blue-500 shadow-blue-200",
      color === 'indigo' && "bg-indigo-500 shadow-indigo-200",
      color === 'rose' && "bg-rose-500 shadow-rose-200"
    )}>
      <Icon className="h-8 w-8 text-white" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{title}</p>
      <h3 className="text-3xl font-black text-slate-900 truncate tracking-tight">{value}</h3>
      {trend && (
        <div className="flex items-center gap-1 mt-1">
          <span className={cn(
            "text-[10px] font-black uppercase tracking-wider",
            trend.startsWith('+') ? "text-emerald-500" : "text-rose-500"
          )}>
            {trend}
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">vs last month</span>
        </div>
      )}
    </div>
  </motion.div>
);

export const Dashboard = () => {
  const navigate = useNavigate();
  const { stats, fetchStats, fetchProducts, resetApp } = useStore();
  const [isResetting, setIsResetting] = React.useState(false);

  React.useEffect(() => {
    fetchStats();
    fetchProducts();
  }, [fetchStats, fetchProducts]);

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset all data? This will clear all sales, products, and settings.')) {
      setIsResetting(true);
      try {
        await resetApp();
        alert('Data reset successfully!');
      } catch (err) {
        console.error('Reset failed:', err);
        alert('Failed to reset data.');
      } finally {
        setIsResetting(false);
      }
    }
  };

  if (!stats) return (
    <div className="animate-pulse space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-100 rounded-none" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-10 pb-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Dashboard</h2>
          <p className="text-slate-500 font-medium mt-1">Welcome back, here's what's happening today.</p>
        </div>
        <Button 
          variant="secondary" 
          className="bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100 h-12 px-6 rounded-none font-bold"
          onClick={handleReset}
          disabled={isResetting}
        >
          <RotateCcw className={cn("h-5 w-5 mr-2", isResetting && "animate-spin")} />
          {isResetting ? 'Resetting...' : 'Reset Data'}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Sales"
          value={formatCurrency(stats.totalRevenue)}
          icon={TrendingUp}
          color="emerald"
        />
        <StatCard
          title="Total Orders"
          value={stats.totalSalesCount}
          icon={ShoppingCart}
          color="blue"
          delay={0.1}
        />
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          icon={Package}
          color="indigo"
          delay={0.2}
        />
        <StatCard
          title="Active Debts"
          value={formatCurrency(stats.totalDebts || 0)}
          icon={Clock}
          color="rose"
          delay={0.3}
        />
      </div>

      {/* Chart Section */}
      <div className="bg-white p-8 rounded-none border border-slate-100 shadow-sm">
        <div className="mb-8">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Sales Overview</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Comparison between Cash and Utang (Debt)</p>
        </div>
        
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.dailySales}>
              <defs>
                <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorDebt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }}
                tickFormatter={(value) => `₱${value}`}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '0', 
                  border: '1px solid #f1f5f9', 
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  padding: '1rem'
                }}
                itemStyle={{ fontSize: '12px', fontWeight: '900' }}
              />
              <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
              <Area 
                type="monotone" 
                dataKey="cash" 
                name="Cash Sales"
                stroke="#10b981" 
                strokeWidth={4}
                fillOpacity={1} 
                fill="url(#colorCash)" 
              />
              <Area 
                type="monotone" 
                dataKey="debt" 
                name="Utang (Debt)"
                stroke="#f43f5e" 
                strokeWidth={4}
                fillOpacity={1} 
                fill="url(#colorDebt)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
