import { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/config";
import { getUserLocations } from "../firebase/db";
import DashboardLayout from "../components/DashboardLayout";

export default function RevenueSummary() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [period, setPeriod] = useState('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');

  const user = JSON.parse(localStorage.getItem("user"));
  const selectedCompanyId = localStorage.getItem("selectedCompanyId") || user?.company_id;

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

      let sales = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          created_at: data.created_at?.toDate ? data.created_at.toDate() : new Date(data.created_at),
        };
      }).filter(s =>
        (s.status === 'paid') &&
        s.created_at >= start &&
        s.created_at <= end &&
        (!selectedLocation || s.location_id === selectedLocation)
      );

      // Group by date + location
      const byKey = {};
      sales.forEach(s => {
        const date = s.created_at.toLocaleDateString('en-CA'); // YYYY-MM-DD
        const loc = s.location_id || 'unknown';
        const key = `${date}_${loc}`;
        if (!byKey[key]) {
          byKey[key] = {
            date,
            location_name: s.location_name || loc,
            gross_sale: 0,
            discount: 0,
            net_sale: 0,
            usd_amount: 0,
          };
        }
        const net = parseFloat(s.total_amount || 0);
        const disc = parseFloat(s.discount || 0);
        byKey[key].net_sale += net;
        byKey[key].discount += disc;
        byKey[key].gross_sale += net + disc;
        byKey[key].usd_amount += net;
      });

      setRows(Object.values(byKey).sort((a, b) => a.date.localeCompare(b.date)));
    } catch (err) {
      console.error("Error fetching revenue data:", err);
    } finally {
      setLoading(false);
    }
  };

  const totalGross = rows.reduce((s, r) => s + r.gross_sale, 0);
  const totalDiscount = rows.reduce((s, r) => s + r.discount, 0);
  const totalNet = rows.reduce((s, r) => s + r.net_sale, 0);
  const totalUsd = rows.reduce((s, r) => s + r.usd_amount, 0);

  return (
    <DashboardLayout>
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Revenue Summary Report</h1>
            <p className="text-gray-600 text-sm">Comprehensive revenue breakdown and analysis</p>
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
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="shrink-0 w-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
          >
            <option value="">All Stores</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
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

        {/* Report Content — inline, no modal */}
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
              <p className="text-gray-500">Loading revenue data...</p>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-xl overflow-hidden">
            {/* Report header for print */}
            <div className="px-6 py-4 border-b">
              <p className="text-sm text-gray-500">
                Period: {startDate} to {endDate}
                {selectedLocation && ` · ${locations.find(l => l.id === selectedLocation)?.name || selectedLocation}`}
              </p>
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
                    <th colSpan="3" className="px-4 py-2 text-center border border-blue-500">Payment Type</th>
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
                    <th className="px-2 py-2 text-center border border-blue-500">KHR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.length > 0 ? (
                    <>
                      {rows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium border border-gray-100">{row.location_name}</td>
                          <td className="px-4 py-3 border border-gray-100">{row.date}</td>
                          <td className="px-4 py-3 text-right font-semibold border border-gray-100">${row.gross_sale.toFixed(2)}</td>
                          {/* Discount Item */}
                          <td className="px-2 py-3 text-center border border-gray-100">0.00</td>
                          <td className="px-2 py-3 text-center border border-gray-100">${row.discount.toFixed(2)}</td>
                          <td className="px-2 py-3 text-center border border-gray-100">0.00</td>
                          <td className="px-2 py-3 text-center border border-gray-100">-</td>
                          {/* Surcharge */}
                          <td className="px-2 py-3 text-center border border-gray-100">0.00</td>
                          <td className="px-2 py-3 text-center border border-gray-100">0.00</td>
                          <td className="px-2 py-3 text-center border border-gray-100">0.00</td>
                          {/* VAT */}
                          <td className="px-4 py-3 text-center border border-gray-100">0.00</td>
                          {/* Discount Type */}
                          <td className="px-2 py-3 text-center border border-gray-100">0.00</td>
                          <td className="px-2 py-3 text-center border border-gray-100">0.00</td>
                          {/* Net Sale */}
                          <td className="px-4 py-3 text-right font-bold text-green-600 border border-gray-100">${row.net_sale.toFixed(2)}</td>
                          {/* Payment Type */}
                          <td className="px-2 py-3 text-center border border-gray-100">-</td>
                          <td className="px-2 py-3 text-center border border-gray-100">${row.usd_amount.toFixed(2)}</td>
                          <td className="px-2 py-3 text-center border border-gray-100">0.00</td>
                        </tr>
                      ))}
                      {/* Total Row */}
                      <tr className="bg-gray-900 text-white font-bold">
                        <td colSpan="2" className="px-4 py-3 text-center border border-gray-700">TOTAL</td>
                        <td className="px-4 py-3 text-right border border-gray-700">${totalGross.toFixed(2)}</td>
                        <td className="px-2 py-3 text-center border border-gray-700">0.00</td>
                        <td className="px-2 py-3 text-center border border-gray-700">${totalDiscount.toFixed(2)}</td>
                        <td className="px-2 py-3 text-center border border-gray-700">0.00</td>
                        <td className="px-2 py-3 text-center border border-gray-700">-</td>
                        <td className="px-2 py-3 text-center border border-gray-700">0.00</td>
                        <td className="px-2 py-3 text-center border border-gray-700">0.00</td>
                        <td className="px-2 py-3 text-center border border-gray-700">0.00</td>
                        <td className="px-4 py-3 text-center border border-gray-700">0.00</td>
                        <td className="px-2 py-3 text-center border border-gray-700">0.00</td>
                        <td className="px-2 py-3 text-center border border-gray-700">0.00</td>
                        <td className="px-4 py-3 text-right border border-gray-700">${totalNet.toFixed(2)}</td>
                        <td className="px-2 py-3 text-center border border-gray-700">-</td>
                        <td className="px-2 py-3 text-center border border-gray-700">${totalUsd.toFixed(2)}</td>
                        <td className="px-2 py-3 text-center border border-gray-700">0.00</td>
                      </tr>
                    </>
                  ) : (
                    <tr>
                      <td colSpan="17" className="px-6 py-12 text-center text-gray-500">
                        No sales found for the selected date range
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
