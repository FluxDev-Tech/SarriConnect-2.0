import React from 'react';
import { Calendar, Clock, Store } from 'lucide-react';
import { ReceiptSettings, Product } from '../../types';
import { formatCurrency, cn } from '../../utils/helpers';

interface ReceiptProps {
  settings: ReceiptSettings;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  subtotal?: number;
  discount?: number;
  receivedAmount?: number;
  change?: number;
  paymentType: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  date?: string;
  receiptNumber?: string;
}

export const Receipt: React.FC<ReceiptProps> = ({ 
  settings, 
  items, 
  total, 
  subtotal,
  discount,
  receivedAmount,
  change,
  paymentType, 
  customerName,
  customerPhone,
  customerAddress,
  date = new Date().toISOString(),
  receiptNumber = `SALE_${Math.floor(Math.random() * 10000000)}`
}) => {
  const d = new Date(date);

  if (!settings) {
    return (
      <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-100">
        <p className="font-bold">Receipt settings not found.</p>
        <p className="text-xs mt-2">Please configure your store details in settings.</p>
      </div>
    );
  }

  return (
    <div className="bg-white text-slate-900 p-4 sm:p-8 shadow-2xl min-h-[600px] flex flex-col font-sans text-sm border border-slate-100 print-receipt w-full max-w-md mx-auto rounded-2xl">
      {/* Header */}
      <div className="text-center space-y-1 mb-4">
        <div className="flex justify-center mb-2">
          <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100">
            <Store className="h-8 w-8 text-brand-500" />
          </div>
        </div>
        <h4 className="text-xl font-black uppercase tracking-tight text-slate-900">{settings.storeName || 'SARICONNECT.PH'}</h4>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sari-Sari Store Management</p>
        <p className="text-[9px] text-slate-400 font-medium">{settings.address || 'Cayus, Pilar, Capiz, Philippines'}</p>
      </div>

      <div className="border-t border-black border-dotted my-3"></div>

      {/* Info Section */}
      <div className="space-y-1 text-[11px] font-medium text-slate-600">
        <div className="flex justify-between">
          <span className="font-bold text-slate-900">Receipt #:</span>
          <span className="font-mono">{receiptNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold text-slate-900">Date:</span>
          <span>{d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}, {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold text-slate-900">Payment:</span>
          <span className={cn("font-bold", paymentType === 'cash' ? "text-emerald-600" : "text-blue-600")}>
            {paymentType === 'cash' ? 'Cash' : 'Utang / Credit'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold text-slate-900">Status:</span>
          <span className={cn("font-bold uppercase tracking-wider", paymentType === 'cash' ? "text-emerald-600" : "text-rose-600")}>
            {paymentType === 'cash' ? 'PAID' : 'UNPAID'}
          </span>
        </div>
      </div>

      {/* Customer Section */}
      {customerName && (
        <div className="mt-4 p-3 bg-slate-50 border-l-4 border-slate-900 rounded-r-xl space-y-1">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Customer Details</p>
          <p className="text-xs font-black text-slate-900">{customerName}</p>
          {customerPhone && <p className="text-[10px] text-slate-500 flex items-center gap-1">📱 {customerPhone}</p>}
          {customerAddress && <p className="text-[10px] text-slate-500 flex items-center gap-1">🏠 {customerAddress}</p>}
        </div>
      )}

      <div className="border-t border-black border-dotted my-4"></div>

      {/* Items Section */}
      <div className="space-y-4 flex-1">
        <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-2">Items Purchased</p>
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="space-y-0.5">
              <div className="flex justify-between items-start">
                <span className="font-black text-slate-900 text-xs flex-1 pr-4">{item.name}</span>
                <span className="font-black text-slate-900 text-xs whitespace-nowrap">{formatCurrency(item.price * item.quantity)}</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                {formatCurrency(item.price)} × {item.quantity}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-slate-200 my-4"></div>

      {/* Summary Section */}
      <div className="space-y-1.5 mb-4">
        {subtotal !== undefined && subtotal !== total && (
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-500 font-bold">Subtotal:</span>
            <span className="font-bold text-slate-900">{formatCurrency(subtotal)}</span>
          </div>
        )}
        {discount !== undefined && discount > 0 && (
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-500 font-bold">Discount:</span>
            <span className="font-bold text-rose-600">-{formatCurrency(discount)}</span>
          </div>
        )}
        <div className="flex justify-between items-center pt-1">
          <span className="text-sm font-black text-slate-900 uppercase">Total Amount:</span>
          <span className="text-lg font-black text-brand-600">{formatCurrency(total)}</span>
        </div>
        
        {paymentType === 'cash' && receivedAmount !== undefined && (
          <>
            <div className="border-t border-slate-100 my-2"></div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500 font-bold">Amount Received:</span>
              <span className="font-bold text-slate-900">{formatCurrency(receivedAmount)}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500 font-bold">Change:</span>
              <span className="font-bold text-emerald-600">{formatCurrency(change || 0)}</span>
            </div>
          </>
        )}
      </div>

      {paymentType === 'debt' && customerName && (
        <div className="bg-rose-50 text-rose-600 py-3 px-4 rounded-xl text-[10px] font-black text-center mb-6 flex items-center justify-center gap-2 border border-rose-100">
          <span>⚠️</span> BALANCE TO BE PAID BY: {customerName.toUpperCase()}
        </div>
      )}

      {/* Barcode Section */}
      <div className="text-center space-y-2 mb-6">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Receipt Barcode</p>
        <div className="border border-slate-100 rounded-xl p-3 bg-white">
          <div className="h-16 w-full flex items-center justify-center gap-0.5">
            {[...Array(40)].map((_, i) => (
              <div 
                key={i} 
                className="bg-slate-900 h-full" 
                style={{ width: Math.random() > 0.5 ? '2px' : '1px', opacity: Math.random() * 0.5 + 0.5 }} 
              />
            ))}
          </div>
          <p className="text-[8px] font-mono text-slate-400 mt-1 uppercase tracking-widest">
            {receiptNumber}{Math.floor(Math.random() * 1000000)}_W
          </p>
        </div>
      </div>

      <div className="border-t border-black border-dotted my-4"></div>

      {/* Footer */}
      <div className="text-center space-y-1.5">
        <p className="text-xs font-black text-slate-900">Thank you for your purchase!</p>
        <p className="text-[10px] font-medium text-slate-600">Salamat sa inyong pagbili! 🎉</p>
        <p className="text-[10px] font-medium text-slate-400">Please come again!</p>
        
        <div className="pt-4 space-y-0.5">
          <p className="text-[9px] text-slate-400">fluxdevtech@gmail.com</p>
          <p className="text-[9px] text-slate-400">fb.com/fluxdevtech</p>
          <p className="text-[10px] font-black text-slate-300 italic mt-2">Powered by SariConnect Pro</p>
        </div>
      </div>
    </div>
  );
};
