import React from 'react';
import { 
  Search, 
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Package,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Edit2
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { formatCurrency, cn } from '../../utils/helpers';
import { useNavigate } from 'react-router-dom';

export const Inventory = () => {
  const navigate = useNavigate();
  const { products, fetchProducts, deleteProduct, isLoading } = useStore();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [productToDelete, setProductToDelete] = React.useState<any>(null);

  React.useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDeleteClick = (product: any) => {
    setProductToDelete(product);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (productToDelete) {
      await deleteProduct(productToDelete.id);
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
    }
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
                <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider text-center">Stock Level</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider text-right">Status</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider text-right">Actions</th>
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
                      "text-lg font-black",
                      product.stock <= 0 ? "text-rose-600" : product.stock <= 5 ? "text-amber-600" : "text-slate-900"
                    )}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {product.stock > 5 ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold uppercase rounded-full">
                        Good
                      </span>
                    ) : product.stock > 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 text-xs font-bold uppercase rounded-full">
                        Low Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 text-xs font-bold uppercase rounded-full">
                        Out of Stock
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => navigate('/products')} 
                        className="p-2 hover:bg-brand-50 hover:text-brand-600 rounded-lg transition-colors"
                        title="Edit in Products"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(product)} 
                        className="p-2 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors"
                        title="Delete Product"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setProductToDelete(null); }}
        title="Confirm Deletion"
      >
        <div className="space-y-8">
          <div className="flex items-center gap-6 p-6 bg-rose-50 rounded-[2rem] text-rose-700 border border-rose-100">
            <div className="bg-rose-100 p-3 rounded-2xl">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <div>
              <p className="text-xl font-black leading-none">Are you sure?</p>
              <p className="text-sm font-medium mt-1 opacity-80 uppercase tracking-wider">This action cannot be undone.</p>
            </div>
          </div>
          
          <p className="text-slate-600 font-medium px-2">
            You are about to delete <span className="font-black text-slate-900 underline decoration-rose-500 decoration-2 underline-offset-4">{productToDelete?.name}</span>. 
            This will permanently remove the product from your inventory.
          </p>

          <div className="flex gap-4 pt-2">
            <Button variant="secondary" className="flex-1 h-14 rounded-2xl font-bold" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="secondary" className="flex-1 h-14 rounded-2xl font-bold bg-rose-600 text-white hover:bg-rose-700 border-none shadow-xl shadow-rose-200/50" onClick={confirmDelete} isLoading={isLoading}>
              Delete Product
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
