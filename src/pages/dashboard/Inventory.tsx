import React from 'react';
import { 
  Search, 
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Package,
  ShoppingCart,
  Plus,
  Minus
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { formatCurrency, cn } from '../../utils/helpers';

export const Inventory = () => {
  const { products, fetchProducts, updateProduct, recordSale, isLoading } = useStore();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isSaleModalOpen, setIsSaleModalOpen] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState<any>(null);
  const [saleQuantity, setSaleQuantity] = React.useState(1);
  const [paymentType, setPaymentType] = React.useState<'cash' | 'debt'>('cash');
  const [customerName, setCustomerName] = React.useState('');

  React.useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleUpdateStock = async (id: number, currentStock: number, delta: number) => {
    const newStock = Math.max(0, currentStock + delta);
    await updateProduct(id, { stock: newStock });
  };

  const handleOpenSale = (product: any) => {
    setSelectedProduct(product);
    setSaleQuantity(1);
    setPaymentType('cash');
    setCustomerName('');
    setIsSaleModalOpen(true);
  };

  const handleRecordSale = async () => {
    if (!selectedProduct) return;
    
    const totalPrice = selectedProduct.price * saleQuantity;
    const items = [{ id: selectedProduct.id, quantity: saleQuantity, price: selectedProduct.price }];
    
    await recordSale(items, totalPrice, paymentType, customerName);
    setIsSaleModalOpen(false);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.barcode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockCount = products.filter(p => p.stock <= 5).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Inventory</h2>
          <p className="text-gray-500">Monitor and manage your stock levels</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-amber-50 px-4 py-2 rounded-2xl border border-amber-100 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-bold text-amber-700">{lowStockCount} Low Stock</span>
          </div>
          <div className="bg-red-50 px-4 py-2 rounded-2xl border border-red-100 flex items-center gap-2">
            <Package className="h-4 w-4 text-red-500" />
            <span className="text-sm font-bold text-red-700">{outOfStockCount} Out of Stock</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search products to check stock..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-100 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Product</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider text-center">Current Stock</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider text-right">Quick Adjust</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} className="h-10 w-10 rounded-lg object-cover border border-gray-100" alt="" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                          <Package className="h-5 w-5" />
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900">{product.name}</span>
                        <span className="text-xs text-gray-400 font-mono">{product.barcode || 'No Barcode'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold uppercase tracking-wide">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={cn(
                      "text-xl font-bold",
                      product.stock <= 5 ? "text-red-600" : "text-gray-900"
                    )}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {product.stock > 5 ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-600 text-xs font-bold uppercase">
                        Good
                      </span>
                    ) : product.stock > 0 ? (
                      <span className="inline-flex items-center gap-1.5 text-amber-600 text-xs font-bold uppercase">
                        Low Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-red-600 text-xs font-bold uppercase">
                        Out of Stock
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-9 px-3 rounded-xl text-indigo-600 hover:bg-indigo-50"
                        onClick={() => handleOpenSale(product)}
                        disabled={product.stock === 0 || isLoading}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Sell
                      </Button>
                      <div className="h-4 w-px bg-gray-100 mx-1" />
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="h-9 w-9 p-0 rounded-xl"
                        onClick={() => handleUpdateStock(product.id, product.stock, -1)}
                        disabled={product.stock === 0 || isLoading}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="h-9 w-9 p-0 rounded-xl"
                        onClick={() => handleUpdateStock(product.id, product.stock, 1)}
                        disabled={isLoading}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
        title="Record Sale"
      >
        {selectedProduct && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-indigo-50 rounded-2xl">
              <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center text-indigo-600 font-bold">
                {selectedProduct.name.charAt(0)}
              </div>
              <div>
                <h4 className="font-bold text-gray-900">{selectedProduct.name}</h4>
                <p className="text-sm text-gray-500">{formatCurrency(selectedProduct.price)} per unit</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Quantity</span>
                <div className="flex items-center gap-4">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="h-10 w-10 p-0 rounded-xl"
                    onClick={() => setSaleQuantity(Math.max(1, saleQuantity - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-lg font-bold w-8 text-center">{saleQuantity}</span>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="h-10 w-10 p-0 rounded-xl"
                    onClick={() => setSaleQuantity(Math.min(selectedProduct.stock, saleQuantity + 1))}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium text-gray-700">Payment Method</span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPaymentType('cash')}
                    className={cn(
                      "py-3 rounded-xl border-2 transition-all font-bold text-sm",
                      paymentType === 'cash' 
                        ? "border-indigo-600 bg-indigo-50 text-indigo-600" 
                        : "border-gray-100 text-gray-500 hover:border-gray-200"
                    )}
                  >
                    Cash
                  </button>
                  <button
                    onClick={() => setPaymentType('debt')}
                    className={cn(
                      "py-3 rounded-xl border-2 transition-all font-bold text-sm",
                      paymentType === 'debt' 
                        ? "border-rose-600 bg-rose-50 text-rose-600" 
                        : "border-gray-100 text-gray-500 hover:border-gray-200"
                    )}
                  >
                    Utang (Debt)
                  </button>
                </div>
              </div>

              {paymentType === 'debt' && (
                <Input 
                  label="Customer Name" 
                  placeholder="Who is borrowing?" 
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              )}

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-gray-500 font-medium">Total Amount</span>
                <span className="text-2xl font-bold text-indigo-600">
                  {formatCurrency(selectedProduct.price * saleQuantity)}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setIsSaleModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleRecordSale}
                isLoading={isLoading}
                disabled={paymentType === 'debt' && !customerName}
              >
                Confirm Sale
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
