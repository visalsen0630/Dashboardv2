import React, { useState, useEffect } from "react";
import { getUserLocations, getCategories, getSalesDashboard } from "../firebase/db";
import DashboardLayout from "../components/DashboardLayout";
import * as XLSX from 'xlsx';

export default function ProductSale() {
  const [data, setData] = useState({
    top_items: [],
    top_categories: [],
    sales_by_uom: []
  });
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
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

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      if (selectedCompanyId) {
        try {
          const res = await getCategories(selectedCompanyId, null);
          setCategories(res);
        } catch (err) {
          console.error("Error fetching categories:", err);
        }
      }
    };
    fetchCategories();
  }, [selectedCompanyId]);

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
      console.error("Error fetching product sales data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Group products by category
  const groupedByCategory = () => {
    const items = data.top_items || [];
    const grouped = {};

    items.forEach(item => {
      const categoryName = item.category_name || 'Uncategorized';
      if (!grouped[categoryName]) {
        grouped[categoryName] = [];
      }
      grouped[categoryName].push(item);
    });

    // Filter by selected category if any
    if (selectedCategory && selectedCategory !== '') {
      const filtered = {};
      if (grouped[selectedCategory]) {
        filtered[selectedCategory] = grouped[selectedCategory];
      }
      return filtered;
    }

    return grouped;
  };

  const exportToExcel = () => {
    const grouped = groupedByCategory();
    const workbook = XLSX.utils.book_new();

    // Create data array for Excel
    const excelData = [];

    // Header row with styling info
    excelData.push(['Product Sale Summary Report']);
    excelData.push(['Period:', period]);
    excelData.push(['Date Range:', startDate || 'N/A', 'to', endDate || 'N/A']);
    excelData.push([]);

    // Table headers
    excelData.push(['Category', 'Product Name', 'Units Sold', 'Revenue', 'Avg Price']);

    let grandTotalUnits = 0;
    let grandTotalRevenue = 0;

    // Add data grouped by category
    Object.keys(grouped).forEach(category => {
      const items = grouped[category];
      let categoryTotalUnits = 0;
      let categoryTotalRevenue = 0;

      items.forEach((item, idx) => {
        const units = parseInt(item.units_sold);
        const revenue = parseFloat(item.revenue);
        const avgPrice = revenue / units;

        excelData.push([
          idx === 0 ? category : '',
          item.product_name,
          units,
          revenue,
          avgPrice
        ]);

        categoryTotalUnits += units;
        categoryTotalRevenue += revenue;
      });

      // Category subtotal
      excelData.push([
        `${category} Subtotal`,
        '',
        categoryTotalUnits,
        categoryTotalRevenue,
        categoryTotalRevenue / categoryTotalUnits
      ]);
      excelData.push([]);

      grandTotalUnits += categoryTotalUnits;
      grandTotalRevenue += categoryTotalRevenue;
    });

    // Grand total
    excelData.push([
      'GRAND TOTAL',
      '',
      grandTotalUnits,
      grandTotalRevenue,
      grandTotalRevenue / grandTotalUnits
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet(excelData);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 25 }, // Category
      { wch: 40 }, // Product Name
      { wch: 15 }, // Units Sold
      { wch: 15 }, // Revenue
      { wch: 15 }  // Avg Price
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Product Sales');
    XLSX.writeFile(workbook, `Product_Sale_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <DashboardLayout>
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Product Sale Report</h1>
          <p className="text-gray-600">Detailed product performance and sales analysis</p>
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

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="shrink-0 w-36 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
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

          <button
            onClick={exportToExcel}
            className="shrink-0 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium flex items-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Excel
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
            <div className="text-gray-500 text-lg">Loading product sales data...</div>
          </div>
        ) : (
          <>
            {/* Product Sale Table Grouped by Category */}
            <div className="bg-white shadow-md rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-green-600 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left">Category</th>
                      <th className="px-4 py-3 text-left">Product Name</th>
                      <th className="px-4 py-3 text-right">Units Sold</th>
                      <th className="px-4 py-3 text-right">Revenue</th>
                      <th className="px-4 py-3 text-right">Avg Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const grouped = groupedByCategory();
                      const categoryNames = Object.keys(grouped);

                      if (categoryNames.length === 0) {
                        return (
                          <tr>
                            <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                              No product sales data available
                            </td>
                          </tr>
                        );
                      }

                      let grandTotalUnits = 0;
                      let grandTotalRevenue = 0;

                      return categoryNames.map((categoryName, catIdx) => {
                        const items = grouped[categoryName];
                        let categoryTotalUnits = 0;
                        let categoryTotalRevenue = 0;

                        return (
                          <React.Fragment key={catIdx}>
                            {items.map((item, itemIdx) => {
                              const units = parseInt(item.units_sold);
                              const revenue = parseFloat(item.revenue);
                              const avgPrice = revenue / units;

                              categoryTotalUnits += units;
                              categoryTotalRevenue += revenue;
                              grandTotalUnits += units;
                              grandTotalRevenue += revenue;

                              return (
                                <tr key={`${catIdx}-${itemIdx}`} className="border-b border-gray-200 hover:bg-gray-50">
                                  <td className="px-4 py-3 font-medium text-gray-900">
                                    {itemIdx === 0 ? categoryName : ''}
                                  </td>
                                  <td className="px-4 py-3 text-gray-800">{item.product_name}</td>
                                  <td className="px-4 py-3 text-right text-gray-900">{units.toLocaleString()}</td>
                                  <td className="px-4 py-3 text-right font-semibold text-green-600">
                                    ${revenue.toFixed(2)}
                                  </td>
                                  <td className="px-4 py-3 text-right text-gray-600">
                                    ${avgPrice.toFixed(2)}
                                  </td>
                                </tr>
                              );
                            })}
                            {/* Category Subtotal */}
                            <tr className="bg-gray-100 border-b-2 border-gray-300 font-semibold">
                              <td colSpan="2" className="px-4 py-3 text-right text-gray-900">
                                {categoryName} Subtotal
                              </td>
                              <td className="px-4 py-3 text-right text-gray-900">
                                {categoryTotalUnits.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-right text-green-700">
                                ${categoryTotalRevenue.toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-right text-gray-700">
                                ${(categoryTotalRevenue / categoryTotalUnits).toFixed(2)}
                              </td>
                            </tr>
                          </React.Fragment>
                        );
                      }).concat(
                        <tr key="grand-total" className="bg-gray-800 text-white font-bold">
                          <td colSpan="2" className="px-4 py-3 text-right">GRAND TOTAL</td>
                          <td className="px-4 py-3 text-right">{grandTotalUnits.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">${grandTotalRevenue.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right">${(grandTotalRevenue / grandTotalUnits).toFixed(2)}</td>
                        </tr>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Product Sale Report Preview</h2>
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
                    <h1 className="text-2xl font-bold text-gray-900">Product Sale Summary Report</h1>
                    <p className="text-sm text-gray-600">Period: {period} | Date: {startDate || 'N/A'} to {endDate || 'N/A'}</p>
                  </div>

                  <table className="w-full text-sm border-collapse">
                    <thead className="bg-green-600 text-white">
                      <tr>
                        <th className="px-4 py-3 text-left border border-green-500">Category</th>
                        <th className="px-4 py-3 text-left border border-green-500">Product Name</th>
                        <th className="px-4 py-3 text-right border border-green-500">Units Sold</th>
                        <th className="px-4 py-3 text-right border border-green-500">Revenue</th>
                        <th className="px-4 py-3 text-right border border-green-500">Avg Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const grouped = groupedByCategory();
                        const categoryNames = Object.keys(grouped);

                        if (categoryNames.length === 0) {
                          return (
                            <tr>
                              <td colSpan="5" className="px-6 py-12 text-center text-gray-500 border">
                                No product sales data available
                              </td>
                            </tr>
                          );
                        }

                        let grandTotalUnits = 0;
                        let grandTotalRevenue = 0;

                        return categoryNames.map((categoryName, catIdx) => {
                          const items = grouped[categoryName];
                          let categoryTotalUnits = 0;
                          let categoryTotalRevenue = 0;

                          return (
                            <React.Fragment key={catIdx}>
                              {items.map((item, itemIdx) => {
                                const units = parseInt(item.units_sold);
                                const revenue = parseFloat(item.revenue);
                                const avgPrice = revenue / units;

                                categoryTotalUnits += units;
                                categoryTotalRevenue += revenue;
                                grandTotalUnits += units;
                                grandTotalRevenue += revenue;

                                return (
                                  <tr key={`${catIdx}-${itemIdx}`} className="border-b border-gray-200">
                                    <td className="px-4 py-3 font-medium text-gray-900 border">
                                      {itemIdx === 0 ? categoryName : ''}
                                    </td>
                                    <td className="px-4 py-3 text-gray-800 border">{item.product_name}</td>
                                    <td className="px-4 py-3 text-right text-gray-900 border">{units.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right font-semibold text-green-600 border">
                                      ${revenue.toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-gray-600 border">
                                      ${avgPrice.toFixed(2)}
                                    </td>
                                  </tr>
                                );
                              })}
                              <tr className="bg-gray-100 border-b-2 border-gray-300 font-semibold">
                                <td colSpan="2" className="px-4 py-3 text-right text-gray-900 border">
                                  {categoryName} Subtotal
                                </td>
                                <td className="px-4 py-3 text-right text-gray-900 border">
                                  {categoryTotalUnits.toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-right text-green-700 border">
                                  ${categoryTotalRevenue.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-right text-gray-700 border">
                                  ${(categoryTotalRevenue / categoryTotalUnits).toFixed(2)}
                                </td>
                              </tr>
                            </React.Fragment>
                          );
                        }).concat(
                          <tr key="grand-total" className="bg-gray-800 text-white font-bold">
                            <td colSpan="2" className="px-4 py-3 text-right border">GRAND TOTAL</td>
                            <td className="px-4 py-3 text-right border">{grandTotalUnits.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right border">${grandTotalRevenue.toFixed(2)}</td>
                            <td className="px-4 py-3 text-right border">${(grandTotalRevenue / grandTotalUnits).toFixed(2)}</td>
                          </tr>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
