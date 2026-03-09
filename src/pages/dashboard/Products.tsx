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
  X as CloseIcon
} from 'lucide-react';
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

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.barcode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Products</h2>
          <p className="text-gray-500">Manage your store products and images</p>
        </div>
        <Button onClick={() => { setEditingProduct(null); reset(); setIsModalOpen(true); }} className="h-12 px-6">
          <Plus className="mr-2 h-5 w-5" />
          Add New Product
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, barcode, or category..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-100 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <div key={product.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition-all">
            <div className="aspect-square bg-gray-50 relative overflow-hidden">
              {product.imageUrl ? (
                <img 
                  src={product.imageUrl} 
                  alt={product.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <Package className="h-12 w-12" />
                </div>
              )}
              <div className="absolute top-3 right-3 flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => handleEdit(product)} className="h-9 w-9 p-0 rounded-xl bg-white shadow-sm border border-gray-100 hover:bg-indigo-50">
                  <Edit2 className="h-4 w-4 text-indigo-600" />
                </Button>
                <Button variant="secondary" size="sm" onClick={() => handleDeleteClick(product)} className="h-9 w-9 p-0 rounded-xl bg-white shadow-sm border border-gray-100 hover:bg-red-50">
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </div>
            <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-gray-900 line-clamp-1">{product.name}</h3>
                  <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">{product.category}</span>
                </div>
                <span className="font-bold text-gray-900">{formatCurrency(product.price)}</span>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-sm font-bold",
                    product.stock <= 5 ? "text-red-600" : "text-gray-500"
                  )}>
                    Stock: {product.stock}
                  </span>
                  {product.stock <= 5 && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                </div>
                <span className={cn(
                  "text-xs font-bold px-2 py-1 rounded-lg",
                  product.stock > 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                )}>
                  {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="p-12 text-center bg-white rounded-3xl border border-gray-100">
          <div className="inline-flex items-center justify-center p-4 bg-gray-50 rounded-full mb-4">
            <Search className="h-8 w-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No products found</h3>
          <p className="text-gray-500">Try adjusting your search or add a new product.</p>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingProduct(null); reset(); }}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Product Name" {...register('name')} error={errors.name?.message} />
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Product Image</label>
            <div className="flex flex-col gap-4">
              {imageUrl ? (
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 group">
                  <img 
                    src={imageUrl} 
                    alt="Preview" 
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                  <button
                    type="button"
                    onClick={() => setValue('imageUrl', '')}
                    className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <CloseIcon className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full aspect-video rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-indigo-300 transition-all cursor-pointer">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500 font-medium">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-400">PNG, JPG or WEBP (MAX. 5MB)</p>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
              )}
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-100"></span>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-400">Or use URL</span>
                </div>
              </div>

              <Input 
                {...register('imageUrl')} 
                error={errors.imageUrl?.message} 
                placeholder="https://example.com/image.jpg" 
              />
            </div>
          </div>

          <Input label="Barcode (Optional)" {...register('barcode')} error={errors.barcode?.message} />
          <Input label="Category" {...register('category')} error={errors.category?.message} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Price (PHP)" type="number" step="0.01" {...register('price')} error={errors.price?.message} />
            <Input label="Stock Quantity" type="number" {...register('stock')} error={errors.stock?.message} />
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="secondary" type="button" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" isLoading={isLoading || isUploading}>
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
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-red-50 rounded-2xl text-red-700">
            <div className="bg-red-100 p-2 rounded-xl">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold">Are you sure?</p>
              <p className="text-sm opacity-90">This action cannot be undone.</p>
            </div>
          </div>
          
          <p className="text-gray-600">
            You are about to delete <span className="font-bold text-gray-900">{productToDelete?.name}</span>. 
            This will permanently remove the product from your inventory.
          </p>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="secondary" className="flex-1 bg-red-600 text-white hover:bg-red-700 border-none" onClick={confirmDelete} isLoading={isLoading}>
              Delete Product
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
