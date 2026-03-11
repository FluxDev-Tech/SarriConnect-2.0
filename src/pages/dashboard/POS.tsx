import React from 'react';
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
  Download,
  X,
  Banknote,
  Clock,
  ArrowRight,
  LayoutDashboard,
  Menu
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { formatCurrency, cn } from '../../utils/helpers';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Receipt } from '../../components/dashboard/Receipt';
import { Product } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

interface CartItem extends Product {
  quantity: number;
}

export const POS = () => {
  const { products, fetchProducts, recordSale, receiptSettings, fetchReceiptSettings, isLoading } = useStore();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('All');
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [paymentType, setPaymentType] = React.useState<'cash' | 'debt'>('cash');
  const [customerName, setCustomerName] = React.useState('');
  const [customerPhone, setCustomerPhone] = React.useState('');
  const [customerAddress, setCustomerAddress] = React.useState('');
  const [discount, setDiscount] = React.useState(0);
  const [receivedAmount, setReceivedAmount] = React.useState<string>('');
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [showReceipt, setShowReceipt] = React.useState(false);
  const [lastOrder, setLastOrder] = React.useState<any>(null);
  const [activeTab, setActiveTab] = React.useState<'products' | 'cart'>('products');
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
  const searchInputRef = React.useRef<HTMLInputElement>(null);

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

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F4' || (e.key === '/' && document.activeElement?.tagName !== 'INPUT')) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'F2') {
        e.preventDefault();
        handleCheckout();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fetchProducts, fetchReceiptSettings]);

  // Barcode auto-add logic
  React.useEffect(() => {
    if (searchQuery.length >= 3) {
      const exactMatch = products.find(p => p.barcode === searchQuery);
      if (exactMatch && exactMatch.stock > 0) {
        addToCart(exactMatch);
        setSearchQuery('');
      }
    }
  }, [searchQuery, products]);

  const categories = ['All', ...new Set(products.map(p => p.category))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    playSound('add');
    
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

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, Math.min(item.stock, item.quantity + delta));
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalAmount = Math.max(0, subtotal - discount);
  const change = receivedAmount ? parseFloat(receivedAmount) - totalAmount : 0;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (paymentType === 'debt' && !customerName) return;
    if (paymentType === 'cash' && receivedAmount && parseFloat(receivedAmount) < totalAmount) return;

    const items = cart.map(item => ({
      id: item.id,
      quantity: item.quantity,
      price: item.price
    }));

    try {
      await recordSale(items, totalAmount, subtotal, discount, paymentType, customerName);
      playSound('success');
      
      setLastOrder({
        items: cart.map(item => ({ name: item.name, quantity: item.quantity, price: item.price })),
        subtotal,
        discount,
        total: totalAmount,
        receivedAmount: parseFloat(receivedAmount) || totalAmount,
        change: Math.max(0, change),
        paymentType,
        customerName,
        customerPhone,
        customerAddress,
        date: new Date().toISOString()
      });

      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
      setDiscount(0);
      setReceivedAmount('');
      setPaymentType('cash');
      setShowSuccess(true);
      setShowReceipt(true);
      setActiveTab('products');
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 h-[calc(100vh-100px)] lg:h-[calc(100vh-140px)] relative">
      {/* Mobile Tab Toggle */}
      <div className="lg:hidden flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm mb-2">
        <button
          onClick={() => setActiveTab('products')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all",
            activeTab === 'products' ? "bg-brand-600 text-white shadow-lg shadow-brand-200" : "text-slate-500"
          )}
        >
          <Package className="h-4 w-4" />
          Products
        </button>
        <button
          onClick={() => setActiveTab('cart')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all relative",
            activeTab === 'cart' ? "bg-brand-600 text-white shadow-lg shadow-brand-200" : "text-slate-500"
          )}
        >
          <ShoppingCart className="h-4 w-4" />
          Cart
          {cart.length > 0 && (
            <span className="absolute top-2 right-4 h-5 w-5 bg-rose-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white">
              {cart.length}
            </span>
          )}
        </button>
      </div>

      {/* Product Selection */}
      <div className={cn(
        "lg:col-span-8 flex flex-col space-y-6 min-h-0",
        activeTab === 'cart' ? "hidden lg:flex" : "flex"
      )}>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="hidden md:block">
              <h2 className="text-3xl font-black text-slate-900">POS Terminal</h2>
              <p className="text-slate-500 font-medium text-sm">Build an order by selecting items</p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search or scan..."
                  className="w-full pl-10 pr-10 py-3 rounded-2xl border border-slate-100 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-medium text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X className="h-3 w-3 text-slate-400" />
                  </button>
                )}
              </div>
              <div className="flex bg-white p-1 rounded-xl border border-slate-100 shadow-sm">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "p-2 rounded-lg transition-all",
                    viewMode === 'grid' ? "bg-brand-50 text-brand-600" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <LayoutDashboard className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "p-2 rounded-lg transition-all",
                    viewMode === 'list' ? "bg-brand-50 text-brand-600" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <Menu className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Categories Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar -mx-2 px-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border",
                  selectedCategory === category
                    ? "bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-100"
                    : "bg-white text-slate-500 border-slate-100 hover:border-brand-200 hover:text-brand-600"
                )}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 -mr-2 scroll-smooth">
          {filteredProducts.length > 0 ? (
            <div className={cn(
              "pb-20 lg:pb-0",
              viewMode === 'grid' 
                ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4" 
                : "flex flex-col gap-2"
            )}>
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product) => (
                  <motion.button
                    layout
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => addToCart(product)}
                    disabled={product.stock <= 0}
                    className={cn(
                      "group relative bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-brand-200 transition-all text-left disabled:opacity-50 disabled:grayscale flex",
                      viewMode === 'grid' ? "flex-col p-4 h-full" : "flex-row p-3 items-center gap-4"
                    )}
                  >
                    <div className={cn(
                      "bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-brand-50 group-hover:text-brand-200 transition-colors relative overflow-hidden shrink-0",
                      viewMode === 'grid' ? "aspect-square mb-3" : "h-12 w-12"
                    )}>
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <Package className={cn(viewMode === 'grid' ? "h-10 w-10" : "h-6 w-6")} />
                      )}
                      {product.stock <= 5 && product.stock > 0 && (
                        <div className="absolute top-1 right-1 bg-amber-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded-md shadow-lg">
                          LOW
                        </div>
                      )}
                      {product.stock <= 0 && (
                        <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                          <span className="text-white font-black text-[8px] uppercase tracking-widest">OUT</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 text-sm line-clamp-1 mb-0.5">{product.name}</h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{product.category}</p>
                      {viewMode === 'list' && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-brand-600 font-black text-sm">{formatCurrency(product.price)}</span>
                          <span className="text-[10px] text-slate-400 font-medium">Stock: {product.stock}</span>
                        </div>
                      )}
                    </div>

                    {viewMode === 'grid' ? (
                      <div className="mt-auto flex items-center justify-between">
                        <span className="text-brand-600 font-black text-base">{formatCurrency(product.price)}</span>
                        <div className={cn(
                          "h-7 w-7 rounded-lg flex items-center justify-center transition-colors",
                          product.stock <= 0 ? "bg-slate-100 text-slate-400" : "bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white"
                        )}>
                          <Plus className="h-4 w-4" />
                        </div>
                      </div>
                    ) : (
                      <div className={cn(
                        "h-8 w-8 rounded-xl flex items-center justify-center transition-colors",
                        product.stock <= 0 ? "bg-slate-100 text-slate-400" : "bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white"
                      )}>
                        <Plus className="h-4 w-4" />
                      </div>
                    )}
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center py-20">
              <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-4">
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

      {/* Cart / Checkout */}
      <div className={cn(
        "lg:col-span-4 bento-card flex flex-col overflow-hidden shadow-2xl shadow-brand-900/5 min-h-0",
        activeTab === 'products' ? "hidden lg:flex" : "flex"
      )}>
        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-brand-600 text-white">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-2 rounded-xl">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold leading-none">Order Summary</h3>
              <p className="text-brand-100 text-[10px] font-bold mt-1 uppercase tracking-widest">{cart.length} Items</p>
            </div>
          </div>
          <button 
            onClick={() => setCart([])}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
            title="Clear Cart"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <AnimatePresence initial={false} mode="popLayout">
            {cart.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50/50 border border-slate-100 group"
              >
                <div className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 overflow-hidden shrink-0">
                  {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <Package className="h-5 w-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="font-bold text-slate-900 text-sm truncate">{item.name}</h5>
                  <p className="text-[10px] text-brand-600 font-black">{formatCurrency(item.price)}</p>
                </div>
                <div className="flex items-center gap-1.5 bg-white rounded-xl border border-slate-100 p-1 shadow-sm">
                  <button 
                    onClick={() => updateQuantity(item.id, -1)}
                    className="p-1 hover:bg-slate-50 rounded-lg transition-colors text-slate-400 hover:text-brand-600"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-5 text-center text-xs font-black text-slate-900">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.id, 1)}
                    className="p-1 hover:bg-slate-50 rounded-lg transition-colors text-slate-400 hover:text-brand-600"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <button 
                  onClick={() => removeFromCart(item.id)}
                  className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
              <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center relative">
                <ShoppingCart className="h-6 w-6 text-slate-200" />
              </div>
              <div>
                <p className="text-slate-900 font-bold text-sm">Cart is Empty</p>
                <p className="text-slate-400 font-medium text-[10px] mt-1">Select items to start<br/>an order</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50/80 backdrop-blur-md border-t border-slate-100 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Payment Method</label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentType('cash')}
                className={cn(
                  "flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all group",
                  paymentType === 'cash' 
                    ? "border-emerald-500 bg-white text-emerald-700 shadow-lg shadow-emerald-100" 
                    : "border-transparent bg-white/50 text-slate-400 hover:bg-white hover:border-slate-200"
                )}
              >
                <Banknote className={cn("h-4 w-4", paymentType === 'cash' ? "text-emerald-500" : "text-slate-400")} />
                <span className="font-bold text-[10px] uppercase tracking-wider">Cash</span>
              </button>
              <button
                onClick={() => setPaymentType('debt')}
                className={cn(
                  "flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all group",
                  paymentType === 'debt' 
                    ? "border-rose-500 bg-white text-rose-700 shadow-lg shadow-rose-100" 
                    : "border-transparent bg-white/50 text-slate-400 hover:bg-white hover:border-slate-200"
                )}
              >
                <Clock className={cn("h-4 w-4", paymentType === 'debt' ? "text-rose-500" : "text-slate-400")} />
                <span className="font-bold text-[10px] uppercase tracking-wider">Utang</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Discount</label>
              <div className="relative">
                <input 
                  type="number"
                  placeholder="0.00"
                  value={discount || ''}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-bold focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
            </div>
            {paymentType === 'cash' && (
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Received</label>
                <input 
                  type="number"
                  placeholder="0.00"
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            )}
          </div>

          <AnimatePresence mode="wait">
            {paymentType === 'cash' ? (
              <motion.div
                key="cash-fields"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 overflow-hidden"
              >
                <div className="flex flex-wrap gap-1">
                  {[20, 50, 100, 200, 500, 1000].map(amt => (
                    <button
                      key={amt}
                      onClick={() => setReceivedAmount(amt.toString())}
                      className="px-2 py-1 text-[9px] font-black bg-white border border-slate-100 rounded-lg hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600 transition-all"
                    >
                      {amt}
                    </button>
                  ))}
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Change</span>
                  <span className="text-lg font-black text-emerald-700">{formatCurrency(Math.max(0, change))}</span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="debt-fields"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden space-y-3"
              >
                <Input 
                  label="Customer Name" 
                  placeholder="Who is borrowing?" 
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="bg-white rounded-xl h-10 border-slate-200 text-sm"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input 
                    label="Phone Number" 
                    placeholder="Optional" 
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="bg-white rounded-xl h-10 border-slate-200 text-sm"
                  />
                  <Input 
                    label="Address" 
                    placeholder="Optional" 
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="bg-white rounded-xl h-10 border-slate-200 text-sm"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="pt-3 border-t border-slate-200 space-y-1">
            {discount > 0 && (
              <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold">
                <span>SUBTOTAL</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
            )}
            {discount > 0 && (
              <div className="flex items-center justify-between text-rose-500 text-[10px] font-bold">
                <span>DISCOUNT</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">Total Amount</span>
              <span className="text-3xl font-black text-brand-600 tracking-tighter">{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          <Button 
            className="w-full h-14 text-base font-black rounded-2xl bg-brand-600 hover:bg-brand-700 shadow-xl shadow-brand-200/50" 
            disabled={
              cart.length === 0 || 
              (paymentType === 'debt' && !customerName) ||
              (paymentType === 'cash' && receivedAmount !== '' && parseFloat(receivedAmount) < totalAmount)
            }
            onClick={handleCheckout}
            isLoading={isLoading}
          >
            Complete Order
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Floating Cart Summary */}
      {activeTab === 'products' && cart.length > 0 && (
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="lg:hidden fixed bottom-6 left-4 right-4 z-40"
        >
          <button
            onClick={() => setActiveTab('cart')}
            className="w-full bg-brand-600 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between group active:scale-95 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold text-brand-100 uppercase tracking-widest leading-none mb-1">{cart.length} Items</p>
                <p className="text-lg font-black leading-none">View Cart</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-black">{formatCurrency(totalAmount)}</p>
            </div>
          </button>
        </motion.div>
      )}

      {/* Success Toast */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-4 rounded-[2rem] shadow-2xl flex items-center gap-6 border border-white/20 backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-1.5 rounded-lg">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <p className="font-black text-base leading-none">Order Successful!</p>
            </div>
            <button 
              onClick={() => setShowReceipt(true)}
              className="bg-white text-emerald-600 hover:bg-emerald-50 px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-lg"
            >
              <Printer className="h-3 w-3" />
              Receipt
            </button>
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
          <div className="bg-slate-50 p-6 rounded-[2rem] overflow-hidden border border-slate-100">
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
                date={lastOrder.date}
              />
            )}
          </div>

          <div className="flex gap-3 no-print">
            <Button 
              className="flex-[2] h-14 rounded-2xl font-black text-sm uppercase tracking-widest bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-200" 
              onClick={() => window.print()}
            >
              <Printer className="mr-2 h-5 w-5" />
              Print Now
            </Button>
            <Button 
              variant="secondary" 
              className="flex-1 h-14 rounded-2xl font-black text-sm uppercase tracking-widest bg-slate-100 border-none text-slate-600 hover:bg-slate-200" 
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
