import { create } from 'zustand';
import { User, Product, DashboardStats, ReceiptSettings } from '../types';
import api from '../services/api';

interface AppState {
  user: User | null;
  token: string | null;
  products: Product[];
  stats: DashboardStats | null;
  receiptSettings: ReceiptSettings | null;
  isLoading: boolean;
  error: string | null;

  setAuth: (user: User, token: string) => void;
  logout: () => void;
  fetchProducts: () => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchReceiptSettings: () => Promise<void>;
  updateReceiptSettings: (settings: ReceiptSettings) => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => Promise<void>;
  updateProduct: (id: number, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
  recordSale: (items: { id: number; quantity: number; price: number }[], totalPrice: number, subtotal: number, discount: number, paymentType?: 'cash' | 'debt', customerName?: string) => Promise<void>;
  markAsPaid: (saleId: number) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token'),
  products: [],
  stats: null,
  receiptSettings: null,
  isLoading: false,
  error: null,

  setAuth: (user, token) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  fetchProducts: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/products');
      set({ products: Array.isArray(res.data) ? res.data : [], isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false, products: [] });
    }
  },

  fetchStats: async () => {
    try {
      const res = await api.get('/sales/stats');
      set({ stats: res.data });
    } catch (err: any) {
      console.error(err);
    }
  },

  fetchReceiptSettings: async () => {
    try {
      const res = await api.get('/settings/receipt');
      set({ receiptSettings: res.data });
    } catch (err: any) {
      console.error(err);
    }
  },

  updateReceiptSettings: async (settings) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/settings/receipt', settings);
      set({ receiptSettings: res.data.value, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  addProduct: async (product) => {
    await api.post('/products', product);
    get().fetchProducts();
  },

  updateProduct: async (id, product) => {
    await api.put(`/products/${id}`, product);
    get().fetchProducts();
  },

  deleteProduct: async (id) => {
    await api.delete(`/products/${id}`);
    get().fetchProducts();
  },

  recordSale: async (items, totalPrice, subtotal, discount, paymentType = 'cash', customerName) => {
    await api.post('/sales', { items, totalPrice, subtotal, discount, paymentType, customerName });
    get().fetchProducts();
    get().fetchStats();
  },

  markAsPaid: async (saleId) => {
    await api.put(`/sales/${saleId}/pay`);
    get().fetchStats();
  },
}));
