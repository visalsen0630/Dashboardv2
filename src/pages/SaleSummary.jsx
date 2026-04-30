import { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/config";
import { getUserLocations } from "../firebase/db";
import DashboardLayout from "../components/DashboardLayout";

export default function SaleSummary() {
  const [sales, setSales] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');

  const user = JSON.parse(localStorage.getItem("user"));
  const selectedCompanyId = localStorage.getItem("selectedCompanyId") || user?.company_id;

  useEffect(() => {
    if (selectedCompanyId && user?.id) {
      getUserLocations(user.id, selectedCompanyId).then(setLocations).catch(console.error);
    }
  }, [selectedCompanyId]);

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

      const filtered = snap.docs
        .map(d => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            created_at: data.created_at?.toDate ? data.created_at.toDate() : new Date(data.created_at),
          };
        })
        .filter(s =>
          s.status === 'paid' &&
          s.created_at >= start &&
          s.created_at <= end &&
          (!selectedLocation || s.location_id === selectedLocation)
        )
        .sort((a, b) => b.created_at - a.created_at);

      setSales(filtered);
      const netSales = filtered.reduce((a, s) => a + parseFloat(s.total_amount || 0), 0);
      const totalDiscount = filtered.reduce((a, s) => a + parseFloat(s.discount || 0), 0);
      const totalTax = filtered.reduce((a, s) => a + parseFloat(s.tax || 0), 0);
      setStats({
        count: filtered.length,
        net_sales: netSales,
        gross_sales: netSales + totalDiscount,
        total_discounts: totalDiscount,
        total_tax: totalTax,
        avg_sale: filtered.length > 0 ? netSales / filtered.length : 0,
      });
    } catch (err) {
      console.error("Error fetching sales:", err);
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
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Sale Summary Report</h1>
            <p className="text-gray-600 text-sm">Detailed sales transaction history</p>
          </div>
          {showReport && (
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white shadow-sm rounded-lg p-4 mb-6 flex items-center gap-2 overflow-x-auto">
          <select value={selectedLocation} onChange={e => setSelectedLocation(e.target.value)}
            className="shrink-0 w-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm">
            <option value="">All Stores</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
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
              <p className="text-gray-500">Loading sales data...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white shadow-sm rounded-xl p-5 border-l-4 border-blue-500">
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">Gross Sales</p>
                <p className="text-2xl font-bold text-gray-900">${stats.gross_sales.toFixed(2)}</p>
              </div>
              <div className="bg-white shadow-sm rounded-xl p-5 border-l-4 border-green-500">
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">Net Sales</p>
                <p className="text-2xl font-bold text-gray-900">${stats.net_sales.toFixed(2)}</p>
              </div>
              <div className="bg-white shadow-sm rounded-xl p-5 border-l-4 border-red-400">
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">Discounts</p>
                <p className="text-2xl font-bold text-gray-900">${stats.total_discounts.toFixed(2)}</p>
              </div>
              <div className="bg-white shadow-sm rounded-xl p-5 border-l-4 border-purple-500">
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">Transactions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.count}</p>
                <p className="text-xs text-gray-400 mt-1">Avg ${stats.avg_sale.toFixed(2)}</p>
              </div>
            </div>

            {/* Sales Table */}
            <div className="bg-white shadow-md rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-800">Transactions ({startDate} – {endDate})</h2>
                <span className="text-sm text-gray-500">{sales.length} records</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Date & Time</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Receipt #</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Location</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Payment</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-600">Discount</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-600">Tax</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-600">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sales.length > 0 ? sales.map(sale => (
                      <tr key={sale.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-700">{sale.created_at.toLocaleString()}</td>
                        <td className="px-4 py-3 font-mono text-blue-600 text-xs">#{sale.id.substring(0, 8)}</td>
                        <td className="px-4 py-3 text-gray-700">{sale.location_name || sale.location_id || 'N/A'}</td>
                        <td className="px-4 py-3 capitalize text-gray-700">{sale.payment_method || 'N/A'}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {sale.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-red-500">-${parseFloat(sale.discount || 0).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-gray-600">${parseFloat(sale.tax || 0).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">${parseFloat(sale.total_amount || 0).toFixed(2)}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan="8" className="px-6 py-12 text-center text-gray-500">No transactions found</td></tr>
                    )}
                  </tbody>
                  {sales.length > 0 && (
                    <tfoot className="bg-gray-900 text-white font-bold">
                      <tr>
                        <td colSpan="5" className="px-4 py-3">TOTAL ({sales.length} transactions)</td>
                        <td className="px-4 py-3 text-right">-${stats.total_discounts.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right">${stats.total_tax.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right">${stats.net_sales.toFixed(2)}</td>
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
