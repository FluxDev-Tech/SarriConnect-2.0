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
  date?: string;
  receiptNumber?: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  orderNote?: string;
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
  date = new Date().toISOString(),
  receiptNumber = `SALE_${Math.floor(Math.random() * 10000000)}`,
  customerName,
  customerPhone,
  customerAddress,
  orderNote
}) => {
  const d = new Date(date);

  if (!settings) {
    return (
      <div className="p-8 text-center text-slate-400 bg-white rounded-none border border-slate-100">
        <p className="font-bold">Receipt settings not found.</p>
        <p className="text-xs mt-2">Please configure your store details in settings.</p>
      </div>
    );
  }

  return (
    <div className="bg-white text-slate-900 p-6 sm:p-10 shadow-2xl flex flex-col font-sans text-sm border border-slate-100 print-receipt w-full max-w-full sm:max-w-md mx-auto rounded-none min-h-[600px] relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-brand-600"></div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-50 rounded-none -mr-16 -mt-16 opacity-50"></div>
      
      {/* Header */}
      <div className="text-center space-y-3 mb-8 shrink-0 relative z-10">
        <div className="flex justify-center mb-4">
          <div className="bg-brand-600 p-4 rounded-none shadow-lg shadow-brand-200 rotate-3">
            <Store className="h-8 w-8 text-white" />
          </div>
        </div>
        <h4 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900 leading-none">{settings.storeName || 'SARICONNECT.PH'}</h4>
        <div className="flex flex-col items-center gap-1.5">
          <p className="text-[10px] font-black text-brand-600 uppercase tracking-[0.3em]">Official Receipt</p>
          <p className="text-[11px] text-slate-500 font-bold max-w-[220px] leading-relaxed italic">{settings.address || 'Cayus, Pilar, Capiz, Philippines'}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6 shrink-0">
        <div className="h-[1px] flex-1 bg-slate-100"></div>
        <div className="w-2 h-2 rounded-none bg-slate-200"></div>
        <div className="h-[1px] flex-1 bg-slate-100"></div>
      </div>

      {/* Info Section */}
      <div className="grid grid-cols-1 gap-2 text-[11px] font-bold text-slate-600 shrink-0">
        <div className="flex justify-between items-center bg-slate-50/80 backdrop-blur-sm px-4 py-3 rounded-none border border-slate-100">
          <span className="text-slate-400 uppercase tracking-widest text-[9px]">Transaction ID</span>
          <span className="font-mono text-slate-900 font-black">{receiptNumber}</span>
        </div>
        <div className="flex justify-between items-center px-4 py-1.5">
          <span className="text-slate-400 uppercase tracking-widest text-[9px]">Date & Time</span>
          <span className="text-slate-900">{d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}, {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div className="flex justify-between items-center px-4 py-1.5">
          <span className="text-slate-400 uppercase tracking-widest text-[9px]">Payment</span>
          <span className={cn("px-2.5 py-1 rounded-none text-[10px] font-black uppercase tracking-widest", paymentType === 'cash' ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700")}>
            {paymentType === 'cash' ? 'Cash' : 'Utang'}
          </span>
        </div>
        {customerName && (
          <div className="flex flex-col gap-1.5 px-4 py-3 border-t border-slate-50 mt-1 pt-3 bg-slate-50/50 rounded-none">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 uppercase tracking-widest text-[9px]">Customer</span>
              <span className="text-slate-900 font-black">{customerName}</span>
            </div>
            {customerPhone && (
              <div className="flex justify-between items-center">
                <span className="text-slate-400 uppercase tracking-widest text-[9px]">Phone</span>
                <span className="text-slate-900 font-bold">{customerPhone}</span>
              </div>
            )}
            {customerAddress && (
              <div className="flex justify-between items-start">
                <span className="text-slate-400 uppercase tracking-widest text-[9px]">Address</span>
                <span className="text-slate-900 font-bold text-right max-w-[150px] leading-tight">{customerAddress}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="my-8 shrink-0 relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 border-dashed"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-4 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Order Details</span>
        </div>
      </div>

      {/* Items Section */}
      <div className="space-y-5 flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar">
        {items.map((item, i) => (
          <div key={i} className="group relative">
            <div className="flex justify-between items-start mb-1.5">
              <span className="font-black text-slate-900 text-xs sm:text-sm flex-1 pr-6 leading-tight group-hover:text-brand-600 transition-colors">{item.name}</span>
              <span className="font-black text-slate-900 text-xs sm:text-sm whitespace-nowrap">{formatCurrency(item.price * item.quantity)}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 rounded-none border border-slate-100">
                <span className="text-[10px] font-black text-slate-400">{item.quantity}</span>
                <span className="text-[8px] text-slate-300 font-black">×</span>
                <span className="text-[10px] font-black text-slate-600">{formatCurrency(item.price)}</span>
              </div>
              <div className="h-[1px] flex-1 bg-slate-50"></div>
            </div>
          </div>
        ))}
      </div>

      {orderNote && (
        <div className="mt-6 p-4 bg-slate-50 border border-slate-100 rounded-none shrink-0">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Order Note</p>
          <p className="text-[11px] text-slate-600 font-bold italic leading-relaxed">"{orderNote}"</p>
        </div>
      )}

      <div className="mt-8 pt-6 border-t-2 border-slate-100 shrink-0">
        {/* Summary Section */}
        <div className="space-y-2.5 bg-slate-900 text-white p-5 rounded-none shadow-xl shadow-slate-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-none -mr-12 -mt-12"></div>
          
          {subtotal !== undefined && subtotal !== total && (
            <div className="flex justify-between text-[11px] font-bold opacity-60">
              <span className="uppercase tracking-widest">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
          )}
          {discount !== undefined && discount > 0 && (
            <div className="flex justify-between text-[11px] font-bold text-rose-400">
              <span className="uppercase tracking-widest">Discount</span>
              <span>-{formatCurrency(discount)}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-2 border-t border-white/10 mt-2">
            <span className="text-xs font-black uppercase tracking-[0.2em]">Total Amount</span>
            <span className="text-2xl font-black text-white">{formatCurrency(total)}</span>
          </div>
          
          {paymentType === 'cash' && receivedAmount !== undefined && (
            <div className="space-y-2 pt-4 mt-2 border-t border-white/10">
              <div className="flex justify-between text-[11px] font-bold opacity-60">
                <span className="uppercase tracking-widest">Received</span>
                <span>{formatCurrency(receivedAmount)}</span>
              </div>
              <div className="flex justify-between text-[11px] font-bold text-emerald-400">
                <span className="uppercase tracking-widest font-black">Change</span>
                <span className="font-black">{formatCurrency(change || 0)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Barcode Section */}
      <div className="text-center space-y-3 my-8 shrink-0">
        <div className="bg-slate-50 rounded-none p-5 border border-slate-100">
          <div className="h-12 w-full flex items-center justify-center gap-[1.5px]">
            {[...Array(60)].map((_, i) => (
              <div 
                key={i} 
                className="bg-slate-900 h-full" 
                style={{ 
                  width: Math.random() > 0.8 ? '3px' : Math.random() > 0.5 ? '1.5px' : '0.5px', 
                  opacity: Math.random() * 0.5 + 0.5 
                }} 
              />
            ))}
          </div>
          <p className="text-[9px] font-mono text-slate-400 mt-3 uppercase tracking-[0.3em] font-black">
            {receiptNumber.split('_')[1]}{Math.floor(Math.random() * 1000000)}X
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center space-y-4 shrink-0 pb-2">
        <div className="space-y-1">
          <p className="text-xs font-black text-slate-900 uppercase tracking-tight">Thank you for your purchase!</p>
          <p className="text-[11px] font-bold text-brand-600 bg-brand-50 inline-block px-4 py-1 rounded-none">Salamat sa inyong pagbili! 🎉</p>
        </div>
        
        <div className="pt-4 flex flex-col items-center gap-1.5 opacity-40">
          <div className="flex items-center gap-4 text-[8px] font-black text-slate-500 uppercase tracking-widest">
            <span>fluxdevtech@gmail.com</span>
            <span className="h-1 w-1 rounded-none bg-slate-400"></span>
            <span>SariConnect Pro v2.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};
