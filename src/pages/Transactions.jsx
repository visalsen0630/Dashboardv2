import { useState, useEffect } from "react";
import { getSales } from "../firebase/db";
import DashboardLayout from "../components/DashboardLayout";
import { FaEye, FaFileExcel } from 'react-icons/fa';
import { TIMEZONE, TIMEZONE_DISPLAY } from "../utils/timezone";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);

  const user = JSON.parse(localStorage.getItem("user"));
  const selectedCompanyId = localStorage.getItem("selectedCompanyId") || user?.company_id;
  const selectedLocationId = localStorage.getItem("selectedLocationId");

  useEffect(() => {
    if (selectedCompanyId) {
      fetchTransactions();
    }
  }, [selectedCompanyId, selectedLocationId, dateRange]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const sales = await getSales(selectedCompanyId, selectedLocationId || null, { limit: 1000 });

      // Transform sales to transactions format
      const transactionList = sales.map(sale => ({
        id: sale.id,
        transactionCode: `100011${String(sale.id).padStart(4, '0')}`,
        outletName: sale.location_name || selectedLocationId || "N/A",
        orderId: sale.id,
        customerName: sale.full_name || sale.customer_name || "Guest",
        amount: parseFloat(sale.total_amount || 0),
        type: sale.payment_method === 'cash' ? 'Cash payment' :
              sale.payment_method === 'credit_card' ? 'Card payment' :
              sale.payment_method === 'mobile' ? 'Mobile payment' :
              'Delivery order payment',
        createdAt: sale.created_at?.toDate ? sale.created_at.toDate() : new Date(sale.created_at),
      }));

      // Filter transactions by date range on the client side as well
      // Handle timezone conversion properly
      const filtered = transactionList.filter(transaction => {
        const transactionDate = new Date(transaction.createdAt);

        // Convert selected dates to Cambodia timezone boundaries
        const startDateTime = new Date(dateRange.start + 'T00:00:00+07:00');
        const endDateTime = new Date(dateRange.end + 'T23:59:59.999+07:00');

        return transactionDate >= startDateTime && transactionDate <= endDateTime;
      });

      setTransactions(transactionList);
      setFilteredTransactions(filtered);
    } catch (err) {
      console.error("Error fetching transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    alert("Export to Excel functionality - Coming soon!");
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  return (
    <DashboardLayout>
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
            <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
              ⏰ All times are shown in {TIMEZONE_DISPLAY} timezone
            </div>
          </div>
        </div>

        {/* Date Range and Actions */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <span className="text-gray-500">-</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium"
            >
              <FaFileExcel /> Export Excel
            </button>
            <button className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
              <FaEye size={20} />
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-orange-500 text-white">
                  <th className="px-4 py-3 text-left text-sm font-semibold">Transaction Code</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Outlet Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Order ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    <div className="flex items-center gap-2">
                      Customer Name
                      <button className="px-2 py-1 bg-white text-orange-500 rounded text-xs font-medium hover:bg-gray-100 transition">
                        ⚡ Ask AI
                      </button>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">MCA (Balance Fluctuations)</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                      Loading transactions...
                    </td>
                  </tr>
                ) : currentItems.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  currentItems.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{transaction.transactionCode}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{transaction.outletName}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{transaction.orderId}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{transaction.customerName}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <span className={transaction.amount < 0 ? 'text-red-600' : 'text-gray-900'}>
                          {transaction.amount < 0 ? '-' : ''}${Math.abs(transaction.amount).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{transaction.type}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredTransactions.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Show {indexOfFirstItem + 1} To {Math.min(indexOfLastItem, filteredTransactions.length)} Of {filteredTransactions.length} Entries
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1 border border-gray-300 rounded"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ←
                </button>
                <span className="px-3 py-1 text-sm text-gray-700">
                  Page {currentPage} of {totalPages || 1}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
