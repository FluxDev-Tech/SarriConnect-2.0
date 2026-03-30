export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'staff';
}

export interface Product {
  id: number | string;
  name: string;
  barcode: string;
  category: string;
  price: number;
  stock: number;
  imageUrl?: string;
  createdAt: string;
}

export interface Sale {
  id: number | string;
  totalPrice: number;
  subtotal: number;
  discount: number;
  paymentType: 'cash' | 'debt';
  customerName?: string;
  customerAddress?: string;
  customerPhone?: string;
  isPaid?: boolean;
  receivedAmount?: number;
  change?: number;
  createdAt: string;
  items?: any; // Changed to any to handle both string and array
}

export interface DashboardStats {
  totalRevenue: number;
  cashRevenue: number;
  debtRevenue: number;
  totalProducts: number;
  totalSalesCount: number;
  totalDebts?: number;
  dailySales: { date: string; cash: number; debt: number }[];
  topProducts: { name: string; totalSold: number }[];
}

export interface ReceiptSettings {
  storeName: string;
  address: string;
  phone: string;
  footer: string;
  showLogo: boolean;
  showDate: boolean;
  showTime: boolean;
  logoUrl: string;
}
