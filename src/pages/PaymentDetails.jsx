import { useState, useEffect } from "react";
import { getSales } from "../firebase/db";
import DashboardLayout from "../components/DashboardLayout";

export default function PaymentDetails() {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('all');

  const user = JSON.parse(localStorage.getItem("user"));
  const selectedCompanyId = localStorage.getItem("selectedCompanyId") || user?.company_id;

  useEffect(() => {
    fetchPaymentDetails();
  }, [selectedCompanyId, startDate, endDate, paymentMethod]);

  const fetchPaymentDetails = async () => {
    setLoading(true);
    try {
      let response = await getSales(selectedCompanyId, null, { limit: 1000 });

      // Client-side date filtering
      if (startDate || endDate) {
        response = response.filter(p => {
          const d = p.created_at?.toDate ? p.created_at.toDate() : new Date(p.created_at);
          if (startDate && d < new Date(startDate + 'T00:00:00+07:00')) return false;
          if (endDate && d > new Date(endDate + 'T23:59:59+07:00')) return false;
          return true;
        });
      }
      if (paymentMethod !== 'all') {
        response = response.filter(p => p.payment_method === paymentMethod);
      }
      setPayments(response);

      // Calculate summary
      const totalAmount = response.reduce((sum, p) => sum + parseFloat(p.total_amount || 0), 0);
      const cashAmount = response.filter(p => p.payment_method === 'cash').reduce((sum, p) => sum + parseFloat(p.total_amount || 0), 0);
      const cardAmount = response.filter(p => p.payment_method === 'card').reduce((sum, p) => sum + parseFloat(p.total_amount || 0), 0);

      setSummary({
        total: totalAmount,
        cash: cashAmount,
        card: cardAmount,
        other: totalAmount - cashAmount - cardAmount
      });
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Details Report</h1>
          <p className="text-gray-600">Detailed breakdown of all payment transactions</p>
        </div>

        {/* Filters */}
        <div className="bg-white shadow-sm rounded-lg p-4 mb-6 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">All Payment Methods</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="qr">QR Code</option>
              <option value="credit">Store Credit</option>
            </select>
          </div>

          <div className="flex-1 min-w-[250px]">
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <span className="text-gray-500">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <button className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium">
            ALL
          </button>

          <button
            onClick={() => window.print()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Preview
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg rounded-xl p-6">
            <h3 className="text-sm font-medium opacity-90 mb-2">Total Payments</h3>
            <p className="text-3xl font-bold">${summary.total?.toFixed(2) || '0.00'}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg rounded-xl p-6">
            <h3 className="text-sm font-medium opacity-90 mb-2">Cash Payments</h3>
            <p className="text-3xl font-bold">${summary.cash?.toFixed(2) || '0.00'}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg rounded-xl p-6">
            <h3 className="text-sm font-medium opacity-90 mb-2">Card Payments</h3>
            <p className="text-3xl font-bold">${summary.card?.toFixed(2) || '0.00'}</p>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg rounded-xl p-6">
            <h3 className="text-sm font-medium opacity-90 mb-2">Other Payments</h3>
            <p className="text-3xl font-bold">${summary.other?.toFixed(2) || '0.00'}</p>
          </div>
        </div>

        {/* Payments Table */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500 text-lg">Loading payment details...</div>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Receipt #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date/Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tendered
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Change
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments && payments.length > 0 ? (
                    payments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{payment.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {(payment.created_at?.toDate ? payment.created_at.toDate() : new Date(payment.created_at)).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            payment.payment_method === 'cash' ? 'bg-green-100 text-green-800' :
                            payment.payment_method === 'card' ? 'bg-blue-100 text-blue-800' :
                            payment.payment_method === 'qr' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {payment.payment_method}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                          ${parseFloat(payment.total_amount || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${((parseFloat(payment.tendered_usd || 0)) + (parseFloat(payment.tendered_khr || 0) / 4100)).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                          ${parseFloat(payment.change_usd || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                        No payment details found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
