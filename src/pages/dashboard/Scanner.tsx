import React from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Scan, Package, ShoppingCart, AlertCircle } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { formatCurrency, cn } from '../../utils/helpers';
import { Button } from '../../components/ui/Button';

export const Scanner = () => {
  const { products, recordSale } = useStore();
  const [scannedProduct, setScannedProduct] = React.useState<any>(null);
  const [isScanning, setIsScanning] = React.useState(true);

  React.useEffect(() => {
    if (!isScanning) return;

    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        const product = products.find(p => p.barcode === decodedText);
        if (product) {
          setScannedProduct(product);
          setIsScanning(false);
          scanner.clear();
        } else {
          alert(`Product with barcode ${decodedText} not found.`);
        }
      },
      (error) => {
        // console.warn(error);
      }
    );

    return () => {
      scanner.clear().catch(err => console.error("Failed to clear scanner", err));
    };
  }, [isScanning, products]);

  const handleQuickSale = async () => {
    if (!scannedProduct) return;
    try {
      await recordSale([{ id: scannedProduct.id, quantity: 1, price: scannedProduct.price }], scannedProduct.price);
      alert('Quick sale recorded!');
      setScannedProduct(null);
      setIsScanning(true);
    } catch (err) {
      alert('Failed to record quick sale');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900">Barcode Scanner</h2>
        <p className="text-gray-500">Scan products for fast checkout or inventory check</p>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        {isScanning ? (
          <div className="space-y-6">
            <div id="reader" className="overflow-hidden rounded-2xl border-2 border-dashed border-gray-200"></div>
            <div className="flex items-center justify-center gap-3 text-gray-400">
              <Scan className="h-5 w-5 animate-pulse" />
              <span className="font-medium">Align barcode within the frame</span>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {scannedProduct ? (
              <div className="space-y-6">
                <div className="flex items-center gap-6 p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <div className="p-4 bg-white rounded-xl shadow-sm">
                    <Package className="h-10 w-10 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">{scannedProduct.name}</h3>
                    <p className="text-gray-500">{scannedProduct.category}</p>
                    <div className="mt-2 flex items-center gap-4">
                      <span className="text-2xl font-bold text-indigo-600">{formatCurrency(scannedProduct.price)}</span>
                      <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold uppercase",
                        scannedProduct.stock <= 5 ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"
                      )}>
                        {scannedProduct.stock} in stock
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button variant="secondary" className="h-14 rounded-2xl" onClick={() => setIsScanning(true)}>
                    Scan Another
                  </Button>
                  <Button className="h-14 rounded-2xl shadow-lg shadow-indigo-100" onClick={handleQuickSale}>
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Quick Sale (1x)
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 space-y-4">
                <div className="inline-flex items-center justify-center p-4 bg-amber-50 rounded-full">
                  <AlertCircle className="h-8 w-8 text-amber-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Product not found</h3>
                <Button variant="secondary" onClick={() => setIsScanning(true)}>Try Again</Button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
        <h4 className="font-bold text-indigo-900 mb-2">Pro Tip:</h4>
        <p className="text-sm text-indigo-700 leading-relaxed">
          Use the barcode scanner for high-speed checkout during peak hours. 
          Make sure your camera has good lighting for the best scanning performance.
        </p>
      </div>
    </div>
  );
};
