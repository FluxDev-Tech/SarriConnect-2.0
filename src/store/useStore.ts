import { create } from 'zustand';
import { User, Product, DashboardStats, ReceiptSettings, Sale } from '../types';
import api from '../services/api';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

interface AppState {
  user: User | null;
  token: string | null;
  products: Product[];
  stats: DashboardStats | null;
  receiptSettings: ReceiptSettings | null;
  isLoading: boolean;
  error: string | null;

  setAuth: (user: User, token: string) => void;
  logout: () => Promise<void>;
  fetchProducts: () => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchReceiptSettings: () => Promise<void>;
  updateReceiptSettings: (settings: ReceiptSettings) => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => Promise<void>;
  updateProduct: (id: number | string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: number | string) => Promise<void>;
  fetchSales: (type?: 'cash' | 'debt', period?: string) => Promise<Sale[]>;
  recordSale: (items: { id: number | string; quantity: number; price: number; name: string }[], totalPrice: number, subtotal: number, discount: number, paymentType?: 'cash' | 'debt', customerName?: string, customerAddress?: string, customerPhone?: string, receivedAmount?: number, change?: number) => Promise<void>;
  markAsPaid: (saleId: string) => Promise<void>;
  deleteSale: (saleId: string) => Promise<void>;
  resetApp: () => Promise<void>;
  initializeAuth: () => void;
}

const getInitialToken = () => {
  const token = localStorage.getItem('token');
  if (token === 'undefined' || token === 'null') return null;
  return token;
};

export const useStore = create<AppState>((set, get) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: getInitialToken(),
  products: [],
  stats: null,
  receiptSettings: null,
  isLoading: false,
  error: null,

  setAuth: (user, token) => {
    if (!token || token === 'undefined' || token === 'null') {
      console.error('Invalid token received');
      return;
    }
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    set({ user, token });
  },

  logout: async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Sign out error:", err);
    }
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  initializeAuth: () => {
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        const userData = userDoc.exists() ? userDoc.data() : null;
        
        const user: User = {
          id: firebaseUser.uid as any,
          name: firebaseUser.displayName || userData?.name || 'User',
          email: firebaseUser.email || '',
          role: userData?.role || 'staff'
        };
        const token = await firebaseUser.getIdToken();
        get().setAuth(user, token);
      } else {
        set({ user: null, token: null });
      }
    });
  },

  fetchProducts: async () => {
    set({ isLoading: true });
    try {
      const q = query(collection(db, 'products'), where('isDeleted', '==', false), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const products = querySnapshot.docs.map(doc => ({
        id: doc.id as any,
        ...doc.data()
      })) as Product[];
      set({ products, isLoading: false });
    } catch (err: any) {
      console.error("Fetch products error:", err);
      // Fallback to API if Firestore fails (optional, but good for migration)
      try {
        const res = await api.get('/products');
        set({ products: Array.isArray(res.data) ? res.data : [], isLoading: false });
      } catch (apiErr: any) {
        set({ error: apiErr.message, isLoading: false, products: [] });
      }
    }
  },

  fetchStats: async () => {
    try {
      // For stats, we'll aggregate from Firestore
      const salesSnap = await getDocs(collection(db, 'sales'));
      const sales = salesSnap.docs.map(doc => ({
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date()
      }));
      
      const totalRevenue = sales.reduce((acc, sale: any) => acc + (sale.totalPrice || 0), 0);
      const cashRevenue = sales.filter((s: any) => s.paymentType === 'cash').reduce((acc, s: any) => acc + (s.totalPrice || 0), 0);
      const debtRevenue = sales.filter((s: any) => s.paymentType === 'debt').reduce((acc, s: any) => acc + (s.totalPrice || 0), 0);
      const totalDebts = sales.filter((s: any) => s.paymentType === 'debt' && !s.isPaid).reduce((acc, s: any) => acc + (s.totalPrice || 0), 0);
      
      // Aggregate daily sales for the last 7 days
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
      }).reverse();

      const dailySales = last7Days.map(date => {
        const daySales = sales.filter((s: any) => s.createdAt.toISOString().split('T')[0] === date);
        return {
          date: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          cash: daySales.filter((s: any) => s.paymentType === 'cash').reduce((acc, s: any) => acc + (s.totalPrice || 0), 0),
          debt: daySales.filter((s: any) => s.paymentType === 'debt').reduce((acc, s: any) => acc + (s.totalPrice || 0), 0)
        };
      });

      const productsSnap = await getDocs(query(collection(db, 'products'), where('isDeleted', '==', false)));
      
      set({ 
        stats: {
          totalRevenue,
          cashRevenue,
          debtRevenue,
          totalDebts,
          totalProducts: productsSnap.size,
          totalSalesCount: salesSnap.size,
          dailySales,
          topProducts: [] // Simplified for now
        }
      });
    } catch (err: any) {
      console.error("Fetch stats error:", err);
    }
  },

  fetchReceiptSettings: async () => {
    try {
      const docSnap = await getDoc(doc(db, 'settings', 'receipt'));
      if (docSnap.exists()) {
        set({ receiptSettings: docSnap.data().value });
      } else {
        // Default settings
        const defaultSettings = {
          storeName: "SariConnect Store",
          address: "123 Sari-Sari St, Manila",
          phone: "0912-345-6789",
          footer: "Thank you for shopping with us!",
          showLogo: true,
          showDate: true,
          showTime: true,
          logoUrl: "https://picsum.photos/seed/store/200/200"
        };
        set({ receiptSettings: defaultSettings });
      }
    } catch (err: any) {
      console.error("Fetch settings error:", err);
    }
  },

  updateReceiptSettings: async (settings) => {
    set({ isLoading: true });
    try {
      await setDoc(doc(db, 'settings', 'receipt'), { key: 'receipt', value: settings });
      set({ receiptSettings: settings, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  addProduct: async (product) => {
    try {
      await addDoc(collection(db, 'products'), {
        ...product,
        isDeleted: false,
        createdAt: serverTimestamp()
      });
      get().fetchProducts();
    } catch (err) {
      console.error("Add product error:", err);
    }
  },

  updateProduct: async (id, product) => {
    try {
      const productRef = doc(db, 'products', id.toString());
      await updateDoc(productRef, product);
      get().fetchProducts();
    } catch (err) {
      console.error("Update product error:", err);
    }
  },

  deleteProduct: async (id) => {
    try {
      const productRef = doc(db, 'products', id.toString());
      // Soft delete
      await updateDoc(productRef, { isDeleted: true });
      get().fetchProducts();
    } catch (err) {
      console.error("Delete product error:", err);
    }
  },

  fetchSales: async (type, period) => {
    try {
      let q = query(collection(db, 'sales'), orderBy('createdAt', 'desc'));
      
      if (type) {
        q = query(q, where('paymentType', '==', type));
      }

      // Period filtering (simplified for Firestore)
      const now = new Date();
      let startDate: Date | null = null;

      if (period === 'today') {
        startDate = new Date(now.setHours(0, 0, 0, 0));
      } else if (period === 'week') {
        startDate = new Date(now.setDate(now.getDate() - 7));
      } else if (period === 'month') {
        startDate = new Date(now.setMonth(now.getMonth() - 1));
      } else if (period === 'year') {
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
      }

      if (startDate) {
        q = query(q, where('createdAt', '>=', Timestamp.fromDate(startDate)));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString()
      })) as Sale[];
    } catch (err) {
      console.error("Fetch sales error:", err);
      return [];
    }
  },

  recordSale: async (items, totalPrice, subtotal, discount, paymentType = 'cash', customerName, customerAddress, customerPhone, receivedAmount, change) => {
    try {
      const saleData = {
        items: items.map(item => ({
          productId: item.id,
          name: item.name,
          quantity: item.quantity,
          priceAtSale: item.price
        })),
        totalPrice,
        subtotal,
        discount,
        paymentType,
        customerName: customerName || null,
        customerAddress: customerAddress || null,
        customerPhone: customerPhone || null,
        receivedAmount: receivedAmount || 0,
        change: change || 0,
        isPaid: paymentType === 'cash',
        createdAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'sales'), saleData);
      
      // Update stock for each item
      for (const item of items) {
        const productRef = doc(db, 'products', item.id.toString());
        const productSnap = await getDoc(productRef);
        if (productSnap.exists()) {
          const currentStock = productSnap.data().stock || 0;
          await updateDoc(productRef, { stock: Math.max(0, currentStock - item.quantity) });
        }
      }
      
      get().fetchProducts();
      get().fetchStats();
    } catch (err) {
      console.error("Record sale error:", err);
    }
  },

  markAsPaid: async (saleId) => {
    try {
      const saleRef = doc(db, 'sales', saleId);
      await updateDoc(saleRef, { isPaid: true });
      get().fetchStats();
    } catch (err) {
      console.error("Mark as paid error:", err);
    }
  },

  deleteSale: async (saleId) => {
    try {
      await deleteDoc(doc(db, 'sales', saleId));
      get().fetchStats();
    } catch (err) {
      console.error("Delete sale error:", err);
    }
  },

  resetApp: async () => {
    // This is dangerous in Firestore, but for this app we'll just clear collections if needed
    // For now, we'll just call the API reset as well
    try {
      await api.post('/reset');
      get().fetchProducts();
      get().fetchStats();
      get().fetchReceiptSettings();
    } catch (err) {
      console.error("Reset app error:", err);
    }
  },
}));
