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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);
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
          <div className="bg-brand-600 p-2.5 rounded-2xl shadow-lg shadow-brand-200 shrink-0">
            <Store className="h-6 w-6 text-white" />
          </div>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">SariConnect</h1>
              <p className="text-[10px] font-bold text-brand-500 uppercase tracking-widest mt-1">Store Manager</p>
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

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobileMenu}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-white z-[60] p-6 shadow-2xl lg:hidden flex flex-col"
            >
              <div className="flex items-center justify-between mb-10 px-2">
                <div className="flex items-center gap-3">
                  <div className="bg-brand-600 p-2 rounded-lg">
                    <Store className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">SariConnect</h1>
                </div>
                <button onClick={closeMobileMenu} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <X className="h-6 w-6 text-slate-500" />
                </button>
              </div>

              <nav className="flex-1 space-y-2">
                {menuItems.map((item) => (
                  <SidebarItem
                    key={item.to}
                    to={item.to}
                    icon={item.icon}
                    label={item.label}
                    active={location.pathname === item.to}
                    onClick={closeMobileMenu}
                  />
                ))}
              </nav>

              <div className="mt-auto pt-6 border-t border-slate-100">
                <div className="flex items-center gap-3 px-2 mb-6">
                  <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold">
                    {user?.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
                    <p className="text-xs text-slate-500 truncate capitalize">{user?.role}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    closeMobileMenu();
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-slate-500 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleMobileMenu}
              className="p-2.5 hover:bg-brand-50 rounded-2xl transition-all text-brand-600 lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            
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

            <button className="p-2.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-2xl transition-all relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>

            <div className="h-8 w-[1px] bg-slate-100 mx-1 hidden sm:block"></div>

            <Link 
              to="/pos"
              className="hidden sm:flex items-center gap-2 bg-brand-600 text-white px-5 py-2.5 rounded-2xl font-bold text-sm shadow-lg shadow-brand-200 hover:bg-brand-700 transition-all active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>New Sale</span>
            </Link>

            <div className="lg:hidden h-10 w-10 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm shadow-sm">
              {user?.name.charAt(0)}
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC]">
          <div className="p-4 sm:p-8 max-w-7xl mx-auto pb-24 lg:pb-8">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 px-6 py-3 flex items-center justify-between lg:hidden z-40">
          <Link 
            to="/" 
            className={cn(
              "flex flex-col items-center gap-1 transition-all",
              location.pathname === '/' ? "text-brand-600" : "text-slate-400"
            )}
          >
            <LayoutDashboard className="h-6 w-6" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Home</span>
          </Link>
          <Link 
            to="/pos" 
            className={cn(
              "flex flex-col items-center gap-1 transition-all",
              location.pathname === '/pos' ? "text-brand-600" : "text-slate-400"
            )}
          >
            <ShoppingCart className="h-6 w-6" />
            <span className="text-[10px] font-bold uppercase tracking-wider">POS</span>
          </Link>
          <div className="relative -top-6">
            <Link 
              to="/scanner"
              className="bg-brand-600 text-white p-4 rounded-full shadow-xl shadow-brand-200 border-4 border-[#F8FAFC] active:scale-90 transition-all flex items-center justify-center"
            >
              <Scan className="h-6 w-6" />
            </Link>
          </div>
          <Link 
            to="/inventory" 
            className={cn(
              "flex flex-col items-center gap-1 transition-all",
              location.pathname === '/inventory' ? "text-brand-600" : "text-slate-400"
            )}
          >
            <BarChart3 className="h-6 w-6" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Stock</span>
          </Link>
          <Link 
            to="/sales" 
            className={cn(
              "flex flex-col items-center gap-1 transition-all",
              location.pathname === '/sales' ? "text-brand-600" : "text-slate-400"
            )}
          >
            <History className="h-6 w-6" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Sales</span>
          </Link>
        </nav>
      </div>
    </div>
  );
};
