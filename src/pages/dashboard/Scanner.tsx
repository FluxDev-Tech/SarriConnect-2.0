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
  const [isScanning, setIsScanning] = React.useState(false);
  const [scanHistory, setScanHistory] = React.useState<{ product: Product, timestamp: string }[]>([]);
  const [autoDeduct, setAutoDeduct] = React.useState(true);

  React.useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleScan = (barcode: string) => {
    // If not auto-deducting, we still want to record the scan in history
    if (!autoDeduct) {
      const product = (products || []).find(p => p.barcode === barcode);
      if (product) {
        setScanHistory(prev => [{ product, timestamp: new Date().toLocaleTimeString() }, ...prev].slice(0, 10));
      }
    }
  };

  const handleQuickSale = async (product: Product) => {
    if (product.stock <= 0) return;
    
    const items = [{ id: product.id, quantity: 1, price: product.price }];
    try {
      await recordSale(items, product.price, product.price, 0, 'cash', 'Quick Scan Sale');
      setScanHistory(prev => [{ product, timestamp: new Date().toLocaleTimeString() }, ...prev].slice(0, 10));
    } catch (error) {
      console.error('Quick sale failed:', error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Smart Scanner</h2>
          <p className="text-slate-500 font-medium mt-1">Dedicated barcode scanning terminal</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
            <div className={cn(
              "w-12 h-6 rounded-full p-1 transition-colors cursor-pointer",
              autoDeduct ? "bg-brand-600" : "bg-slate-300"
            )} onClick={() => setAutoDeduct(!autoDeduct)}>
              <div className={cn(
                "w-4 h-4 bg-white rounded-full transition-transform shadow-sm",
                autoDeduct ? "translate-x-6" : "translate-x-0"
              )} />
            </div>
            <span className="text-sm font-bold text-slate-700 pr-2">Auto-Deduct</span>
          </div>
          <Button 
            onClick={() => setIsScanning(true)}
            className="h-14 px-8 rounded-2xl bg-brand-600 text-white font-bold shadow-xl shadow-brand-200 flex items-center gap-3"
          >
            <Scan className="h-6 w-6" />
            Start Scanning
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Scanner Area */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bento-card p-12 flex flex-col items-center justify-center text-center min-h-[500px] bg-gradient-to-br from-white to-slate-50">
            {!isScanning ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md space-y-8"
              >
                <div className="relative mx-auto w-32 h-32">
                  <div className="absolute inset-0 bg-brand-100 rounded-[2.5rem] animate-pulse" />
                  <div className="absolute inset-4 bg-brand-600 rounded-3xl flex items-center justify-center shadow-xl shadow-brand-200">
                    <Scan className="h-12 w-12 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-900">Ready to Scan</h3>
                  <p className="text-slate-500 font-medium mt-4 leading-relaxed">
                    Use your device camera to scan product barcodes. 
                    {autoDeduct ? " Items will be automatically deducted from stock." : " View product details and stock levels instantly."}
                  </p>
                </div>
                <Button 
                  onClick={() => setIsScanning(true)}
                  className="w-full h-16 rounded-3xl bg-brand-600 text-white text-lg font-bold shadow-2xl shadow-brand-200"
                >
                  Open Camera Scanner
                </Button>
              </motion.div>
            ) : (
              <div className="w-full max-w-2xl">
                <BarcodeScanner 
                  onScan={handleScan}
                  onClose={() => setIsScanning(false)}
                  products={products}
                  onQuickSale={autoDeduct ? handleQuickSale : undefined}
                />
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bento-card p-6 bg-white">
              <div className="flex items-center gap-4">
                <div className="bg-emerald-50 p-3 rounded-2xl">
                  <Zap className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Scans Today</p>
                  <p className="text-2xl font-black text-slate-900">{scanHistory.length}</p>
                </div>
              </div>
            </div>
            <div className="bento-card p-6 bg-white">
              <div className="flex items-center gap-4">
                <div className="bg-brand-50 p-3 rounded-2xl">
                  <Package className="h-6 w-6 text-brand-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Auto-Deduct</p>
                  <p className="text-2xl font-black text-slate-900">{autoDeduct ? 'ON' : 'OFF'}</p>
                </div>
              </div>
            </div>
            <div className="bento-card p-6 bg-white">
              <div className="flex items-center gap-4">
                <div className="bg-amber-50 p-3 rounded-2xl">
                  <History className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mode</p>
                  <p className="text-2xl font-black text-slate-900">Retail</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scan History Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bento-card p-8 h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-slate-900">Recent Scans</h3>
              <History className="h-5 w-5 text-slate-400" />
            </div>
            
            <div className="flex-1 space-y-4 overflow-y-auto pr-2 -mr-2">
              <AnimatePresence initial={false}>
                {(scanHistory || []).length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
                    <div className="bg-slate-50 p-4 rounded-full">
                      <Scan className="h-8 w-8 text-slate-300" />
                    </div>
                    <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">No recent scans</p>
                  </div>
                ) : (
                  (scanHistory || []).map((item, index) => (
                    <motion.div
                      key={`${item.product.id}-${item.timestamp}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4 group hover:bg-white hover:shadow-md transition-all"
                    >
                      <div className="bg-white p-2 rounded-xl shadow-sm group-hover:bg-brand-50 transition-colors">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{item.product.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.timestamp}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-brand-600">{formatCurrency(item.product.price)}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stock: {item.product.stock}</p>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="bg-brand-50 p-4 rounded-2xl flex items-center gap-4">
                <div className="bg-brand-600 p-2 rounded-xl">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <p className="text-[10px] font-bold text-brand-700 uppercase tracking-widest leading-tight">
                  Scanning is optimized for EAN-13 and UPC barcodes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
