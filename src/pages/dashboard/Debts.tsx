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
  const { fetchStats, receiptSettings, fetchReceiptSettings, markAsPaid } = useStore();
  const [debts, setDebts] = React.useState<Sale[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedDebt, setSelectedDebt] = React.useState<Sale | null>(null);
  const [showReceipt, setShowReceipt] = React.useState(false);

  const fetchDebts = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/sales');
      // Filter only debts
      const debtSales = (res.data || []).filter((s: Sale) => s.paymentType === 'debt');
      setDebts(debtSales);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDebts();
    fetchReceiptSettings();
  }, [fetchDebts, fetchReceiptSettings]);

  const handleMarkAsPaid = async (debt: Sale) => {
    try {
      await markAsPaid(debt.id);
      fetchDebts();
      setSelectedDebt({ ...debt, paymentType: 'cash' });
      setShowReceipt(true);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredDebts = debts.filter(d => 
    d.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.items?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalDebt = filteredDebts.reduce((sum, d) => sum + d.totalPrice, 0);

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900">Utang Management</h2>
          <p className="text-slate-500 font-medium mt-1">Track and manage customer credit balances</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-rose-50 px-8 py-4 rounded-2xl border border-rose-100 flex items-center gap-6 shadow-sm">
            <div className="bg-rose-600 p-3 rounded-2xl shadow-lg shadow-rose-200">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Total Receivables</p>
              <p className="text-3xl font-black text-rose-700 tracking-tighter">{formatCurrency(totalDebt)}</p>
            </div>
          </div>
          <Button 
            onClick={() => navigate('/pos?type=debt')}
            className="h-14 px-8 rounded-2xl bg-rose-600 hover:bg-rose-700 shadow-xl shadow-rose-200/50 font-bold"
          >
            <Plus className="mr-2 h-5 w-5" />
            New Utang
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search by customer name or items..."
          className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-100 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-medium"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {isLoading ? (
          [1,2,3].map(i => <div key={i} className="h-28 bg-white rounded-2xl animate-pulse border border-slate-100" />)
        ) : filteredDebts.length === 0 ? (
          <div className="text-center py-24 bento-card border-dashed">
            <div className="bg-slate-50 h-20 w-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-black text-slate-900">No active debts!</h3>
            <p className="text-slate-500 font-medium mt-2">All customers have paid their balances.</p>
          </div>
        ) : (
          filteredDebts.map((debt) => (
            <div key={debt.id} className="bento-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500" />
              <div className="flex items-center gap-6">
                <div className="h-16 w-16 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-all duration-300">
                  <Clock className="h-8 w-8" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-black text-slate-900">Transaction #{debt.id}</h3>
                    <span className="px-3 py-1 rounded-lg bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest border border-rose-100">
                      Unpaid
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-400 mt-2 font-medium">
                    <span className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(debt.createdAt).toLocaleDateString()}
                    </span>
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-200" />
                    <span className="line-clamp-1 max-w-[300px] italic">{debt.items}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-10">
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Amount Owed</p>
                  <p className="text-3xl font-black text-rose-600 tracking-tighter">{formatCurrency(debt.totalPrice)}</p>
                </div>
                <Button 
                  onClick={() => handleMarkAsPaid(debt)}
                  className="bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-100 h-14 px-8 rounded-2xl font-bold"
                >
                  <Banknote className="mr-3 h-5 w-5" />
                  Mark as Paid
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
        title="Payment Receipt"
      >
        <div className="space-y-8">
          <div className="bg-slate-50 p-8 rounded-3xl overflow-hidden border border-slate-100">
            {selectedDebt && receiptSettings && (
              <Receipt 
                settings={receiptSettings}
                items={selectedDebt.items ? selectedDebt.items.split(',').map(item => {
                  const match = item.match(/(.+) \(x(\d+)\)/);
                  return {
                    name: match ? match[1] : item,
                    quantity: match ? parseInt(match[2]) : 1,
                    price: 0 
                  };
                }) : []}
                total={selectedDebt.totalPrice}
                paymentType="CASH (PAID DEBT)"
                customerName={selectedDebt.customerName}
                date={new Date().toISOString()}
              />
            )}
          </div>

          <div className="flex gap-4 no-print">
            <Button variant="secondary" className="flex-1 h-14 rounded-2xl font-bold" onClick={() => setShowReceipt(false)}>
              Close
            </Button>
            <Button className="flex-1 h-14 rounded-2xl font-bold bg-brand-600 hover:bg-brand-700 shadow-xl shadow-brand-200/50" onClick={() => window.print()}>
              <Printer className="mr-3 h-5 w-5" />
              Print Receipt
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
