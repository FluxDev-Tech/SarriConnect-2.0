import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Scan, 
  LogOut,
  Store,
  Menu,
  X,
  CreditCard
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { cn } from '../../utils/helpers';
import { motion, AnimatePresence } from 'motion/react';

const SidebarItem: React.FC<{ to: string, icon: any, label: string, active: boolean, onClick?: () => void }> = ({ to, icon: Icon, label, active, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative",
      active 
        ? "bg-brand-600 text-white shadow-xl shadow-brand-200/50" 
        : "text-slate-500 hover:bg-brand-50 hover:text-brand-600"
    )}
  >
    <Icon className={cn("h-5 w-5 transition-transform duration-300", active ? "text-white" : "group-hover:scale-110 group-hover:text-brand-600")} />
    <span className="font-semibold text-sm">{label}</span>
    {active && (
      <motion.div 
        layoutId="active-pill"
        className="absolute -left-1 w-1.5 h-6 bg-brand-400 rounded-full"
      />
    )}
  </Link>
);

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const menuItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/pos', icon: ShoppingCart, label: 'Point of Sale' },
    { to: '/sales', icon: CreditCard, label: 'Sales History' },
    { to: '/products', icon: Package, label: 'Products' },
    { to: '/inventory', icon: BarChart3, label: 'Inventory' },
    { to: '/debts', icon: CreditCard, label: 'Utang (Debts)' },
  ];

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-100 flex flex-col p-8 hidden lg:flex">
        <div className="flex items-center gap-4 mb-12 px-2">
          <div className="bg-brand-600 p-2.5 rounded-2xl shadow-lg shadow-brand-200">
            <Store className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">SariConnect</h1>
            <p className="text-[10px] font-bold text-brand-500 uppercase tracking-widest mt-1">Store Manager</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              active={location.pathname === item.to}
            />
          ))}
        </nav>

        <div className="mt-auto pt-8 border-t border-slate-100">
          <div className="bg-slate-50 p-4 rounded-3xl mb-6 flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-lg shadow-sm">
              {user?.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-2xl transition-all duration-300 group"
          >
            <LogOut className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            <span className="font-bold text-sm">Logout</span>
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
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-white z-50 p-6 shadow-2xl lg:hidden flex flex-col"
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

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-30 lg:hidden">
           <div className="flex items-center gap-2">
            <Store className="h-6 w-6 text-brand-600" />
            <span className="font-bold text-slate-900">SariConnect</span>
          </div>
          <button 
            onClick={toggleMobileMenu}
            className="p-2 hover:bg-brand-50 rounded-xl transition-all text-brand-600"
          >
            <Menu className="h-6 w-6" />
          </button>
        </header>
        <div className="p-4 sm:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
