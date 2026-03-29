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
  Trash2
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

  const [isUpdateModalOpen, setIsUpdateModalOpen] = React.useState(false);
  const [productToUpdate, setProductToUpdate] = React.useState<any>(null);
  const [newStock, setNewStock] = React.useState<string>('');

  React.useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDeleteClick = (product: any) => {
    setProductToDelete(product);
    setIsDeleteModalOpen(true);
  };

  const handleUpdateClick = (product: any) => {
    setProductToUpdate(product);
    setNewStock(product.stock.toString());
    setIsUpdateModalOpen(true);
  };

  const confirmDelete = async () => {
    if (productToDelete) {
      await deleteProduct(productToDelete.id);
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
    }
  };

  const confirmUpdate = async () => {
    if (productToUpdate && newStock !== '') {
      await useStore.getState().updateProduct(productToUpdate.id, { stock: parseInt(newStock) });
      setIsUpdateModalOpen(false);
      setProductToUpdate(null);
    }
  };

  const filteredProducts = (products || []).filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.barcode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockCount = (products || []).filter(p => p.stock <= 5).length;
  const outOfStockCount = (products || []).filter(p => p.stock === 0).length;

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl lg:text-4xl font-black text-slate-900">Inventory</h2>
          <p className="text-slate-500 font-medium mt-1 text-sm lg:text-base">Monitor and manage your stock levels</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="bg-amber-50 px-4 py-2 rounded-none border border-amber-100 flex items-center gap-2 shadow-sm">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span className="text-xs lg:text-sm font-bold text-amber-700">{lowStockCount} Low Stock</span>
          </div>
          <div className="bg-rose-50 px-4 py-2 rounded-none border border-rose-100 flex items-center gap-2 shadow-sm">
            <Package className="h-4 w-4 text-rose-500" />
            <span className="text-xs lg:text-sm font-bold text-rose-700">{outOfStockCount} Out of Stock</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search products to check stock..."
            className="w-full pl-12 pr-4 py-3 lg:py-4 rounded-none border border-slate-100 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-medium text-sm lg:text-base"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-none shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Product</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Stock Level</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} className="h-12 w-12 rounded-none object-cover border border-slate-100" alt="" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="h-12 w-12 rounded-none bg-slate-100 flex items-center justify-center text-slate-300">
                          <Package className="h-6 w-6" />
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{product.name}</span>
                        <span className="text-xs text-slate-400 font-medium">{product.barcode || 'No Barcode'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-none text-[10px] font-bold uppercase tracking-wider">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className={cn(
                      "text-xl font-black",
                      product.stock <= 0 ? "text-rose-600" : product.stock <= 5 ? "text-amber-600" : "text-slate-900"
                    )}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    {product.stock > 5 ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded-none">
                        Good
                      </span>
                    ) : product.stock > 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-black uppercase rounded-none">
                        Low Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-black uppercase rounded-none">
                        Out of Stock
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleUpdateClick(product)} 
                        className="p-2.5 bg-brand-50 text-brand-600 hover:bg-brand-600 hover:text-white rounded-none transition-all"
                        title="Update Stock"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(product)} 
                        className="p-2.5 bg-slate-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-none transition-all"
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

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredProducts.map((product) => (
          <div key={product.id} className="bento-card p-4 flex items-center gap-4 rounded-none">
            <div className="h-16 w-16 rounded-none bg-slate-100 flex items-center justify-center text-slate-300 overflow-hidden shrink-0">
              {product.imageUrl ? <img src={product.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <Package className="h-8 w-8" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-slate-900 truncate">{product.name}</h3>
                {product.stock > 5 ? (
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase rounded-none shrink-0">
                    Good
                  </span>
                ) : product.stock > 0 ? (
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[9px] font-black uppercase rounded-none shrink-0">
                    Low
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[9px] font-black uppercase rounded-none shrink-0">
                    Out
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 font-medium mb-2">{product.barcode || 'No barcode'}</p>
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-none text-[9px] font-bold uppercase tracking-wider">
                  {product.category}
                </span>
                <p className={cn(
                  "text-base font-black",
                  product.stock <= 0 ? "text-rose-600" : product.stock <= 5 ? "text-amber-600" : "text-slate-900"
                )}>Stock: {product.stock}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => handleUpdateClick(product)} 
                className="p-2 bg-brand-50 text-brand-600 rounded-none"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button 
                onClick={() => handleDeleteClick(product)} 
                className="p-2 bg-slate-50 text-rose-600 rounded-none"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setProductToDelete(null); }}
        title="Confirm Deletion"
      >
        <div className="space-y-8">
          <div className="flex items-center gap-6 p-6 bg-rose-50 rounded-none text-rose-700 border border-rose-100">
            <div className="bg-rose-100 p-3 rounded-none">
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
            <Button variant="secondary" className="flex-1 h-14 rounded-none font-bold" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="secondary" className="flex-1 h-14 rounded-none font-bold bg-rose-600 text-white hover:bg-rose-700 border-none shadow-xl shadow-rose-200/50" onClick={confirmDelete} isLoading={isLoading}>
              Delete Product
            </Button>
          </div>
        </div>
      </Modal>

      {/* Update Stock Modal */}
      <Modal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        title="Update Stock Level"
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-none border border-slate-100">
            <div className="h-16 w-16 rounded-none bg-white flex items-center justify-center text-slate-300 overflow-hidden border border-slate-100">
              {productToUpdate?.imageUrl ? <img src={productToUpdate.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <Package className="h-8 w-8" />}
            </div>
            <div>
              <h3 className="font-black text-slate-900">{productToUpdate?.name}</h3>
              <p className="text-xs text-slate-500 font-medium">Current Stock: <span className="font-black text-slate-900">{productToUpdate?.stock}</span></p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Stock Quantity</label>
            <Input
              type="number"
              value={newStock}
              onChange={(e) => setNewStock(e.target.value)}
              placeholder="Enter new stock amount..."
              className="h-14 rounded-none text-lg font-black"
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1 rounded-none h-12 font-bold" onClick={() => setIsUpdateModalOpen(false)}>Cancel</Button>
            <Button className="flex-1 rounded-none h-12 font-bold bg-brand-600 hover:bg-brand-700" onClick={confirmUpdate}>Update Stock</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
