import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  AlertTriangle,
  Filter,
  Package,
  Upload,
  LayoutGrid,
  List,
  X as CloseIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../../store/useStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { formatCurrency, cn } from '../../utils/helpers';

const productSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  barcode: z.string().default(''),
  category: z.string().min(2, 'Category is required'),
  price: z.coerce.number().min(0.01, 'Price must be greater than 0'),
  stock: z.coerce.number().min(0, 'Stock cannot be negative'),
  imageUrl: z.string().url('Invalid image URL').or(z.string().length(0)).optional(),
});

type ProductForm = z.infer<typeof productSchema>;

export const Products = () => {
  const { products, fetchProducts, addProduct, updateProduct, deleteProduct, isLoading } = useStore();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<any>(null);
  const [productToDelete, setProductToDelete] = React.useState<any>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isUploading, setIsUploading] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
  const [categoryFilter, setCategoryFilter] = React.useState('All');

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<any>({
    resolver: zodResolver(productSchema),
  });

  const imageUrl = watch('imageUrl');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File is too large. Max size is 5MB.');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setValue('imageUrl', reader.result as string);
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  React.useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const categories = ['All', ...new Set(products.map(p => p.category))];

  const onSubmit = async (data: ProductForm) => {
    if (editingProduct) {
      await updateProduct(editingProduct.id, data);
    } else {
      await addProduct(data);
    }
    setIsModalOpen(false);
    setEditingProduct(null);
    reset();
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setValue('name', product.name);
    setValue('barcode', product.barcode || '');
    setValue('category', product.category);
    setValue('price', product.price);
    setValue('stock', product.stock);
    setValue('imageUrl', product.imageUrl || '');
    setIsModalOpen(true);
  };

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

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.barcode?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900">Products</h2>
          <p className="text-slate-500 font-medium mt-1">Manage your store products and stock levels</p>
        </div>
        <Button 
          onClick={() => { setEditingProduct(null); reset(); setIsModalOpen(true); }} 
          className="h-14 px-8 rounded-2xl bg-brand-600 hover:bg-brand-700 shadow-xl shadow-brand-200/50 text-base font-bold"
        >
          <Plus className="mr-3 h-5 w-5" />
          Add New Product
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search products..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-100 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={cn(
                  "px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                  categoryFilter === cat ? "bg-brand-600 text-white shadow-lg shadow-brand-100" : "text-slate-500 hover:bg-slate-50"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
          <button 
            onClick={() => setViewMode('grid')}
            className={cn("p-2.5 rounded-xl transition-all", viewMode === 'grid' ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:text-slate-600")}
          >
            <LayoutGrid className="h-5 w-5" />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={cn("p-2.5 rounded-xl transition-all", viewMode === 'list' ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:text-slate-600")}
          >
            <List className="h-5 w-5" />
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product) => (
              <motion.div
                layout
                key={product.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bento-card group overflow-hidden flex flex-col"
              >
                <div className="aspect-video bg-slate-50 relative overflow-hidden">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-200">
                      <Package className="h-16 w-16" />
                    </div>
                  )}
                  <div className="absolute top-4 right-4 flex flex-col gap-2 translate-x-0 transition-all duration-300">
                    <button 
                      onClick={() => handleEdit(product)}
                      className="p-2.5 bg-white/90 backdrop-blur-md text-slate-600 rounded-xl shadow-xl hover:bg-brand-600 hover:text-white transition-all border border-white/20"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteClick(product)}
                      className="p-2.5 bg-white/90 backdrop-blur-md text-rose-600 rounded-xl shadow-xl hover:bg-rose-600 hover:text-white transition-all border border-white/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="absolute bottom-4 left-4">
                    <span className="px-3 py-1 rounded-lg bg-white/90 backdrop-blur-md text-[10px] font-black text-slate-900 uppercase tracking-widest shadow-sm">
                      {product.category}
                    </span>
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">{product.name}</h3>
                  <p className="text-xs text-slate-400 font-medium mb-4">{product.barcode || 'No barcode'}</p>
                  <div className="mt-auto flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Price</p>
                      <p className="text-xl font-black text-brand-600">{formatCurrency(product.price)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Stock</p>
                      <p className={cn(
                        "text-lg font-black",
                        product.stock <= 5 ? "text-rose-600" : "text-slate-900"
                      )}>{product.stock}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="bento-card overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Product</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Price</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Stock</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-300 overflow-hidden">
                        {product.imageUrl ? <img src={product.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <Package className="h-6 w-6" />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{product.name}</p>
                        <p className="text-xs text-slate-400 font-medium">{product.barcode || 'No barcode'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-3 py-1 rounded-lg bg-slate-100 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right font-black text-brand-600">
                    {formatCurrency(product.price)}
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className={cn(
                      "font-black text-lg",
                      product.stock <= 5 ? "text-rose-600" : "text-slate-900"
                    )}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2 transition-opacity">
                      <button 
                        onClick={() => handleEdit(product)} 
                        className="p-2.5 bg-slate-50 text-slate-600 hover:bg-brand-600 hover:text-white rounded-xl transition-all"
                        title="Edit Product"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(product)} 
                        className="p-2.5 bg-slate-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all"
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
      )}

      {filteredProducts.length === 0 && (
        <div className="p-20 text-center bento-card border-dashed">
          <div className="inline-flex items-center justify-center p-6 bg-slate-50 rounded-[2.5rem] mb-6">
            <Search className="h-10 w-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">No products found</h3>
          <p className="text-slate-500 font-medium">Try adjusting your search or add a new product.</p>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingProduct(null); reset(); }}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input label="Product Name" {...register('name')} error={errors.name?.message} className="rounded-2xl h-12" />
          
          <div className="space-y-3">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Product Image</label>
            <div className="flex flex-col gap-4">
              {imageUrl ? (
                <div className="relative w-full aspect-video rounded-[2rem] overflow-hidden border border-slate-100 bg-slate-50 group">
                  <img 
                    src={imageUrl} 
                    alt="Preview" 
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                  <button
                    type="button"
                    onClick={() => setValue('imageUrl', '')}
                    className="absolute top-4 right-4 p-2 bg-rose-600 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <CloseIcon className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full aspect-video rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-brand-50 hover:border-brand-300 transition-all cursor-pointer group">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <div className="bg-white p-4 rounded-2xl shadow-sm mb-4 group-hover:scale-110 transition-transform">
                      <Upload className="w-8 h-8 text-slate-400 group-hover:text-brand-600" />
                    </div>
                    <p className="mb-2 text-sm text-slate-900 font-bold">Click to upload or drag and drop</p>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">PNG, JPG or WEBP (MAX. 5MB)</p>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
              )}
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-100"></span>
                </div>
                <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
                  <span className="bg-white px-4 text-slate-400">Or use URL</span>
                </div>
              </div>

              <Input 
                {...register('imageUrl')} 
                error={errors.imageUrl?.message} 
                placeholder="https://example.com/image.jpg" 
                className="rounded-2xl h-12"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Barcode (Optional)" {...register('barcode')} error={errors.barcode?.message} className="rounded-2xl h-12" />
            <Input label="Category" {...register('category')} error={errors.category?.message} className="rounded-2xl h-12" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Price (PHP)" type="number" step="0.01" {...register('price')} error={errors.price?.message} className="rounded-2xl h-12" />
            <Input label="Stock Quantity" type="number" {...register('stock')} error={errors.stock?.message} className="rounded-2xl h-12" />
          </div>
          <div className="flex gap-4 pt-4">
            <Button variant="secondary" type="button" className="flex-1 h-14 rounded-2xl font-bold" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1 h-14 rounded-2xl font-bold bg-brand-600 hover:bg-brand-700 shadow-xl shadow-brand-200/50" isLoading={isLoading || isUploading}>
              {editingProduct ? 'Update Product' : 'Add Product'}
            </Button>
          </div>
        </form>
      </Modal>

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
