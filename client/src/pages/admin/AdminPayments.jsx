import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import PaymentReceipt from '../../components/documents/PaymentReceipt';
import { CreditCard, FileText, Search } from 'lucide-react';

export default function AdminPayments() {
  const { error } = useToast();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Receipt Modal
  const [viewingReceipt, setViewingReceipt] = useState(null);

  useEffect(() => {
    async function loadPayments() {
      try {
        setLoading(true);
        const res = await api.get('/admin/payments');
        setPayments(res.data.payments || []);
      } catch (err) {
        error('Failed to load payment transactions.');
      } finally {
        setLoading(false);
      }
    }
    loadPayments();
  }, []);

  const filtered = payments.filter((p) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      p.payment_id.toLowerCase().includes(term) ||
      p.booking_id.toLowerCase().includes(term) ||
      p.customer_name.toLowerCase().includes(term) ||
      p.vehicle_number.toLowerCase().includes(term)
    );
  });

  const handleOpenReceipt = async (p) => {
    try {
      const res = await api.get(`/payments/${p.id}`);
      setViewingReceipt(res.data.receipt);
    } catch {
      // Fallback
      setViewingReceipt({
        payment_id: p.payment_id,
        booking_id: p.booking_id,
        customer_name: p.customer_name,
        customer_email: p.customer_email,
        vehicle_number: p.vehicle_number,
        slot_number: p.slot_number,
        amount: p.amount,
        payment_method: p.payment_method,
        payment_date: p.payment_date,
        duration: 3,
        hourly_rate: 30
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Payment Transactions Audit</h2>
        <p className="text-xs text-gray-500 mt-1">Audit trail of all parking revenue and digital payment settlements</p>
      </div>

      <Card bodyClassName="p-4">
        <div className="max-w-md relative">
          <input
            type="text"
            placeholder="Search by Payment ID, Booking ID, Customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs rounded-lg border border-[#DDE5DD] px-3 py-2 pl-9 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        </div>
      </Card>

      <Card bodyClassName="p-0">
        {loading ? (
          <div className="p-12 text-center text-gray-500 text-sm">Loading payments...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-sm">No payment records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7FAF7] border-b border-[#DDE5DD] text-gray-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Payment ID</th>
                  <th className="px-5 py-3.5">Booking Ref</th>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Vehicle</th>
                  <th className="px-5 py-3.5">Slot</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Method</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-gray-900">{p.payment_id}</td>
                    <td className="px-5 py-4 font-mono text-gray-600">{p.booking_id}</td>
                    <td className="px-5 py-4 font-medium text-gray-900">{p.customer_name}</td>
                    <td className="px-5 py-4 font-mono text-gray-800">{p.vehicle_number}</td>
                    <td className="px-5 py-4 font-bold text-[#2E7D32]">{p.slot_number}</td>
                    <td className="px-5 py-4 font-bold text-gray-900">₹{p.amount}</td>
                    <td className="px-5 py-4 text-gray-700">{p.payment_method}</td>
                    <td className="px-5 py-4">
                      <Badge variant="Paid">Paid</Badge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={FileText}
                        onClick={() => handleOpenReceipt(p)}
                      >
                        Receipt
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Receipt Modal */}
      <Modal
        isOpen={!!viewingReceipt}
        onClose={() => setViewingReceipt(null)}
        title="Official Payment Receipt"
        maxWidth="max-w-xl"
      >
        <PaymentReceipt
          receipt={viewingReceipt}
          onClose={() => setViewingReceipt(null)}
        />
      </Modal>
    </div>
  );
}
