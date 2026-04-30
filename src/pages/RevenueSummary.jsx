import { useState, useEffect } from "react";
import { getUserLocations, getSalesDashboard } from "../firebase/db";
import DashboardLayout from "../components/DashboardLayout";

export default function RevenueSummary() {
  const [data, setData] = useState({
    overview: {},
    sales_by_stores: [],
    sales_by_payment: [],
    sales_by_channels: []
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const user = JSON.parse(localStorage.getItem("user"));
  const selectedCompanyId = localStorage.getItem("selectedCompanyId") || user?.company_id;

  // Fetch user's accessible locations
  useEffect(() => {
    const fetchLocations = async () => {
      if (selectedCompanyId && user?.id) {
        try {
          const res = await getUserLocations(user.id, selectedCompanyId);
          setLocations(res);
        } catch (err) {
          console.error("Error fetching locations:", err);
        }
      }
    };
    fetchLocations();
  }, [selectedCompanyId, user?.id]);

  const handlePreview = async () => {
    if (!startDate || !endDate) {
      alert('Please select both start date and end date before previewing the report.');
      return;
    }

    setLoading(true);
    setShowPreview(true);
    try {
      if (selectedCompanyId) {
        const analytics = await getSalesDashboard(selectedCompanyId, 'custom', { start: startDate, end: endDate });
        setData(analytics);
      }
    } catch (err) {
      console.error("Error fetching revenue data:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Revenue Summary Report</h1>
          <p className="text-gray-600">Comprehensive revenue breakdown and analysis</p>
        </div>

        {/* Filters */}
        <div className="bg-white shadow-sm rounded-lg p-4 mb-6 flex items-center gap-2 overflow-x-auto">
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="shrink-0 w-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
          >
            <option value="">All Stores</option>
            {locations.map(location => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>

          <select className="shrink-0 w-36 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm">
            <option>Completed</option>
            <option>Pending</option>
            <option>Cancelled</option>
          </select>

          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="shrink-0 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
          />
          <span className="shrink-0 text-gray-500">-</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="shrink-0 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
          />

          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="shrink-0 w-28 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select>

          <button className="shrink-0 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium text-sm">
            ALL
          </button>

          <button
            onClick={handlePreview}
            className="shrink-0 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Preview
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
            <div className="text-gray-500 text-lg">Loading revenue data...</div>
          </div>
        ) : (
          <>
            {/* Revenue Summary Table */}
            <div className="bg-white shadow-md rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-blue-600 text-white">
                    <tr>
                      <th rowSpan="2" className="px-4 py-3 text-left border-r border-blue-500">Outlet</th>
                      <th rowSpan="2" className="px-4 py-3 text-left border-r border-blue-500">Date</th>
                      <th rowSpan="2" className="px-4 py-3 text-right border-r border-blue-500">Gross Sale</th>
                      <th colSpan="4" className="px-4 py-2 text-center border-r border-blue-500">Discount Item</th>
                      <th colSpan="3" className="px-4 py-2 text-center border-r border-blue-500">Surcharge</th>
                      <th rowSpan="2" className="px-4 py-3 text-center border-r border-blue-500">VAT</th>
                      <th colSpan="2" className="px-4 py-2 text-center border-r border-blue-500">Discount Type</th>
                      <th rowSpan="2" className="px-4 py-3 text-right border-r border-blue-500">Net Sale</th>
                      <th colSpan="3" className="px-4 py-2 text-center">Payment Type</th>
                    </tr>
                    <tr>
                      {/* Discount Item columns */}
                      <th className="px-2 py-2 text-center border-r border-blue-500">(%)</th>
                      <th className="px-2 py-2 text-center border-r border-blue-500">($)</th>
                      <th className="px-2 py-2 text-center border-r border-blue-500">15% VAT</th>
                      <th className="px-2 py-2 text-center border-r border-blue-500">Staff</th>
                      {/* Surcharge columns */}
                      <th className="px-2 py-2 text-center border-r border-blue-500">(%)</th>
                      <th className="px-2 py-2 text-center border-r border-blue-500">($)</th>
                      <th className="px-2 py-2 text-center border-r border-blue-500">15% VAT</th>
                      {/* Discount Type columns */}
                      <th className="px-2 py-2 text-center border-r border-blue-500">(%)</th>
                      <th className="px-2 py-2 text-center border-r border-blue-500">($)</th>
                      {/* Payment Type columns */}
                      <th className="px-2 py-2 text-center border-r border-blue-500">KH1</th>
                      <th className="px-2 py-2 text-center border-r border-blue-500">USD</th>
                      <th className="px-2 py-2 text-center">KHR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.sales_by_stores && data.sales_by_stores.length > 0 ? (
                      <>
                        {data.sales_by_stores.map((store, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium">{store.store_name || 'Unknown'}</td>
                            <td className="px-4 py-3">{new Date().toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-right font-semibold">${parseFloat(store.gross_sales || 0).toFixed(2)}</td>
                            {/* Discount Item */}
                            <td className="px-2 py-3 text-center">0.00</td>
                            <td className="px-2 py-3 text-center">0.00</td>
                            <td className="px-2 py-3 text-center">0.00</td>
                            <td className="px-2 py-3 text-center">-</td>
                            {/* Surcharge */}
                            <td className="px-2 py-3 text-center">0.00</td>
                            <td className="px-2 py-3 text-center">0.00</td>
                            <td className="px-2 py-3 text-center">0.00</td>
                            {/* VAT */}
                            <td className="px-4 py-3 text-center">0.00</td>
                            {/* Discount Type */}
                            <td className="px-2 py-3 text-center">0.00</td>
                            <td className="px-2 py-3 text-center">0.00</td>
                            {/* Net Sale */}
                            <td className="px-4 py-3 text-right font-bold text-green-600">${parseFloat(store.total_sales || 0).toFixed(2)}</td>
                            {/* Payment Type */}
                            <td className="px-2 py-3 text-center">-</td>
                            <td className="px-2 py-3 text-center">${parseFloat(store.total_sales || 0).toFixed(2)}</td>
                            <td className="px-2 py-3 text-center">0.00</td>
                          </tr>
                        ))}
                        {/* Total Row */}
                        <tr className="bg-gray-800 text-white font-bold">
                          <td colSpan="2" className="px-4 py-3 text-center">TOTAL</td>
                          <td className="px-4 py-3 text-right">
                            ${data.sales_by_stores.reduce((sum, s) => sum + parseFloat(s.gross_sales || 0), 0).toFixed(2)}
                          </td>
                          <td className="px-2 py-3 text-center">0.00</td>
                          <td className="px-2 py-3 text-center">0.00</td>
                          <td className="px-2 py-3 text-center">0.00</td>
                          <td className="px-2 py-3 text-center">-</td>
                          <td className="px-2 py-3 text-center">0.00</td>
                          <td className="px-2 py-3 text-center">0.00</td>
                          <td className="px-2 py-3 text-center">0.00</td>
                          <td className="px-4 py-3 text-center">0.00</td>
                          <td className="px-2 py-3 text-center">0.00</td>
                          <td className="px-2 py-3 text-center">0.00</td>
                          <td className="px-4 py-3 text-right">
                            ${data.sales_by_stores.reduce((sum, s) => sum + parseFloat(s.total_sales || 0), 0).toFixed(2)}
                          </td>
                          <td className="px-2 py-3 text-center">-</td>
                          <td className="px-2 py-3 text-center">
                            ${data.sales_by_stores.reduce((sum, s) => sum + parseFloat(s.total_sales || 0), 0).toFixed(2)}
                          </td>
                          <td className="px-2 py-3 text-center">0.00</td>
                        </tr>
                      </>
                    ) : (
                      <tr>
                        <td colSpan="17" className="px-6 py-12 text-center text-gray-500">
                          No revenue data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Revenue Summary Report Preview</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Print
                  </button>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="bg-white">
                  <div className="mb-4 text-center">
                    <h1 className="text-2xl font-bold text-gray-900">Revenue Summary Report</h1>
                    <p className="text-sm text-gray-600">Period: {period} | Date: {startDate || 'N/A'} to {endDate || 'N/A'}</p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead className="bg-blue-600 text-white">
                        <tr>
                          <th rowSpan="2" className="px-4 py-3 text-left border border-blue-500">Outlet</th>
                          <th rowSpan="2" className="px-4 py-3 text-left border border-blue-500">Date</th>
                          <th rowSpan="2" className="px-4 py-3 text-right border border-blue-500">Gross Sale</th>
                          <th colSpan="4" className="px-4 py-2 text-center border border-blue-500">Discount Item</th>
                          <th colSpan="3" className="px-4 py-2 text-center border border-blue-500">Surcharge</th>
                          <th rowSpan="2" className="px-4 py-3 text-center border border-blue-500">VAT</th>
                          <th colSpan="2" className="px-4 py-2 text-center border border-blue-500">Discount Type</th>
                          <th rowSpan="2" className="px-4 py-3 text-right border border-blue-500">Net Sale</th>
                          <th colSpan="3" className="px-4 py-2 text-center border">Payment Type</th>
                        </tr>
                        <tr>
                          <th className="px-2 py-2 text-center border border-blue-500">(%)</th>
                          <th className="px-2 py-2 text-center border border-blue-500">($)</th>
                          <th className="px-2 py-2 text-center border border-blue-500">15% VAT</th>
                          <th className="px-2 py-2 text-center border border-blue-500">Staff</th>
                          <th className="px-2 py-2 text-center border border-blue-500">(%)</th>
                          <th className="px-2 py-2 text-center border border-blue-500">($)</th>
                          <th className="px-2 py-2 text-center border border-blue-500">15% VAT</th>
                          <th className="px-2 py-2 text-center border border-blue-500">(%)</th>
                          <th className="px-2 py-2 text-center border border-blue-500">($)</th>
                          <th className="px-2 py-2 text-center border border-blue-500">KH1</th>
                          <th className="px-2 py-2 text-center border border-blue-500">USD</th>
                          <th className="px-2 py-2 text-center border">KHR</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {data.sales_by_stores && data.sales_by_stores.length > 0 ? (
                          <>
                            {data.sales_by_stores.map((store, idx) => (
                              <tr key={idx}>
                                <td className="px-4 py-3 font-medium border">{store.store_name || 'Unknown'}</td>
                                <td className="px-4 py-3 border">{new Date().toLocaleDateString()}</td>
                                <td className="px-4 py-3 text-right font-semibold border">${parseFloat(store.gross_sales || 0).toFixed(2)}</td>
                                <td className="px-2 py-3 text-center border">0.00</td>
                                <td className="px-2 py-3 text-center border">0.00</td>
                                <td className="px-2 py-3 text-center border">0.00</td>
                                <td className="px-2 py-3 text-center border">-</td>
                                <td className="px-2 py-3 text-center border">0.00</td>
                                <td className="px-2 py-3 text-center border">0.00</td>
                                <td className="px-2 py-3 text-center border">0.00</td>
                                <td className="px-4 py-3 text-center border">0.00</td>
                                <td className="px-2 py-3 text-center border">0.00</td>
                                <td className="px-2 py-3 text-center border">0.00</td>
                                <td className="px-4 py-3 text-right font-bold text-green-600 border">${parseFloat(store.total_sales || 0).toFixed(2)}</td>
                                <td className="px-2 py-3 text-center border">-</td>
                                <td className="px-2 py-3 text-center border">${parseFloat(store.total_sales || 0).toFixed(2)}</td>
                                <td className="px-2 py-3 text-center border">0.00</td>
                              </tr>
                            ))}
                            <tr className="bg-gray-800 text-white font-bold">
                              <td colSpan="2" className="px-4 py-3 text-center border">TOTAL</td>
                              <td className="px-4 py-3 text-right border">
                                ${data.sales_by_stores.reduce((sum, s) => sum + parseFloat(s.gross_sales || 0), 0).toFixed(2)}
                              </td>
                              <td className="px-2 py-3 text-center border">0.00</td>
                              <td className="px-2 py-3 text-center border">0.00</td>
                              <td className="px-2 py-3 text-center border">0.00</td>
                              <td className="px-2 py-3 text-center border">-</td>
                              <td className="px-2 py-3 text-center border">0.00</td>
                              <td className="px-2 py-3 text-center border">0.00</td>
                              <td className="px-2 py-3 text-center border">0.00</td>
                              <td className="px-4 py-3 text-center border">0.00</td>
                              <td className="px-2 py-3 text-center border">0.00</td>
                              <td className="px-2 py-3 text-center border">0.00</td>
                              <td className="px-4 py-3 text-right border">
                                ${data.sales_by_stores.reduce((sum, s) => sum + parseFloat(s.total_sales || 0), 0).toFixed(2)}
                              </td>
                              <td className="px-2 py-3 text-center border">-</td>
                              <td className="px-2 py-3 text-center border">
                                ${data.sales_by_stores.reduce((sum, s) => sum + parseFloat(s.total_sales || 0), 0).toFixed(2)}
                              </td>
                              <td className="px-2 py-3 text-center border">0.00</td>
                            </tr>
                          </>
                        ) : (
                          <tr>
                            <td colSpan="17" className="px-6 py-12 text-center text-gray-500 border">
                              No revenue data available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
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
