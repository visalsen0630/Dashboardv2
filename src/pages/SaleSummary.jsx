import { useState, useEffect } from "react";
import { getSales } from "../firebase/db";
import DashboardLayout from "../components/DashboardLayout";

export default function SaleSummary() {
  const [sales, setSales] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState('month');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const user = JSON.parse(localStorage.getItem("user"));
  const selectedCompanyId = localStorage.getItem("selectedCompanyId") || user?.company_id;

  const handlePreview = async () => {
    if (!startDate || !endDate) {
      alert('Please select both start date and end date before previewing the report.');
      return;
    }

    setLoading(true);
    setShowPreview(true);
    try {
      if (selectedCompanyId) {
        const allSales = await getSales(selectedCompanyId, null, { limit: 500 });
        const filtered = allSales.filter(s => {
          const d = s.created_at?.seconds ? new Date(s.created_at.seconds * 1000) : new Date(s.created_at);
          return d >= new Date(startDate) && d <= new Date(new Date(endDate).setHours(23,59,59,999));
        });
        setSales(filtered);
        const totalRevenue = filtered.reduce((a, s) => a + parseFloat(s.total_amount || 0), 0);
        const totalDiscount = filtered.reduce((a, s) => a + parseFloat(s.discount || 0), 0);
        setStats({ total_receipts: filtered.length, net_sales: totalRevenue, total_discounts: totalDiscount });
      }
    } catch (err) {
      console.error("Error fetching sales data:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSales = sales.filter(sale =>
    searchTerm === '' ||
    sale.cashier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.location_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sale Summary Report</h1>
          <p className="text-gray-600">Detailed sales transaction history and analysis</p>
        </div>

        {/* Filters */}
        <div className="bg-white shadow-sm rounded-lg p-4 mb-6 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option>Select store...</option>
              <option>All Stores</option>
            </select>
          </div>

          <div className="flex-1 min-w-[150px]">
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option>Completed</option>
              <option>Pending</option>
              <option>Cancelled</option>
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

          <button
            onClick={handlePreview}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Preview
          </button>

          <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>

        {!showPreview ? (
          <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow-sm">
            <div className="text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-600 text-lg mb-2">Select Date Range</p>
              <p className="text-gray-500 text-sm">Please select start and end dates, then click Preview to view the report</p>
            </div>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500 text-lg">Loading sales data...</div>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white shadow-md rounded-xl p-6 border-l-4 border-blue-500">
                <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Total Sales</h3>
                <p className="text-3xl font-bold text-gray-900">${parseFloat(stats.total_sales || 0).toFixed(2)}</p>
              </div>

              <div className="bg-white shadow-md rounded-xl p-6 border-l-4 border-green-500">
                <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Transactions</h3>
                <p className="text-3xl font-bold text-gray-900">{stats.total_transactions || 0}</p>
              </div>

              <div className="bg-white shadow-md rounded-xl p-6 border-l-4 border-purple-500">
                <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Average Sale</h3>
                <p className="text-3xl font-bold text-gray-900">${parseFloat(stats.average_sale || 0).toFixed(2)}</p>
              </div>

              <div className="bg-white shadow-md rounded-xl p-6 border-l-4 border-yellow-500">
                <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Total Tax</h3>
                <p className="text-3xl font-bold text-gray-900">${parseFloat(stats.total_tax || 0).toFixed(2)}</p>
              </div>
            </div>

            {/* Sales Table */}
            <div className="bg-white shadow-md rounded-xl overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">Sales Transactions</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Showing {filteredSales.length} of {sales.length} transactions
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Receipt #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cashier
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tax
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSales.length > 0 ? (
                      filteredSales.map((sale) => (
                        <tr key={sale.id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(sale.created_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-600">
                            #{sale.id.substring(0, 8)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {sale.location_name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {sale.cashier_name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                            {sale.order_type?.replace('_', ' ') || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              sale.status === 'paid'
                                ? 'bg-green-100 text-green-800'
                                : sale.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {sale.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                            ${parseFloat(sale.total_amount - sale.tax).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                            ${parseFloat(sale.tax).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                            ${parseFloat(sale.total_amount).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                          No sales transactions found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Total: {filteredSales.length} transactions
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    Grand Total: $
                    {filteredSales
                      .reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0)
                      .toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Sale Summary Report Preview</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                  >
                    Print
                  </button>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white shadow-md rounded-xl p-6 border-l-4 border-blue-500">
                    <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Total Sales</h3>
                    <p className="text-3xl font-bold text-gray-900">${parseFloat(stats.total_sales || 0).toFixed(2)}</p>
                  </div>

                  <div className="bg-white shadow-md rounded-xl p-6 border-l-4 border-green-500">
                    <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Transactions</h3>
                    <p className="text-3xl font-bold text-gray-900">{stats.total_transactions || 0}</p>
                  </div>

                  <div className="bg-white shadow-md rounded-xl p-6 border-l-4 border-purple-500">
                    <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Average Sale</h3>
                    <p className="text-3xl font-bold text-gray-900">${parseFloat(stats.average_sale || 0).toFixed(2)}</p>
                  </div>

                  <div className="bg-white shadow-md rounded-xl p-6 border-l-4 border-yellow-500">
                    <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Total Tax</h3>
                    <p className="text-3xl font-bold text-gray-900">${parseFloat(stats.total_tax || 0).toFixed(2)}</p>
                  </div>
                </div>

                {/* Sales Table */}
                <div className="bg-white shadow-md rounded-xl overflow-hidden">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800">Sales Transactions</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Showing {filteredSales.length} of {sales.length} transactions
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date & Time
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Receipt #
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Location
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Cashier
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tax
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredSales.length > 0 ? (
                          filteredSales.map((sale) => (
                            <tr key={sale.id} className="hover:bg-gray-50 transition">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {new Date(sale.created_at).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-600">
                                #{sale.id.substring(0, 8)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {sale.location_name || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {sale.cashier_name || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                                {sale.order_type?.replace('_', ' ') || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  sale.status === 'paid'
                                    ? 'bg-green-100 text-green-800'
                                    : sale.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {sale.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                ${parseFloat(sale.total_amount - sale.tax).toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                                ${parseFloat(sale.tax).toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                                ${parseFloat(sale.total_amount).toFixed(2)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                              No sales transactions found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Table Footer */}
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600">
                        Total: {filteredSales.length} transactions
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        Grand Total: $
                        {filteredSales
                          .reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0)
                          .toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
