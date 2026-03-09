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
  X
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
    <div className="flex flex-col lg:flex-row gap-8 lg:h-[calc(100vh-12rem)] relative">
      {/* Mobile Tab Switcher */}
      <div className="flex lg:hidden bg-white p-1 rounded-2xl border border-gray-100 shadow-sm mb-4">
        <button 
          onClick={() => setActiveTab('products')}
          className={cn(
            "flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2",
            activeTab === 'products' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "text-gray-500"
          )}
        >
          <Package className="h-4 w-4" />
          Products
        </button>
        <button 
          onClick={() => setActiveTab('cart')}
          className={cn(
            "flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 relative",
            activeTab === 'cart' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "text-gray-500"
          )}
        >
          <ShoppingCart className="h-4 w-4" />
          Cart
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] h-5 w-5 rounded-full flex items-center justify-center border-2 border-white">
              {cart.length}
            </span>
          )}
        </button>
      </div>

      {/* Product Selection Area */}
      <div className={cn(
        "flex-1 flex flex-col min-h-0",
        activeTab !== 'products' && "hidden lg:flex"
      )}>
        <div className="mb-4 lg:mb-6">
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1 lg:mb-2">Point of Sale</h2>
          <p className="text-sm lg:text-base text-gray-500">Select products to add to cart</p>
        </div>

        <div className="relative mb-4 lg:mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            className="w-full pl-12 pr-4 py-3 lg:py-4 rounded-2xl border border-gray-100 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-base lg:text-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 min-h-[400px] lg:min-h-0">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
              <Package className="h-12 w-12 text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium">No products found</p>
              <Button variant="ghost" className="mt-2" onClick={() => setSearchQuery('')}>
                Clear Search
              </Button>
            </div>
          ) : (
            filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={product.stock <= 0}
                className={cn(
                  "flex flex-col bg-white p-3 sm:p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-left group relative",
                  product.stock <= 0 && "opacity-60 grayscale cursor-not-allowed"
                )}
              >
                <div className="aspect-square rounded-xl bg-gray-50 mb-3 overflow-hidden flex items-center justify-center">
                  {product.imageUrl ? (
                    <img 
                      src={product.imageUrl} 
                      alt={product.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <Package className="h-8 w-8 text-gray-300" />
                  )}
                </div>
                <h3 className="font-bold text-gray-900 text-sm sm:text-base line-clamp-1 mb-1">{product.name}</h3>
                <p className="text-indigo-600 font-bold mb-2">{formatCurrency(product.price)}</p>
                <div className="mt-auto flex items-center justify-between">
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full",
                    product.stock <= 5 ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-500"
                  )}>
                    Stock: {product.stock}
                  </span>
                </div>
                {product.stock > 0 && (
                  <div className="absolute top-2 right-2 bg-indigo-600 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus className="h-4 w-4" />
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Cart Area */}
      <div className={cn(
        "w-full lg:w-[400px] flex flex-col bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden lg:sticky lg:top-0 lg:h-full",
        activeTab !== 'cart' && "hidden lg:flex"
      )}>
        <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-indigo-50/30">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl">
              <ShoppingCart className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-bold text-gray-900">Current Order</h3>
          </div>
          <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">
            {cart.length} items
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <AnimatePresence mode="popLayout">
            {cart.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center text-center py-12"
              >
                <div className="bg-gray-50 p-4 rounded-full mb-4">
                  <ShoppingCart className="h-8 w-8 text-gray-300" />
                </div>
                <p className="text-gray-400 font-medium">Your cart is empty</p>
              </motion.div>
            ) : (
              cart.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-4 p-3 rounded-2xl bg-gray-50/50 border border-gray-100 group"
                >
                  <div className="h-12 w-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <Package className="h-5 w-5 text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 text-sm truncate">{item.name}</h4>
                    <p className="text-xs text-indigo-600 font-bold">{formatCurrency(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => updateQuantity(item.id, -1)}
                      className="h-7 w-7 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, 1)}
                      className="h-7 w-7 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="h-7 w-7 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors ml-1"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        <div className="p-6 bg-gray-50/50 border-t border-gray-100 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Payment Method</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentType('cash')}
                className={cn(
                  "flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all font-bold text-sm",
                  paymentType === 'cash' 
                    ? "border-indigo-600 bg-indigo-50 text-indigo-600" 
                    : "border-white bg-white text-gray-500 hover:border-gray-200 shadow-sm"
                )}
              >
                <CreditCard className="h-4 w-4" />
                Cash
              </button>
              <button
                onClick={() => setPaymentType('debt')}
                className={cn(
                  "flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all font-bold text-sm",
                  paymentType === 'debt' 
                    ? "border-rose-600 bg-rose-50 text-rose-600" 
                    : "border-white bg-white text-gray-500 hover:border-gray-200 shadow-sm"
                )}
              >
                <UserIcon className="h-4 w-4" />
                Utang
              </button>
            </div>
          </div>

          <AnimatePresence>
            {paymentType === 'debt' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Input 
                  label="Customer Name" 
                  placeholder="Who is borrowing?" 
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="bg-white"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
            <span className="text-gray-500 font-bold">Total Amount</span>
            <span className="text-3xl font-black text-indigo-600">{formatCurrency(totalAmount)}</span>
          </div>

          <Button 
            className="w-full h-14 text-lg shadow-xl shadow-indigo-100" 
            disabled={cart.length === 0 || (paymentType === 'debt' && !customerName)}
            onClick={handleCheckout}
            isLoading={isLoading}
          >
            Complete Transaction
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
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6" />
              <span className="font-bold">Transaction recorded!</span>
            </div>
            <button 
              onClick={() => setShowReceipt(true)}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
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
        <div className="space-y-6">
          <div className="bg-gray-100 p-4 rounded-3xl overflow-hidden">
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

          <div className="flex gap-3 no-print">
            <Button variant="secondary" className="flex-1" onClick={() => setShowReceipt(false)}>
              Close
            </Button>
            <Button className="flex-1" onClick={() => window.print()}>
              <Printer className="mr-2 h-5 w-5" />
              Print Receipt
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
