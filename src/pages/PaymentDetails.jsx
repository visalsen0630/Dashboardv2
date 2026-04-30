import { useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/config";
import DashboardLayout from "../components/DashboardLayout";

export default function PaymentDetails() {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('all');

  const user = JSON.parse(localStorage.getItem("user"));
  const selectedCompanyId = localStorage.getItem("selectedCompanyId") || user?.company_id;

  const handlePreview = async () => {
    if (!startDate || !endDate) {
      alert('Please select both start and end dates.');
      return;
    }
    setLoading(true);
    setShowReport(true);
    try {
      const snap = await getDocs(
        query(collection(db, 'sales'), where('company_id', '==', selectedCompanyId))
      );
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      let rows = snap.docs
        .map(d => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            created_at: data.created_at?.toDate ? data.created_at.toDate() : new Date(data.created_at),
          };
        })
        .filter(s => s.status === 'paid' && s.created_at >= start && s.created_at <= end)
        .sort((a, b) => b.created_at - a.created_at);

      if (paymentMethod !== 'all') {
        rows = rows.filter(p => p.payment_method === paymentMethod);
      }

      setPayments(rows);

      const total = rows.reduce((s, p) => s + parseFloat(p.total_amount || 0), 0);
      const cash = rows.filter(p => p.payment_method === 'cash').reduce((s, p) => s + parseFloat(p.total_amount || 0), 0);
      const card = rows.filter(p => p.payment_method === 'card').reduce((s, p) => s + parseFloat(p.total_amount || 0), 0);
      const qr = rows.filter(p => p.payment_method === 'qr').reduce((s, p) => s + parseFloat(p.total_amount || 0), 0);
      setSummary({ total, cash, card, qr, other: total - cash - card - qr });
    } catch (err) {
      console.error("Error fetching payment details:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Payment Details Report</h1>
            <p className="text-gray-600 text-sm">Breakdown of all payment transactions</p>
          </div>
          {showReport && (
            <button onClick={() => window.print()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white shadow-sm rounded-lg p-4 mb-6 flex items-center gap-2 overflow-x-auto">
          <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
            className="shrink-0 w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm">
            <option value="all">All Payment Methods</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="qr">QR Code</option>
          </select>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
            className="shrink-0 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" />
          <span className="shrink-0 text-gray-500">-</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
            className="shrink-0 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" />
          <button onClick={handlePreview}
            className="shrink-0 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Preview
          </button>
        </div>

        {!showReport ? (
          <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow-sm">
            <div className="text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-600 text-lg mb-2">Select Date Range</p>
              <p className="text-gray-500 text-sm">Pick start and end dates, then click Preview</p>
            </div>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow-sm">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-gray-500">Loading payment data...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            {summary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg rounded-xl p-5">
                  <p className="text-sm opacity-90 mb-1">Total</p>
                  <p className="text-2xl font-bold">${summary.total.toFixed(2)}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg rounded-xl p-5">
                  <p className="text-sm opacity-90 mb-1">Cash</p>
                  <p className="text-2xl font-bold">${summary.cash.toFixed(2)}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg rounded-xl p-5">
                  <p className="text-sm opacity-90 mb-1">Card</p>
                  <p className="text-2xl font-bold">${summary.card.toFixed(2)}</p>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg rounded-xl p-5">
                  <p className="text-sm opacity-90 mb-1">QR / Other</p>
                  <p className="text-2xl font-bold">${(summary.qr + summary.other).toFixed(2)}</p>
                </div>
              </div>
            )}

            {/* Payments Table */}
            <div className="bg-white shadow-md rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <p className="text-sm text-gray-500">Period: {startDate} to {endDate}</p>
                <span className="text-sm text-gray-500">{payments.length} records</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-blue-600 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left">Receipt #</th>
                      <th className="px-4 py-3 text-left">Date/Time</th>
                      <th className="px-4 py-3 text-left">Store</th>
                      <th className="px-4 py-3 text-left">Payment Method</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3 text-right">Tendered</th>
                      <th className="px-4 py-3 text-right">Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {payments.length > 0 ? payments.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-blue-600 text-xs">#{p.id.substring(0, 8)}</td>
                        <td className="px-4 py-3 text-gray-700">{p.created_at.toLocaleString()}</td>
                        <td className="px-4 py-3 text-gray-700">{p.location_name || p.location_id || 'N/A'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                            p.payment_method === 'cash' ? 'bg-green-100 text-green-800' :
                            p.payment_method === 'card' ? 'bg-blue-100 text-blue-800' :
                            p.payment_method === 'qr' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>{p.payment_method}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">${parseFloat(p.total_amount || 0).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          ${(parseFloat(p.tendered_usd || 0) + parseFloat(p.tendered_khr || 0) / 4100).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right text-green-600">${parseFloat(p.change_usd || 0).toFixed(2)}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan="7" className="px-6 py-12 text-center text-gray-500">No payment records found</td></tr>
                    )}
                  </tbody>
                  {payments.length > 0 && summary && (
                    <tfoot className="bg-gray-900 text-white font-bold">
                      <tr>
                        <td colSpan="4" className="px-4 py-3">TOTAL ({payments.length})</td>
                        <td className="px-4 py-3 text-right">${summary.total.toFixed(2)}</td>
                        <td className="px-4 py-3"></td>
                        <td className="px-4 py-3"></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
