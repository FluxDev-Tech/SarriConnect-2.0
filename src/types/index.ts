export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'staff';
}

export interface Product {
  id: number;
  name: string;
  barcode: string;
  category: string;
  price: number;
  stock: number;
  imageUrl?: string;
  createdAt: string;
}

export interface Sale {
  id: number;
  totalPrice: number;
  subtotal: number;
  discount: number;
  paymentType: 'cash' | 'debt';
  customerName?: string;
  createdAt: string;
  items?: string;
}

export interface DashboardStats {
  totalRevenue: number;
  cashRevenue: number;
  debtRevenue: number;
  totalProducts: number;
  totalSalesCount: number;
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
