import React from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingCart, 
  CreditCard,
  Receipt,
  Scan
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Button } from '../../components/ui/Button';
import { formatCurrency, cn } from '../../utils/helpers';
import { motion, AnimatePresence } from 'motion/react';

export const Sales = () => {
  const { products, fetchProducts, recordSale } = useStore();
  const [cart, setCart] = React.useState<any[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isProcessing, setIsProcessing] = React.useState(false);

  React.useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const addToCart = (product: any) => {
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
        const product = products.find(p => p.id === productId);
        const newQty = item.quantity + delta;
        if (newQty > 0 && (!product || newQty <= product.stock)) {
          return { ...item, quantity: newQty };
        }
      }
      return item;
    }));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    try {
      const items = cart.map(item => ({ id: item.id, quantity: item.quantity, price: item.price }));
      await recordSale(items, total);
      setCart([]);
      alert('Sale recorded successfully!');
    } catch (err) {
      alert('Failed to record sale');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.barcode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-160px)]">
      {/* Product Selection */}
      <div className="lg:col-span-2 flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-900">Point of Sale</h2>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-100 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <motion.button
                layout
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={product.stock <= 0}
                className="group relative bg-white p-4 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all text-left disabled:opacity-50 disabled:grayscale"
              >
                <div className="aspect-square bg-gray-50 rounded-2xl mb-3 flex items-center justify-center text-gray-300 group-hover:bg-indigo-50 group-hover:text-indigo-200 transition-colors">
                  <ShoppingCart className="h-10 w-10" />
                </div>
                <h4 className="font-bold text-gray-900 truncate">{product.name}</h4>
                <p className="text-sm text-gray-500 mb-2">{product.category}</p>
                <div className="flex items-center justify-between">
                  <span className="text-indigo-600 font-bold">{formatCurrency(product.price)}</span>
                  <span className={cn(
                    "text-xs font-bold px-2 py-0.5 rounded-full",
                    product.stock <= 5 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
                  )}>
                    {product.stock} left
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Cart / Checkout */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-indigo-600">
          <div className="flex items-center gap-3 text-white">
            <ShoppingCart className="h-6 w-6" />
            <h3 className="text-lg font-bold">Current Order</h3>
          </div>
          <span className="bg-white/20 text-white px-3 py-1 rounded-full text-xs font-bold">
            {cart.length} items
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <AnimatePresence initial={false}>
            {cart.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-4 p-3 rounded-2xl bg-gray-50/50 border border-gray-100"
              >
                <div className="flex-1 min-w-0">
                  <h5 className="font-bold text-gray-900 truncate">{item.name}</h5>
                  <p className="text-xs text-indigo-600 font-bold">{formatCurrency(item.price)}</p>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-100 p-1">
                  <button 
                    onClick={() => updateQuantity(item.id, -1)}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Minus className="h-4 w-4 text-gray-500" />
                  </button>
                  <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.id, 1)}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Plus className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
                <button 
                  onClick={() => removeFromCart(item.id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
              <div className="p-4 bg-gray-50 rounded-full">
                <ShoppingCart className="h-8 w-8 text-gray-300" />
              </div>
              <p className="text-gray-400 font-medium">Your cart is empty.<br/>Select products to start.</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Tax (0%)</span>
              <span>{formatCurrency(0)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-200">
              <span>Total</span>
              <span className="text-indigo-600">{formatCurrency(total)}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-12 border-gray-200 text-gray-600 hover:bg-white">
              <Receipt className="mr-2 h-5 w-5" />
              Receipt
            </Button>
            <Button 
              className="h-12 shadow-lg shadow-indigo-200" 
              disabled={cart.length === 0}
              isLoading={isProcessing}
              onClick={handleCheckout}
            >
              <CreditCard className="mr-2 h-5 w-5" />
              Checkout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
