import React from 'react';
import { Calendar, Clock, Store } from 'lucide-react';
import { ReceiptSettings, Product } from '../../types';
import { formatCurrency } from '../../utils/helpers';

interface ReceiptProps {
  settings: ReceiptSettings;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  paymentType: string;
  customerName?: string;
  date?: string;
}

export const Receipt: React.FC<ReceiptProps> = ({ 
  settings, 
  items, 
  total, 
  paymentType, 
  customerName,
  date = new Date().toISOString()
}) => {
  const d = new Date(date);

  return (
    <div className="bg-white text-gray-900 p-8 shadow-inner min-h-[500px] flex flex-col font-mono text-sm border border-gray-100 print-receipt">
      {settings.showLogo && settings.logoUrl && (
        <div className="flex justify-center mb-6">
          <img src={settings.logoUrl} alt="Logo" className="h-16 w-16 object-contain" referrerPolicy="no-referrer" />
        </div>
      )}
      
      <div className="text-center space-y-1 mb-6">
        <h4 className="text-xl font-black uppercase tracking-tighter">{settings.storeName}</h4>
        <p className="text-xs opacity-70">{settings.address}</p>
        <p className="text-xs opacity-70">TEL: {settings.phone}</p>
      </div>

      <div className="border-t border-dashed border-gray-300 py-3 flex justify-between text-[10px] uppercase font-bold">
        {settings.showDate && (
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {d.toLocaleDateString()}
          </span>
        )}
        {settings.showTime && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      <div className="border-t border-dashed border-gray-300 py-4 space-y-2">
        <div className="flex justify-between font-bold">
          <span>ITEM</span>
          <span>TOTAL</span>
        </div>
        {items.map((item, i) => (
          <div key={i} className="flex justify-between opacity-70">
            <span className="truncate max-w-[150px]">{item.name} x {item.quantity}</span>
            <span>{formatCurrency(item.price * item.quantity)}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-dashed border-gray-300 py-4 space-y-1">
        <div className="flex justify-between text-lg font-black">
          <span>TOTAL</span>
          <span>{formatCurrency(total)}</span>
        </div>
        <div className="flex justify-between text-xs opacity-70 uppercase">
          <span>PAYMENT: {paymentType}</span>
        </div>
        {customerName && (
          <div className="flex justify-between text-xs opacity-70 uppercase">
            <span>CUSTOMER: {customerName}</span>
          </div>
        )}
      </div>

      <div className="mt-auto pt-8 text-center space-y-4">
        <div className="flex justify-center">
          <div className="h-12 w-48 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
            <div className="flex gap-1">
              {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(i => (
                <div key={i} className="w-1 h-8 bg-black" style={{ opacity: Math.random() * 0.5 + 0.5 }} />
              ))}
            </div>
          </div>
        </div>
        <p className="text-[10px] italic opacity-60 max-w-[200px] mx-auto leading-tight">
          {settings.footer}
        </p>
      </div>
    </div>
  );
};
