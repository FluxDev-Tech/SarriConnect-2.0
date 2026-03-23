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
      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative mx-2",
      active 
        ? "bg-brand-50 text-brand-600" 
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
    )}
  >
    <Icon className={cn("h-5 w-5 shrink-0 transition-colors duration-200", active ? "text-brand-600" : "text-slate-400 group-hover:text-slate-600")} />
    {!collapsed && <span className={cn("text-sm whitespace-nowrap", active ? "font-bold" : "font-medium")}>{label}</span>}
    
    {active && !collapsed && (
      <div className="absolute left-0 w-1 h-6 bg-brand-500 rounded-r-full" />
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
    <div className="flex h-screen bg-[#F6F6F6] overflow-hidden">
      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out hidden lg:flex relative z-40",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        <div className={cn("flex items-center gap-3 h-20 border-b border-slate-100", isCollapsed ? "justify-center" : "px-6")}>
          <div className="bg-brand-500 p-1.5 rounded-lg shrink-0">
            <Store className="h-6 w-6 text-white" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <h1 className="text-lg font-black text-brand-600 tracking-tight leading-none uppercase">SariConnect</h1>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Seller Centre</p>
            </div>
          )}
        </div>

        <div className="flex-1 py-6 space-y-1 overflow-y-auto no-scrollbar">
          {!isCollapsed && (
            <p className="px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Main Menu</p>
          )}
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
        </div>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 w-full py-3 text-slate-500 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-all duration-200 group",
              isCollapsed ? "justify-center" : "px-4"
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span className="font-semibold text-sm">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleSidebar}
              className="p-2 hover:bg-slate-50 rounded-lg transition-colors lg:flex hidden"
            >
              <Menu className="h-5 w-5 text-slate-500" />
            </button>
            <div className="sm:block hidden">
              <h2 className="text-base font-bold text-slate-900">{currentPage}</h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center bg-slate-100 rounded-full px-4 py-2 w-64 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
              <Search className="h-4 w-4 text-slate-400 mr-2" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-400 font-medium"
              />
            </div>

            <div className="flex items-center gap-3 pl-4 border-l border-slate-100">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900">{user?.name}</p>
                <p className="text-[10px] text-brand-500 font-bold uppercase tracking-wider">{user?.role}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 font-bold border border-brand-100">
                {user?.name?.charAt(0) || '?'}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto bg-[#F6F6F6]">
          <div className="p-4 sm:p-8 max-w-7xl mx-auto pb-24 lg:pb-8">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation - Shopee Style */}
        <div className="fixed bottom-0 left-0 right-0 lg:hidden z-40 bg-white border-t border-slate-200 pb-safe">
          <nav className="flex items-center justify-around h-16">
            {[
              { to: '/', icon: LayoutDashboard, label: 'Home' },
              { to: '/pos', icon: ShoppingCart, label: 'POS' },
              { to: '/products', icon: Package, label: 'Products' },
              { to: '/sales', icon: History, label: 'Sales' },
              { to: '/debts', icon: CreditCard, label: 'Debts' },
            ].map((item) => {
              const isActive = location.pathname === item.to;
              const Icon = item.icon;
              
              return (
                <Link 
                  key={item.to}
                  to={item.to} 
                  className={cn(
                    "flex flex-col items-center justify-center flex-1 h-full transition-colors",
                    isActive ? "text-brand-500" : "text-slate-400"
                  )}
                >
                  <Icon className={cn("h-5 w-5 mb-1", isActive ? "stroke-[2.5px]" : "stroke-[2px]")} />
                  <span className={cn(
                    "text-[10px] font-medium",
                    isActive ? "text-brand-500" : "text-slate-500"
                  )}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
            
            <button 
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full transition-colors",
                isSettingsOpen ? "text-brand-500" : "text-slate-400"
              )}
            >
              <Settings className={cn("h-5 w-5 mb-1", isSettingsOpen ? "stroke-[2.5px]" : "stroke-[2px]")} />
              <span className={cn(
                "text-[10px] font-medium",
                isSettingsOpen ? "text-brand-500" : "text-slate-500"
              )}>
                More
              </span>
            </button>
          </nav>

          <AnimatePresence>
            {isSettingsOpen && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsSettingsOpen(false)}
                  className="fixed inset-0 bg-black/20 z-[-1]"
                />
                <motion.div
                  initial={{ opacity: 0, y: 100 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 100 }}
                  className="absolute bottom-full left-0 right-0 bg-white rounded-t-3xl shadow-2xl p-6 border-t border-slate-100"
                >
                  <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                    <div className="h-14 w-14 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 font-bold text-xl border border-brand-100">
                      {user?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="text-lg font-bold text-slate-900">{user?.name}</p>
                      <p className="text-sm text-slate-500 font-medium">{user?.email}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Link 
                      to="/scanner" 
                      onClick={() => setIsSettingsOpen(false)}
                      className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl hover:bg-brand-50 transition-colors group"
                    >
                      <Scan className="h-6 w-6 text-slate-500 group-hover:text-brand-500" />
                      <span className="text-xs font-bold text-slate-700">Scanner</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex flex-col items-center gap-2 p-4 bg-rose-50 rounded-2xl hover:bg-rose-100 transition-colors group"
                    >
                      <LogOut className="h-6 w-6 text-rose-500" />
                      <span className="text-xs font-bold text-rose-700">Logout</span>
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
