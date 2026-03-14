import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  BarChart3, 
  Scan, 
  LogOut,
  Store,
  Menu,
  X,
  CreditCard,
  History,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  Settings,
  User,
  Plus
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { cn } from '../../utils/helpers';
import { motion, AnimatePresence } from 'motion/react';

const SidebarItem: React.FC<{ 
  to: string, 
  icon: any, 
  label: string, 
  active: boolean, 
  collapsed?: boolean,
  onClick?: () => void 
}> = ({ to, icon: Icon, label, active, collapsed, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative",
      active 
        ? "bg-brand-600 text-white shadow-lg shadow-brand-200/50" 
        : "text-slate-500 hover:bg-brand-50 hover:text-brand-600"
    )}
  >
    <Icon className={cn("h-5 w-5 shrink-0 transition-transform duration-300", active ? "text-white" : "group-hover:scale-110 group-hover:text-brand-600")} />
    {!collapsed && <span className="font-semibold text-sm whitespace-nowrap">{label}</span>}
    
    {active && !collapsed && (
      <motion.div 
        layoutId="active-pill"
        className="absolute -left-1 w-1.5 h-6 bg-brand-400 rounded-full"
      />
    )}
    
    {collapsed && (
      <div className="absolute left-full ml-4 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
        {label}
      </div>
    )}
  </Link>
);

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useStore();
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  const menuItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/pos', icon: ShoppingCart, label: 'POS Terminal' },
    { to: '/products', icon: Package, label: 'Products' },
    { to: '/inventory', icon: BarChart3, label: 'Inventory' },
    { to: '/sales', icon: History, label: 'Sale History' },
    { to: '/debts', icon: CreditCard, label: 'Utang/Debts' },
    { to: '/scanner', icon: Scan, label: 'Scanner' },
  ];

  const currentPage = menuItems.find(item => item.to === location.pathname)?.label || 'Dashboard';

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "bg-white border-r border-slate-100 flex flex-col transition-all duration-500 ease-in-out hidden lg:flex relative z-40",
          isCollapsed ? "w-24 p-4" : "w-72 p-8"
        )}
      >
        <button 
          onClick={toggleSidebar}
          className="absolute -right-3 top-10 bg-white border border-slate-100 rounded-full p-1 shadow-sm hover:bg-slate-50 transition-colors z-50"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4 text-slate-400" /> : <ChevronLeft className="h-4 w-4 text-slate-400" />}
        </button>

        <div className={cn("flex items-center gap-4 mb-12", isCollapsed ? "justify-center" : "px-2")}>
          <div className="bg-white p-1 rounded-full shadow-lg shadow-brand-200 shrink-0 border border-slate-100">
            <img 
              src="https://raw.githubusercontent.com/johnlawrencemartinez/sariconnect-assets/main/logo.png" 
              alt="Logo" 
              className="h-10 w-10 object-contain rounded-full"
              onError={(e) => {
                e.currentTarget.src = "https://api.iconify.design/lucide:store.svg?color=%234f46e5";
                e.currentTarget.className = "h-6 w-6 m-2";
              }}
            />
          </div>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">SariConnect</h1>
              <p className="text-[10px] font-black text-brand-500 uppercase tracking-widest mt-1">Store Manager</p>
            </motion.div>
          )}
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              active={location.pathname === item.to}
              collapsed={isCollapsed}
            />
          ))}
        </nav>

        <div className="mt-auto pt-8 border-t border-slate-100">
          {!isCollapsed ? (
            <div className="bg-slate-50 p-4 rounded-3xl mb-6 flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-lg shadow-sm shrink-0">
                {user?.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{user?.role}</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center mb-6">
              <div className="h-10 w-10 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-lg shadow-sm">
                {user?.name.charAt(0)}
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 w-full py-3.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-2xl transition-all duration-300 group",
              isCollapsed ? "justify-center" : "px-4"
            )}
          >
            <LogOut className="h-5 w-5 group-hover:translate-x-1 transition-transform shrink-0" />
            {!isCollapsed && <span className="font-bold text-sm">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-4">
            <div className="hidden sm:block">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">{currentPage}</h2>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                <span>SariConnect</span>
                <ChevronRight className="h-2.5 w-2.5" />
                <span className="text-brand-500">{currentPage}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden md:flex items-center bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2 w-64 focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-500 transition-all">
              <Search className="h-4 w-4 text-slate-400 mr-2" />
              <input 
                type="text" 
                placeholder="Search anything..." 
                className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-400 font-medium"
              />
            </div>

            <div className="h-8 w-[1px] bg-slate-100 mx-1 hidden sm:block"></div>

            <Link 
              to="/pos"
              className="hidden sm:flex items-center gap-2 bg-brand-600 text-white px-5 py-2.5 rounded-2xl font-bold text-sm shadow-lg shadow-brand-200 hover:bg-brand-700 transition-all active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>New Sale</span>
            </Link>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC]">
          <div className="p-4 sm:p-8 max-w-7xl mx-auto pb-24 lg:pb-8">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <div className="fixed bottom-6 left-4 right-4 lg:hidden z-40">
          <nav className="bg-slate-900/90 backdrop-blur-xl border border-white/10 px-2 py-2 flex items-center justify-around rounded-[2rem] shadow-2xl shadow-slate-900/40">
            {[
              { to: '/', icon: LayoutDashboard, label: 'Home' },
              { to: '/pos', icon: ShoppingCart, label: 'POS' },
              { to: '/products', icon: Package, label: 'Prod' },
              { to: '/scanner', icon: Scan, label: 'Scan', primary: true },
              { to: '/inventory', icon: BarChart3, label: 'Inv' },
              { to: '/sales', icon: History, label: 'Sales' },
              { to: '/debts', icon: CreditCard, label: 'Utang' },
            ].map((item) => {
              const isActive = location.pathname === item.to;
              const Icon = item.icon;
              
              return (
                <Link 
                  key={item.to}
                  to={item.to} 
                  className={cn(
                    "relative flex flex-col items-center justify-center transition-all duration-300 py-2 min-w-[40px]",
                    item.primary ? "-top-6" : "",
                    isActive ? "text-white" : "text-slate-400 hover:text-slate-200"
                  )}
                >
                  {isActive && !item.primary && (
                    <motion.div 
                      layoutId="nav-active-bg"
                      className="absolute inset-0 bg-brand-600/20 rounded-2xl -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  
                  <div className={cn(
                    "transition-transform duration-300",
                    isActive ? "scale-110" : "scale-100",
                    item.primary ? "bg-brand-600 p-4 rounded-full shadow-xl shadow-brand-500/40 border-4 border-slate-900 text-white" : ""
                  )}>
                    <Icon className={cn(item.primary ? "h-6 w-6" : "h-5 w-5")} />
                  </div>
                  
                  {!item.primary && (
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-tighter mt-1 transition-all",
                      isActive ? "opacity-100 translate-y-0" : "opacity-60"
                    )}>
                      {item.label}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* Settings/Logout Button */}
            <div className="relative">
              <button 
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={cn(
                  "flex flex-col items-center justify-center py-2 min-w-[44px] transition-all duration-300",
                  isSettingsOpen ? "text-white" : "text-slate-400"
                )}
              >
                {isSettingsOpen && (
                  <div className="absolute inset-0 bg-brand-600/20 rounded-2xl -z-10" />
                )}
                <Settings className={cn("h-5 w-5 transition-transform", isSettingsOpen ? "rotate-45 scale-110" : "")} />
                <span className="text-[9px] font-black uppercase tracking-tighter mt-1 opacity-60">Set</span>
              </button>
              
              <AnimatePresence>
                {isSettingsOpen && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setIsSettingsOpen(false)}
                      className="fixed inset-0 z-[-1]"
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute bottom-full right-0 mb-6 w-48 bg-slate-900 border border-white/10 rounded-[2rem] shadow-2xl p-2 overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-white/5 mb-1">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Account</p>
                        <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 text-rose-400 hover:bg-rose-500/10 rounded-2xl transition-all"
                      >
                        <LogOut className="h-4 w-4" />
                        <span className="font-black text-[10px] uppercase tracking-widest">Logout System</span>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
};
