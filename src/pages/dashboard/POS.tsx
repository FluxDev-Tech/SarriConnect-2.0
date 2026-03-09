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
  ArrowRight
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
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [paymentType, setPaymentType] = React.useState<'cash' | 'debt'>('cash');
  const [customerName, setCustomerName] = React.useState('');
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [showReceipt, setShowReceipt] = React.useState(false);
  const [lastOrder, setLastOrder] = React.useState<any>(null);
  const [activeTab, setActiveTab] = React.useState<'products' | 'cart'>('products');

  React.useEffect(() => {
    fetchProducts();
    fetchReceiptSettings();
  }, [fetchProducts, fetchReceiptSettings]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.barcode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    
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

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (paymentType === 'debt' && !customerName) return;

    const items = cart.map(item => ({
      id: item.id,
      quantity: item.quantity,
      price: item.price
    }));

    await recordSale(items, totalAmount, paymentType, customerName);
    
    setLastOrder({
      items: cart.map(item => ({ name: item.name, quantity: item.quantity, price: item.price })),
      total: totalAmount,
      paymentType,
      customerName,
      date: new Date().toISOString()
    });

    setCart([]);
    setCustomerName('');
    setPaymentType('cash');
    setShowSuccess(true);
    setShowReceipt(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-140px)]">
      {/* Product Selection */}
      <div className="lg:col-span-8 flex flex-col space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-4xl font-black text-slate-900">POS Terminal</h2>
            <p className="text-slate-500 font-medium">Select products to build an order</p>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, category or barcode..."
              className="w-full pl-12 pr-4 py-4 rounded-[1.5rem] border border-slate-100 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 -mr-2 scroll-smooth">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
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
                  className="group relative bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-brand-200 transition-all text-left disabled:opacity-50 disabled:grayscale flex flex-col h-full"
                >
                  <div className="aspect-square bg-slate-50 rounded-2xl mb-4 flex items-center justify-center text-slate-300 group-hover:bg-brand-50 group-hover:text-brand-200 transition-colors relative overflow-hidden">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <Package className="h-12 w-12" />
                    )}
                    {product.stock <= 5 && product.stock > 0 && (
                      <div className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-lg">
                        LOW STOCK
                      </div>
                    )}
                  </div>
                  <h4 className="font-bold text-slate-900 line-clamp-1 mb-1">{product.name}</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">{product.category}</p>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-brand-600 font-black text-lg">{formatCurrency(product.price)}</span>
                    <div className={cn(
                      "h-8 w-8 rounded-xl flex items-center justify-center transition-colors",
                      product.stock <= 0 ? "bg-slate-100 text-slate-400" : "bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white"
                    )}>
                      <Plus className="h-5 w-5" />
                    </div>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Cart / Checkout */}
      <div className="lg:col-span-4 bento-card flex flex-col overflow-hidden shadow-2xl shadow-brand-900/5">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-brand-600 text-white">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-2.5 rounded-2xl">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold leading-none">Order Details</h3>
              <p className="text-brand-100 text-xs font-bold mt-1 uppercase tracking-widest">{cart.length} Items Selected</p>
            </div>
          </div>
          <button 
            onClick={() => setCart([])}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
            title="Clear Cart"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <AnimatePresence initial={false} mode="popLayout">
            {cart.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50/50 border border-slate-100 group"
              >
                <div className="h-12 w-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 overflow-hidden">
                  {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <Package className="h-6 w-6" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="font-bold text-slate-900 truncate">{item.name}</h5>
                  <p className="text-xs text-brand-600 font-black">{formatCurrency(item.price)}</p>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-2xl border border-slate-100 p-1 shadow-sm">
                  <button 
                    onClick={() => updateQuantity(item.id, -1)}
                    className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors text-slate-400 hover:text-brand-600"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-6 text-center text-sm font-black text-slate-900">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.id, 1)}
                    className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors text-slate-400 hover:text-brand-600"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-20">
              <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center relative">
                <ShoppingCart className="h-10 w-10 text-slate-200" />
                <div className="absolute -right-2 -top-2 w-8 h-8 bg-white rounded-full shadow-sm flex items-center justify-center">
                  <Plus className="h-4 w-4 text-brand-400" />
                </div>
              </div>
              <div>
                <p className="text-slate-900 font-bold text-lg">Terminal Ready</p>
                <p className="text-slate-400 font-medium text-sm mt-1">Select products from the left<br/>to begin checkout</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-8 bg-slate-50/80 backdrop-blur-md border-t border-slate-100 space-y-6">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Payment Method</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setPaymentType('cash')}
                className={cn(
                  "flex flex-col items-center justify-center gap-3 py-5 rounded-[1.5rem] border-2 transition-all group relative overflow-hidden",
                  paymentType === 'cash' 
                    ? "border-emerald-500 bg-white text-emerald-700 shadow-xl shadow-emerald-100" 
                    : "border-transparent bg-white/50 text-slate-400 hover:bg-white hover:border-slate-200"
                )}
              >
                <div className={cn(
                  "p-2.5 rounded-xl transition-all duration-300",
                  paymentType === 'cash' ? "bg-emerald-500 text-white scale-110" : "bg-slate-100 text-slate-400 group-hover:scale-110"
                )}>
                  <Banknote className="h-5 w-5" />
                </div>
                <span className="font-bold text-xs uppercase tracking-wider">Cash</span>
              </button>
              <button
                onClick={() => setPaymentType('debt')}
                className={cn(
                  "flex flex-col items-center justify-center gap-3 py-5 rounded-[1.5rem] border-2 transition-all group relative overflow-hidden",
                  paymentType === 'debt' 
                    ? "border-rose-500 bg-white text-rose-700 shadow-xl shadow-rose-100" 
                    : "border-transparent bg-white/50 text-slate-400 hover:bg-white hover:border-slate-200"
                )}
              >
                <div className={cn(
                  "p-2.5 rounded-xl transition-all duration-300",
                  paymentType === 'debt' ? "bg-rose-500 text-white scale-110" : "bg-slate-100 text-slate-400 group-hover:scale-110"
                )}>
                  <Clock className="h-5 w-5" />
                </div>
                <span className="font-bold text-xs uppercase tracking-wider">Utang</span>
              </button>
            </div>
          </div>

          <AnimatePresence>
            {paymentType === 'debt' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                <Input 
                  label="Customer Name" 
                  placeholder="Who is borrowing?" 
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="bg-white rounded-2xl h-12 border-slate-200"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Total Payable</span>
            <span className="text-4xl font-black text-brand-600 tracking-tighter">{formatCurrency(totalAmount)}</span>
          </div>

          <Button 
            className="w-full h-16 text-lg font-black rounded-[1.5rem] bg-brand-600 hover:bg-brand-700 shadow-2xl shadow-brand-200/50" 
            disabled={cart.length === 0 || (paymentType === 'debt' && !customerName)}
            onClick={handleCheckout}
            isLoading={isLoading}
          >
            Complete Order
            <ArrowRight className="ml-3 h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Success Toast */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-8 py-5 rounded-[2rem] shadow-2xl flex items-center gap-8 border border-white/20 backdrop-blur-md"
          >
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-2 rounded-xl">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="font-black text-lg leading-none">Order Successful!</p>
                <p className="text-emerald-100 text-xs font-bold mt-1 uppercase tracking-widest">Transaction Recorded</p>
              </div>
            </div>
            <button 
              onClick={() => setShowReceipt(true)}
              className="bg-white text-emerald-600 hover:bg-emerald-50 px-6 py-3 rounded-xl text-sm font-black transition-all flex items-center gap-2 shadow-lg"
            >
              <Printer className="h-4 w-4" />
              Print Receipt
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Receipt Modal */}
      <Modal
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
        title="Transaction Receipt"
      >
        <div className="space-y-8">
          <div className="bg-slate-50 p-8 rounded-[2.5rem] overflow-hidden border border-slate-100">
            {lastOrder && receiptSettings && (
              <Receipt 
                settings={receiptSettings}
                items={lastOrder.items}
                total={lastOrder.total}
                paymentType={lastOrder.paymentType}
                customerName={lastOrder.customerName}
                date={lastOrder.date}
              />
            )}
          </div>

          <div className="flex gap-4 no-print">
            <Button 
              variant="secondary" 
              className="flex-1 h-14 rounded-2xl font-bold" 
              onClick={() => setShowReceipt(false)}
            >
              Close
            </Button>
            <Button 
              className="flex-1 h-14 rounded-2xl font-bold bg-brand-600 hover:bg-brand-700" 
              onClick={() => window.print()}
            >
              <Printer className="mr-3 h-5 w-5" />
              Print Receipt
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
