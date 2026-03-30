import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User as UserIcon, 
  Search, 
  Calendar, 
  DollarSign, 
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Printer,
  Clock,
  Banknote,
  Trash2,
  Plus
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { formatCurrency, cn } from '../../utils/helpers';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Receipt } from '../../components/dashboard/Receipt';
import { Sale } from '../../types';
import api from '../../services/api';

export const Debts = () => {
  const navigate = useNavigate();
  const { fetchStats, receiptSettings, fetchReceiptSettings, markAsPaid, fetchSales, deleteSale } = useStore();
  const [debts, setDebts] = React.useState<Sale[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedDebt, setSelectedDebt] = React.useState<Sale | null>(null);
  const [showReceipt, setShowReceipt] = React.useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [debtToDelete, setDebtToDelete] = React.useState<Sale | null>(null);

  const [isPayModalOpen, setIsPayModalOpen] = React.useState(false);
  const [debtToPay, setDebtToPay] = React.useState<Sale | null>(null);

  const fetchDebts = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchSales('debt');
      // Filter only unpaid debts
      const debtSales = (data || []).filter((s: Sale) => !s.isPaid);
      setDebts(debtSales);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchSales]);

  React.useEffect(() => {
    fetchDebts();
    fetchReceiptSettings();
  }, [fetchDebts, fetchReceiptSettings]);

  const handleMarkAsPaid = (debt: Sale) => {
    setDebtToPay(debt);
    setIsPayModalOpen(true);
  };

  const confirmPayment = async () => {
    if (!debtToPay) return;
    
    try {
      await markAsPaid(debtToPay.id);
      fetchDebts();
      setSelectedDebt({ ...debtToPay, paymentType: 'cash', isPaid: true });
      setShowReceipt(true);
      setIsPayModalOpen(false);
      setDebtToPay(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteClick = (debt: Sale) => {
    setDebtToDelete(debt);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!debtToDelete) return;

    try {
      await deleteSale(debtToDelete.id);
      fetchDebts();
      setIsDeleteModalOpen(false);
      setDebtToDelete(null);
    } catch (err) {
      console.error('Failed to delete debt:', err);
    }
  };

  const filteredDebts = debts.filter(d => 
    d.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (Array.isArray(d.items) && d.items.some(item => 
      item.product?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    ))
  );

  const totalDebt = filteredDebts.reduce((sum, d) => sum + d.totalPrice, 0);

  const isOverdue = (date: string) => {
    const debtDate = new Date(date);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - debtDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 7;
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900">Utang Management</h2>
          <p className="text-slate-500 font-medium mt-1 tracking-tight">Track and manage customer credit balances</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-rose-50 px-8 py-4 rounded-none border border-rose-100 flex items-center gap-6 shadow-sm">
            <div className="bg-rose-600 p-3 rounded-none shadow-lg shadow-rose-200">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Total Receivables</p>
              <p className="text-3xl font-black text-rose-700 tracking-tighter">{formatCurrency(totalDebt)}</p>
            </div>
          </div>
          <Button 
            onClick={() => navigate('/pos?type=debt')}
            className="h-14 px-8 rounded-none bg-rose-600 hover:bg-rose-700 shadow-xl shadow-rose-200/50 font-black uppercase tracking-widest text-xs"
          >
            <Plus className="mr-2 h-5 w-5" />
            New Utang
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search by customer name, address, or items..."
          className="w-full pl-14 pr-6 py-5 rounded-none border-2 border-slate-100 bg-white shadow-sm focus:outline-none focus:ring-4 focus:ring-brand-50 focus:border-brand-500 transition-all font-bold text-slate-700"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {isLoading ? (
          [1,2,3].map(i => <div key={i} className="h-32 bg-white rounded-none animate-pulse border border-slate-100" />)
        ) : filteredDebts.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-none border-2 border-dashed border-slate-200">
            <div className="bg-emerald-50 h-24 w-24 rounded-none flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            </div>
            <h3 className="text-3xl font-black text-slate-900">No active debts!</h3>
            <p className="text-slate-500 font-medium mt-2">All customers have paid their balances.</p>
          </div>
        ) : (
          filteredDebts.map((debt) => (
            <div key={debt.id} className="bg-white p-8 rounded-none border border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-8 group relative overflow-hidden hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500">
              <div className={cn(
                "absolute top-0 left-0 w-2 h-full transition-all duration-500",
                isOverdue(debt.createdAt) ? "bg-rose-500" : "bg-amber-400"
              )} />
              
              <div className="flex items-start gap-6 flex-1">
                <div className={cn(
                  "h-20 w-20 rounded-none flex items-center justify-center transition-all duration-500 shrink-0",
                  isOverdue(debt.createdAt) 
                    ? "bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white" 
                    : "bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white"
                )}>
                  {isOverdue(debt.createdAt) ? <AlertCircle className="h-10 w-10" /> : <Clock className="h-10 w-10" />}
                </div>
                
                <div className="space-y-4 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                      {debt.customerName || `Transaction #${debt.id}`}
                    </h3>
                    {isOverdue(debt.createdAt) && (
                      <span className="px-3 py-1 rounded-none bg-rose-500 text-white text-[9px] font-black uppercase tracking-[0.2em] shadow-lg shadow-rose-200 animate-pulse">
                        Overdue
                      </span>
                    )}
                    <span className="px-3 py-1 rounded-none bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-[0.2em]">
                      Unpaid
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      {debt.customerPhone && (
                        <div className="flex items-center gap-2 text-slate-500 text-sm font-bold">
                          <div className="w-6 h-6 rounded-none bg-slate-50 flex items-center justify-center">
                            <span className="text-[10px]">📞</span>
                          </div>
                          {debt.customerPhone}
                        </div>
                      )}
                      {debt.customerAddress && (
                        <div className="flex items-center gap-2 text-slate-500 text-sm font-bold">
                          <div className="w-6 h-6 rounded-none bg-slate-50 flex items-center justify-center">
                            <span className="text-[10px]">📍</span>
                          </div>
                          {debt.customerAddress}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-400 font-bold">
                      <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-none">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        {new Date(debt.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between lg:justify-end gap-6 border-t lg:border-t-0 pt-6 lg:pt-0">
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Balance Owed</p>
                  <p className="text-4xl font-black text-rose-600 tracking-tighter">{formatCurrency(debt.totalPrice)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button 
                    onClick={() => handleMarkAsPaid(debt)}
                    className="bg-emerald-600 hover:bg-emerald-700 shadow-2xl shadow-emerald-200/50 h-16 px-8 rounded-none font-black text-sm uppercase tracking-widest group"
                  >
                    <Banknote className="mr-3 h-6 w-6 group-hover:scale-110 transition-transform" />
                    Pay Now
                  </Button>
                  <button
                    onClick={() => handleDeleteClick(debt)}
                    className="p-5 text-rose-500 bg-rose-50 rounded-none hover:bg-rose-100 active:scale-90 transition-all shadow-sm"
                    title="Delete Transaction"
                  >
                    <Trash2 className="h-6 w-6" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Payment Confirmation Modal */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => { setIsPayModalOpen(false); setDebtToPay(null); }}
        title="Confirm Payment"
      >
        <div className="space-y-8">
          <div className="flex items-center gap-6 p-6 bg-emerald-50 rounded-none text-emerald-700 border border-emerald-100">
            <div className="bg-emerald-100 p-3 rounded-none">
              <Banknote className="h-8 w-8" />
            </div>
            <div>
              <p className="text-xl font-black leading-none">Confirm Payment?</p>
              <p className="text-sm font-medium mt-1 opacity-80 uppercase tracking-wider">Marking this debt as fully paid.</p>
            </div>
          </div>
          
          <div className="bg-slate-50 p-6 rounded-none border border-slate-100 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Customer</span>
              <span className="font-black text-slate-900">{debtToPay?.customerName || 'Walk-in Customer'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Amount to Pay</span>
              <span className="text-2xl font-black text-emerald-600">{formatCurrency(debtToPay?.totalPrice || 0)}</span>
            </div>
          </div>

          <p className="text-slate-600 font-medium px-2 text-center">
            Are you sure you want to mark this balance as <span className="font-black text-emerald-600 underline decoration-emerald-500 decoration-2 underline-offset-4 tracking-tight">FULLY PAID</span>?
          </p>

          <div className="flex gap-4 pt-2">
            <Button variant="secondary" className="flex-1 h-14 rounded-none font-bold" onClick={() => setIsPayModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="secondary" className="flex-1 h-14 rounded-none font-bold bg-emerald-600 text-white hover:bg-emerald-700 border-none shadow-xl shadow-emerald-200/50" onClick={confirmPayment}>
              Confirm Payment
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setDebtToDelete(null); }}
        title="Confirm Deletion"
      >
        <div className="space-y-8">
          <div className="flex items-center gap-6 p-6 bg-rose-50 rounded-none text-rose-700 border border-rose-100">
            <div className="bg-rose-100 p-3 rounded-none">
              <AlertCircle className="h-8 w-8" />
            </div>
            <div>
              <p className="text-xl font-black leading-none">Are you sure?</p>
              <p className="text-sm font-medium mt-1 opacity-80 uppercase tracking-wider">This action cannot be undone.</p>
            </div>
          </div>
          
          <p className="text-slate-600 font-medium px-2">
            You are about to delete the debt record for <span className="font-black text-slate-900 underline decoration-rose-500 decoration-2 underline-offset-4">{debtToDelete?.customerName || 'this customer'}</span>. 
            This will permanently remove the transaction from your records.
          </p>

          <div className="flex gap-4 pt-2">
            <Button variant="secondary" className="flex-1 h-14 rounded-none font-bold" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="secondary" className="flex-1 h-14 rounded-none font-bold bg-rose-600 text-white hover:bg-rose-700 border-none shadow-xl shadow-rose-200/50" onClick={confirmDelete}>
              Delete Record
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
        title="Payment Receipt"
      >
        <div className="space-y-8">
          <div className="bg-slate-50 p-8 rounded-none overflow-hidden border border-slate-100">
            {selectedDebt && receiptSettings && (
              <Receipt 
                settings={receiptSettings}
                items={Array.isArray(selectedDebt.items) ? selectedDebt.items.map(item => ({
                  name: item.product?.name || 'Unknown Product',
                  quantity: item.quantity,
                  price: item.price
                })) : []}
                total={selectedDebt.totalPrice}
                paymentType="CASH (PAID DEBT)"
                customerName={selectedDebt.customerName}
                date={new Date().toISOString()}
              />
            )}
          </div>

          <div className="flex gap-4 no-print">
            <Button variant="secondary" className="flex-1 h-14 rounded-none font-bold" onClick={() => setShowReceipt(false)}>
              Close
            </Button>
            <Button className="flex-1 h-14 rounded-none font-bold bg-brand-600 hover:bg-brand-700 shadow-xl shadow-brand-200/50" onClick={() => window.print()}>
              <Printer className="mr-3 h-5 w-5" />
              Print Receipt
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
