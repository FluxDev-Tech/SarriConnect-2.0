import React from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Search, 
  ShoppingCart, 
  Plus,
  Minus, 
  Trash2, 
  CreditCard, 
  User as UserIcon,
  CheckCircle2,
  Package,
  Printer,
  X,
  Banknote,
  Clock,
  ArrowRight,
  LayoutDashboard,
  Menu,
  LayoutGrid,
  List
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { formatCurrency, cn } from '../../utils/helpers';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Receipt } from '../../components/dashboard/Receipt';
import { Drawer } from '../../components/ui/Drawer';
import { Product } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

interface CartItem extends Product {
  quantity: number;
}

export const POS = () => {
  const { products, fetchProducts, recordSale, receiptSettings, fetchReceiptSettings, isLoading } = useStore();
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('type') === 'debt' ? 'debt' : 'cash';
  
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('All');
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [paymentType, setPaymentType] = React.useState<'cash' | 'debt'>(initialType);
  const [receivedAmount, setReceivedAmount] = React.useState<string>('');
  const [customerName, setCustomerName] = React.useState('');
  const [customerAddress, setCustomerAddress] = React.useState('');
  const [customerPhone, setCustomerPhone] = React.useState('');
  const [orderNote, setOrderNote] = React.useState('');
  const [printReceipt, setPrintReceipt] = React.useState(true);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [showReceipt, setShowReceipt] = React.useState(false);
  const [lastOrder, setLastOrder] = React.useState<any>(null);
  const [isCartOpen, setIsCartOpen] = React.useState(false);
  const [showClearConfirm, setShowClearConfirm] = React.useState(false);
  const [lastAddedId, setLastAddedId] = React.useState<number | string | null>(null);
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const catalogContainerRef = React.useRef<HTMLDivElement>(null);

  // Keyboard Shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus search with '/'
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // Clear cart with Alt+C
      if (e.altKey && e.key === 'c') {
        setCart([]);
      }
      // Checkout with Alt+Enter
      if (e.altKey && e.key === 'Enter' && cart.length > 0) {
        handleCheckout();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, receivedAmount, paymentType]);

  const playSound = (type: 'add' | 'success' | 'click') => {
    const sounds = {
      add: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
      success: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
      click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'
    };
    const audio = new Audio(sounds[type]);
    audio.volume = 0.2;
    audio.play().catch(() => {}); // Ignore if blocked by browser
  };

  React.useEffect(() => {
    fetchProducts();
    fetchReceiptSettings();
  }, []);

  const categories = ['All', ...new Set((products || []).map(p => p.category))];

  const filteredProducts = (products || []).filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    playSound('add');
    setLastAddedId(product.id);
    
    // Pulse the cart icon
    const cartIcon = document.getElementById('cart-icon-main');
    if (cartIcon) {
      cartIcon.classList.add('animate-bounce');
      setTimeout(() => cartIcon.classList.remove('animate-bounce'), 500);
    }

    setTimeout(() => setLastAddedId(null), 500);
    
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: number | string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: number | string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, Math.min(item.stock, item.quantity + delta));
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalAmount = subtotal;
  const change = receivedAmount ? parseFloat(receivedAmount) - totalAmount : 0;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (paymentType === 'cash' && receivedAmount && parseFloat(receivedAmount) < totalAmount) return;

    const items = cart.map(item => ({
      id: item.id,
      quantity: item.quantity,
      price: item.price,
      name: item.name
    }));

    try {
      // Add a small artificial delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 800));
      
      await recordSale(
        items, 
        totalAmount, 
        subtotal, 
        0, 
        paymentType, 
        paymentType === 'debt' ? customerName : undefined,
        paymentType === 'debt' ? customerAddress : undefined,
        paymentType === 'debt' ? customerPhone : undefined,
        parseFloat(receivedAmount) || totalAmount, 
        Math.max(0, change)
      );
      playSound('success');
      
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#6ee7b7', '#ffffff']
      });
      
      setLastOrder({
        items: cart.map(item => ({ name: item.name, quantity: item.quantity, price: item.price })),
        subtotal,
        discount: 0,
        total: totalAmount,
        receivedAmount: parseFloat(receivedAmount) || totalAmount,
        change: Math.max(0, change),
        paymentType,
        customerName: paymentType === 'debt' ? customerName : undefined,
        customerAddress: paymentType === 'debt' ? customerAddress : undefined,
        customerPhone: paymentType === 'debt' ? customerPhone : undefined,
        orderNote: orderNote || undefined,
        date: new Date().toISOString()
      });

      setCart([]);
      setReceivedAmount('');
      setCustomerName('');
      setCustomerAddress('');
      setCustomerPhone('');
      setOrderNote('');
      setPaymentType('cash');
      setShowSuccess(true);
      setShowReceipt(false);
      setIsCartOpen(false);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error(error);
    }
  };

  const CartContent = ({ isDrawer = false }: { isDrawer?: boolean }) => (
    <div className="flex flex-col h-full bg-white lg:bg-transparent">
      <div className={cn(
        "flex-1 overflow-y-auto custom-scrollbar p-6",
        !isDrawer && "lg:p-4"
      )}>
        <div className="space-y-3">
          <AnimatePresence initial={false} mode="popLayout">
            {cart.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-4 p-3 rounded-none bg-white border border-slate-200 group hover:border-brand-500 transition-all shadow-sm hover:shadow-md"
              >
                <div className="h-12 w-12 rounded-none bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 overflow-hidden shrink-0 group-hover:border-brand-100 transition-colors">
                  {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <Package className="h-6 w-6 opacity-20" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="font-bold text-slate-900 text-xs truncate tracking-tight mb-1">{item.name}</h5>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center bg-slate-50 border border-slate-200">
                      <button 
                        onClick={() => updateQuantity(item.id, -1)}
                        className="p-1 hover:bg-white text-slate-400 hover:text-slate-900 transition-colors"
                      >
                        <Minus className="h-2.5 w-2.5" />
                      </button>
                      <span className="w-6 text-center font-bold text-[10px] text-slate-900">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        className="p-1 hover:bg-white text-slate-400 hover:text-slate-900 transition-colors"
                      >
                        <Plus className="h-2.5 w-2.5" />
                      </button>
                    </div>
                    <span className="text-[10px] font-black text-slate-900">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => removeFromCart(item.id)}
                  className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100 shrink-0"
                  title="Remove from cart"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          {cart.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center space-y-6 py-20 opacity-40">
              <div className="w-20 h-20 bg-slate-50 rounded-none flex items-center justify-center border-2 border-dashed border-slate-200">
                <ShoppingCart className="h-8 w-8 text-slate-300" />
              </div>
              <div>
                <p className="text-slate-900 font-bold text-lg tracking-tight">Your cart is empty</p>
                <p className="text-slate-400 text-xs font-medium uppercase mt-1">Add some products to start</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={cn(
        "bg-slate-50 border-t border-slate-200 space-y-5 p-6",
        !isDrawer && "lg:p-5"
      )}>
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Payment Method</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setPaymentType('cash')}
              className={cn(
                "flex items-center justify-center gap-2 py-3 rounded-none border transition-all",
                paymentType === 'cash' 
                  ? "border-slate-900 bg-slate-900 text-white shadow-md" 
                  : "border-slate-200 bg-white text-slate-400 hover:border-slate-300"
              )}
            >
              <Banknote className={cn("h-4 w-4", paymentType === 'cash' ? "text-brand-400" : "text-slate-300")} />
              <span className="font-black text-[9px] uppercase tracking-widest">Cash</span>
            </button>
            <button
              onClick={() => setPaymentType('debt')}
              className={cn(
                "flex items-center justify-center gap-2 py-3 rounded-none border transition-all",
                paymentType === 'debt' 
                  ? "border-rose-600 bg-rose-600 text-white shadow-md" 
                  : "border-slate-200 bg-white text-slate-400 hover:border-slate-300"
              )}
            >
              <Clock className={cn("h-4 w-4", paymentType === 'debt' ? "text-rose-200" : "text-slate-300")} />
              <span className="font-black text-[9px] uppercase tracking-widest">Utang</span>
            </button>
          </div>
        </div>

        {paymentType === 'debt' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-rose-100"></div>
              <span className="text-[9px] font-bold text-rose-400 uppercase tracking-widest">Customer Details</span>
              <div className="h-px flex-1 bg-rose-100"></div>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <div className="relative group">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-rose-500 transition-colors" />
                <input 
                  type="text"
                  placeholder="Customer Full Name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-none border border-slate-200 bg-white text-sm font-bold focus:border-rose-500 focus:ring-4 focus:ring-rose-500/5 outline-none transition-all placeholder:text-slate-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="tel"
                  placeholder="Phone Number"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-none border border-slate-200 bg-white text-sm font-bold focus:border-rose-500 focus:ring-4 focus:ring-rose-500/5 outline-none transition-all placeholder:text-slate-300"
                />
                <input 
                  type="text"
                  placeholder="Address"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-none border border-slate-200 bg-white text-sm font-bold focus:border-rose-500 focus:ring-4 focus:ring-rose-500/5 outline-none transition-all placeholder:text-slate-300"
                />
              </div>
            </div>
          </div>
        )}

        {paymentType === 'cash' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Received</label>
                {receivedAmount && (
                  <button 
                    onClick={() => setReceivedAmount('')}
                    className="text-[10px] font-bold text-brand-600 uppercase tracking-widest hover:underline"
                  >
                    Reset
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-300 text-xl">₱</span>
                <input 
                  type="number"
                  placeholder="0.00"
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 rounded-none border border-slate-200 bg-white text-2xl font-bold tracking-tight focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all"
                />
              </div>
            </div>
            <div className="p-4 rounded-none bg-white border border-emerald-100 flex items-center justify-between shadow-sm">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Change</span>
                <span className="text-2xl font-bold text-emerald-700 tracking-tight">{formatCurrency(Math.max(0, change))}</span>
              </div>
              <div className="h-10 w-10 rounded-none bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                <Banknote className="h-5 w-5" />
              </div>
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Order Note (Optional)</label>
          <textarea 
            placeholder="Add instructions..."
            value={orderNote}
            onChange={(e) => setOrderNote(e.target.value)}
            className="w-full px-3 py-2 rounded-none border border-slate-200 bg-white text-xs font-medium focus:border-brand-500 focus:ring-4 focus:ring-brand-500/5 outline-none transition-all h-14 resize-none"
          />
        </div>

        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2">
            <Printer className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Print Receipt</span>
          </div>
          <button 
            onClick={() => setPrintReceipt(!printReceipt)}
            className={cn(
              "w-8 h-4 rounded-full transition-all relative",
              printReceipt ? "bg-emerald-500" : "bg-slate-200"
            )}
          >
            <div className={cn(
              "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all",
              printReceipt ? "left-4.5" : "left-0.5"
            )} />
          </button>
        </div>

        <div className="pt-4 border-t border-slate-200">
          <div className="flex items-end justify-between mb-4">
            <div className="flex flex-col">
              <span className="text-slate-400 font-black uppercase text-[9px] tracking-[0.2em] mb-1">Total Amount</span>
              <span className="text-4xl font-black text-brand-600 tracking-tighter leading-none">{formatCurrency(totalAmount)}</span>
            </div>
            {cart.length > 0 && (
              <div className="relative">
                {showClearConfirm ? (
                  <div className="flex items-center gap-2 animate-in fade-in zoom-in-95">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sure?</span>
                    <button 
                      onClick={() => {
                        setCart([]);
                        setShowClearConfirm(false);
                      }}
                      className="text-[9px] font-black text-rose-600 uppercase tracking-widest hover:bg-rose-50 px-2 py-1 transition-colors"
                    >
                      Yes
                    </button>
                    <button 
                      onClick={() => setShowClearConfirm(false)}
                      className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-100 px-2 py-1 transition-colors"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowClearConfirm(true)}
                    className="text-[9px] font-black text-rose-500 uppercase tracking-widest hover:bg-rose-50 px-2 py-1 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Button 
              className="h-16 rounded-none font-black text-sm uppercase tracking-[0.2em] bg-brand-600 hover:bg-brand-700 text-white shadow-xl shadow-brand-100 active:translate-y-0.5 transition-all group w-full" 
              disabled={
                cart.length === 0 || 
                (paymentType === 'cash' && receivedAmount !== '' && parseFloat(receivedAmount) < totalAmount)
              }
              onClick={handleCheckout}
              isLoading={isLoading}
            >
              Complete Order
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            {isDrawer && (
              <button 
                className="h-8 font-black text-[9px] uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-colors"
                onClick={() => setIsCartOpen(false)}
              >
                ← Continue Shopping
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-[calc(100vh-80px)] lg:h-[calc(100vh-140px)] relative overflow-hidden">
      <div className="h-full lg:grid lg:grid-cols-[1fr_400px] lg:gap-8 p-4 lg:p-0">
        {/* Left Column: Catalog */}
        <div className="flex flex-col space-y-6 h-full overflow-hidden">
          {/* Header and Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
            <div className="hidden md:block">
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">POS Terminal</h2>
              <p className="text-slate-500 text-sm font-medium mt-1">Manage your transactions efficiently</p>
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto flex-1 max-w-2xl">
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Scan barcode or search product..."
                  className="w-full pl-12 pr-20 py-4 rounded-none border border-slate-200 bg-white shadow-sm focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/5 transition-all font-medium text-sm h-14"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {searchQuery ? (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="p-1.5 hover:bg-slate-100 rounded-none transition-colors"
                    >
                      <X className="h-4 w-4 text-slate-400" />
                    </button>
                  ) : (
                    <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded-none">
                      <span className="text-[10px] font-bold text-slate-400">/</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Categories and View Mode */}
          <div className="sticky top-0 z-20 bg-slate-50/80 backdrop-blur-md py-4 -mx-4 px-4 lg:mx-0 lg:px-0 flex flex-col lg:flex-row lg:items-center gap-6 shrink-0 border-b border-slate-200 lg:border-none lg:bg-transparent lg:backdrop-blur-none">
            <div className="flex-1 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    "px-6 py-2.5 rounded-none whitespace-nowrap font-bold text-xs uppercase tracking-wider transition-all active:scale-95 border",
                    selectedCategory === category
                      ? "bg-slate-900 text-white border-slate-900 shadow-md"
                      : "bg-white text-slate-500 hover:bg-slate-50 border-slate-200 hover:border-slate-300"
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 bg-white p-1 rounded-none border border-slate-200 shadow-sm self-end lg:self-auto">
              <button 
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-2.5 rounded-none transition-all", 
                  viewMode === 'grid' 
                    ? "bg-slate-100 text-slate-900" 
                    : "bg-transparent text-slate-400 hover:text-slate-600"
                )}
                title="Grid View"
              >
                <LayoutGrid className="h-5 w-5" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-2.5 rounded-none transition-all", 
                  viewMode === 'list' 
                    ? "bg-slate-100 text-slate-900" 
                    : "bg-transparent text-slate-400 hover:text-slate-600"
                )}
                title="List View"
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Product Display */}
          <div 
            ref={catalogContainerRef}
            className="flex-1 overflow-y-auto pr-2 -mr-2 scroll-smooth custom-scrollbar"
          >
            {filteredProducts.length > 0 ? (
              viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 pb-32">
                  <AnimatePresence mode="popLayout">
                    {filteredProducts.map((product) => (
                      <motion.div
                        layout
                        key={product.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        whileHover={product.stock > 0 ? { y: -4 } : {}}
                        onClick={() => product.stock > 0 && addToCart(product)}
                        className={cn(
                          "group relative bg-white rounded-none border border-slate-200 hover:border-brand-500 hover:shadow-xl transition-all text-left flex flex-col p-0 h-full overflow-hidden cursor-pointer",
                          product.stock <= 0 && "opacity-50 grayscale cursor-not-allowed"
                        )}
                        role="button"
                        tabIndex={product.stock > 0 ? 0 : -1}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            if (product.stock > 0) addToCart(product);
                          }
                        }}
                      >
                        <div className="bg-slate-50 rounded-none flex items-center justify-center text-slate-200 group-hover:bg-brand-50 transition-colors relative overflow-hidden shrink-0 aspect-square border-b border-slate-100 group-hover:border-brand-100">
                          {product.imageUrl ? (
                            <img 
                              src={product.imageUrl} 
                              alt={product.name} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                              referrerPolicy="no-referrer" 
                            />
                          ) : (
                            <Package className="h-12 w-12 opacity-20" />
                          )}
                          
                          {/* Stock Badge */}
                          <div className="absolute top-2 left-2">
                            <span className={cn(
                              "px-2 py-1 text-[9px] font-bold uppercase tracking-wider shadow-sm border",
                              product.stock <= 0 
                                ? "bg-slate-900 text-white border-slate-900" 
                                : product.stock <= 5 
                                  ? "bg-rose-500 text-white border-rose-500" 
                                  : "bg-white text-slate-700 border-slate-200"
                            )}>
                              {product.stock <= 0 ? 'Out of Stock' : `${product.stock} In Stock`}
                            </span>
                          </div>

                          {product.stock <= 0 && (
                            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center">
                              <span className="bg-white text-slate-900 font-bold text-xs uppercase tracking-widest px-4 py-2 rounded-none shadow-xl border border-slate-900">SOLD OUT</span>
                            </div>
                          )}

                          {/* Add Overlay */}
                          <div className="absolute inset-0 bg-brand-600/0 group-hover:bg-brand-600/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <div className="bg-white text-brand-600 p-2.5 rounded-none shadow-xl transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 border border-brand-200">
                              <Plus className="h-5 w-5 font-bold" />
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4 flex-1 flex flex-col">
                          <div className="mb-3">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-[10px] font-bold text-brand-500 uppercase tracking-widest">{product.category}</p>
                              {cart.find(item => item.id === product.id) && (
                                <motion.span 
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="bg-brand-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-none"
                                >
                                  {cart.find(item => item.id === product.id)?.quantity} in cart
                                </motion.span>
                              )}
                            </div>
                            <h4 className="font-bold text-slate-900 text-sm leading-tight line-clamp-2 group-hover:text-brand-600 transition-colors">{product.name}</h4>
                          </div>

                          <div className="mt-auto pt-3 border-t border-slate-50 flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Price</span>
                              <span className="text-slate-900 font-bold text-lg tracking-tight">{formatCurrency(product.price)}</span>
                            </div>
                            
                            {cart.find(item => item.id === product.id) ? (
                              <div className="flex items-center bg-slate-100 border border-slate-200">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateQuantity(product.id, -1);
                                  }}
                                  className="p-2 hover:bg-white text-slate-500 hover:text-slate-900 transition-colors"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="w-6 text-center font-bold text-xs text-slate-900">
                                  {cart.find(item => item.id === product.id)?.quantity}
                                </span>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateQuantity(product.id, 1);
                                  }}
                                  className="p-2 hover:bg-white text-slate-500 hover:text-slate-900 transition-colors"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <div className="h-9 w-9 bg-slate-50 text-slate-400 group-hover:bg-brand-600 group-hover:text-white transition-all flex items-center justify-center border border-transparent group-hover:border-brand-700">
                                <Plus className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="space-y-4 pb-32">
                  <AnimatePresence mode="popLayout">
                    {filteredProducts.map((product) => (
                      <motion.div
                        layout
                        key={product.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        onClick={() => product.stock > 0 && addToCart(product)}
                        className={cn(
                          "w-full flex items-center gap-6 p-4 bg-white rounded-none border border-slate-200 hover:border-brand-500 hover:shadow-lg transition-all text-left group cursor-pointer",
                          product.stock <= 0 && "opacity-50 grayscale cursor-not-allowed"
                        )}
                        role="button"
                        tabIndex={product.stock > 0 ? 0 : -1}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            if (product.stock > 0) addToCart(product);
                          }
                        }}
                      >
                        <div className="h-16 w-16 rounded-none bg-slate-50 flex items-center justify-center text-slate-300 overflow-hidden shrink-0 border border-slate-100 group-hover:border-brand-100 transition-colors">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                          ) : (
                            <Package className="h-8 w-8 opacity-20" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1.5">
                            <span className="px-2 py-0.5 rounded-none bg-slate-100 text-[9px] font-bold text-slate-500 uppercase tracking-widest border border-slate-200">
                              {product.category}
                            </span>
                            <h4 className="font-bold text-slate-900 text-base truncate group-hover:text-brand-600 transition-colors tracking-tight">{product.name}</h4>
                          </div>
                          <div className="flex items-center gap-8">
                            <div>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Price</p>
                              <p className="font-bold text-slate-900 text-base tracking-tight">{formatCurrency(product.price)}</p>
                            </div>
                            <div>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Stock</p>
                              <p className={cn(
                                "text-sm font-bold tracking-tight",
                                product.stock <= 5 ? "text-rose-500" : "text-slate-700"
                              )}>{product.stock} units</p>
                            </div>
                            {cart.find(item => item.id === product.id) && (
                              <div className="flex items-center bg-slate-100 border border-slate-200 ml-auto">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateQuantity(product.id, -1);
                                  }}
                                  className="p-2 hover:bg-white text-slate-500 hover:text-slate-900 transition-colors"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="w-8 text-center font-bold text-sm text-slate-900">
                                  {cart.find(item => item.id === product.id)?.quantity}
                                </span>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateQuantity(product.id, 1);
                                  }}
                                  className="p-2 hover:bg-white text-slate-500 hover:text-slate-900 transition-colors"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        {!cart.find(item => item.id === product.id) && (
                          <div className={cn(
                            "h-12 w-12 rounded-none flex items-center justify-center transition-all border",
                            product.stock <= 0 
                              ? "bg-slate-50 border-slate-100 text-slate-300" 
                              : "bg-white border-slate-200 text-brand-600 group-hover:bg-brand-600 group-hover:border-brand-700 group-hover:text-white shadow-sm"
                          )}>
                            <Plus className="h-6 w-6" />
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-20">
                <div className="w-20 h-20 bg-slate-50 rounded-none flex items-center justify-center mb-4">
                  <Search className="h-8 w-8 text-slate-200" />
                </div>
                <h3 className="text-slate-900 font-bold text-lg">No Products Found</h3>
                <p className="text-slate-400 text-sm max-w-[200px] mx-auto mt-2">Try adjusting your search or category filter</p>
                <Button 
                  variant="secondary" 
                  className="mt-6 rounded-xl"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                  }}
                >
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Persistent Cart (Desktop Only) */}
        <div className="hidden lg:flex flex-col h-full border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div id="cart-icon-main" className="p-2 bg-brand-50 text-brand-600 transition-transform">
                    <ShoppingCart className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 tracking-tight">Order Summary</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {cart.length} items in cart
                    </p>
                  </div>
                </div>
              </div>
          <div className="flex-1 flex flex-col overflow-hidden">
            <CartContent />
          </div>
        </div>
      </div>

      {/* Floating Cart Button (Mobile/Tablet Only) */}
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-24 right-6 lg:hidden z-40"
      >
        <motion.button
          animate={lastAddedId ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.3 }}
          onClick={() => setIsCartOpen(true)}
          className={cn(
            "relative bg-slate-900 text-white h-16 rounded-full shadow-2xl flex items-center justify-center gap-3 group active:scale-95 transition-all hover:bg-slate-800 border-4 border-white",
            cart.length > 0 ? "w-auto px-8 ring-8 ring-brand-500/10" : "w-16"
          )}
        >
          <div className="relative">
            <ShoppingCart className={cn("transition-all", cart.length > 0 ? "h-6 w-6" : "h-7 w-7")} />
            <AnimatePresence>
              {cart.length > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-3 -right-3 h-6 w-6 bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white shadow-lg"
                >
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          
          {cart.length > 0 && (
            <span className="font-black text-sm uppercase tracking-[0.2em] animate-in fade-in slide-in-from-left-2">Checkout</span>
          )}
          
          {/* Ring animation when items are added */}
          <AnimatePresence>
            {cart.length > 0 && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1.2, opacity: 0 }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 rounded-full border-4 border-brand-500/20"
              />
            )}
          </AnimatePresence>
        </motion.button>
      </motion.div>

      {/* Cart Drawer (Mobile/Tablet Only) */}
      <Drawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        title={
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-50 text-brand-600 rounded-none">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xl font-bold text-slate-900 block tracking-tight">Current Order</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {cart.length} {cart.length === 1 ? 'Item' : 'Items'} in cart
              </span>
            </div>
          </div>
        }
      >
        <CartContent isDrawer />
      </Drawer>

      {/* Success Toast */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md"
          >
            <div className="bg-white text-slate-900 p-1 rounded-none shadow-2xl border border-slate-200 backdrop-blur-xl">
              <div className="flex items-center justify-between pl-6 pr-2 py-3">
                <div className="flex items-center gap-4">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="bg-emerald-500 p-2 rounded-none"
                  >
                    <CheckCircle2 className="h-6 w-6 text-white" />
                  </motion.div>
                  <div>
                    <p className="font-bold text-lg leading-none tracking-tight">Transaction Complete</p>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">Order recorded successfully</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setShowReceipt(true);
                      setShowSuccess(false);
                    }}
                    className="bg-slate-900 text-white hover:bg-slate-800 h-12 px-5 rounded-none text-xs font-bold transition-all flex items-center gap-2 shadow-sm active:scale-95"
                  >
                    <Printer className="h-4 w-4" />
                    Receipt
                  </button>
                  <button 
                    onClick={() => setShowSuccess(false)}
                    className="bg-slate-50 hover:bg-slate-100 h-12 w-12 rounded-none flex items-center justify-center transition-all active:scale-95"
                  >
                    <X className="h-5 w-5 text-slate-400" />
                  </button>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="px-8 pb-1">
                <motion.div 
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 3, ease: 'linear' }}
                  className="h-1 bg-emerald-500 rounded-none"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Receipt Modal */}
      <Modal
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
        title={
          <div className="flex items-center gap-2">
            <span className="text-lg">🧾</span>
            <span>Receipt Preview</span>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="bg-slate-50 p-4 sm:p-6 rounded-none overflow-hidden border border-slate-100">
            {lastOrder && receiptSettings && (
              <Receipt 
                settings={receiptSettings}
                items={lastOrder.items}
                subtotal={lastOrder.subtotal}
                discount={lastOrder.discount}
                total={lastOrder.total}
                receivedAmount={lastOrder.receivedAmount}
                change={lastOrder.change}
                paymentType={lastOrder.paymentType}
                customerName={lastOrder.customerName}
                customerPhone={lastOrder.customerPhone}
                customerAddress={lastOrder.customerAddress}
                orderNote={lastOrder.orderNote}
                date={lastOrder.date}
              />
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 no-print">
            <Button 
              className="flex-[2] h-14 rounded-none font-black text-sm uppercase tracking-widest bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-200" 
              onClick={() => window.print()}
            >
              <Printer className="mr-2 h-5 w-5" />
              Print Now
            </Button>
            <Button 
              variant="secondary" 
              className="flex-1 h-14 rounded-none font-black text-sm uppercase tracking-widest bg-slate-100 border-none text-slate-600 hover:bg-slate-200" 
              onClick={() => setShowReceipt(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
