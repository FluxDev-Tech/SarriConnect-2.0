import React from 'react';
import { 
  Scan, 
  History, 
  Settings, 
  Zap, 
  Package, 
  DollarSign, 
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../../store/useStore';
import { BarcodeScanner } from '../../components/dashboard/BarcodeScanner';
import { formatCurrency, cn } from '../../utils/helpers';
import { Product } from '../../types';
import { Button } from '../../components/ui/Button';

export const Scanner = () => {
  const { products, recordSale, fetchProducts } = useStore();
  const [isScanning, setIsScanning] = React.useState(true);
  const [scanHistory, setScanHistory] = React.useState<{ id: string, product: Product, timestamp: string, status: 'success' | 'error' }[]>([]);
  const [autoDeduct, setAutoDeduct] = React.useState(true);
  const [isConnected, setIsConnected] = React.useState(true);

  React.useEffect(() => {
    fetchProducts();
    // Simulate connection check
    const interval = setInterval(() => {
      setIsConnected(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchProducts]);

  const handleScan = (barcode: string) => {
    const product = (products || []).find(p => p.barcode === barcode);
    if (!product) {
      // Record failed scan
      setScanHistory(prev => [{ 
        id: Math.random().toString(36).substr(2, 9),
        product: { name: `Unknown Barcode: ${barcode}`, price: 0, stock: 0, category: 'Unknown' } as any, 
        timestamp: new Date().toLocaleTimeString(),
        status: 'error'
      }, ...prev].slice(0, 15));
      return;
    }

    if (!autoDeduct) {
      setScanHistory(prev => [{ 
        id: Math.random().toString(36).substr(2, 9),
        product, 
        timestamp: new Date().toLocaleTimeString(), 
        status: 'success' 
      }, ...prev].slice(0, 15));
    }
  };

  const handleQuickSale = async (product: Product) => {
    if (product.stock <= 0) {
      setScanHistory(prev => [{ 
        id: Math.random().toString(36).substr(2, 9),
        product, 
        timestamp: new Date().toLocaleTimeString(), 
        status: 'error' 
      }, ...prev].slice(0, 15));
      return;
    }
    
    const items = [{ id: product.id, quantity: 1, price: product.price }];
    try {
      await recordSale(items, product.price, product.price, 0, 'cash', 'Quick Scan Sale', undefined, undefined, product.price, 0);
      setScanHistory(prev => [{ 
        id: Math.random().toString(36).substr(2, 9),
        product, 
        timestamp: new Date().toLocaleTimeString(), 
        status: 'success' 
      }, ...prev].slice(0, 15));
    } catch (error) {
      console.error('Quick sale failed:', error);
      setScanHistory(prev => [{ 
        id: Math.random().toString(36).substr(2, 9),
        product, 
        timestamp: new Date().toLocaleTimeString(), 
        status: 'error' 
      }, ...prev].slice(0, 15));
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-none border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-brand-600 p-3 rounded-none shadow-lg shadow-brand-100">
            <Scan className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Barcode Scanner</h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Scan products to add or view</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-none border border-slate-100">
          <button 
            onClick={() => setAutoDeduct(true)}
            className={cn(
              "px-4 py-2 rounded-none text-[10px] font-black transition-all tracking-widest",
              autoDeduct ? "bg-white text-brand-600 shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"
            )}
          >
            AUTO-DEDUCT
          </button>
          <button 
            onClick={() => setAutoDeduct(false)}
            className={cn(
              "px-4 py-2 rounded-none text-[10px] font-black transition-all tracking-widest",
              !autoDeduct ? "bg-white text-brand-600 shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"
            )}
          >
            VIEW ONLY
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Main Scanner Section */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bento-card p-4 lg:p-8 bg-white border border-slate-100 min-h-[400px] flex flex-col items-center justify-center">
            <div className="w-full max-w-2xl mx-auto">
              <BarcodeScanner 
                onScan={handleScan}
                products={products}
                onQuickSale={autoDeduct ? handleQuickSale : undefined}
                isModal={false}
              />
            </div>
          </div>

          {/* Simple Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Scans', value: scanHistory.length, icon: Scan },
              { label: 'Success Rate', value: scanHistory.length > 0 ? `${Math.round((scanHistory.filter(h => h.status === 'success').length / scanHistory.length) * 100)}%` : '100%', icon: CheckCircle2 },
              { label: 'Mode', value: autoDeduct ? 'Sale' : 'View', icon: Zap },
              { label: 'Status', value: 'Ready', icon: Settings }
            ].map((stat, i) => (
              <div key={i} className="bg-white p-4 rounded-none border border-slate-100">
                <div className="flex items-center gap-2 mb-1">
                  <stat.icon className="h-3 w-3 text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</span>
                </div>
                <p className="text-lg font-black text-slate-900">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Log */}
        <div className="lg:col-span-4 flex flex-col h-full min-h-[400px]">
          <div className="bg-white p-6 rounded-none border border-slate-100 flex-1 flex flex-col shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Recent Scans</h3>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Live scan history</p>
              </div>
              <History className="h-5 w-5 text-slate-300" />
            </div>
            
            <div className="flex-1 space-y-3 overflow-y-auto pr-2 -mr-2 custom-scrollbar">
              <AnimatePresence initial={false}>
                {(scanHistory || []).length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-30 py-10">
                    <Scan className="h-8 w-8 text-slate-400" />
                    <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">No scans yet</p>
                  </div>
                ) : (
                  (scanHistory || []).map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "p-3 rounded-none border flex items-center gap-3 transition-all",
                        item.status === 'success' 
                          ? "bg-slate-50 border-slate-100" 
                          : "bg-rose-50 border-rose-100"
                      )}
                    >
                      <div className={cn(
                        "p-1.5 rounded-none",
                        item.status === 'success' ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                      )}>
                        {item.status === 'success' ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <AlertCircle className="h-3.5 w-3.5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{item.product.name}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{item.timestamp}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-brand-600">{formatCurrency(item.product.price)}</p>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
