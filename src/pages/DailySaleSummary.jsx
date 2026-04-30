import { useState, useEffect } from "react";
import { getSales } from "../firebase/db";
import DashboardLayout from "../components/DashboardLayout";

export default function DailySaleSummary() {
  const [dailySales, setDailySales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedStore, setSelectedStore] = useState('all');

  const user = JSON.parse(localStorage.getItem("user"));
  const selectedCompanyId = localStorage.getItem("selectedCompanyId") || user?.company_id;

  useEffect(() => {
    fetchDailySales();
  }, [selectedCompanyId, startDate, endDate]);

  const fetchDailySales = async () => {
    setLoading(true);
    try {
      let sales = await getSales(selectedCompanyId, null, { limit: 2000 });

      // Client-side date filtering
      if (startDate || endDate) {
        sales = sales.filter(s => {
          const d = s.created_at?.toDate ? s.created_at.toDate() : new Date(s.created_at);
          if (startDate && d < new Date(startDate + 'T00:00:00+07:00')) return false;
          if (endDate && d > new Date(endDate + 'T23:59:59+07:00')) return false;
          return true;
        });
      }

      // Group by date
      const grouped = {};
      sales.forEach(s => {
        const d = s.created_at?.toDate ? s.created_at.toDate() : new Date(s.created_at);
        const dateKey = d.toISOString().split('T')[0];
        if (!grouped[dateKey]) {
          grouped[dateKey] = { sale_date: dateKey, order_count: 0, gross_sales: 0, total_discounts: 0, total_tax: 0, net_sales: 0 };
        }
        grouped[dateKey].order_count += 1;
        grouped[dateKey].gross_sales += parseFloat(s.subtotal || 0);
        grouped[dateKey].total_discounts += parseFloat(s.discount || 0);
        grouped[dateKey].total_tax += parseFloat(s.tax || 0);
        grouped[dateKey].net_sales += parseFloat(s.total_amount || 0);
      });

      const result = Object.values(grouped).sort((a, b) => b.sale_date.localeCompare(a.sale_date));
      setDailySales(result);
    } catch (err) {
      console.error("Error fetching daily sales:", err);
      setDailySales([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Daily Sale Summary Report</h1>
          <p className="text-gray-600">Daily breakdown of sales performance</p>
        </div>

        {/* Filters */}
        <div className="bg-white shadow-sm rounded-lg p-4 mb-6 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">All Stores</option>
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

        {/* Daily Sales Table */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500 text-lg">Loading daily sales...</div>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      # Orders
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gross Sales
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Discounts
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tax
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Net Sales
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dailySales && dailySales.length > 0 ? (
                    dailySales.map((day, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {new Date(day.sale_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {day.order_count || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${parseFloat(day.gross_sales || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                          ${parseFloat(day.total_discounts || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${parseFloat(day.total_tax || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                          ${parseFloat(day.net_sales || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                        No daily sales data found
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
