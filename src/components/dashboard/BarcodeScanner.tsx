import React from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Zap, Info, CheckCircle2, AlertCircle, RefreshCw, Camera, Scan } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../../types';
import { formatCurrency } from '../../utils/helpers';

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose?: () => void;
  products?: Product[];
  onQuickSale?: (product: Product) => Promise<void>;
  isModal?: boolean;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose, products = [], onQuickSale, isModal = true }) => {
  const [lastScanned, setLastScanned] = React.useState<Product | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [facingMode, setFacingMode] = React.useState<'environment' | 'user'>('environment');
  const [isScannerReady, setIsScannerReady] = React.useState(false);
  const [isFlashing, setIsFlashing] = React.useState(false);
  const scannerRef = React.useRef<Html5Qrcode | null>(null);
  const transitionLock = React.useRef(false);

  const playBeep = React.useCallback(() => {
    // Trigger visual flash
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 150);

    try {
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      if (!AudioContextClass) return;
      
      const audioCtx = new AudioContextClass();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // High pitch beep
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
      
      // Close context after sound finishes to save resources
      setTimeout(() => audioCtx.close(), 200);
    } catch (e) {
      console.warn('Audio beep failed:', e);
    }
  }, []);

  const startScanner = React.useCallback(async (mode: 'environment' | 'user', retryCount = 0) => {
    if (transitionLock.current) {
      if (retryCount < 5) {
        setTimeout(() => startScanner(mode, retryCount + 1), 200);
      }
      return;
    }
    
    transitionLock.current = true;
    setIsScannerReady(false);

    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode('reader');
    }

    try {
      if (scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }

      const config = {
        fps: 20,
        qrbox: { width: 280, height: 180 },
        aspectRatio: 1.0,
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E
        ]
      };

      await scannerRef.current.start(
        { facingMode: mode },
        config,
        async (decodedText) => {
          playBeep();
          onScan(decodedText);
          
          const product = products.find(p => p.barcode === decodedText);
          if (product) {
            setLastScanned(product);
            setError(null);
            
            // Clear success message after 3 seconds
            setTimeout(() => {
              setLastScanned(null);
            }, 3000);
            
            if (onQuickSale) {
              setIsProcessing(true);
              try {
                await onQuickSale(product);
              } catch (err) {
                setError('Failed to record sale');
                setTimeout(() => setError(null), 3000);
              } finally {
                setIsProcessing(false);
              }
            }
          } else {
            setError(`Product with barcode ${decodedText} not found`);
            setLastScanned(null);
            setTimeout(() => setError(null), 3000);
          }
        },
        () => {} // Ignore errors
      );
      setIsScannerReady(true);
      setError(null);
    } catch (err) {
      console.error('Failed to start scanner:', err);
      if (err instanceof Error && err.message.includes('transition')) {
        // If still transitioning, try one more time after a delay
        if (retryCount < 5) {
          setTimeout(() => {
            transitionLock.current = false;
            startScanner(mode, retryCount + 1);
          }, 300);
          return;
        }
      }
      setError('Could not access camera. Please check permissions.');
    } finally {
      transitionLock.current = false;
    }
  }, [onScan, products, onQuickSale, playBeep]);

  React.useEffect(() => {
    let isMounted = true;
    
    const init = async () => {
      // Small delay to ensure previous instance is fully cleaned up
      await new Promise(resolve => setTimeout(resolve, 300));
      if (isMounted) {
        await startScanner(facingMode);
      }
    };

    init();

    return () => {
      isMounted = false;
      const cleanup = async () => {
        if (scannerRef.current?.isScanning) {
          try {
            await scannerRef.current.stop();
          } catch (e) {
            console.error('Cleanup stop failed:', e);
          }
        }
      };
      cleanup();
    };
  }, [startScanner, facingMode]);

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  return (
    <div className={cn(
      isModal ? "fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4" : "w-full"
    )}>
      <div className={cn(
        "bg-white overflow-hidden relative border border-slate-100",
        isModal ? "rounded-none shadow-2xl w-full max-w-lg border-white/20" : "rounded-none w-full"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="bg-brand-50 p-2 rounded-none">
              <Scan className="h-5 w-5 text-brand-600" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight">Scanner</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                {facingMode === 'environment' ? 'Rear Camera' : 'Front Camera'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={toggleCamera}
              className="p-2 hover:bg-slate-50 rounded-none transition-all text-slate-400 hover:text-brand-600"
              title="Switch Camera"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            {onClose && (
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-50 rounded-none transition-all text-slate-400 hover:text-rose-500"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        <div className="p-4 lg:p-6 space-y-6">
          {/* Scanner Viewport */}
          <div className="relative">
            <div id="reader" className="overflow-hidden rounded-none border-2 border-slate-100 bg-black aspect-square md:aspect-video relative z-10"></div>
            
            {/* Flash Overlay */}
            <AnimatePresence>
              {isFlashing && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-white z-20 pointer-events-none rounded-none"
                />
              )}
            </AnimatePresence>

            {!isScannerReady && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 rounded-none z-20">
                <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-none animate-spin mb-3" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Starting Camera...</p>
              </div>
            )}

            {/* Laser Animation Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
              <div className="w-[90%] h-0.5 bg-brand-500/50 animate-scan-line rounded-none" />
            </div>

            {/* Corner Accents */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-brand-500/30 rounded-none z-20" />
            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-brand-500/30 rounded-none z-20" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-brand-500/30 rounded-none z-20" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-brand-500/30 rounded-none z-20" />
          </div>

          {/* Feedback Area */}
          <div className="min-h-[80px]">
            <AnimatePresence mode="wait">
              {lastScanned ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 bg-emerald-50 rounded-none border border-emerald-100 flex items-center gap-4"
                >
                  <div className="bg-emerald-500 p-2.5 rounded-none">
                    <CheckCircle2 className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-black text-slate-900">{lastScanned.name}</h4>
                    <div className="flex items-center gap-3 mt-0.5">
                      <p className="text-xs font-black text-brand-600">{formatCurrency(lastScanned.price)}</p>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stock: {lastScanned.stock}</span>
                    </div>
                  </div>
                  {isProcessing && (
                    <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-none animate-spin" />
                  )}
                </motion.div>
              ) : error ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 bg-rose-50 rounded-none border border-rose-100 flex items-center gap-4"
                >
                  <div className="bg-rose-500 p-2.5 rounded-none">
                    <AlertCircle className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-black text-rose-900">Scan Error</h4>
                    <p className="text-[10px] font-bold text-rose-600 mt-0.5">{error}</p>
                  </div>
                  <button 
                    onClick={() => setError(null)}
                    className="p-1.5 hover:bg-rose-100 rounded-none text-rose-400 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3"
                >
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Manual Barcode</label>
                    <div className="relative">
                      <input 
                        type="text"
                        placeholder="Enter barcode..."
                        className="w-full h-12 pl-10 pr-4 bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white rounded-none outline-none transition-all font-bold text-slate-900 text-sm placeholder:text-slate-300"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = (e.target as HTMLInputElement).value;
                            if (val) {
                              const product = products.find(p => p.barcode === val);
                              if (product) {
                                playBeep();
                                setLastScanned(product);
                                setError(null);
                                onScan(val);
                                
                                setTimeout(() => {
                                  setLastScanned(null);
                                }, 3000);
                              } else {
                                setError(`Barcode ${val} not found`);
                                setTimeout(() => setError(null), 3000);
                              }
                              (e.target as HTMLInputElement).value = '';
                            }
                          }
                        }}
                      />
                      <Zap className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
