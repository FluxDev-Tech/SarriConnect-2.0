import React from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Zap, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../../types';
import { formatCurrency } from '../../utils/helpers';

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
  products?: Product[];
  onQuickSale?: (product: Product) => Promise<void>;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose, products = [], onQuickSale }) => {
  const [lastScanned, setLastScanned] = React.useState<Product | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [autoDeduct, setAutoDeduct] = React.useState(true);

  React.useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'reader',
      { 
        fps: 20, 
        qrbox: { width: 280, height: 180 }, // Rectangular for barcodes
        aspectRatio: 1.0,
        formatsToSupport: [ 
          Html5QrcodeSupportedFormats.EAN_13, 
          Html5QrcodeSupportedFormats.EAN_8, 
          Html5QrcodeSupportedFormats.CODE_128, 
          Html5QrcodeSupportedFormats.UPC_A, 
          Html5QrcodeSupportedFormats.UPC_E 
        ]
      },
      /* verbose= */ false
    );

    const handleScanSuccess = async (decodedText: string) => {
      onScan(decodedText);
      
      const product = products.find(p => p.barcode === decodedText);
      if (product) {
        setLastScanned(product);
        setError(null);
        
        if (autoDeduct && onQuickSale) {
          setIsProcessing(true);
          try {
            await onQuickSale(product);
            // Success feedback
          } catch (err) {
            setError('Failed to record sale');
          } finally {
            setIsProcessing(false);
          }
        }
      } else {
        setError(`Product with barcode ${decodedText} not found`);
        setLastScanned(null);
      }
    };

    scanner.render(handleScanSuccess, () => {});

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [onScan, products, autoDeduct, onQuickSale]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden relative border border-white/20">
        {/* Header */}
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="bg-brand-600 p-3 rounded-2xl shadow-lg shadow-brand-200">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 leading-none">Smart Scanner</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1.5">Barcode Only Mode</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-4 hover:bg-white rounded-2xl transition-all text-slate-400 hover:text-rose-600 shadow-sm hover:shadow-md"
          >
            <X className="h-7 w-7" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* Scanner Viewport */}
          <div className="relative group">
            <div id="reader" className="overflow-hidden rounded-[2.5rem] border-8 border-slate-100 shadow-inner bg-black aspect-square md:aspect-video"></div>
            
            {/* Laser Animation Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-[80%] h-1 bg-brand-500/50 shadow-[0_0_15px_rgba(51,84,255,0.8)] animate-scan-line rounded-full" />
            </div>

            {/* Corner Accents */}
            <div className="absolute top-6 left-6 w-12 h-12 border-t-4 border-l-4 border-brand-500 rounded-tl-2xl opacity-50" />
            <div className="absolute top-6 right-6 w-12 h-12 border-t-4 border-r-4 border-brand-500 rounded-tr-2xl opacity-50" />
            <div className="absolute bottom-6 left-6 w-12 h-12 border-b-4 border-l-4 border-brand-500 rounded-bl-2xl opacity-50" />
            <div className="absolute bottom-6 right-6 w-12 h-12 border-b-4 border-r-4 border-brand-500 rounded-br-2xl opacity-50" />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-3xl border border-slate-100">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-6 rounded-full p-1 transition-colors cursor-pointer",
                autoDeduct ? "bg-brand-600" : "bg-slate-300"
              )} onClick={() => setAutoDeduct(!autoDeduct)}>
                <div className={cn(
                  "w-4 h-4 bg-white rounded-full transition-transform shadow-sm",
                  autoDeduct ? "translate-x-6" : "translate-x-0"
                )} />
              </div>
              <span className="text-sm font-bold text-slate-700">Auto-Deduct Stock</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Info className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">1 Unit per scan</span>
            </div>
          </div>

          {/* Feedback Area */}
          <AnimatePresence mode="wait">
            {lastScanned ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 flex items-center gap-6"
              >
                <div className="bg-emerald-500 p-4 rounded-2xl shadow-lg shadow-emerald-200">
                  <CheckCircle2 className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-black text-slate-900 leading-tight">{lastScanned.name}</h4>
                  <div className="flex items-center gap-4 mt-2">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Price</p>
                      <p className="text-xl font-black text-brand-600">{formatCurrency(lastScanned.price)}</p>
                    </div>
                    <div className="h-8 w-px bg-emerald-200" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stock</p>
                      <p className="text-xl font-black text-slate-900">{lastScanned.stock}</p>
                    </div>
                  </div>
                </div>
                {isProcessing && (
                  <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
                )}
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-6 bg-rose-50 rounded-[2rem] border border-rose-100 flex items-center gap-6"
              >
                <div className="bg-rose-500 p-4 rounded-2xl shadow-lg shadow-rose-200">
                  <AlertCircle className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-black text-rose-900 leading-tight">Not Found</h4>
                  <p className="text-sm font-medium text-rose-600 mt-1">{error}</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-10 text-center border-2 border-dashed border-slate-200 rounded-[2rem]"
              >
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Waiting for scan...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
