import React from 'react';
import { 
  Settings as SettingsIcon, 
  Store, 
  MapPin, 
  Phone, 
  Type, 
  Image as ImageIcon,
  Save,
  Eye,
  Calendar,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency } from '../../utils/helpers';

export const Settings = () => {
  const { receiptSettings, fetchReceiptSettings, updateReceiptSettings, isLoading } = useStore();
  const [formData, setFormData] = React.useState(receiptSettings);
  const [showSuccess, setShowSuccess] = React.useState(false);

  React.useEffect(() => {
    fetchReceiptSettings();
  }, [fetchReceiptSettings]);

  React.useEffect(() => {
    if (receiptSettings) {
      setFormData(receiptSettings);
    }
  }, [receiptSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      await updateReceiptSettings(formData);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  if (!formData) return <div className="animate-pulse space-y-8">
    <div className="h-12 w-48 bg-gray-200 rounded-xl mb-8" />
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="h-96 bg-gray-200 rounded-3xl" />
      <div className="h-96 bg-gray-200 rounded-3xl" />
    </div>
  </div>;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Settings</h2>
          <p className="text-gray-500">Customize your store and receipt design</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Configuration Form */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-indigo-600 p-2 rounded-xl">
              <SettingsIcon className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Receipt Configuration</h3>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <Input 
                label="Store Name" 
                icon={Store}
                value={formData.storeName}
                onChange={(e) => setFormData({...formData, storeName: e.target.value})}
                placeholder="Enter store name"
              />
              <Input 
                label="Store Address" 
                icon={MapPin}
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                placeholder="Enter store address"
              />
              <Input 
                label="Contact Number" 
                icon={Phone}
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="Enter phone number"
              />
              <Input 
                label="Logo URL" 
                icon={ImageIcon}
                value={formData.logoUrl}
                onChange={(e) => setFormData({...formData, logoUrl: e.target.value})}
                placeholder="https://example.com/logo.png"
              />
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Receipt Footer Message</label>
                <textarea 
                  className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                  value={formData.footer}
                  onChange={(e) => setFormData({...formData, footer: e.target.value})}
                  placeholder="Thank you for shopping!"
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h4 className="font-bold text-gray-900">Display Options</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <label className="flex items-center gap-3 p-4 rounded-2xl border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors">
                  <input 
                    type="checkbox" 
                    className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    checked={formData.showLogo}
                    onChange={(e) => setFormData({...formData, showLogo: e.target.checked})}
                  />
                  <span className="text-sm font-medium text-gray-700">Show Logo</span>
                </label>
                <label className="flex items-center gap-3 p-4 rounded-2xl border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors">
                  <input 
                    type="checkbox" 
                    className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    checked={formData.showDate}
                    onChange={(e) => setFormData({...formData, showDate: e.target.checked})}
                  />
                  <span className="text-sm font-medium text-gray-700">Show Date</span>
                </label>
                <label className="flex items-center gap-3 p-4 rounded-2xl border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors">
                  <input 
                    type="checkbox" 
                    className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    checked={formData.showTime}
                    onChange={(e) => setFormData({...formData, showTime: e.target.checked})}
                  />
                  <span className="text-sm font-medium text-gray-700">Show Time</span>
                </label>
              </div>
            </div>

            <Button type="submit" className="w-full h-14 text-lg shadow-xl shadow-indigo-100" isLoading={isLoading}>
              <Save className="mr-2 h-5 w-5" />
              Save Settings
            </Button>
          </form>
        </motion.div>

        {/* Preview Area */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 p-2 rounded-xl">
              <Eye className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Receipt Preview</h3>
          </div>

          <div className="bg-gray-900 p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
            {/* Receipt Paper */}
            <div className="bg-white text-gray-900 p-8 shadow-inner min-h-[500px] flex flex-col font-mono text-sm">
              {formData.showLogo && formData.logoUrl && (
                <div className="flex justify-center mb-6">
                  <img src={formData.logoUrl} alt="Logo" className="h-16 w-16 object-contain" referrerPolicy="no-referrer" />
                </div>
              )}
              
              <div className="text-center space-y-1 mb-6">
                <h4 className="text-xl font-black uppercase tracking-tighter">{formData.storeName}</h4>
                <p className="text-xs opacity-70">{formData.address}</p>
                <p className="text-xs opacity-70">TEL: {formData.phone}</p>
              </div>

              <div className="border-t border-dashed border-gray-300 py-3 flex justify-between text-[10px] uppercase font-bold">
                {formData.showDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date().toLocaleDateString()}
                  </span>
                )}
                {formData.showTime && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>

              <div className="border-t border-dashed border-gray-300 py-4 space-y-2">
                <div className="flex justify-between font-bold">
                  <span>ITEM</span>
                  <span>TOTAL</span>
                </div>
                <div className="flex justify-between opacity-70">
                  <span>Coke 1.5L x 2</span>
                  <span>{formatCurrency(130)}</span>
                </div>
                <div className="flex justify-between opacity-70">
                  <span>SkyFlakes x 1</span>
                  <span>{formatCurrency(55)}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-gray-300 py-4 space-y-1">
                <div className="flex justify-between text-lg font-black">
                  <span>TOTAL</span>
                  <span>{formatCurrency(185)}</span>
                </div>
                <div className="flex justify-between text-xs opacity-70">
                  <span>PAYMENT: CASH</span>
                </div>
              </div>

              <div className="mt-auto pt-8 text-center space-y-4">
                <div className="flex justify-center">
                  <div className="h-12 w-48 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                    <div className="flex gap-1">
                      {[1,2,3,4,5,6,7,8,9,10].map(i => (
                        <div key={i} className="w-1 h-8 bg-black" style={{ opacity: Math.random() * 0.5 + 0.5 }} />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-[10px] italic opacity-60 max-w-[200px] mx-auto leading-tight">
                  {formData.footer}
                </p>
              </div>
            </div>

            {/* Decorative elements to make it look like a phone/tablet */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-1 bg-gray-800 rounded-full" />
          </div>
        </motion.div>
      </div>

      {/* Success Toast */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3"
          >
            <CheckCircle2 className="h-6 w-6" />
            <span className="font-bold">Settings saved successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
