import React from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Zap, Info, CheckCircle2, AlertCircle, RefreshCw, Camera } from 'lucide-react';
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
            
            if (onQuickSale) {
              setIsProcessing(true);
              try {
                await onQuickSale(product);
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
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1.5">
                {facingMode === 'environment' ? 'Back Camera' : 'Front Camera'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleCamera}
              className="p-4 hover:bg-white rounded-2xl transition-all text-slate-400 hover:text-brand-600 shadow-sm hover:shadow-md"
              title="Switch Camera"
            >
              <RefreshCw className="h-6 w-6" />
            </button>
            <button 
              onClick={onClose}
              className="p-4 hover:bg-white rounded-2xl transition-all text-slate-400 hover:text-rose-600 shadow-sm hover:shadow-md"
            >
              <X className="h-7 w-7" />
            </button>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Scanner Viewport */}
          <div className="relative group">
            <div id="reader" className="overflow-hidden rounded-[2.5rem] border-8 border-slate-100 shadow-inner bg-black aspect-square md:aspect-video"></div>
            
            {/* Flash Overlay */}
            <AnimatePresence>
              {isFlashing && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-white z-10 pointer-events-none rounded-[2.5rem]"
                />
              )}
            </AnimatePresence>

            {!isScannerReady && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/50 rounded-[2.5rem] backdrop-blur-sm">
                <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-white font-bold uppercase tracking-widest text-xs">Initializing Camera...</p>
              </div>
            )}

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
                <div className="flex-1">
                  <h4 className="text-lg font-black text-rose-900 leading-tight">Scanner Alert</h4>
                  <p className="text-sm font-medium text-rose-600 mt-1">{error}</p>
                </div>
                <button 
                  onClick={() => setError(null)}
                  className="p-2 hover:bg-rose-100 rounded-lg text-rose-400 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div className="p-10 text-center border-2 border-dashed border-slate-200 rounded-[2rem]">
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Waiting for barcode...</p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-slate-100" />
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">or</span>
                  <div className="flex-1 h-px bg-slate-100" />
                </div>

                <div className="relative">
                  <input 
                    type="text"
                    placeholder="Enter barcode manually..."
                    className="w-full h-14 pl-12 pr-4 bg-slate-50 border-2 border-transparent focus:border-brand-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-900"
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
                          } else {
                            setError(`Product with barcode ${val} not found`);
                          }
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                  />
                  <Zap className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                </div>
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
