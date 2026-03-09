import React from 'react';
import { 
  User as UserIcon, 
  Search, 
  Calendar, 
  DollarSign, 
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Printer
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { formatCurrency, cn } from '../../utils/helpers';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Receipt } from '../../components/dashboard/Receipt';
import { Sale } from '../../types';
import api from '../../services/api';

export const Debts = () => {
  const { fetchStats, receiptSettings, fetchReceiptSettings } = useStore();
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
      const debtSales = res.data.filter((s: Sale) => s.paymentType === 'debt');
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
      await api.put(`/sales/${debt.id}/pay`); 
      fetchDebts();
      fetchStats();
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
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Utang Management</h2>
          <p className="text-gray-500">Track and manage customer debts</p>
        </div>
        <div className="bg-rose-50 px-6 py-3 rounded-2xl border border-rose-100 flex items-center gap-4">
          <div className="bg-rose-600 p-2 rounded-xl">
            <DollarSign className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">Total Receivables</p>
            <p className="text-2xl font-black text-rose-700">{formatCurrency(totalDebt)}</p>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by customer name or items..."
          className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          [1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-2xl" />)
        ) : filteredDebts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
            <div className="bg-gray-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No active debts!</h3>
            <p className="text-gray-500">All customers have paid their balances.</p>
          </div>
        ) : (
          filteredDebts.map((debt) => (
            <div key={debt.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <UserIcon className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{debt.customerName}</h3>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(debt.createdAt).toLocaleDateString()}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-gray-300" />
                    <span className="line-clamp-1 max-w-[200px]">{debt.items}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-8">
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Amount Owed</p>
                  <p className="text-xl font-black text-rose-600">{formatCurrency(debt.totalPrice)}</p>
                </div>
                <Button 
                  onClick={() => handleMarkAsPaid(debt)}
                  className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100"
                >
                  Mark as Paid
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Receipt Modal */}
      <Modal
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
        title="Payment Receipt"
      >
        <div className="space-y-6">
          <div className="bg-gray-100 p-4 rounded-3xl overflow-hidden">
            {selectedDebt && receiptSettings && (
              <Receipt 
                settings={receiptSettings}
                items={selectedDebt.items ? selectedDebt.items.split(',').map(item => {
                  const match = item.match(/(.+) \(x(\d+)\)/);
                  return {
                    name: match ? match[1] : item,
                    quantity: match ? parseInt(match[2]) : 1,
                    price: 0 // We don't have individual prices here, but total is correct
                  };
                }) : []}
                total={selectedDebt.totalPrice}
                paymentType="CASH (PAID DEBT)"
                customerName={selectedDebt.customerName}
                date={new Date().toISOString()}
              />
            )}
          </div>

          <div className="flex gap-3 no-print">
            <Button variant="secondary" className="flex-1" onClick={() => setShowReceipt(false)}>
              Close
            </Button>
            <Button className="flex-1" onClick={() => window.print()}>
              <Printer className="mr-2 h-5 w-5" />
              Print Receipt
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
